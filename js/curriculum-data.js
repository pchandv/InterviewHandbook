/* ═══════════════════════════════════════════════════════════════════
   CURRICULUM-DATA.JS — Level Metadata, Tracks, Career Roadmap
   Powers the interactive roadmap, learning tracks, and career views
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const CurriculumData = (() => {

    // ─── Level Metadata ─────────────────────────────────────────────
    const levels = [
        {
            level: 0,
            title: 'Computer Science',
            subtitle: 'Prerequisites & Fundamentals',
            difficulty: 'beginner',
            estimatedHours: 12,
            interviewWeight: 3,
            importance: 'Foundation',
            icon: '🖥️',
            color: '#10b981',
            objectives: [
                'Understand binary, boolean logic, and number systems',
                'Explain how CPUs execute instructions',
                'Describe OS process/thread management',
                'Explain TCP/IP networking fundamentals',
                'Use Git for version control confidently'
            ],
            skills: ['Binary', 'Boolean Logic', 'OS Concepts', 'Networking', 'Git'],
            companies: ['All companies — baseline expectation'],
            prerequisites: [],
            careerImpact: 'Required foundation for all engineering roles',
            questionCount: 105
        },
        {
            level: 1,
            title: 'Modern C#',
            subtitle: 'Core Language Features & Paradigms',
            difficulty: 'beginner',
            estimatedHours: 20,
            interviewWeight: 5,
            importance: 'Critical',
            icon: '⚡',
            color: '#6366f1',
            objectives: [
                'Master value types, reference types, and boxing',
                'Write efficient LINQ queries with deferred execution',
                'Implement async/await patterns correctly',
                'Use generics with constraints and variance',
                'Manage memory with Span<T> and IDisposable'
            ],
            skills: ['C#', 'LINQ', 'Async/Await', 'Generics', 'Memory Management'],
            companies: ['Microsoft', 'Amazon', 'Goldman Sachs', 'EPAM', 'ThoughtWorks'],
            prerequisites: ['Level 0 — Computing Basics'],
            careerImpact: 'Asked in every .NET interview without exception',
            questionCount: 185
        },
        {
            level: 2,
            title: 'Advanced .NET',
            subtitle: 'ASP.NET Core, APIs, Middleware & DI',
            difficulty: 'intermediate',
            estimatedHours: 30,
            interviewWeight: 5,
            importance: 'Critical',
            icon: '🏗️',
            color: '#0078d4',
            objectives: [
                'Build production APIs with ASP.NET Core',
                'Implement authentication with JWT/OAuth',
                'Design middleware pipelines',
                'Configure dependency injection lifetimes',
                'Use SignalR for real-time communication'
            ],
            skills: ['ASP.NET Core', 'REST APIs', 'JWT/OAuth', 'SignalR', 'Blazor', 'DI'],
            companies: ['Microsoft', 'Amazon', 'Netflix', 'Goldman Sachs', 'Uber'],
            prerequisites: ['Level 1 — Modern C#'],
            careerImpact: 'Core skill for mid-to-senior .NET roles',
            questionCount: 200
        },
        {
            level: 3,
            title: 'Engineering Principles',
            subtitle: 'SOLID, Clean Code, Testing & Quality',
            difficulty: 'intermediate',
            estimatedHours: 15,
            interviewWeight: 5,
            importance: 'Critical',
            icon: '📐',
            color: '#f59e0b',
            objectives: [
                'Apply SOLID principles in real code',
                'Write clean, self-documenting code',
                'Design effective unit tests with TDD',
                'Identify and eliminate code smells',
                'Measure and improve code quality metrics'
            ],
            skills: ['SOLID', 'Clean Code', 'TDD', 'Refactoring', 'Code Quality'],
            companies: ['All companies — table-stakes for senior roles'],
            prerequisites: ['Level 1 — Modern C#'],
            careerImpact: 'Separates mid-level from senior engineers',
            questionCount: 120
        },
        {
            level: 4,
            title: 'Design Patterns',
            subtitle: 'GoF Creational, Structural & Behavioral',
            difficulty: 'intermediate',
            estimatedHours: 18,
            interviewWeight: 4,
            importance: 'High',
            icon: '🧩',
            color: '#8b5cf6',
            objectives: [
                'Implement all 23 GoF patterns in C#',
                'Choose the right pattern for the problem',
                'Combine patterns for complex solutions',
                'Apply Repository and Unit of Work',
                'Use MediatR/CQRS for decoupling'
            ],
            skills: ['GoF Patterns', 'Repository', 'CQRS', 'MediatR', 'Anti-Patterns'],
            companies: ['Microsoft', 'Google', 'Amazon', 'ThoughtWorks', 'EPAM'],
            prerequisites: ['Level 3 — Engineering Principles'],
            careerImpact: 'Commonly tested in system design rounds',
            questionCount: 95
        },
        {
            level: 5,
            title: 'Architecture',
            subtitle: 'DDD, Microservices & Distributed Systems',
            difficulty: 'advanced',
            estimatedHours: 40,
            interviewWeight: 5,
            importance: 'Critical',
            icon: '🏛️',
            color: '#ec4899',
            objectives: [
                'Design microservices with proper boundaries',
                'Implement event-driven architectures',
                'Apply DDD tactical and strategic patterns',
                'Handle distributed data consistency (Saga, Outbox)',
                'Choose between architectural styles'
            ],
            skills: ['Microservices', 'DDD', 'Event-Driven', 'CQRS', 'API Design', 'Kafka'],
            companies: ['Netflix', 'Uber', 'Amazon', 'Google', 'Meta', 'Microsoft'],
            prerequisites: ['Level 4 — Design Patterns'],
            careerImpact: 'Defines senior→staff engineer transition',
            questionCount: 250
        },
        {
            level: 6,
            title: 'SQL & Data',
            subtitle: 'Indexes, EF Core, Dapper & Migrations',
            difficulty: 'intermediate',
            estimatedHours: 15,
            interviewWeight: 4,
            importance: 'High',
            icon: '🗄️',
            color: '#14b8a6',
            objectives: [
                'Optimize queries with proper indexing',
                'Read and interpret execution plans',
                'Handle transactions and isolation levels',
                'Use EF Core with change tracking efficiently',
                'Implement zero-downtime database migrations'
            ],
            skills: ['SQL Server', 'EF Core', 'Dapper', 'Indexing', 'Transactions'],
            companies: ['Goldman Sachs', 'Amazon', 'Microsoft', 'All fintech'],
            prerequisites: ['Level 2 — Advanced .NET'],
            careerImpact: 'Data questions appear in 80% of backend interviews',
            questionCount: 75
        },
        {
            level: 7,
            title: 'Angular & Frontend',
            subtitle: 'Components, Signals, RxJS & Performance',
            difficulty: 'intermediate',
            estimatedHours: 20,
            interviewWeight: 3,
            importance: 'High',
            icon: '🅰️',
            color: '#ef4444',
            objectives: [
                'Build components with signals and change detection',
                'Master RxJS operators and avoid memory leaks',
                'Implement lazy loading and performance optimization',
                'Write testable Angular code with TestBed',
                'Apply accessibility best practices (WCAG)'
            ],
            skills: ['Angular', 'RxJS', 'TypeScript', 'HTML/CSS', 'Accessibility'],
            companies: ['Google', 'Microsoft', 'EPAM', 'ThoughtWorks'],
            prerequisites: ['Level 1 — TypeScript section'],
            careerImpact: 'Required for full-stack roles; differentiator for backend devs',
            questionCount: 85
        },
        {
            level: 8,
            title: 'Cloud',
            subtitle: 'Azure, AWS, Networking & Terraform',
            difficulty: 'advanced',
            estimatedHours: 25,
            interviewWeight: 4,
            importance: 'High',
            icon: '☁️',
            color: '#0ea5e9',
            objectives: [
                'Design cloud-native applications on Azure/AWS',
                'Implement infrastructure as code with Terraform',
                'Configure VPCs, load balancers, and DNS',
                'Apply 12-factor app principles',
                'Plan cloud migrations using the 6 Rs'
            ],
            skills: ['Azure', 'AWS', 'Terraform', 'Cloud Networking', 'Cloud-Native'],
            companies: ['Amazon', 'Microsoft', 'Google', 'Netflix', 'Uber'],
            prerequisites: ['Level 5 — Architecture basics'],
            careerImpact: 'Cloud knowledge now expected for all senior roles',
            questionCount: 90
        },
        {
            level: 9,
            title: 'DevOps',
            subtitle: 'CI/CD, Docker, Kubernetes & Observability',
            difficulty: 'advanced',
            estimatedHours: 20,
            interviewWeight: 3,
            importance: 'High',
            icon: '🔄',
            color: '#22c55e',
            objectives: [
                'Design CI/CD pipelines with YAML',
                'Containerize applications with Docker',
                'Deploy to Kubernetes with Helm',
                'Implement observability (metrics, traces, logs)',
                'Choose deployment strategies (blue-green, canary)'
            ],
            skills: ['Docker', 'Kubernetes', 'CI/CD', 'Observability', 'ELK Stack'],
            companies: ['Netflix', 'Google', 'Amazon', 'Uber', 'Meta'],
            prerequisites: ['Level 8 — Cloud fundamentals'],
            careerImpact: 'Expected knowledge for senior+ platform roles',
            questionCount: 70
        },
        {
            level: 10,
            title: 'Security',
            subtitle: 'OWASP, Auth, Encryption & Zero Trust',
            difficulty: 'advanced',
            estimatedHours: 15,
            interviewWeight: 4,
            importance: 'High',
            icon: '🔒',
            color: '#f43f5e',
            objectives: [
                'Prevent OWASP Top 10 vulnerabilities',
                'Implement OAuth 2.0/OIDC flows correctly',
                'Apply secure coding practices',
                'Design zero trust architectures',
                'Conduct threat modeling with STRIDE'
            ],
            skills: ['OWASP', 'OAuth/JWT', 'Encryption', 'Zero Trust', 'Threat Modeling'],
            companies: ['Goldman Sachs', 'Microsoft', 'Google', 'All fintech/healthcare'],
            prerequisites: ['Level 2 — ASP.NET Auth section'],
            careerImpact: 'Security questions increasingly common; critical for fintech',
            questionCount: 60
        },
        {
            level: 11,
            title: 'Performance',
            subtitle: 'Caching, Optimization, Load Testing & SLOs',
            difficulty: 'advanced',
            estimatedHours: 18,
            interviewWeight: 4,
            importance: 'High',
            icon: '⚡',
            color: '#eab308',
            objectives: [
                'Implement caching strategies (aside, through, invalidation)',
                'Profile and optimize .NET applications',
                'Design load tests and interpret results',
                'Set SLOs/SLIs and manage error budgets',
                'Implement rate limiting patterns'
            ],
            skills: ['Caching', 'Profiling', 'Load Testing', 'Rate Limiting', 'SLOs'],
            companies: ['Netflix', 'Uber', 'Amazon', 'Google', 'High-traffic systems'],
            prerequisites: ['Level 5 — Architecture', 'Level 6 — SQL'],
            careerImpact: 'Performance knowledge separates good from great engineers',
            questionCount: 75
        },
        {
            level: 12,
            title: 'AI Engineering',
            subtitle: 'LLMs, RAG, Agents, Prompt Engineering',
            difficulty: 'advanced',
            estimatedHours: 20,
            interviewWeight: 4,
            importance: 'Critical (2025+)',
            icon: '🤖',
            color: '#a855f7',
            objectives: [
                'Integrate LLMs into .NET applications',
                'Build RAG pipelines with vector databases',
                'Design AI agents with Semantic Kernel',
                'Implement guardrails and responsible AI',
                'Optimize cost and latency of AI features'
            ],
            skills: ['LLMs', 'RAG', 'Semantic Kernel', 'Prompt Engineering', 'AI Agents'],
            companies: ['Microsoft', 'Google', 'Amazon', 'Meta', 'All AI-first companies'],
            prerequisites: ['Level 2 — Advanced .NET', 'Level 5 — Architecture'],
            careerImpact: 'Fastest-growing interview topic; expected by 2025-2026',
            questionCount: 50
        },
        {
            level: 13,
            title: 'System Design',
            subtitle: 'Case Studies & Trade-off Analysis',
            difficulty: 'expert',
            estimatedHours: 25,
            interviewWeight: 5,
            importance: 'Critical',
            icon: '📊',
            color: '#06b6d4',
            objectives: [
                'Drive system design interviews with confidence',
                'Estimate capacity and choose data models',
                'Design Netflix, Uber, WhatsApp at scale',
                'Analyze trade-offs and justify decisions',
                'Design data-intensive applications'
            ],
            skills: ['System Design', 'Capacity Planning', 'Trade-offs', 'Data Modeling'],
            companies: ['Google', 'Meta', 'Amazon', 'Netflix', 'Uber', 'Microsoft'],
            prerequisites: ['Level 5 — Architecture', 'Level 8 — Cloud'],
            careerImpact: 'Required round for all senior+ positions at top companies',
            questionCount: 80
        },
        {
            level: 14,
            title: 'Production Engineering',
            subtitle: 'Incidents, SRE, Chaos & Feature Flags',
            difficulty: 'expert',
            estimatedHours: 20,
            interviewWeight: 3,
            importance: 'High',
            icon: '🚨',
            color: '#f97316',
            objectives: [
                'Manage production incidents effectively',
                'Design resilient systems with circuit breakers',
                'Practice chaos engineering safely',
                'Implement feature flags and progressive rollouts',
                'Debug production issues with distributed tracing'
            ],
            skills: ['Incident Management', 'Chaos Engineering', 'Feature Flags', 'SRE'],
            companies: ['Netflix', 'Google', 'Amazon', 'Uber', 'Meta'],
            prerequisites: ['Level 9 — DevOps', 'Level 11 — Performance'],
            careerImpact: 'Key differentiator for staff/principal roles',
            questionCount: 65
        },
        {
            level: 15,
            title: 'Leadership',
            subtitle: 'Strategy, Team Building & Communication',
            difficulty: 'expert',
            estimatedHours: 15,
            interviewWeight: 4,
            importance: 'Critical',
            icon: '👥',
            color: '#84cc16',
            objectives: [
                'Lead technical strategy and ADR processes',
                'Build and grow high-performing teams',
                'Communicate effectively with stakeholders',
                'Manage technical debt strategically',
                'Run structured interviews and hiring processes'
            ],
            skills: ['Tech Strategy', 'Team Building', 'Communication', 'Hiring', 'Tech Debt'],
            companies: ['All companies for lead+ roles'],
            prerequisites: ['5+ years of professional experience'],
            careerImpact: 'Required for tech lead, staff, and principal roles',
            questionCount: 55
        },
        {
            level: 16,
            title: 'Interview Mastery',
            subtitle: 'Behavioral, Coding & System Design Interviews',
            difficulty: 'expert',
            estimatedHours: 12,
            interviewWeight: 5,
            importance: 'Critical',
            icon: '🎯',
            color: '#d946ef',
            objectives: [
                'Structure answers with STAR method',
                'Solve coding problems with UMPIRE framework',
                'Drive system design rounds confidently',
                'Handle behavioral curveballs authentically',
                'Build and rehearse your story bank'
            ],
            skills: ['STAR Method', 'Problem Solving', 'Communication', 'Scenario Analysis'],
            companies: ['All companies — meta-skill for all interviews'],
            prerequisites: ['Completed at least Levels 1-5'],
            careerImpact: 'Directly determines interview success',
            questionCount: 50
        },
        {
            level: 17,
            title: 'Staff / Principal Engineering',
            subtitle: 'Architecture Decisions, Scalability & Platform',
            difficulty: 'expert',
            estimatedHours: 35,
            interviewWeight: 4,
            importance: 'Critical',
            icon: '🏆',
            color: '#f59e0b',
            objectives: [
                'Make architecture decisions under uncertainty',
                'Design multi-region global systems',
                'Apply systems thinking to complex problems',
                'Lead platform engineering initiatives',
                'Optimize cloud costs with FinOps'
            ],
            skills: ['Architecture Decisions', 'Scalability', 'Platform Engineering', 'FinOps', 'Data Mesh'],
            companies: ['Google', 'Meta', 'Netflix', 'Amazon', 'Microsoft', 'Uber'],
            prerequisites: ['All previous levels recommended'],
            careerImpact: 'Defines staff/principal/distinguished engineer level',
            questionCount: 160
        }
    ];

    // ─── Learning Tracks ────────────────────────────────────────────
    const tracks = [
        {
            id: 'dotnet-developer',
            title: '.NET Developer',
            subtitle: 'Backend-focused .NET engineering',
            icon: '💻',
            color: '#6366f1',
            levels: [0, 1, 2, 3, 4, 5, 6, 10, 11],
            estimatedWeeks: 8,
            targetRole: 'Senior .NET Developer',
            description: 'Master C#, ASP.NET Core, SQL, and backend architecture'
        },
        {
            id: 'fullstack-engineer',
            title: 'Full Stack Engineer',
            subtitle: 'End-to-end web development',
            icon: '🌐',
            color: '#0078d4',
            levels: [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 13],
            estimatedWeeks: 12,
            targetRole: 'Senior Full Stack Engineer',
            description: 'C#, Angular, APIs, SQL, cloud basics, and system design'
        },
        {
            id: 'ai-engineer',
            title: 'AI Engineer (.NET)',
            subtitle: 'AI-powered application development',
            icon: '🤖',
            color: '#a855f7',
            levels: [0, 1, 2, 3, 5, 6, 12, 13],
            estimatedWeeks: 10,
            targetRole: 'AI/ML Engineer',
            description: 'LLMs, RAG, Semantic Kernel, plus strong .NET foundation'
        },
        {
            id: 'solution-architect',
            title: 'Solution Architect',
            subtitle: 'Enterprise architecture mastery',
            icon: '🏛️',
            color: '#ec4899',
            levels: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 17],
            estimatedWeeks: 16,
            targetRole: 'Solution Architect',
            description: 'Full architecture stack from patterns to cloud to leadership'
        },
        {
            id: 'tech-lead',
            title: 'Technical Lead',
            subtitle: 'Technical leadership & delivery',
            icon: '👥',
            color: '#22c55e',
            levels: [0, 1, 2, 3, 4, 5, 6, 8, 9, 13, 14, 15],
            estimatedWeeks: 14,
            targetRole: 'Technical Lead / Engineering Manager',
            description: 'Architecture, DevOps, production engineering, and leadership'
        },
        {
            id: 'staff-engineer',
            title: 'Staff Engineer',
            subtitle: 'Deep technical expertise & influence',
            icon: '⭐',
            color: '#f59e0b',
            levels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            estimatedWeeks: 20,
            targetRole: 'Staff Engineer',
            description: 'Complete curriculum — depth across all domains'
        },
        {
            id: 'principal-engineer',
            title: 'Principal Engineer',
            subtitle: 'Organization-wide technical leadership',
            icon: '🏆',
            color: '#ef4444',
            levels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            estimatedWeeks: 24,
            targetRole: 'Principal / Distinguished Engineer',
            description: 'Full mastery plus advanced architecture labs and systems thinking'
        }
    ];

    // ─── Career Roadmap ─────────────────────────────────────────────
    const careers = [
        {
            role: 'Junior Developer',
            yearsExp: '0-2',
            icon: '🌱',
            color: '#10b981',
            requiredLevels: [0, 1],
            recommendedLevels: [2, 3],
            skills: ['C# Basics', 'Git', 'SQL Basics', 'Unit Testing'],
            projects: ['CRUD API', 'Todo App', 'Simple REST service'],
            interviewFocus: 'Language fundamentals, basic algorithms, willingness to learn'
        },
        {
            role: 'Mid-Level Developer',
            yearsExp: '2-5',
            icon: '🌿',
            color: '#22c55e',
            requiredLevels: [0, 1, 2, 3, 4],
            recommendedLevels: [5, 6],
            skills: ['ASP.NET Core', 'Design Patterns', 'SQL', 'Testing', 'Git'],
            projects: ['Microservice', 'Auth system', 'Background job processor'],
            interviewFocus: 'SOLID, patterns, API design, debugging skills'
        },
        {
            role: 'Senior Developer',
            yearsExp: '5-8',
            icon: '🌳',
            color: '#0078d4',
            requiredLevels: [0, 1, 2, 3, 4, 5, 6],
            recommendedLevels: [7, 8, 9, 10],
            skills: ['Architecture', 'Microservices', 'Cloud', 'Performance', 'Mentoring'],
            projects: ['Event-driven system', 'Cloud deployment pipeline', 'Performance optimization'],
            interviewFocus: 'System design, architecture trade-offs, production experience'
        },
        {
            role: 'Senior Full Stack Engineer',
            yearsExp: '5-10',
            icon: '🌐',
            color: '#6366f1',
            requiredLevels: [0, 1, 2, 3, 4, 5, 6, 7],
            recommendedLevels: [8, 10, 13],
            skills: ['Full Stack', 'Angular/React', 'APIs', 'DevOps', 'System Design'],
            projects: ['Full-stack SaaS app', 'Real-time dashboard', 'Mobile-responsive PWA'],
            interviewFocus: 'End-to-end ownership, frontend+backend depth, system design'
        },
        {
            role: 'Technical Lead',
            yearsExp: '8-12',
            icon: '🎖️',
            color: '#f59e0b',
            requiredLevels: [0, 1, 2, 3, 4, 5, 6, 8, 9, 13, 15],
            recommendedLevels: [10, 11, 14, 16],
            skills: ['Architecture', 'Leadership', 'Mentoring', 'Strategy', 'Delivery'],
            projects: ['Lead team of 5+', 'Architecture migration', 'Production incident leadership'],
            interviewFocus: 'Technical decisions, team leadership, conflict resolution, strategy'
        },
        {
            role: 'Solution Architect',
            yearsExp: '10-15',
            icon: '🏗️',
            color: '#ec4899',
            requiredLevels: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 17],
            recommendedLevels: [7, 12, 16],
            skills: ['Enterprise Architecture', 'Cloud', 'Security', 'Stakeholder Management'],
            projects: ['Enterprise platform', 'Multi-region architecture', 'Cloud migration'],
            interviewFocus: 'Architecture decisions, trade-offs, breadth of knowledge, communication'
        },
        {
            role: 'Staff Engineer',
            yearsExp: '10-15',
            icon: '⭐',
            color: '#a855f7',
            requiredLevels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 17],
            recommendedLevels: [12, 16],
            skills: ['Deep Expertise', 'Cross-Team Influence', 'Systems Thinking', 'Mentoring'],
            projects: ['Organization-wide initiative', 'Platform evolution', 'Performance at scale'],
            interviewFocus: 'Depth + breadth, influence without authority, complex problem solving'
        },
        {
            role: 'Principal Engineer',
            yearsExp: '15+',
            icon: '🏆',
            color: '#ef4444',
            requiredLevels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            recommendedLevels: [],
            skills: ['Vision', 'Industry Influence', 'R&D', 'Multi-Year Strategy', 'Innovation'],
            projects: ['Industry-defining system', 'Multi-year tech strategy', 'Open source leadership'],
            interviewFocus: 'Vision, impact at scale, technical judgment, industry perspective'
        },
        {
            role: 'Engineering Manager',
            yearsExp: '8-15',
            icon: '📋',
            color: '#06b6d4',
            requiredLevels: [0, 1, 2, 3, 4, 5, 13, 15],
            recommendedLevels: [8, 9, 14, 16],
            skills: ['People Management', 'Delivery', 'Hiring', 'Strategy', 'Coaching'],
            projects: ['Team scaling', 'Process improvement', 'Cross-team delivery'],
            interviewFocus: 'People leadership, delivery track record, hiring, conflict, strategy'
        }
    ];

    // ─── Experience Profiles ────────────────────────────────────────
    const experienceProfiles = [
        {
            id: 'student',
            label: 'Student / Bootcamp',
            years: '0',
            strengths: ['Enthusiasm', 'Latest tech exposure', 'No bad habits'],
            gaps: ['Production experience', 'Architecture', 'Performance', 'Leadership'],
            startLevel: 0,
            priorityLevels: [0, 1, 2, 3],
            estimatedPrepWeeks: 16,
            skipLevels: [14, 15, 17]
        },
        {
            id: 'junior',
            label: '0–2 Years',
            years: '0-2',
            strengths: ['Recent education', 'Energy', 'Adaptability'],
            gaps: ['Design patterns', 'Architecture', 'Production debugging', 'Cloud'],
            startLevel: 1,
            priorityLevels: [1, 2, 3, 4, 6],
            estimatedPrepWeeks: 12,
            skipLevels: [14, 15, 17]
        },
        {
            id: 'mid',
            label: '3–5 Years',
            years: '3-5',
            strengths: ['Solid coding', 'Some patterns', 'Team collaboration'],
            gaps: ['Advanced architecture', 'System design', 'Cloud depth', 'Leadership'],
            startLevel: 3,
            priorityLevels: [4, 5, 6, 8, 13],
            estimatedPrepWeeks: 8,
            skipLevels: [0]
        },
        {
            id: 'senior',
            label: '6–10 Years',
            years: '6-10',
            strengths: ['Architecture', 'Production experience', 'Mentoring', 'Full stack'],
            gaps: ['System design practice', 'AI/ML', 'Cloud certifications', 'Staff-level thinking'],
            startLevel: 5,
            priorityLevels: [5, 12, 13, 14, 15, 16],
            estimatedPrepWeeks: 6,
            skipLevels: [0, 1]
        },
        {
            id: 'staff',
            label: '10–15 Years',
            years: '10-15',
            strengths: ['Deep expertise', 'Leadership', 'Production wisdom', 'Architecture'],
            gaps: ['AI/ML trends', 'Latest patterns', 'Interview rust', 'Behavioral prep'],
            startLevel: 12,
            priorityLevels: [12, 13, 15, 16, 17],
            estimatedPrepWeeks: 4,
            skipLevels: [0, 1, 2, 3]
        },
        {
            id: 'principal',
            label: '15+ Years',
            years: '15+',
            strengths: ['Vision', 'Industry experience', 'Deep technical judgment', 'Leadership'],
            gaps: ['Newest AI patterns', 'Interview format changes', 'Behavioral storytelling'],
            startLevel: 15,
            priorityLevels: [12, 16, 17],
            estimatedPrepWeeks: 3,
            skipLevels: [0, 1, 2, 3, 4]
        }
    ];

    // ─── Public API ─────────────────────────────────────────────────
    return {
        levels,
        tracks,
        careers,
        experienceProfiles,
        getLevel: (n) => levels.find(l => l.level === n),
        getTrack: (id) => tracks.find(t => t.id === id),
        getCareer: (role) => careers.find(c => c.role === role),
        getExperience: (id) => experienceProfiles.find(e => e.id === id),
        getDifficultyStars: (weight) => '★'.repeat(weight) + '☆'.repeat(5 - weight),
        getDifficultyLabel: (d) => ({ beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' }[d] || d)
    };
})();
