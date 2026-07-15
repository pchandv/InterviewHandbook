/* ═══════════════════════════════════════════════════════════════════
   Terraform Advanced: Modules, State, Workspaces, CI/CD, Drift
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('terraform-advanced', {
    title: 'Terraform Advanced',
    description: 'Advanced Terraform patterns: module design and composition, remote state management, state locking, workspaces, drift detection, resource importing, CI/CD integration, secret management, and comparison with Pulumi and Bicep.',
    sections: [
        {
            title: 'Introduction',
            content: `<p><strong>Terraform</strong> by HashiCorp is the dominant infrastructure-as-code tool, used to provision and manage cloud infrastructure declaratively. While basic Terraform usage (resources, variables, outputs) is straightforward, production environments demand advanced patterns for team collaboration, state management, and CI/CD integration.</p>
            <p>Interview questions at senior/staff level focus on: how do you structure modules for reuse, how do you manage state safely across teams, and how do you integrate Terraform into a delivery pipeline without risk? This section covers those advanced topics.</p>`
        },
        {
            title: 'Module Design and Composition',
            content: `<p>Terraform <strong>modules</strong> are reusable building blocks that encapsulate related resources. Good module design follows these principles:</p>
            <ul>
                <li><strong>Single responsibility</strong> — one module per concern (networking, database, monitoring).</li>
                <li><strong>Composable</strong> — modules accept inputs and produce outputs; compose them in root modules.</li>
                <li><strong>Versioned</strong> — published to a registry (private or public) with semantic versioning.</li>
                <li><strong>Opinionated defaults</strong> — sensible defaults for most cases, override via variables.</li>
                <li><strong>Minimal coupling</strong> — modules should not reach into each other's state; pass data via outputs/inputs.</li>
            </ul>`,
            code: `# Module structure for a production VPC module
# modules/vpc/
#   main.tf       - resource definitions
#   variables.tf  - input variables with descriptions
#   outputs.tf    - exported attributes
#   versions.tf   - required providers and terraform version

# modules/vpc/variables.tf
variable "name" {
  type        = string
  description = "VPC name prefix for all resources"
}

variable "cidr" {
  type        = string
  description = "VPC CIDR block (e.g., 10.0.0.0/16)"
  validation {
    condition     = can(cidrhost(var.cidr, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "azs" {
  type        = list(string)
  description = "Availability zones for subnet placement"
}

variable "private_subnets" {
  type        = list(string)
  description = "CIDR blocks for private subnets"
}

variable "public_subnets" {
  type        = list(string)
  description = "CIDR blocks for public subnets"
}

variable "enable_nat_gateway" {
  type        = bool
  default     = true
  description = "Deploy NAT Gateways for private subnet internet access"
}

# modules/vpc/outputs.tf
output "vpc_id" {
  value       = aws_vpc.this.id
  description = "The ID of the VPC"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "List of private subnet IDs"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "List of public subnet IDs"
}

# Root module composing multiple modules
module "vpc" {
  source  = "git::https://gitlab.com/infra/modules.git//vpc?ref=v2.1.0"
  name    = "production"
  cidr    = "10.0.0.0/16"
  azs     = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

module "database" {
  source            = "git::https://gitlab.com/infra/modules.git//rds?ref=v1.5.0"
  subnet_ids        = module.vpc.private_subnet_ids  # Composition via outputs
  vpc_id            = module.vpc.vpc_id
  instance_class    = "db.r6g.xlarge"
  engine            = "postgres"
  engine_version    = "15.4"
}`,
            language: 'hcl'
        },
        {
            title: 'Remote State Management',
            content: `<p>Terraform <strong>state</strong> maps declared resources to real infrastructure. In production, state must be:</p>
            <ul>
                <li><strong>Remote</strong> — stored in a shared backend (S3, Azure Blob, GCS, Terraform Cloud), not local files.</li>
                <li><strong>Locked</strong> — prevent concurrent modifications that corrupt state (DynamoDB for AWS, blob lease for Azure).</li>
                <li><strong>Encrypted</strong> — state contains sensitive data (connection strings, IPs); encrypt at rest.</li>
                <li><strong>Versioned</strong> — enable versioning on the bucket for rollback if state is corrupted.</li>
            </ul>`,
            mermaid: `graph TB
    subgraph Team["Engineering Team"]
        DEV1["Developer A<br/>terraform plan"]
        DEV2["Developer B<br/>terraform plan"]
        CI["CI/CD Pipeline<br/>terraform apply"]
    end

    subgraph Backend["Remote State Backend"]
        S3["S3 Bucket<br/>(encrypted, versioned)"]
        DDB["DynamoDB Table<br/>(state locking)"]
    end

    DEV1 -->|"read state"| S3
    DEV2 -->|"read state"| S3
    CI -->|"1. acquire lock"| DDB
    CI -->|"2. read/write state"| S3
    CI -->|"3. release lock"| DDB
    DDB -->|"blocks if locked"| DEV2`,
            code: `# Remote backend configuration — AWS S3 + DynamoDB locking
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "production/networking/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"  # State locking
    # Enable versioning on the S3 bucket for state rollback
  }
}

# DynamoDB table for state locking (created once, manually or bootstrap)
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}

# Azure backend alternative
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "stterraformstate"
    container_name       = "tfstate"
    key                  = "production.networking.tfstate"
    use_oidc             = true  # Workload identity (no stored credentials)
  }
}

# Data source to reference another state file (cross-stack references)
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "company-terraform-state"
    key    = "production/networking/terraform.tfstate"
    region = "us-east-1"
  }
}

# Use outputs from the networking state
resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.networking.outputs.private_subnet_ids[0]
}`,
            language: 'hcl'
        },
        {
            title: 'CI/CD Pipeline with Terraform',
            mermaid: `graph LR
    subgraph PR["Pull Request"]
        PUSH["Developer Push"] --> LINT["terraform fmt<br/>tflint / checkov"]
        LINT --> INIT["terraform init"]
        INIT --> PLAN["terraform plan<br/>(speculative)"]
        PLAN --> COMMENT["Post plan diff<br/>as PR comment"]
        COMMENT --> REVIEW["Human Review<br/>+ Approval"]
    end

    subgraph Merge["After Merge to Main"]
        MERGE["Merge PR"] --> INIT2["terraform init"]
        INIT2 --> PLAN2["terraform plan<br/>(confirm)"]
        PLAN2 --> APPROVE["Manual Approval<br/>Gate"]
        APPROVE --> APPLY["terraform apply<br/>-auto-approve"]
        APPLY --> NOTIFY["Notify Slack<br/>+ Update CMDB"]
    end

    REVIEW --> MERGE`,
            content: `<p>Integrating Terraform into CI/CD pipelines requires careful handling of state, secrets, and approval workflows:</p>
            <ul>
                <li><strong>Plan in PR</strong> — run terraform plan on every PR and post the diff as a comment for review.</li>
                <li><strong>Apply on merge</strong> — only apply changes from the main branch after approval.</li>
                <li><strong>Speculative plans</strong> — show what would change without modifying anything. Enables safe review.</li>
                <li><strong>Manual approval gate</strong> — for production environments, require human confirmation before apply.</li>
                <li><strong>Credentials via OIDC</strong> — use workload identity federation (no stored keys). Pipeline assumes a role.</li>
                <li><strong>Policy as code</strong> — OPA/Sentinel policies validate plans before apply (no public S3 buckets, etc.).</li>
            </ul>`
        },
        {
            title: 'Workspaces, Drift Detection, and Import',
            content: `<p><strong>Workspaces</strong> allow multiple state files within the same configuration:</p>
            <ul>
                <li><strong>When to use</strong> — identical infrastructure for different environments (dev/staging/prod) with only variable differences.</li>
                <li><strong>When NOT to use</strong> — when environments differ significantly in structure. Use separate state files or Terragrunt instead.</li>
                <li><strong>Terraform Cloud workspaces</strong> are more powerful: separate state, variables, runs, and permissions per workspace.</li>
            </ul>
            <p><strong>Drift Detection:</strong> When someone modifies infrastructure outside Terraform (console click, CLI), state diverges from reality. Running terraform plan reveals this drift. Strategies: regular scheduled plans to detect drift, alerting on unexpected changes, and either accepting the drift (terraform apply with updated config) or reverting it.</p>
            <p><strong>Importing Resources:</strong></p>`,
            code: `# Import existing resources into Terraform state
# Old way: CLI command (Terraform < 1.5)
# terraform import aws_s3_bucket.existing my-existing-bucket

# New way: Import blocks (Terraform 1.5+)
import {
  to = aws_s3_bucket.existing
  id = "my-existing-bucket"
}

resource "aws_s3_bucket" "existing" {
  bucket = "my-existing-bucket"
  # Write the config to match the existing resource
  # then plan shows no changes
}

# Terraform 1.5+ can also generate config:
# terraform plan -generate-config-out=generated.tf

# Workspace usage
# terraform workspace new staging
# terraform workspace select staging
# terraform apply -var-file="staging.tfvars"

# Reference workspace name in config
resource "aws_instance" "app" {
  tags = {
    Environment = terraform.workspace  # "staging", "production"
  }
  instance_type = terraform.workspace == "production" ? "m5.xlarge" : "t3.medium"
}

# Better alternative for most cases: separate tfvars files
# terraform apply -var-file="environments/production.tfvars"`,
            language: 'hcl'
        },
        {
            title: 'Secret Management in Terraform',
            content: `<p>Terraform state can contain sensitive values (database passwords, API keys). Strategies to manage secrets safely:</p>
            <ul>
                <li><strong>Mark as sensitive</strong> — prevents values from appearing in plan output (but still stored in state).</li>
                <li><strong>Vault provider</strong> — read secrets from HashiCorp Vault at plan/apply time; secret never stored in state.</li>
                <li><strong>Data sources for secrets</strong> — reference secrets from AWS Secrets Manager / Azure Key Vault.</li>
                <li><strong>Encrypt state backend</strong> — S3 server-side encryption, Azure Storage encryption.</li>
                <li><strong>Never commit .tfstate</strong> — .gitignore state files; use remote backend exclusively.</li>
                <li><strong>Separate sensitive resources</strong> — keep secret-containing resources in their own state file with restricted access.</li>
            </ul>`,
            code: `# Sensitive variables — hidden from plan output
variable "db_password" {
  type      = string
  sensitive = true  # Won't show in plan/apply output
}

# Read secret from AWS Secrets Manager (not stored in TF state as the value)
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "production/database/password"
}

resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
}

# HashiCorp Vault provider — secret fetched at runtime
data "vault_generic_secret" "database" {
  path = "secret/production/database"
}

resource "aws_db_instance" "main" {
  password = data.vault_generic_secret.database.data["password"]
}

# OIDC authentication for CI/CD (no stored credentials)
provider "aws" {
  region = "us-east-1"
  # Pipeline assumes role via OIDC - no AWS_ACCESS_KEY needed
  assume_role_with_web_identity {
    role_arn           = "arn:aws:iam::123456789:role/terraform-ci"
    web_identity_token = var.ci_oidc_token
  }
}`,
            language: 'hcl'
        },
        {
            title: 'Terraform vs Pulumi vs Bicep',
            content: `<p>Each IaC tool has distinct strengths depending on team skills and cloud strategy:</p>
            <table><thead><tr><th>Aspect</th><th>Terraform (HCL)</th><th>Pulumi</th><th>Bicep</th></tr></thead><tbody>
                <tr><td>Language</td><td>HCL (domain-specific)</td><td>TypeScript, Python, C#, Go</td><td>Bicep DSL (compiles to ARM)</td></tr>
                <tr><td>Multi-cloud</td><td>Excellent (1000+ providers)</td><td>Good (uses Terraform providers)</td><td>Azure-only</td></tr>
                <tr><td>State</td><td>Self-managed or Terraform Cloud</td><td>Pulumi Cloud or self-managed</td><td>None (ARM handles it)</td></tr>
                <tr><td>Learning curve</td><td>Low-medium (HCL is simple)</td><td>Low for devs (real languages)</td><td>Low for Azure teams</td></tr>
                <tr><td>Testing</td><td>Terratest, terraform test</td><td>Native unit testing (Jest, pytest)</td><td>What-if, ARM template specs</td></tr>
                <tr><td>Ecosystem</td><td>Largest (modules, providers)</td><td>Growing, crosswalk libraries</td><td>Azure-native, tight integration</td></tr>
                <tr><td>Best for</td><td>Multi-cloud, large orgs, platform teams</td><td>Dev-heavy teams, complex logic</td><td>Azure-only shops, simplicity</td></tr>
            </tbody></table>
            <p><strong>Choose Terraform</strong> for multi-cloud or when the org has standardized on it. <strong>Choose Pulumi</strong> when developers want real programming constructs (loops, conditionals, testing). <strong>Choose Bicep</strong> for Azure-only environments wanting tight integration without state management overhead.</p>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>No state locking</strong> — two engineers run apply simultaneously, corrupting state. Always enable DynamoDB/blob lease locking.</li>
                <li><strong>Monolithic state</strong> — putting entire infrastructure in one state file. One bad apply risks everything. Split by blast radius.</li>
                <li><strong>Secrets in state unencrypted</strong> — state contains passwords, keys. Must encrypt at rest and restrict access.</li>
                <li><strong>No versioned modules</strong> — pointing to latest branch means breaking changes propagate silently. Pin module versions.</li>
                <li><strong>terraform apply without plan review</strong> — running apply directly in production without reviewing the plan first.</li>
                <li><strong>Hardcoded values</strong> — environment-specific values baked into modules instead of parameterized via variables.</li>
                <li><strong>Ignoring drift</strong> — manual console changes accumulate until plan shows massive unexpected diffs.</li>
                <li><strong>Large blast radius</strong> — one state file managing VPC + databases + compute. A mistake in compute config risks the database.</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li><strong>State management maturity</strong> — remote backend, locking, encryption, versioning, and blast radius splitting</li>
                    <li><strong>Module design philosophy</strong> — single responsibility, versioning, composition via outputs, validation</li>
                    <li><strong>CI/CD integration</strong> — plan in PR, apply on merge, approval gates, OIDC for credentials</li>
                    <li><strong>Drift handling</strong> — how you detect, alert, and reconcile manual changes</li>
                    <li><strong>Secret hygiene</strong> — never in state unprotected, Vault/Secrets Manager integration, OIDC over static keys</li>
                    <li><strong>Scale patterns</strong> — how you organize Terraform for 50+ services (Terragrunt, separate repos, module registry)</li>
                    <li><strong>Tool comparison honesty</strong> — know when Terraform is NOT the best choice (Bicep for Azure-only, Pulumi for complex logic)</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Modules should be versioned, composable, and follow single responsibility. Pin versions in consuming code.</li>
                <li>Remote state with locking (S3+DynamoDB, Azure Blob) is non-negotiable for team collaboration.</li>
                <li>Split state by blast radius — networking, data, compute should be separate state files.</li>
                <li>CI/CD: plan in PR for review, apply on merge with approval gate. Never apply unreviewed changes to production.</li>
                <li>Drift detection via scheduled plans catches manual changes before they cause problems.</li>
                <li>Import blocks (1.5+) let you adopt existing infrastructure without recreation.</li>
                <li>Secrets: use data sources from Vault/Secrets Manager, not plain variables. Encrypt state at rest.</li>
                <li>Choose tooling based on team skills and cloud strategy — Terraform for multi-cloud, Bicep for Azure-only, Pulumi for dev-centric teams.</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'How do you manage Terraform state for a team of 10+ engineers working on the same infrastructure?',
            difficulty: 'medium',
            answer: `<p>Team state management requires several controls:</p>
            <ul>
                <li><strong>Remote backend</strong> — S3/Azure Blob/GCS so everyone accesses the same state, not local files.</li>
                <li><strong>State locking</strong> — DynamoDB or blob lease prevents concurrent applies from corrupting state.</li>
                <li><strong>Split state by blast radius</strong> — separate state files for networking, databases, and compute. A mistake in one does not risk others.</li>
                <li><strong>CI/CD pipeline</strong> — apply only runs in the pipeline (not from laptops), ensuring sequential execution and audit trail.</li>
                <li><strong>PR-based workflow</strong> — plan output posted as PR comment, requires approval before merge triggers apply.</li>
                <li><strong>RBAC on state</strong> — restrict who can access state files (they contain sensitive data).</li>
            </ul>`,
            interviewTip: 'The key insight: nobody should run terraform apply from their laptop in production. The pipeline is the single path to production, ensuring locking, sequencing, and audit. Engineers run plan locally for development, but apply is pipeline-only.',
            followUp: ['How do you handle state file corruption?', 'What is terraform force-unlock and when do you use it?', 'How do you migrate from local to remote state?'],
            seniorPerspective: 'I enforce pipeline-only applies with IAM policies (engineers have read-only access to state, the CI role has write). State is split by team ownership: networking team owns their state, app teams own theirs. Cross-references use data sources.',
            architectPerspective: 'State management reflects organizational trust boundaries. Each team should own their state files, with well-defined output contracts between them. The state split follows Conway\'s Law: infrastructure boundaries mirror team boundaries.'
        },
        {
            question: 'Explain Terraform state locking. What happens without it, and how does DynamoDB locking work?',
            difficulty: 'medium',
            answer: `<p><strong>Without locking:</strong> If two engineers run terraform apply simultaneously, both read the same state, make different changes, and the last one to write overwrites the first's state — potentially losing track of resources (orphaned infrastructure) or corrupting the state file entirely.</p>
            <p><strong>DynamoDB locking (AWS):</strong> Before any state-modifying operation, Terraform creates a record in the DynamoDB table with the state file path as the key. If the record already exists (another operation in progress), Terraform blocks and retries. After the operation completes, it deletes the lock record. The lock includes metadata: who holds it, when it was created, and an operation description.</p>
            <p><strong>Azure equivalent:</strong> Blob lease on the state file in Azure Storage. Only one client can hold the lease at a time.</p>`,
            interviewTip: 'Mention the edge case: if a Terraform process crashes mid-apply, the lock may remain (stale lock). terraform force-unlock removes it, but only use after confirming no operation is actually running. This shows you have dealt with real-world state issues.',
            followUp: ['What is terraform force-unlock and when is it safe to use?', 'How does Terraform Cloud handle locking differently?', 'What happens if the DynamoDB table is unavailable?'],
            seniorPerspective: 'I have seen state corruption from missing locks exactly once — it took a full day to reconcile. Since then, every new project starts with remote state + DynamoDB locking as the first commit. The bootstrap module creates the S3 bucket, DynamoDB table, and IAM policies.',
            architectPerspective: 'State locking is a distributed systems problem. Terraform solves it with a simple lease mechanism (DynamoDB conditional writes). The design trade-off is availability vs safety: if DynamoDB is unreachable, you cannot modify infrastructure. This is the correct trade-off for critical infrastructure changes.'
        },
        {
            question: 'How do you design Terraform modules for reuse across teams? What makes a good module interface?',
            difficulty: 'hard',
            answer: `<p>A well-designed Terraform module follows these principles:</p>
            <ul>
                <li><strong>Clear contract</strong> — well-documented input variables with types, descriptions, validations, and sensible defaults.</li>
                <li><strong>Minimal required inputs</strong> — provide opinionated defaults; only require what truly varies between uses.</li>
                <li><strong>Useful outputs</strong> — expose IDs, ARNs, endpoints that consumers need for composition.</li>
                <li><strong>Semantic versioning</strong> — breaking changes = major bump. Consumers pin versions and upgrade deliberately.</li>
                <li><strong>No provider configuration</strong> — let the root module configure providers. Modules should be provider-agnostic where possible.</li>
                <li><strong>Validation blocks</strong> — catch invalid inputs at plan time with clear error messages.</li>
                <li><strong>Examples directory</strong> — working examples showing common use patterns.</li>
            </ul>
            <p>Publish to a private module registry (Terraform Cloud, GitLab, Artifactory) with automated testing on PRs.</p>`,
            interviewTip: 'Draw the analogy to library/package design: modules are libraries with a public API (variables/outputs). Same principles apply — backward compatibility, semantic versioning, documentation, and testing. Show you think of infrastructure modules the same way you think of code libraries.',
            followUp: ['How do you test Terraform modules?', 'What is the role of a private module registry?', 'How do you handle breaking changes in a module used by 20 teams?'],
            seniorPerspective: 'I maintain a "golden module" library for our org: vpc, eks-cluster, rds-postgres, s3-bucket. Each module encodes our security policies (encryption enabled, no public access, logging configured). Teams get compliance for free by using the module.',
            architectPerspective: 'Module design is platform engineering. The module library is your internal developer platform for infrastructure. It encodes organizational policies, security requirements, and operational best practices into reusable building blocks. The module registry is your infrastructure API catalog.'
        },
        {
            question: 'What is Terraform drift, how do you detect it, and what strategies exist for reconciliation?',
            difficulty: 'hard',
            answer: `<p><strong>Drift</strong> occurs when the actual infrastructure diverges from the Terraform state — typically caused by manual changes (console clicks, CLI commands, other tools modifying resources).</p>
            <p><strong>Detection:</strong></p>
            <ul>
                <li>Run terraform plan regularly (scheduled pipeline) — plan output shows unexpected changes.</li>
                <li>AWS Config rules or Azure Policy detect non-compliant resources.</li>
                <li>Terraform Cloud provides automatic drift detection with notifications.</li>
            </ul>
            <p><strong>Reconciliation strategies:</strong></p>
            <ul>
                <li><strong>Accept the drift</strong> — update Terraform config to match reality (if the manual change was intentional).</li>
                <li><strong>Revert the drift</strong> — run terraform apply to force infrastructure back to declared state.</li>
                <li><strong>Refresh state</strong> — terraform refresh updates state to match reality without changing config.</li>
                <li><strong>Prevent drift</strong> — restrict console/CLI write access, enforce pipeline-only changes via IAM policies.</li>
            </ul>`,
            interviewTip: 'The mature answer includes prevention: if only the pipeline can modify production infrastructure, drift cannot occur (except for auto-scaling groups and similar dynamic resources). Mention this governance approach alongside detection.',
            followUp: ['How does terraform refresh differ from plan?', 'How do you handle drift in auto-scaling resources?', 'What is the lifecycle ignore_changes for?'],
            seniorPerspective: 'I run nightly drift detection plans in a read-only pipeline and alert the team on unexpected changes. For resources that legitimately change outside Terraform (ASG desired count, dynamic tags), I use lifecycle { ignore_changes } to prevent false positives.',
            architectPerspective: 'Drift is a governance failure, not a technical one. The solution is organizational: restrict direct access to production, establish a culture where the pipeline is the only path, and use drift detection as an audit control rather than a primary remediation mechanism.'
        },
        {
            question: 'How do you integrate Terraform into a CI/CD pipeline safely? Describe the plan/apply workflow.',
            difficulty: 'medium',
            answer: `<p>The safe CI/CD workflow separates planning (safe, read-only) from applying (destructive, requires approval):</p>
            <ol>
                <li><strong>PR opened:</strong> Pipeline runs fmt check, validate, tflint, and plan. Plan output posted as PR comment.</li>
                <li><strong>Review:</strong> Reviewer examines plan diff — what's being created/changed/destroyed.</li>
                <li><strong>Policy check:</strong> OPA/Sentinel validates plan against organizational policies (no public S3, required tags, etc.).</li>
                <li><strong>PR merged:</strong> Main branch pipeline runs plan again (confirm no drift since PR) then apply with approval gate.</li>
                <li><strong>Apply:</strong> terraform apply -auto-approve (the plan was already reviewed). Artifacts stored for audit.</li>
                <li><strong>Notification:</strong> Post to Slack, update CMDB, tag deployment in monitoring.</li>
            </ol>
            <p><strong>Credentials:</strong> Use OIDC workload identity (GitLab CI → AWS STS assume-role). No static credentials stored anywhere.</p>`,
            interviewTip: 'Emphasize the security principle: plan is safe (read-only), apply is destructive (write). The approval gate between them is the control point. Mention that storing the plan file and applying the exact reviewed plan (not re-planning) prevents drift-between-review attacks.',
            followUp: ['How do you handle plan/apply for multiple environments?', 'What is a speculative plan in Terraform Cloud?', 'How do you prevent the plan output from changing between PR and apply?'],
            seniorPerspective: 'I save the plan file as a pipeline artifact and apply that exact plan on merge — this prevents any state changes between review and apply from introducing unexpected modifications. I also run Checkov/tfsec for security scanning on every PR.',
            architectPerspective: 'The Terraform CI/CD pipeline is a change management system for infrastructure. It provides the same controls as a software release pipeline: peer review, automated testing, approval gates, and audit trail. Organizations that apply infrastructure without these controls are taking unmanaged risk.'
        },
        {
            question: 'When would you use Terraform workspaces vs separate state files vs Terragrunt?',
            difficulty: 'hard',
            answer: `<p><strong>Terraform Workspaces:</strong> Use when environments are structurally identical and differ only in variable values (instance sizes, counts, feature flags). Each workspace gets its own state but shares the same code. Limitation: all environments live in the same backend, making access control harder.</p>
            <p><strong>Separate state files (directories):</strong> Use when environments differ structurally (prod has DR region, staging does not) or when you need different access controls per environment. Each gets its own backend configuration. More explicit, more flexible.</p>
            <p><strong>Terragrunt:</strong> Use for DRY multi-environment/multi-account setups at scale. It wraps Terraform with inheritance, generates backend configs, and handles dependencies between stacks. Best for large organizations with many environments and accounts.</p>`,
            interviewTip: 'Most senior engineers prefer separate directories over workspaces for real environments. Workspaces hide which environment you are targeting (easy to apply to production accidentally). Separate directories make it explicit. Mention this as a safety argument.',
            followUp: ['What are the risks of using workspaces for production vs non-production?', 'How does Terragrunt handle cross-stack dependencies?', 'What about Terraform Cloud workspaces vs CLI workspaces?'],
            seniorPerspective: 'I use separate directories per environment (envs/dev/, envs/prod/) with a shared modules/ folder. This makes it impossible to accidentally target the wrong environment (it is physically a different directory with different backend config). Terragrunt when we hit 10+ environments/accounts.',
            architectPerspective: 'The organizational structure of Terraform code should mirror the organizational structure of responsibility. If different teams own different environments, they should have separate state files with separate permissions. This is not a technical decision but an access control and blast radius one.'
        },
        {
            question: 'How do you import existing cloud resources into Terraform management? Compare the old and new approaches.',
            difficulty: 'medium',
            answer: `<p><strong>Old approach (pre-1.5): terraform import CLI</strong></p>
            <ul>
                <li>Run: <code>terraform import aws_s3_bucket.existing my-bucket-name</code></li>
                <li>Only imports into state — you must manually write the matching resource config.</li>
                <li>One resource at a time, no plan preview, error-prone.</li>
            </ul>
            <p><strong>New approach (1.5+): Import blocks</strong></p>
            <ul>
                <li>Declare import blocks in config alongside the resource.</li>
                <li>Run terraform plan to see what the imported resource looks like.</li>
                <li>Use <code>-generate-config-out</code> to auto-generate the matching HCL.</li>
                <li>Reviewable in PR, can import multiple resources, works in CI/CD.</li>
            </ul>
            <p>The new approach is safer because it is plan-able, reviewable, and automatable.</p>`,
            interviewTip: 'Mention that after importing, you must run plan and ensure zero diff — meaning your written config exactly matches the existing resource. Any discrepancy means terraform apply would modify the real resource. This is the dangerous step most people rush.',
            followUp: ['What happens if imported config does not match the real resource?', 'How do you import resources with complex dependencies?', 'What is the moved block and how does it differ from import?'],
            seniorPerspective: 'I use import blocks exclusively now — they are reviewable in PRs and the config generation saves hours of manual HCL writing. My workflow: add import block, run plan -generate-config-out, review generated code, clean it up, verify plan shows no changes, commit.',
            architectPerspective: 'Resource importing is part of the "brownfield adoption" story. When migrating from ClickOps to IaC, you need a systematic approach: discover resources, group by module boundary, import in dependency order, and verify zero-diff plans before considering the resource managed.'
        },
        {
            question: 'Compare Terraform, Pulumi, and Bicep. When would you recommend each?',
            difficulty: 'hard',
            answer: `<p><strong>Terraform</strong> — HCL-based, multi-cloud (1000+ providers), largest ecosystem and community. Self-managed state or Terraform Cloud. Best for: multi-cloud environments, platform teams, organizations that have standardized on it.</p>
            <p><strong>Pulumi</strong> — real programming languages (TypeScript, Python, C#, Go). Native testing with standard frameworks. Uses Terraform providers under the hood. Best for: developer-heavy teams that want loops/conditionals/abstractions that HCL struggles with, and native unit testing.</p>
            <p><strong>Bicep</strong> — Azure-only DSL that compiles to ARM templates. No state file to manage (Azure Resource Manager handles it). Tight Azure integration (IntelliSense, what-if). Best for: Azure-only shops wanting simplicity and native tooling without state management overhead.</p>
            <p><strong>Decision framework:</strong> Multi-cloud? → Terraform. Azure-only? → Bicep. Complex logic / dev team? → Pulumi. Existing investment? → Stay with current tool unless clear ROI from switching.</p>`,
            interviewTip: 'Show you are not a Terraform zealot. Acknowledge that Bicep removes state management entirely (a huge operational win for Azure shops) and Pulumi enables real unit testing. The "best tool" depends on cloud strategy, team skills, and organizational context.',
            followUp: ['How does Pulumi use Terraform providers without HCL?', 'What is the biggest operational advantage of Bicep over Terraform?', 'Can you use Terraform and Bicep together?'],
            seniorPerspective: 'For my Azure-only projects, I genuinely consider Bicep — no state management is a massive operational simplification. For multi-cloud or teams already on Terraform, switching is rarely worth the migration cost. Pulumi wins when I need complex resource generation logic that would be painful in HCL.',
            architectPerspective: 'Tool selection should be driven by organizational context, not technical superiority arguments. The total cost includes: learning curve, ecosystem maturity, hiring pool, state management operations, testing capabilities, and integration with existing CI/CD. Evaluate holistically.'
        },
        {
            question: 'How do you handle secrets in Terraform without exposing them in state or plan output?',
            difficulty: 'hard',
            answer: `<p>Secrets in Terraform are challenging because state stores all resource attributes, including passwords. Strategies:</p>
            <ul>
                <li><strong>Sensitive variable marking</strong> — <code>sensitive = true</code> hides from plan output but the value is still in state.</li>
                <li><strong>External secret stores</strong> — use data sources to read from Vault/Secrets Manager at apply time. The reference (path/ARN) is in state, not the actual secret value.</li>
                <li><strong>Random provider for generation</strong> — <code>random_password</code> generates secrets and stores directly in the target resource (still in state, but not in code).</li>
                <li><strong>Encrypt state at rest</strong> — S3 server-side encryption with KMS, Azure Storage encryption.</li>
                <li><strong>Restrict state access</strong> — IAM policies limiting who can read the state file (it is as sensitive as the secrets it contains).</li>
                <li><strong>Avoid passing secrets through Terraform entirely</strong> — some architectures have the application read secrets directly from Vault at runtime, so Terraform never touches them.</li>
            </ul>`,
            interviewTip: 'The most secure pattern: Terraform creates the secret store (Key Vault, Secrets Manager) and sets the access policy, but a separate process (rotation Lambda, manual entry) puts the actual secret value in. Terraform never sees the plaintext password. Explain this separation of concerns.',
            followUp: ['What is the risk of using environment variables for Terraform secrets?', 'How does Vault dynamic secrets eliminate the problem entirely?', 'How do you handle database password rotation with Terraform?'],
            seniorPerspective: 'My preferred pattern: Terraform creates the Secrets Manager secret (empty), a rotation Lambda populates and rotates the value, and the application reads it at runtime via IAM role. Terraform never contains the actual password — only the secret ARN flows through state.',
            architectPerspective: 'The fundamental tension: Terraform needs to provision resources that require secrets (DB passwords), but state should not contain them. The resolution is architectural separation: Terraform provisions the container (Secrets Manager secret, Key Vault entry) and the access policy, while a separate process manages the secret lifecycle. This matches the principle of least privilege.'
        },
        {
            question: 'Describe how you would organize Terraform for an enterprise with 50+ microservices across 3 environments.',
            difficulty: 'expert',
            answer: `<p>Enterprise Terraform organization at scale requires careful structuring:</p>
            <ul>
                <li><strong>Repo structure:</strong> Shared modules repo (versioned, published to registry) + per-team/service repos that consume modules.</li>
                <li><strong>State isolation:</strong> Separate state per service per environment (e.g., payments-prod.tfstate, payments-staging.tfstate). ~150 state files for 50 services × 3 environments.</li>
                <li><strong>Shared infrastructure:</strong> Platform team owns networking, Kubernetes cluster, shared databases in their own states. Service teams reference outputs via data sources.</li>
                <li><strong>Module registry:</strong> Private registry with golden modules (vpc, eks, rds, s3) encoding organizational policies.</li>
                <li><strong>Terragrunt or Terraform Cloud:</strong> Manage the multiplicity of environments and dependency ordering.</li>
                <li><strong>Policy as code:</strong> OPA/Sentinel enforces guardrails (required tags, encryption, no public access) across all teams.</li>
            </ul>`,
            interviewTip: 'Draw the layered ownership: platform team owns foundational layers (VPC, K8s cluster), service teams own their specific resources. Show understanding that this is an organizational design problem, not just a file structure problem.',
            followUp: ['How do you handle cross-service dependencies?', 'What is the role of a platform engineering team in this model?', 'How do you enforce module usage across 50 teams?'],
            seniorPerspective: 'I structure it as: infrastructure-modules/ repo (versioned modules), infrastructure-live/ repo per team (Terragrunt or separate directories per env). The platform team provides the modules and the CI pipeline templates. Service teams use them as building blocks.',
            architectPerspective: 'At enterprise scale, Terraform is a platform, not a tool. It requires the same investment as any internal platform: dedicated team, documented standards, golden paths, self-service automation, and governance controls. Without this investment, 50 teams using Terraform independently creates 50 different patterns and exponential operational complexity.'
        }
    ]
});
