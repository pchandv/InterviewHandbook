/* ═══════════════════════════════════════════════════════════════════
   INFRASTRUCTURE AS CODE — Level 9: DevOps (Infrastructure)
   IaC concepts, Terraform HCL, state, plan/apply, modules, drift,
   and comparison with Bicep/ARM/Pulumi.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('iac-terraform', {

    title: 'Infrastructure as Code',
    level: 9,
    group: 'infrastructure',
    description: 'IaC fundamentals: declarative vs imperative, Terraform HCL, state management, plan/apply, modules, providers, drift, idempotency, and secrets handling \u2014 with Bicep/ARM/Pulumi comparison.',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    prerequisites: ['docker-core'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Infrastructure as Code (IaC)</strong> manages and provisions infrastructure — servers,
            networks, databases, DNS — through machine-readable definition files rather than manual console clicks.
            Your infrastructure becomes versioned, reviewable, repeatable code.</p>
            <p><strong>Terraform</strong> (by HashiCorp) is the most widely used cloud-agnostic IaC tool. It uses a
            declarative language (HCL) where you describe the desired end state, and Terraform figures out the API
            calls to reach it.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Declarative vs imperative infrastructure</li>
                <li>Terraform's core workflow: write, plan, apply</li>
                <li>State files and why they matter</li>
                <li>Modules, providers, and variables</li>
                <li>Drift, idempotency, and secrets handling</li>
                <li>How Terraform compares to Bicep, ARM, Pulumi, CloudFormation</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Declarative vs Imperative</h4>
            <p>Declarative (Terraform, Bicep): you describe the desired end state; the tool computes the steps.
            Imperative (scripts): you write the exact commands. Declarative is idempotent and self-healing toward the
            target state.</p>
            <h4>State</h4>
            <p>Terraform records what it created in a <strong>state file</strong>, mapping your config to real
            resources. It compares state vs config vs reality to plan changes. State is sensitive and must be stored
            remotely and locked for teams.</p>
            <h4>Providers</h4>
            <p>Plugins that talk to a platform's API (AWS, Azure, GCP, Kubernetes, Cloudflare). One config can span
            multiple providers.</p>
            <h4>Resources &amp; Data Sources</h4>
            <p>A <code>resource</code> is something Terraform manages (a VM, a bucket). A <code>data</code> source
            reads existing infrastructure without managing it.</p>
            <h4>Modules</h4>
            <p>Reusable, parameterized groupings of resources — the unit of abstraction and reuse, like functions for
            infrastructure.</p>
            <h4>Plan &amp; Apply</h4>
            <p><code>plan</code> shows the diff (what will be created/changed/destroyed); <code>apply</code> executes
            it. Plan-before-apply is the safety mechanism.</p>`,
            mermaid: `graph LR
    Config[HCL config<br/>desired state] --> Plan[terraform plan]
    State[(State file)] --> Plan
    Real[Real cloud resources] --> Plan
    Plan --> Diff[Diff: add/change/destroy]
    Diff --> Apply[terraform apply]
    Apply --> Real
    Apply --> State`
        },
        {
            title: 'How It Works',
            content: `<p>The Terraform workflow follows a predictable loop:</p>
            <ol>
                <li><strong>Write:</strong> declare resources in <code>.tf</code> files using HCL</li>
                <li><strong>Init:</strong> <code>terraform init</code> downloads providers and configures the backend</li>
                <li><strong>Plan:</strong> <code>terraform plan</code> compares desired config to current state and
                reality, producing an execution plan (the diff)</li>
                <li><strong>Apply:</strong> <code>terraform apply</code> makes the API calls to reach the desired state
                and updates the state file</li>
                <li><strong>Destroy:</strong> <code>terraform destroy</code> tears down managed resources when no
                longer needed</li>
            </ol>
            <p>Because it is declarative and tracks state, re-running apply with no config changes does nothing
            (idempotent) — Terraform only acts on the difference between desired and actual.</p>`,
            code: `# main.tf — declare desired state for an Azure resource group + storage
terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.0" }
  }
  backend "azurerm" {            # remote state with locking
    resource_group_name  = "tfstate-rg"
    storage_account_name = "tfstatestore"
    container_name       = "state"
    key                  = "prod.terraform.tfstate"
  }
}

provider "azurerm" { features {} }

variable "location" { default = "eastus" }

resource "azurerm_resource_group" "app" {
  name     = "app-prod-rg"
  location = var.location
}

resource "azurerm_storage_account" "data" {
  name                     = "appprodstore"
  resource_group_name      = azurerm_resource_group.app.name
  location                 = azurerm_resource_group.app.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

output "storage_id" { value = azurerm_storage_account.data.id }`,
            language: 'hcl'
        },
        {
            title: 'Visual Diagram',
            content: `<p>How state mediates between your config and reality:</p>`,
            mermaid: `flowchart TB
    Dev[Developer edits .tf] --> Repo[Git repo: reviewed PR]
    Repo --> CI[CI: terraform plan]
    CI --> Approve{Plan approved?}
    Approve -->|Yes| ApplyCD[CD: terraform apply]
    ApplyCD --> Cloud[(Cloud Provider)]
    ApplyCD --> Backend[(Remote State + Lock)]
    Backend -.->|read for next plan| CI`
        },
        {
            title: 'Implementation',
            content: `<p>Modules, variables, and CLI usage:</p>`,
            tabs: [
                {
                    label: 'Module',
                    code: `# modules/webapp/main.tf — reusable web app module
variable "name"     { type = string }
variable "sku"      { type = string, default = "B1" }
variable "location" { type = string }

resource "azurerm_service_plan" "this" {
  name                = "\${var.name}-plan"
  location            = var.location
  os_type             = "Linux"
  sku_name            = var.sku
}

resource "azurerm_linux_web_app" "this" {
  name            = var.name
  location        = var.location
  service_plan_id = azurerm_service_plan.this.id
  site_config {}
}

output "url" { value = azurerm_linux_web_app.this.default_hostname }

# Usage in root config:
# module "api" {
#   source   = "./modules/webapp"
#   name     = "orders-api"
#   location = "eastus"
#   sku      = "P1v3"
# }`,
                    language: 'hcl'
                },
                {
                    label: 'CLI Workflow',
                    code: `# Initialize: download providers, configure backend
terraform init

# Format and validate
terraform fmt -recursive
terraform validate

# Preview changes (safe — makes no changes)
terraform plan -out=tfplan

# Apply the reviewed plan
terraform apply tfplan

# Show current state / inspect a resource
terraform state list
terraform state show azurerm_storage_account.data

# Tear down (careful!)
terraform destroy`,
                    language: 'bash'
                },
                {
                    label: 'Secrets',
                    code: `# DO NOT hardcode secrets in .tf files or commit them.
# Option 1: reference a secret from a vault as a data source
data "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  key_vault_id = var.key_vault_id
}

resource "azurerm_mssql_server" "db" {
  administrator_login_password = data.azurerm_key_vault_secret.db_password.value
  # ... other config
}

# Option 2: pass via environment variables (TF_VAR_db_password)
# variable "db_password" { type = string, sensitive = true }
# Mark outputs sensitive too: output "x" { value = ..., sensitive = true }`,
                    language: 'hcl'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Store State Remotely with Locking</h4>
            <p>Use a remote backend (S3+DynamoDB, Azure Storage, Terraform Cloud) so the team shares state and
            concurrent applies are locked. Never commit state to git.</p>
            <h4>Do: Always Review the Plan</h4>
            <p>Run <code>plan</code> in CI and require approval before <code>apply</code>. The plan is your diff
            review for infrastructure.</p>
            <h4>Do: Use Modules for Reuse</h4>
            <p>Encapsulate common patterns (a standard web app, a network) in versioned modules to keep configs DRY
            and consistent across environments.</p>
            <h4>Do: Separate Environments</h4>
            <p>Use workspaces or separate state per environment (dev/staging/prod) so changes are isolated.</p>
            <h4>Do: Keep Secrets Out of Code</h4>
            <p>Pull secrets from a vault or environment variables; mark sensitive variables/outputs as
            <code>sensitive</code>.</p>`,
            callout: {
                type: 'tip',
                title: 'Plan Is Your Safety Net',
                text: 'terraform plan shows exactly what will be added, changed, or destroyed before anything happens. Treat an unexpected "destroy" in a plan as a red flag \u2014 it often means a forced replacement (e.g., changing an immutable property) that could cause downtime or data loss.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Committing State to Git</h4>
            <p>State contains sensitive values and resource IDs. Committing it leaks secrets and causes conflicts.
            Use a remote, locked backend.</p>
            <h4>Mistake: Manual Changes (Drift)</h4>
            <p>Editing resources in the cloud console behind Terraform's back creates "drift" — config and reality
            disagree. The next apply may revert or conflict. Make all changes through code.</p>
            <h4>Mistake: Hardcoding Secrets</h4>
            <p>Putting passwords/keys in .tf files commits them to history. Use vaults or env vars and mark them
            sensitive.</p>
            <h4>Mistake: No Plan Review</h4>
            <p>Running apply blindly can destroy or replace resources unexpectedly. Always review the plan.</p>
            <h4>Mistake: One Giant State File</h4>
            <p>Putting all environments/resources in one state makes blast radius huge and applies slow. Split by
            environment and bounded area.</p>`,
            code: `# DANGER signs in a plan output to stop and review:
#   ~ update in-place        (usually safe)
#   -/+ destroy and replace  (DOWNTIME / DATA LOSS risk - investigate why)
#   - destroy                (resource removal - intended?)

# Example forced replacement: changing an immutable field
# resource "azurerm_storage_account" "data" {
#   name = "newname"   # changing name forces destroy + recreate!
# }
# Plan shows -/+  -> the storage account (and its data) would be recreated.`,
            language: 'hcl'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Multi-Environment Provisioning</h4>
            <p>Teams define infrastructure once as modules and instantiate identical dev/staging/prod environments,
            eliminating "works in staging" config drift.</p>
            <h4>GitOps Infrastructure</h4>
            <p>Infrastructure changes go through pull requests; CI runs plan, a human approves, CD applies — full
            audit trail and review for infrastructure.</p>
            <h4>Disaster Recovery</h4>
            <p>Because infrastructure is code, an entire environment can be recreated in a new region from the same
            config — a powerful DR capability.</p>
            <h4>Multi-Cloud &amp; SaaS Provisioning</h4>
            <p>Terraform's provider ecosystem manages AWS + Azure + Cloudflare + Datadog from one workflow, and SaaS
            companies use it to provision per-customer infrastructure programmatically.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Terraform vs other IaC tools:</p>`,
            table: {
                headers: ['Aspect', 'Terraform', 'Bicep/ARM', 'Pulumi', 'CloudFormation'],
                rows: [
                    ['Scope', 'Multi-cloud', 'Azure only', 'Multi-cloud', 'AWS only'],
                    ['Language', 'HCL (declarative)', 'Bicep DSL / JSON', 'General-purpose (TS/Python/Go)', 'YAML/JSON'],
                    ['State', 'Explicit state file', 'Managed by Azure', 'Explicit (Pulumi service)', 'Managed by AWS'],
                    ['Maturity/ecosystem', 'Very large', 'Azure-native', 'Growing', 'AWS-native'],
                    ['Learning curve', 'Moderate', 'Low (for Azure)', 'Low (if you know the language)', 'Moderate'],
                    ['Best for', 'Cloud-agnostic teams', 'Azure-only shops', 'Devs wanting real code', 'AWS-only shops']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>"Performance" for IaC means safe, fast, reliable applies:</p>
            <h4>Plan/Apply Speed</h4>
            <p>Large monolithic states are slow to plan (Terraform refreshes every resource). Split state by bounded
            area to keep plans fast and blast radius small.</p>
            <h4>Parallelism</h4>
            <p>Terraform applies independent resources in parallel (default 10). The dependency graph determines
            ordering; well-structured configs maximize parallelism.</p>
            <h4>Targeted Operations</h4>
            <p>Use <code>-target</code> sparingly for surgical changes, and <code>-refresh=false</code> to skip
            refresh when you know state is current — but prefer correctness over speed hacks.</p>
            <h4>Module Granularity</h4>
            <p>Right-size modules and state boundaries so common changes touch a small, fast-to-plan slice rather
            than the whole estate.</p>`,
            callout: {
                type: 'warning',
                title: 'Blast Radius',
                text: 'A single state file covering everything means one bad apply can affect your entire infrastructure, and every plan is slow. Partition state by environment and by bounded area (network, data, apps) to limit blast radius and speed up operations.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Infrastructure code can and should be validated and tested.</p>
            <h4>Static Checks</h4>
            <p><code>terraform validate</code> (syntax/types), <code>terraform fmt</code> (style), plus linters
            (tflint) and security scanners (tfsec, Checkov) in CI.</p>
            <h4>Plan in CI</h4>
            <p>Run plan on every PR and post the diff for reviewers — catching destroys and surprises before merge.</p>
            <h4>Automated Tests</h4>
            <p>Terratest (Go) or the native <code>terraform test</code> framework spin up real infrastructure in a
            sandbox, assert it works, then tear it down.</p>`,
            code: `# CI pipeline checks (conceptual)
terraform fmt -check -recursive     # style gate
terraform validate                  # syntax/type gate
tflint                              # linting best practices
tfsec .                             # security scan (e.g., public buckets)
terraform plan -out=tfplan          # produce reviewable diff

# Native test (terraform test) - tests/storage.tftest.hcl
# run "creates_storage" {
#   command = plan
#   assert {
#     condition     = azurerm_storage_account.data.account_tier == "Standard"
#     error_message = "Storage tier must be Standard"
#   }
# }`,
            language: 'bash'
        },
        {
            title: 'Interview Tips',
            content: `<p>IaC and Terraform are common in DevOps/platform interviews:</p>
            <ul>
                <li><strong>Explain declarative vs imperative</strong> and why declarative is idempotent</li>
                <li><strong>Describe state</strong> and why remote, locked state matters for teams</li>
                <li><strong>Walk the plan/apply workflow</strong> and emphasize plan as a safety review</li>
                <li><strong>Discuss drift</strong> and why manual console changes are harmful</li>
                <li><strong>Mention secrets handling</strong> — never in code, use vaults/env vars</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Senior Signal',
                text: 'Discussing state-file partitioning to limit blast radius, GitOps (plan in CI, approve, apply in CD), and detecting/avoiding drift signals you have operated Terraform at team scale, not just run it locally.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Docs &amp; Books</h4>
            <ul>
                <li>Terraform docs: developer.hashicorp.com/terraform</li>
                <li><em>Terraform: Up &amp; Running</em> by Yevgeniy Brikman</li>
                <li>Azure Bicep docs (learn.microsoft.com/azure/azure-resource-manager/bicep)</li>
            </ul>
            <h4>Tools</h4>
            <ul>
                <li>tflint, tfsec, Checkov (linting/security)</li>
                <li>Terratest, terraform test (testing)</li>
                <li>Terragrunt (DRY multi-environment wrapper)</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>IaC</strong> = infrastructure defined as versioned, reviewable code</li>
                <li><strong>Declarative</strong> (describe end state) is idempotent and self-correcting toward target</li>
                <li><strong>State</strong> maps config to real resources — store it remotely with locking, never in git</li>
                <li><strong>plan before apply</strong> is the safety review; watch for destroy/replace</li>
                <li><strong>Modules</strong> provide reuse; <strong>partition state</strong> to limit blast radius</li>
                <li><strong>Drift</strong> (manual changes) breaks the model — make all changes through code</li>
                <li><strong>Secrets</strong> live in vaults/env vars, never in .tf files</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Provision a Two-Environment Web App</h4>
            <ol>
                <li>Write a reusable module for a web app + its database</li>
                <li>Instantiate it twice (dev with small SKU, prod with larger SKU) using variables</li>
                <li>Configure a remote backend with state locking</li>
                <li>Pull the DB password from a vault data source (no hardcoded secret)</li>
                <li>Run fmt, validate, and plan; review the diff before any apply</li>
                <li>Add a tfsec/Checkov scan and fix any flagged issue</li>
            </ol>`,
            code: `# Target structure:
# modules/webapp/        (reusable: service plan + web app + db)
# environments/dev/main.tf   (module "app" { source=..., sku="B1" })
# environments/prod/main.tf  (module "app" { source=..., sku="P1v3" })
# backend config: remote state with locking per environment
# TODO: implement module, both envs, vault secret data source, CI checks`,
            language: 'hcl'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is the difference between declarative and imperative IaC?<br/>
                    <em>A: Declarative describes the desired end state and the tool computes the steps (idempotent);
                    imperative specifies the exact commands to run. Terraform is declarative.</em></li>
                <li><strong>Q:</strong> What is the Terraform state file and why store it remotely?<br/>
                    <em>A: It maps your config to real resources so Terraform can plan diffs. Remote, locked state lets a
                    team share it safely and prevents concurrent applies from corrupting it. It also contains secrets, so
                    it must not be committed to git.</em></li>
                <li><strong>Q:</strong> What is drift and how do you avoid it?<br/>
                    <em>A: Drift is when real infrastructure differs from the Terraform config (usually from manual console
                    changes). Avoid it by making all changes through code and detecting drift via plan.</em></li>
                <li><strong>Q:</strong> Why review terraform plan before apply?<br/>
                    <em>A: Plan shows exactly what will be added, changed, or destroyed. Reviewing it catches dangerous
                    operations (like a destroy/replace causing downtime or data loss) before they happen.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What is Infrastructure as Code and what are its benefits?',
            difficulty: 'easy',
            answer: `<p><strong>Infrastructure as Code</strong> manages infrastructure (servers, networks, databases, DNS)
            through machine-readable definition files instead of manual clicks. The infrastructure becomes versioned,
            reviewable, and repeatable.</p>
            <p>Benefits: <strong>repeatability</strong> (spin up identical environments), <strong>version control</strong>
            (history, rollback, code review), <strong>consistency</strong> (no config drift between environments),
            <strong>automation</strong> (CI/CD provisioning), and <strong>documentation</strong> (the code is the
            source of truth).</p>`,
            explanation: 'Instead of hand-assembling furniture from memory each time (manual setup), IaC is the printed instruction sheet — anyone can reproduce the exact same result, and you can improve the instructions over time.',
            bestPractices: ['Version infrastructure in git', 'Review changes via PRs', 'Use the same code across environments'],
            commonMistakes: ['Manual console changes alongside IaC (drift)', 'Not versioning or reviewing infra changes'],
            interviewTip: 'List the concrete benefits (repeatability, versioning, consistency, automation) rather than just defining the term.',
            followUp: ['How does IaC support disaster recovery?', 'What is configuration drift?']
        },
        {
            question: 'Explain Terraform state. Why is it important and how should teams manage it?',
            difficulty: 'medium',
            answer: `<p>Terraform's <strong>state file</strong> records the resources Terraform manages and maps your
            configuration to real-world resource IDs. On each run, Terraform compares the desired config, the recorded
            state, and the actual infrastructure to compute what must change.</p>
            <p>It is important because without it Terraform couldn't know what it already created or detect drift.
            Teams should store state in a <strong>remote backend with locking</strong> (S3+DynamoDB, Azure Storage,
            Terraform Cloud) so everyone shares one source of truth and concurrent applies can't corrupt it. State
            often contains secrets, so it must never be committed to git and should be encrypted at rest.</p>`,
            explanation: 'State is Terraform\u2019s memory of what it built. Without it, every run would be like waking up with amnesia, unsure what already exists. Shared, locked remote state is the team\u2019s single shared memory that only one person can write to at a time.',
            code: `terraform {
  backend "s3" {
    bucket         = "company-tfstate"
    key            = "prod/network.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tf-locks"   # state locking
    encrypt        = true
  }
}`,
            language: 'hcl',
            bestPractices: ['Remote backend with locking and encryption', 'Never commit state to git', 'Partition state to limit blast radius'],
            commonMistakes: ['Local state shared via git (conflicts, leaked secrets)', 'No locking (concurrent applies corrupt state)', 'One giant state file'],
            interviewTip: 'Stress remote + locked + encrypted state, and that state contains secrets. Mention partitioning state for blast radius to show scale experience.',
            followUp: ['What happens if two engineers apply at the same time without locking?', 'How do you handle secrets that end up in state?']
        },
        {
            question: 'How would you design a Terraform setup for a team managing multiple environments safely?',
            difficulty: 'hard',
            answer: `<p>A robust setup combines several practices:</p>
            <ul>
                <li><strong>Reusable modules:</strong> encapsulate standard infrastructure (network, web app, DB) as
                versioned modules so all environments stay consistent and DRY.</li>
                <li><strong>Per-environment state:</strong> separate state (and ideally separate accounts/subscriptions)
                for dev/staging/prod to isolate blast radius; remote backend with locking and encryption.</li>
                <li><strong>GitOps workflow:</strong> changes via pull request; CI runs fmt/validate/lint/security
                scan and <code>plan</code>, posting the diff; a human approves; CD runs <code>apply</code>.</li>
                <li><strong>Secrets from vaults:</strong> never in code; pull from Key Vault/Secrets Manager and mark
                sensitive.</li>
                <li><strong>Drift detection:</strong> scheduled plan to catch manual changes; policy that all changes
                go through code.</li>
                <li><strong>Policy as code:</strong> OPA/Sentinel or Checkov to enforce guardrails (no public buckets,
                required tags) automatically.</li>
            </ul>`,
            explanation: 'It is like running a regulated factory: standardized blueprints (modules), separate production lines that can\u2019t interfere (per-env state), every change inspected before it runs (plan + approval), locked materials cabinet (vault secrets), and automated safety inspectors (policy as code).',
            bestPractices: ['Versioned reusable modules', 'Isolated per-environment state and credentials', 'CI plan + approval + CD apply (GitOps)', 'Secrets in vaults; policy-as-code guardrails', 'Scheduled drift detection'],
            commonMistakes: ['Shared state across environments (huge blast radius)', 'Apply without plan review', 'Copy-pasted config instead of modules', 'Manual hotfixes in the console'],
            interviewTip: 'Structure the answer around modules, state isolation, GitOps, secrets, and policy-as-code. Naming the GitOps plan-approve-apply flow and blast-radius isolation is the senior differentiator.',
            followUp: ['How do you prevent a junior from accidentally destroying prod?', 'What is policy as code and how does it help?', 'How do you handle a resource that must be shared across environments?'],
            seniorPerspective: 'The controls I care most about are blast-radius isolation and approval gates. I keep prod state and credentials fully separate from lower environments, require a reviewed plan before any prod apply, and enforce guardrails with policy-as-code so a misconfiguration (public storage, missing tags, an unintended destroy) fails CI rather than reaching production. Drift detection runs on a schedule because the moment someone fixes something by hand in the console, the code stops being the source of truth and the next apply becomes dangerous.'
        },
        {
            question: 'What does it mean that Terraform is declarative and idempotent, and how does that differ from an imperative provisioning script?',
            difficulty: 'medium',
            answer: `<p><strong>Declarative</strong> means you describe the desired <em>end state</em> ("a storage account named X in eastus exists") and Terraform computes the API calls to reach it. An <strong>imperative</strong> script lists the exact steps ("create the account, then set this property"). </p>
            <p><strong>Idempotent</strong> means running the same config repeatedly converges to the same result: if reality already matches, Terraform does nothing. An imperative create script run twice may error ("already exists") or create duplicates, because it does not reason about current state.</p>
            <p>Terraform achieves this by diffing three things on every run: your config (desired), the state file (what it built), and reality (refreshed from the provider).</p>`,
            explanation: 'Imperative is turn-by-turn driving directions that only work from one specific starting point; declarative is giving the destination address to a GPS that recalculates the route from wherever you currently are. Run it again from the destination and it simply says "you have arrived."',
            code: `# Declarative: describe the END STATE, run as many times as you like.
resource "azurerm_storage_account" "data" {
  name                     = "appprodstore"
  resource_group_name      = "app-prod-rg"
  location                 = "eastus"
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
# terraform apply  -> creates it
# terraform apply  -> "No changes. Infrastructure is up-to-date." (idempotent)

# Imperative equivalent is fragile:
#   az storage account create --name appprodstore ...   # 2nd run: errors / no-op guesswork`,
            language: 'hcl',
            bestPractices: ['Describe end state, not steps — let Terraform compute the diff', 'Rely on idempotency: re-running apply should be safe and boring', 'Keep config the single source of truth so plan reflects reality', 'Use data sources to read existing infra rather than scripting lookups'],
            commonMistakes: ['Mixing imperative scripts (CLI create) with Terraform-managed resources', 'Assuming apply "redoes" everything — it only acts on the diff', 'Local-exec provisioners used as a crutch for imperative steps', 'Editing resources outside Terraform, breaking the declarative model'],
            interviewTip: 'Define declarative (end state) vs imperative (steps), then connect it to idempotency: because Terraform diffs desired vs actual, re-running is a no-op when nothing changed. That convergence property is the whole point.',
            followUp: ['How does Terraform know what already exists?', 'Why can an imperative create script fail on the second run?', 'What are the three inputs Terraform compares during a plan?']
        },
        {
            question: 'Walk through the terraform plan/apply workflow. What danger signs in a plan should make you stop?',
            difficulty: 'hard',
            answer: `<p>The workflow is <code>init</code> &rarr; <code>plan</code> &rarr; <code>apply</code>. <strong>plan</strong> refreshes real state, diffs it against your config, and prints exactly what will be added, changed, or destroyed — without changing anything. <strong>apply</strong> executes that diff and updates state. Saving the plan (<code>-out=tfplan</code>) and applying that exact file guarantees you run what you reviewed.</p>
            <p>Danger signs in the plan symbols:</p>
            <ul>
                <li><code>+ create</code> — new resource (usually fine).</li>
                <li><code>~ update in-place</code> — modify, generally safe.</li>
                <li><code>- destroy</code> — removal; confirm it is intended.</li>
                <li><strong><code>-/+ destroy and replace</code></strong> — the big red flag: a forced replacement, often from changing an immutable field, which can mean downtime or data loss.</li>
            </ul>
            <p>A surprise replace on a stateful resource (database, storage) is the moment to stop and investigate which immutable attribute changed.</p>`,
            explanation: 'plan is the contractor walking you through the blueprint changes before swinging a hammer. "Repaint the wall" (update) is fine; "demolish and rebuild the foundation" (destroy/replace) on the room where you store everything is when you say stop and ask why.',
            code: `terraform init                      # providers + backend
terraform plan -out=tfplan          # review the diff (no changes made)
terraform apply tfplan              # apply EXACTLY what was reviewed

# Reading the plan symbols:
#   + create
#   ~ update in-place        (usually safe)
#   - destroy                (intended removal?)
#   -/+ destroy and replace  (DOWNTIME / DATA LOSS risk — investigate!)

# Example trigger for a forced replace: changing an immutable name
# resource "azurerm_storage_account" "data" { name = "renamedstore" }  # -/+`,
            language: 'bash',
            bestPractices: ['Always plan before apply and review the diff', 'Use plan -out and apply the saved plan file in CI/CD', 'Treat any unexpected destroy/replace as a stop-and-investigate event', 'Run plan automatically on every PR and post the diff for review'],
            commonMistakes: ['Running apply without reviewing the plan', 'Ignoring a -/+ replace on a stateful resource (data loss)', 'Applying a stale plan after the config or reality changed', 'Not running plan in CI, so surprises surface only at apply time'],
            interviewTip: 'Emphasize that plan is the diff review for infrastructure and that -/+ (destroy and replace) is the symbol to fear, especially on databases/storage — it usually means an immutable property changed and the resource will be recreated.',
            followUp: ['Why does changing certain attributes force a replacement?', 'How does -out make apply safer in a pipeline?', 'How would you avoid downtime when a replace is truly required?']
        },
        {
            question: 'What is configuration drift, how do you detect it, and how should you remediate it?',
            difficulty: 'advanced',
            answer: `<p><strong>Drift</strong> is when real infrastructure no longer matches the Terraform configuration/state — almost always because someone made a manual change in the cloud console (an emergency fix, a quick toggle). It silently breaks the "code is the source of truth" guarantee.</p>
            <p><strong>Detection</strong>: run <code>terraform plan</code> (which refreshes state against reality) on a schedule in CI. A non-empty plan when no code changed signals drift. <code>terraform plan -refresh-only</code> isolates drift from intended config changes.</p>
            <p><strong>Remediation</strong>, depending on intent:</p>
            <ul>
                <li>If the manual change was wrong: <code>apply</code> to revert reality back to code.</li>
                <li>If the manual change should be kept: update the Terraform config to match, then apply so state and code reconcile (codify the change).</li>
                <li>For resources created entirely outside Terraform: <code>import</code> them into state.</li>
            </ul>
            <p>The durable fix is prevention: restrict console write access so all changes flow through code review and CI.</p>`,
            explanation: 'Drift is like someone secretly rearranging a room that is supposed to match a published floor plan. A scheduled plan is the weekly walkthrough that spots the difference; then you either put the furniture back (apply to revert) or update the floor plan to match the new arrangement (codify) — and ideally lock the door so only approved changes happen.',
            code: `# Detect drift on a schedule (CI cron). Empty plan = no drift.
terraform plan -refresh-only -detailed-exitcode
#   exit 0 = no drift, 2 = drift detected, 1 = error  (great for pipelines)

# Remediation options:
# 1) Manual change was wrong -> revert reality to code:
terraform apply
# 2) Manual change should stay -> codify it in .tf, then:
terraform apply              # state + config now match reality
# 3) Resource made outside Terraform -> bring under management:
terraform import azurerm_storage_account.data /subscriptions/.../appprodstore`,
            language: 'bash',
            bestPractices: ['Run scheduled plan (refresh-only) to detect drift early', 'Use -detailed-exitcode so CI can alert on drift automatically', 'Codify intentional manual changes rather than leaving them un-tracked', 'Prevent drift at the source by restricting console write access (RBAC)'],
            commonMistakes: ['Fixing things in the console and never reflecting it in code', 'Blindly applying to revert a manual change that was actually needed', 'No scheduled drift detection, so drift is found only during an unrelated apply', 'Forgetting to import resources created outside Terraform'],
            interviewTip: 'Show the full loop: detect (scheduled refresh-only plan + detailed exit code), then decide intent — revert via apply, or codify and apply — and finish with prevention via RBAC. Mentioning import for out-of-band resources is a nice senior touch.',
            followUp: ['How does -refresh-only differ from a normal plan?', 'When would you import instead of recreate a resource?', 'How do you stop drift from happening in the first place?'],
            seniorPerspective: 'I run drift detection on a schedule because drift is silent until the next apply turns it into an incident — someone hotfixes a setting in the console, and weeks later an unrelated apply quietly reverts it. The decision is always intent-based: revert if the manual change was wrong, codify it if it was right, and import anything created out of band. The real fix, though, is locking down console write access so code review is the only path to change.'
        },
        {
            question: 'How do you design Terraform modules for reuse across multiple teams and environments?',
            difficulty: 'hard',
            answer: `<p><strong>Module design</strong> is what makes Terraform scale from one team to an organization. Well-designed modules are reusable, versioned, and opinionated enough to enforce standards.</p>
<h4>Module architecture:</h4>
<ul>
<li><strong>Root modules:</strong> Environment-specific (dev/staging/prod). They compose child modules and provide environment-specific variables.</li>
<li><strong>Child modules:</strong> Reusable building blocks (e.g., "web-app", "database", "networking"). Published to a private registry or Git repo with tags.</li>
<li><strong>Module registry:</strong> Internal Terraform registry (or Git tags) where teams discover and consume modules like packages.</li>
</ul>
<h4>Design principles:</h4>
<ol>
<li><strong>Single responsibility:</strong> One module = one logical resource group (a web app module creates: App Service + SQL DB + Key Vault + monitoring). Not one module for everything.</li>
<li><strong>Sensible defaults with overrides:</strong> Module works with zero optional variables for the common case. Teams can override when needed.</li>
<li><strong>Versioned (semver):</strong> Breaking changes = major version bump. Teams pin to a version and upgrade deliberately.</li>
<li><strong>Outputs for composition:</strong> Modules export IDs, connection strings, endpoints so other modules can reference them.</li>
<li><strong>Baked-in standards:</strong> Security best practices, tagging policies, naming conventions are in the module — teams get them for free.</li>
</ol>
<h4>Anti-patterns:</h4>
<ul>
<li><strong>God module:</strong> One module that creates entire infrastructure (impossible to reuse partially)</li>
<li><strong>Over-parameterization:</strong> 50 variables making the module harder to use than raw resources</li>
<li><strong>No versioning:</strong> Module changes break all consumers immediately</li>
</ul>`,
            bestPractices: ['Version modules with semver tags; teams pin and upgrade intentionally', 'Bake standards (security, tagging, naming) into modules so they are default', 'Provide sensible defaults; require only the minimum variables for common cases', 'Test modules with Terratest or terraform-compliance before publishing'],
            commonMistakes: ['One giant module for everything (cannot reuse pieces)', 'No versioning (changes break all consumers simultaneously)', 'Modules that expose every possible parameter (harder to use than raw resources)', 'No documentation or examples (teams copy-paste instead of using the module properly)'],
            interviewTip: 'Describe the root-module/child-module hierarchy and emphasize versioning. Mentioning a private registry and "baked-in standards" shows organizational-scale thinking.',
            followUp: ['How do you test Terraform modules before publishing a new version?', 'How do you handle breaking changes in a module used by 20 teams?']
        },
        {
            question: 'How does Terraform state locking work, and what happens if it fails?',
            difficulty: 'hard',
            answer: `<p><strong>State locking</strong> prevents concurrent <code>terraform apply</code> operations from corrupting the state file by ensuring only one operation can modify state at a time.</p>
<h4>How it works:</h4>
<ol>
<li><strong>Before any write operation</strong> (plan, apply, destroy), Terraform acquires a lock on the state backend</li>
<li><strong>Lock is stored in the backend:</strong>
<ul>
<li>S3 backend → DynamoDB table (LockID, Info, Who, Created)</li>
<li>Azure Storage → Blob lease</li>
<li>GCS → Object lock</li>
<li>Terraform Cloud → Built-in locking</li>
</ul></li>
<li><strong>Other operations see the lock</strong> and wait or fail with "state locked" error</li>
<li><strong>After operation completes,</strong> lock is released</li>
</ol>
<h4>What happens when locking fails:</h4>
<ul>
<li><strong>Stale lock (operator crashed mid-apply):</strong> Lock exists but the process is dead. Use <code>terraform force-unlock LOCK_ID</code> after confirming no operation is running.</li>
<li><strong>Concurrent apply attempt:</strong> Second operator gets "Error acquiring the state lock" — must wait for the first to complete.</li>
<li><strong>Lock backend down:</strong> Terraform cannot proceed (safe failure — refuses to operate without locking rather than risking corruption).</li>
</ul>
<h4>Without locking (catastrophic scenarios):</h4>
<ul>
<li>Two <code>apply</code> operations run simultaneously → both read the same state → both try to create the same resource → one succeeds, other fails, state file is inconsistent with reality</li>
<li>State records resource as created, but it was actually created twice (or partially), leading to drift and orphaned resources</li>
</ul>
<p><strong>Key principle:</strong> State locking is not optional for any shared backend. It is the serialization mechanism that makes Terraform safe for teams.</p>`,
            bestPractices: ['Always use a backend that supports locking (S3+DynamoDB, Azure Blob, GCS, Terraform Cloud)', 'Never force-unlock without confirming no other operation is running', 'Set up CI/CD to run Terraform (single pipeline = natural serialization)', 'Use workspaces or state-per-environment to reduce lock contention'],
            commonMistakes: ['Using a local state file shared via git (no locking, guaranteed corruption)', 'Using S3 backend without DynamoDB table (S3 alone does not provide locking)', 'Force-unlocking reflexively without checking if another apply is running', 'Multiple CI jobs running terraform apply in parallel against the same state'],
            interviewTip: 'Name the specific locking mechanism for your backend (DynamoDB for S3, blob lease for Azure). Explaining the failure scenario (concurrent apply → state corruption) shows you understand WHY locking exists.',
            followUp: ['What is the difference between state locking and state encryption?', 'How do you recover from a corrupted state file?']
        }
    ]
});
