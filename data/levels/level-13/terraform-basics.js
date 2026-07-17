/* Level 13 - Cloud-Native: Terraform Basics */
'use strict';
PageData.register('terraform-basics', {
    "title": "Terraform Basics",
    "description": "Infrastructure as Code, HCL workflow, providers, resources, variables, outputs, state, backends",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Terraform by HashiCorp is the industry standard for Infrastructure as Code (IaC). It uses declarative HCL to define infrastructure, manages state to track real-world resources, and provides a plan-apply workflow for safe changes.</p>"
        },
        {
            "title": "Core Concepts",
            "content": "<p><strong>Declarative</strong>: describe desired state, Terraform figures out how. <strong>Providers</strong>: plugins for cloud APIs (AWS, Azure, GCP). <strong>Resources</strong>: infrastructure objects. <strong>State</strong>: maps config to real resources. <strong>Workflow</strong>: init, plan, apply, destroy.</p>",
            "mermaid": "graph LR\n A[Write HCL] --> B[terraform init]\n B --> C[terraform plan]\n C --> D[Review changes]\n D --> E[terraform apply]\n E --> F[State updated]"
        },
        {
            "title": "HCL Syntax",
            "content": "<p>Resources, variables, outputs, data sources, locals. Terraform tracks dependencies automatically via references between resources.</p>",
            "code": "variable region {\n type = string\n default = us-east-1\n}\n\nprovider aws {\n region = var.region\n}\n\nresource aws_instance web {\n ami = ami-0c55b159cbfafe1f0\n instance_type = t3.micro\n tags = {\n Name = web-server\n }\n}\n\noutput public_ip {\n value = aws_instance.web.public_ip\n}",
            "language": "hcl"
        },
        {
            "title": "State Management",
            "content": "<p>State file tracks real infrastructure. Local state for dev, remote backends (S3, Azure Blob, GCS) for teams. State locking prevents concurrent modifications. Never commit state to Git (contains secrets).</p>",
            "code": "terraform {\n backend s3 {\n bucket = my-tf-state\n key = prod/terraform.tfstate\n region = us-east-1\n encrypt = true\n dynamodb_table = tf-locks\n }\n}",
            "language": "hcl"
        },
        {
            "title": "Variables and Outputs",
            "content": "<p>Input variables parameterize config. Types: string, number, bool, list, map, object. Outputs expose values for other modules or CLI display. Use .tfvars files per environment.</p>"
        },
        {
            "title": "Data Sources",
            "content": "<p>Query existing infrastructure without managing it. Use to reference AMIs, VPCs, DNS zones owned by other teams or created manually.</p>",
            "code": "data aws_ami latest {\n most_recent = true\n owners = [amazon]\n filter {\n name = name\n values = [amzn2-ami-hvm-*-x86_64-gp2]\n }\n}\n\nresource aws_instance web {\n ami = data.aws_ami.latest.id\n}",
            "language": "hcl"
        },
        {
            "title": "Workspace and Environments",
            "content": "<p>Workspaces provide separate state per environment (dev/staging/prod) from same config. Alternative: separate directories per env with shared modules.</p>"
        },
        {
            "title": "Common Mistakes",
            "content": "",
            "callout": {
                "type": "warning",
                "title": "Terraform Pitfalls",
                "text": "<ul><li>State in Git (secrets exposed)</li><li>No state locking (concurrent corruption)</li><li>Hardcoded values instead of variables</li><li>No remote backend for teams</li><li>terraform apply without plan review</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Key Topics",
                "text": "<ul><li>State purpose and management</li><li>Plan vs Apply workflow</li><li>How to handle secrets in Terraform</li><li>Module design principles</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "junior",
            "title": "What is Terraform?",
            "answer": "<p>Infrastructure as Code tool. Declarative HCL defines desired state, Terraform creates/modifies infrastructure to match.</p>"
        },
        {
            "id": "q2",
            "level": "junior",
            "title": "What is terraform plan?",
            "answer": "<p>Shows what changes Terraform will make without applying. Review before apply for safety.</p>"
        },
        {
            "id": "q3",
            "level": "mid",
            "title": "What is Terraform state?",
            "answer": "<p>JSON file mapping config to real resources. Tracks metadata, dependencies. Store remotely with locking for teams.</p>"
        },
        {
            "id": "q4",
            "level": "mid",
            "title": "Remote backend benefits?",
            "answer": "<p>Team collaboration, state locking (prevent concurrent changes), encryption, versioning, separation from code.</p>"
        },
        {
            "id": "q5",
            "level": "mid",
            "title": "Variables vs locals?",
            "answer": "<p>Variables: input parameters (configurable per env). Locals: computed intermediate values (DRY within module, not configurable from outside).</p>"
        },
        {
            "id": "q6",
            "level": "senior",
            "title": "Handle secrets in Terraform?",
            "answer": "<p>Never in state/code. Use: vault provider, environment variables, encrypted remote state, sensitive=true flag, external secret references.</p>"
        },
        {
            "id": "q7",
            "level": "senior",
            "title": "State file corruption recovery?",
            "answer": "<p>Remote backend versioning for rollback. terraform import to re-associate. terraform state rm for orphans. Always backup before manipulation.</p>"
        },
        {
            "id": "q8",
            "level": "lead",
            "title": "Multi-environment strategy?",
            "answer": "<p>Shared modules + per-env variables. Options: workspaces (simple), directory-per-env (isolated), Terragrunt (DRY). Remote state per env with separate backends.</p>"
        },
        {
            "id": "q9",
            "level": "architect",
            "title": "Terraform at enterprise scale?",
            "answer": "<p>Module registry, policy-as-code (Sentinel/OPA), CI/CD pipelines for plan/apply, state isolation per team, drift detection, cost estimation.</p>"
        }
    ]
});
