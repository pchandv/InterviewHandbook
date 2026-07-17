/* Level 13 - Cloud-Native: Terraform Advanced */
'use strict';
PageData.register('terraform-advanced', {
    "title": "Terraform Advanced",
    "description": "Modules, remote state, lifecycle rules, dynamic blocks, multi-cloud provisioning",
    "level": 13,
    "sections": [
        {
            "title": "Introduction",
            "content": "<p>Advanced Terraform covers modules for reusability, lifecycle rules for safe updates, dynamic blocks for DRY config, and patterns for managing complex multi-cloud infrastructure.</p>"
        },
        {
            "title": "Modules",
            "content": "<p>Reusable packages of Terraform config. Source from local paths, Git, or registries. Pass variables in, expose outputs. Compose infrastructure from building blocks.</p>",
            "code": "module vpc {\n source = ./modules/vpc\n cidr = 10.0.0.0/16\n azs = [us-east-1a, us-east-1b]\n}\n\nmodule eks {\n source = ./modules/eks\n vpc_id = module.vpc.vpc_id\n subnet_ids = module.vpc.private_subnets\n}",
            "language": "hcl"
        },
        {
            "title": "Lifecycle Rules",
            "content": "<p>Control resource behavior: create_before_destroy (zero-downtime replacements), prevent_destroy (safety), ignore_changes (external modifications).</p>",
            "code": "resource aws_instance web {\n lifecycle {\n create_before_destroy = true\n prevent_destroy = true\n ignore_changes = [tags]\n }\n}",
            "language": "hcl"
        },
        {
            "title": "Dynamic Blocks",
            "content": "<p>Generate repeated nested blocks from collections. Reduces duplication for security group rules, IAM policies, etc.</p>"
        },
        {
            "title": "Remote State Data",
            "content": "<p>Reference outputs from other Terraform projects. Enables team boundaries while sharing infrastructure references (VPC IDs, DNS zones).</p>"
        },
        {
            "title": "Best Practices",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Production Patterns",
                "text": "<ul><li>Small, focused modules</li><li>Pin provider versions</li><li>Use workspaces or directories per env</li><li>CI/CD for plan+apply</li><li>Policy-as-code (Sentinel/OPA)</li></ul>"
            }
        },
        {
            "title": "Interview Tips",
            "content": "",
            "callout": {
                "type": "tip",
                "title": "Advanced Topics",
                "text": "<ul><li>Module design and composition</li><li>State management at scale</li><li>Zero-downtime infrastructure changes</li><li>Multi-account/multi-region patterns</li></ul>"
            }
        }
    ],
    "questions": [
        {
            "id": "q1",
            "level": "mid",
            "title": "What are Terraform modules?",
            "answer": "<p>Reusable config packages. Accept variables, expose outputs. Source from local, Git, or registry. Compose complex infra from building blocks.</p>"
        },
        {
            "id": "q2",
            "level": "mid",
            "title": "create_before_destroy use case?",
            "answer": "<p>Zero-downtime replacements. New resource created first, then old destroyed. Essential for load balancers, DNS, instances behind ASG.</p>"
        },
        {
            "id": "q3",
            "level": "senior",
            "title": "Module versioning strategy?",
            "answer": "<p>Semantic versioning in Git tags. Pin in consumer: source=git::tag=v1.2.0. Registry modules with version constraint. Breaking changes = major bump.</p>"
        },
        {
            "id": "q4",
            "level": "senior",
            "title": "Handle provider version conflicts?",
            "answer": "<p>Required_providers block with version constraints. Lock file (.terraform.lock.hcl) for reproducibility. Separate state per provider version if needed.</p>"
        },
        {
            "id": "q5",
            "level": "lead",
            "title": "Design module library for organization?",
            "answer": "<p>Internal registry, opinionated modules with sensible defaults, input validation, documentation, examples, automated testing (terratest), CODEOWNERS.</p>"
        },
        {
            "id": "q6",
            "level": "architect",
            "title": "Multi-account cloud strategy with Terraform?",
            "answer": "<p>Hub-spoke model: shared services account + workload accounts. Provider aliases per account. Cross-account state references. Landing zone module for account baseline.</p>"
        }
    ]
});
