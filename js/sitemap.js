/* ═══════════════════════════════════════════════════════════════════
   SITEMAP.JS — Navigation Structure & Topic Registry
   Software Engineering Academy — 17-Level Curriculum
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const SiteMap = {
    levels: [
        // ─── LEVEL 0: Prerequisites ───────────────────────────────────
        {
            level: 0,
            title: 'Prerequisites',
            description: 'Getting started and computer fundamentals',
            groups: [
                {
                    id: 'getting-started',
                    title: 'Getting Started',
                    items: [
                        { id: 'home', title: 'Dashboard', icon: Icons.home, keywords: ['home', 'dashboard', 'overview'], dataFile: null },
                        { id: 'study-plan', title: 'Study Plan', icon: Icons.target, keywords: ['plan', 'schedule', 'roadmap'], dataFile: null },
                        { id: 'mock-interview', title: 'Mock Interview', icon: Icons.play, keywords: ['mock', 'practice', 'interview'], dataFile: null },
                        { id: 'flash-cards', title: 'Flash Cards', icon: Icons.shuffle, keywords: ['flash', 'cards', 'memorize'], dataFile: null }
                    ]
                },
                {
                    id: 'computing-basics',
                    title: 'Computing Basics',
                    items: [
                        { id: 'binary-number-systems', title: 'Binary & Number Systems', icon: Icons.hash, keywords: ['binary', 'hex', 'octal', 'number'], dataFile: 'data/levels/level-00/binary-number-systems.js' },
                        { id: 'boolean-logic', title: 'Boolean Logic & Gates', icon: Icons.zap, keywords: ['boolean', 'logic', 'gate', 'and', 'or', 'xor', 'nand', 'de morgan', 'truth table'], badge: '20', topics: ['AND/OR/NOT/XOR', 'Truth Tables', 'Logic Gates', "De Morgan's Laws", 'NAND/NOR Universal', 'Half Adder'], dataFile: 'data/levels/level-00/boolean-logic.js' },
                        { id: 'how-computers-work', title: 'How Computers Work', icon: Icons.cpu, keywords: ['cpu', 'memory', 'hardware', 'instruction', 'register', 'alu', 'cache', 'fetch decode execute'], badge: '20', topics: ['CPU & ALU', 'Registers', 'Fetch-Decode-Execute', 'Memory Hierarchy', 'Cache Locality', 'Stack vs Heap'], dataFile: 'data/levels/level-00/how-computers-work.js' },
                        { id: 'os-fundamentals', title: 'Operating System Basics', icon: Icons.terminal, keywords: ['os', 'process', 'thread', 'filesystem', 'scheduler', 'virtual memory', 'deadlock', 'concurrency'], badge: '20', topics: ['Process vs Thread', 'Scheduling', 'Virtual Memory', 'System Calls', 'Race Conditions', 'Deadlocks'], dataFile: 'data/levels/level-00/os-fundamentals.js' },
                        { id: 'networking-basics', title: 'Networking Fundamentals', icon: Icons.globe, keywords: ['tcp', 'ip', 'dns', 'http', 'network', 'udp', 'osi', 'ports', 'tls'], badge: '20', topics: ['OSI/TCP-IP Model', 'TCP vs UDP', 'IP & Ports', 'DNS', 'HTTP/HTTPS', 'TCP Handshake'], dataFile: 'data/levels/level-00/networking-basics.js' }
                    ]
                },
                {
                    id: 'developer-tools',
                    title: 'Developer Tools',
                    items: [
                        { id: 'git-version-control', title: 'Git & Version Control', icon: Icons.code, keywords: ['git', 'branch', 'merge', 'rebase', 'pull request', 'version control', 'gitflow', 'trunk based', 'cherry pick', 'conflict'], badge: '25', topics: ['Branching Strategies', 'Merge vs Rebase', 'PR Workflow', 'Conflict Resolution', 'GitFlow vs Trunk-Based', 'Cherry-Pick', 'Interactive Rebase'], dataFile: 'data/levels/level-00/git-version-control.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 1: C# Fundamentals ─────────────────────────────────
        {
            level: 1,
            title: 'C# Fundamentals',
            description: 'Core C# language features and paradigms',
            groups: [
                {
                    id: 'csharp-core',
                    title: 'C# Core',
                    items: [
                        { id: 'csharp-variables', title: 'Variables & Types', icon: Icons.hash, keywords: ['var', 'int', 'string', 'type', 'value', 'reference'], badge: '25', topics: ['Value Types', 'Reference Types', 'Boxing', 'Unboxing', 'Nullable', 'var keyword', 'Constants', 'Static', 'readonly'], dataFile: 'data/csharp.js' },
                        { id: 'csharp-collections', title: 'Collections', icon: Icons.grid, keywords: ['list', 'dictionary', 'array', 'hashset', 'queue', 'stack', 'concurrent'], badge: '30', topics: ['List<T>', 'Dictionary', 'HashSet', 'Queue', 'Stack', 'ConcurrentDictionary', 'IEnumerable', 'ICollection'], dataFile: 'data/csharp-collections.js' },
                        { id: 'csharp-linq', title: 'LINQ', icon: Icons.filter, keywords: ['linq', 'where', 'select', 'groupby', 'join', 'aggregate', 'expression'], badge: '35', topics: ['Query Syntax', 'Method Syntax', 'Deferred Execution', 'GroupBy', 'Join', 'Aggregate', 'Performance'], dataFile: 'data/csharp-linq.js' },
                        { id: 'csharp-delegates', title: 'Delegates & Events', icon: Icons.zap, keywords: ['delegate', 'event', 'action', 'func', 'predicate', 'multicast', 'callback'], badge: '20', topics: ['Delegates', 'Events', 'Action', 'Func', 'Predicate', 'Multicast', 'EventHandler'], dataFile: 'data/csharp-delegates.js' },
                        { id: 'csharp-async', title: 'Async/Await & TPL', icon: Icons.clock, keywords: ['async', 'await', 'task', 'parallel', 'concurrent', 'thread', 'synchronization'], badge: '40', topics: ['async/await', 'Task', 'ValueTask', 'Task.WhenAll', 'Task.WhenAny', 'CancellationToken', 'SemaphoreSlim', 'Deadlocks'], dataFile: 'data/csharp-async.js' }
                    ]
                },
                {
                    id: 'csharp-advanced-features',
                    title: 'Advanced C# Features',
                    items: [
                        { id: 'csharp-generics', title: 'Generics', icon: Icons.box, keywords: ['generic', 'constraint', 'covariant', 'contravariant', 'where'], badge: '15', topics: ['Generic Classes', 'Constraints', 'Covariance', 'Contravariance', 'Generic Methods'], dataFile: 'data/csharp-generics.js' },
                        { id: 'csharp-memory', title: 'Memory Management', icon: Icons.cpu, keywords: ['memory', 'garbage', 'gc', 'heap', 'stack', 'span', 'dispose', 'finalize'], badge: '25', topics: ['Stack vs Heap', 'Garbage Collection', 'IDisposable', 'Span<T>', 'Memory<T>', 'Object Pooling', 'LOH'], dataFile: 'data/csharp-memory.js' },
                        { id: 'csharp-patterns', title: 'Pattern Matching', icon: Icons.code, keywords: ['pattern', 'switch', 'is', 'when', 'record', 'deconstruct'], badge: '15', topics: ['Type Patterns', 'Property Patterns', 'Positional Patterns', 'Relational Patterns', 'Switch Expressions'], dataFile: 'data/csharp-patterns.js' },
                        { id: 'csharp-advanced', title: 'Advanced C#', icon: Icons.award, keywords: ['reflection', 'expression', 'dynamic', 'unsafe', 'attribute', 'source generator'], badge: '30', topics: ['Reflection', 'Expression Trees', 'Dynamic', 'Attributes', 'Source Generators', 'Interceptors'], dataFile: 'data/csharp-advanced.js' }
                    ]
                },
                {
                    id: 'typescript-js',
                    title: 'TypeScript & JavaScript',
                    items: [
                        { id: 'typescript-fundamentals', title: 'TypeScript Essentials', icon: Icons.code, keywords: ['typescript', 'javascript', 'type', 'interface', 'generic', 'union', 'intersection', 'utility type', 'infer', 'mapped type', 'discriminated union'], badge: '35', topics: ['Type System', 'Generics', 'Utility Types', 'Discriminated Unions', 'Type Guards', 'Mapped Types', 'Conditional Types', 'Module System'], dataFile: 'data/typescript-fundamentals.js' },
                        { id: 'javascript-async', title: 'JavaScript Async & Runtime', icon: Icons.zap, keywords: ['promise', 'async', 'await', 'event loop', 'callback', 'closure', 'prototype', 'this', 'hoisting', 'scope'], badge: '25', topics: ['Event Loop', 'Promises', 'async/await', 'Closures', 'Prototypes', 'this keyword', 'Hoisting', 'ES Modules'], dataFile: 'data/javascript-async.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 2: Advanced .NET ───────────────────────────────────
        {
            level: 2,
            title: 'Advanced .NET',
            description: 'ASP.NET Core, middleware, APIs, and dependency injection',
            groups: [
                {
                    id: 'aspnet-core',
                    title: 'ASP.NET Core',
                    items: [
                        { id: 'aspnet-middleware', title: 'Middleware', icon: Icons.layers, keywords: ['middleware', 'pipeline', 'request', 'response', 'next'], badge: '20', topics: ['Pipeline', 'Custom Middleware', 'Order Matters', 'Map', 'UseWhen'], dataFile: 'data/aspnet.js' },
                        { id: 'aspnet-minimal-api', title: 'Minimal APIs', icon: Icons.zap, keywords: ['minimal', 'api', 'endpoint', 'map', 'route'], badge: '20', topics: ['MapGet', 'MapPost', 'Filters', 'Route Groups', 'TypedResults'], dataFile: 'data/aspnet-minimalapi.js' },
                        { id: 'aspnet-auth', title: 'Authentication & Authorization', icon: Icons.shield, keywords: ['auth', 'jwt', 'oauth', 'openid', 'identity', 'claims', 'policy', 'role'], badge: '35', topics: ['JWT', 'OAuth 2.0', 'OpenID Connect', 'Claims', 'Policies', 'Roles', 'API Keys'], dataFile: 'data/aspnet-auth.js' },
                        { id: 'aspnet-caching', title: 'Caching', icon: Icons.zap, keywords: ['cache', 'redis', 'memory', 'distributed', 'output', 'response'], badge: '20', topics: ['In-Memory', 'Distributed', 'Output Caching', 'Response Caching', 'Redis', 'Cache Invalidation'], dataFile: 'data/aspnet-caching.js' },
                        { id: 'aspnet-signalr', title: 'SignalR', icon: Icons.globe, keywords: ['signalr', 'websocket', 'realtime', 'hub', 'notification'], badge: '15', topics: ['Hubs', 'Groups', 'Streaming', 'Scaling', 'Authentication'], dataFile: 'data/aspnet-signalr.js' },
                        { id: 'aspnet-config', title: 'Configuration & Logging', icon: Icons.settings, keywords: ['config', 'appsettings', 'options', 'serilog', 'logging', 'structured'], badge: '15', topics: ['IOptions', 'IConfiguration', 'Structured Logging', 'Serilog', 'Health Checks'], dataFile: 'data/aspnet-config.js' },
                        { id: 'aspnet-performance', title: 'Performance & Security', icon: Icons.trendingUp, keywords: ['performance', 'rate', 'limit', 'compression', 'security', 'cors', 'https'], badge: '25', topics: ['Rate Limiting', 'Response Compression', 'CORS', 'HTTPS', 'Data Protection'], dataFile: 'data/aspnet-performance.js' }
                    ]
                },
                {
                    id: 'dotnet-patterns',
                    title: '.NET Patterns',
                    items: [
                        { id: 'csharp-di', title: 'Dependency Injection', icon: Icons.layers, keywords: ['di', 'ioc', 'container', 'service', 'lifetime', 'transient', 'scoped', 'singleton'], badge: '20', topics: ['Constructor Injection', 'Lifetimes', 'Service Registration', 'Keyed Services', 'Factory Pattern'], dataFile: 'data/csharp-di.js' },
                        { id: 'dotnet-versions', title: '.NET Core Version History', icon: Icons.clock, keywords: ['.net core', '.net 5', '.net 6', '.net 7', '.net 8', '.net 9', 'lts', 'sts', 'migration', 'breaking changes', 'minimal api', 'aot'], badge: '25', topics: ['.NET Core 1-3.1', '.NET 5 Unification', '.NET 6 LTS', '.NET 7', '.NET 8 LTS', '.NET 9', 'LTS vs STS', 'Migration Path'], dataFile: 'data/levels/level-02/dotnet-versions.js' },
                        { id: 'fluent-validation', title: 'FluentValidation', icon: Icons.check, keywords: ['fluent validation', 'validator', 'rule', 'custom validator', 'async validation', 'pipeline', 'mediatr', 'model validation'], badge: '25', topics: ['AbstractValidator', 'Built-in Rules', 'Custom Validators', 'Async Validation', 'Dependent Rules', 'Pipeline Integration', 'Testing Validators'], dataFile: 'data/levels/level-02/fluent-validation.js' }
                    ]
                },
                {
                    id: 'blazor',
                    title: 'Blazor',
                    items: [
                        { id: 'blazor-fundamentals', title: 'Blazor Fundamentals', icon: Icons.code, keywords: ['blazor', 'component', 'razor', 'render mode', 'server', 'wasm', 'webassembly', 'interactive', 'ssr'], badge: '30', topics: ['Render Modes', 'Components', 'Lifecycle', 'Parameters', 'Event Handling', 'Forms', 'SSR vs Interactive'], dataFile: 'data/blazor-fundamentals.js' },
                        { id: 'blazor-advanced', title: 'Blazor Advanced', icon: Icons.zap, keywords: ['blazor', 'state', 'js interop', 'authentication', 'signalr', 'performance', 'virtualization', 'error boundary'], badge: '25', topics: ['State Management', 'JS Interop', 'Authentication', 'Error Boundaries', 'Virtualization', 'Pre-rendering', 'AOT'], dataFile: 'data/blazor-advanced.js' }
                    ]
                },
                {
                    id: 'dotnet-services',
                    title: '.NET Background Services',
                    items: [
                        { id: 'dotnet-background-jobs', title: 'Background Jobs & Workers', icon: Icons.clock, keywords: ['background', 'hosted service', 'worker', 'hangfire', 'quartz', 'ihostedservice', 'queue', 'scheduled', 'cron', 'fire and forget'], badge: '25', topics: ['IHostedService', 'BackgroundService', 'Worker Services', 'Hangfire', 'Quartz.NET', 'Channel<T> Queues', 'Reliability Patterns'], dataFile: 'data/dotnet-background-jobs.js' }
                    ]
                },
                {
                    id: 'dotnet-concurrency',
                    title: '.NET Concurrency',
                    items: [
                        { id: 'concurrency-patterns', title: 'Concurrency Patterns', icon: Icons.zap, keywords: ['channel', 'semaphore', 'lock', 'interlocked', 'concurrent', 'producer consumer', 'reader writer', 'lock-free', 'thread safety'], badge: '30', topics: ['Channel<T>', 'SemaphoreSlim', 'lock/Monitor', 'Interlocked', 'ConcurrentDictionary', 'ReaderWriterLockSlim', 'Lock-Free Patterns', 'Producer-Consumer'], dataFile: 'data/levels/level-02/concurrency-patterns.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 3: Engineering Principles ──────────────────────────
        {
            level: 3,
            title: 'Engineering Principles',
            description: 'SOLID, DRY, KISS and foundational design principles',
            groups: [
                {
                    id: 'principles',
                    title: 'Core Principles',
                    items: [
                        { id: 'arch-principles', title: 'Principles & Patterns', icon: Icons.layers, keywords: ['solid', 'dry', 'kiss', 'yagni', 'cupid', 'grasp'], badge: '30', topics: ['SOLID', 'DRY', 'KISS', 'YAGNI', 'CUPID', 'GRASP', 'Law of Demeter'], dataFile: 'data/architecture.js' }
                    ]
                },
                {
                    id: 'clean-code',
                    title: 'Clean Code',
                    items: [
                        { id: 'clean-code-naming', title: 'Naming & Readability', icon: Icons.fileText, keywords: ['naming', 'readability', 'conventions', 'self-documenting', 'clean code', 'comments', 'functions'], badge: '20', topics: ['Intention-Revealing Names', 'Self-Documenting Code', 'Function Design', 'Comments', 'Magic Numbers', 'Boolean Flags'], dataFile: 'data/levels/level-03/clean-code-naming.js' },
                        { id: 'refactoring-techniques', title: 'Refactoring Techniques', icon: Icons.code, keywords: ['refactor', 'extract', 'rename', 'code smell', 'strangler fig', 'guard clause', 'polymorphism'], badge: '25', topics: ['Code Smells', 'Extract Method', 'Guard Clauses', 'Replace Conditional with Polymorphism', 'Characterization Tests', 'Strangler Fig'], dataFile: 'data/levels/level-03/refactoring-techniques.js' },
                        { id: 'testing-fundamentals', title: 'Testing Fundamentals', icon: Icons.check, keywords: ['unit test', 'tdd', 'assertion', 'mock', 'stub', 'test pyramid', 'coverage', 'aaa'], badge: '25', topics: ['Test Pyramid', 'TDD', 'Arrange-Act-Assert', 'Test Doubles', 'Coverage', 'Mutation Testing', 'Maintainable Tests'], dataFile: 'data/levels/level-03/testing-fundamentals.js' }
                    ]
                },
                {
                    id: 'software-quality',
                    title: 'Software Quality',
                    items: [
                        { id: 'maintainability', title: 'Maintainability & Code Quality', icon: Icons.settings, keywords: ['maintainability', 'code quality', 'technical debt', 'coupling', 'cohesion', 'cyclomatic complexity', 'code metrics', 'static analysis', 'sonarqube'], badge: '30', topics: ['Coupling & Cohesion', 'Cyclomatic Complexity', 'Technical Debt', 'Code Metrics', 'Static Analysis', 'Maintainability Index', 'Code Ownership'], dataFile: 'data/levels/level-03/maintainability.js' },
                        { id: 'software-quality-attributes', title: 'Software Quality Attributes', icon: Icons.award, keywords: ['quality attributes', 'ilities', 'reliability', 'availability', 'scalability', 'testability', 'deployability', 'security', 'nonfunctional', 'iso 25010'], badge: '35', topics: ['Reliability', 'Availability', 'Scalability', 'Maintainability', 'Testability', 'Deployability', 'Performance', 'Security'], dataFile: 'data/levels/level-03/software-quality-attributes.js' },
                        { id: 'engineering-laws', title: 'Engineering Laws & Principles', icon: Icons.zap, keywords: ['conway', 'brooks', 'murphy', 'goodhart', 'gall', 'pareto', 'amdahl', 'little', 'hofstadter', 'law'], badge: '25', topics: ["Conway's Law", "Brooks' Law", "Goodhart's Law", "Gall's Law", "Amdahl's Law", "Little's Law", 'Pareto Principle'], dataFile: 'data/levels/level-03/engineering-laws.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 4: Design Patterns ─────────────────────────────────
        {
            level: 4,
            title: 'Design Patterns',
            description: 'GoF creational, structural, and behavioral patterns',
            groups: [
                {
                    id: 'design-patterns',
                    title: 'Gang of Four Patterns',
                    items: [
                        { id: 'dp-creational', title: 'Creational Patterns', icon: Icons.box, keywords: ['singleton', 'factory', 'builder', 'prototype', 'abstract factory'], badge: '25', topics: ['Singleton', 'Factory Method', 'Abstract Factory', 'Builder', 'Prototype'], dataFile: 'data/design-patterns.js' },
                        { id: 'dp-structural', title: 'Structural Patterns', icon: Icons.layers, keywords: ['adapter', 'bridge', 'composite', 'decorator', 'facade', 'flyweight', 'proxy'], badge: '30', topics: ['Adapter', 'Bridge', 'Composite', 'Decorator', 'Facade', 'Flyweight', 'Proxy'], dataFile: 'data/dp-structural.js' },
                        { id: 'dp-behavioral', title: 'Behavioral Patterns', icon: Icons.zap, keywords: ['observer', 'mediator', 'strategy', 'command', 'state', 'visitor', 'chain'], badge: '40', topics: ['Observer', 'Mediator', 'Strategy', 'Command', 'Chain of Responsibility', 'State', 'Visitor', 'Template Method'], dataFile: 'data/dp-behavioral.js' }
                    ]
                },
                {
                    id: 'enterprise-patterns',
                    title: 'Enterprise Patterns',
                    items: [
                        { id: 'repository-pattern', title: 'Repository & Unit of Work', icon: Icons.database, keywords: ['repository', 'unit of work', 'data access', 'abstraction'], dataFile: 'data/levels/level-04/repository-pattern.js' },
                        { id: 'mediator-cqrs-pattern', title: 'Mediator & CQRS Intro', icon: Icons.shuffle, keywords: ['mediator', 'cqrs', 'command', 'query', 'handler', 'mediatr', 'pipeline behavior'], badge: '25', topics: ['Mediator Pattern', 'MediatR', 'Commands', 'Queries', 'Pipeline Behaviors', 'Notifications', 'CQRS'], dataFile: 'data/levels/level-04/mediator-cqrs-pattern.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 5: Architecture ────────────────────────────────────
        {
            level: 5,
            title: 'Architecture',
            description: 'Architectural styles, DDD, and distributed system patterns',
            groups: [
                {
                    id: 'architecture-styles',
                    title: 'Architecture Styles',
                    items: [
                        { id: 'arch-styles', title: 'Architecture Styles', icon: Icons.grid, keywords: ['clean', 'hexagonal', 'onion', 'layered', 'microservice', 'monolith', 'modular'], badge: '35', topics: ['Clean Architecture', 'Hexagonal', 'Onion', 'Layered', 'Microservices', 'Modular Monolith', 'Serverless'], dataFile: 'data/arch-styles.js' },
                        { id: 'serverless-architecture', title: 'Serverless Architecture', icon: Icons.zap, keywords: ['serverless', 'faas', 'baas', 'lambda', 'azure functions', 'cold start', 'durable functions', 'event-driven'], badge: '35', topics: ['FaaS vs BaaS', 'Event Triggers', 'Cold Starts', 'Statelessness', 'Cost Model', 'Durable Functions', 'When to Use'], dataFile: 'data/levels/level-05/serverless-architecture.js' },
                        { id: 'arch-ddd', title: 'Domain-Driven Design', icon: Icons.target, keywords: ['ddd', 'domain', 'bounded', 'context', 'aggregate', 'entity', 'value object'], badge: '25', topics: ['Bounded Context', 'Aggregates', 'Entities', 'Value Objects', 'Domain Events', 'Event Storming'], dataFile: 'data/arch-ddd.js' }
                    ]
                },
                {
                    id: 'microservices',
                    title: 'Microservices',
                    items: [
                        { id: 'microservices', title: 'Microservices: Overview', icon: Icons.globe, keywords: ['microservice', 'overview', 'monolith', 'modular monolith', 'when not', 'principles', 'two pizza', 'curriculum'], badge: '8', topics: ['What & Why', 'Principles', 'Monolith vs Microservices', 'When NOT', 'Curriculum Index'], dataFile: 'data/levels/level-05/microservices/overview.js' },
                        { id: 'microservices-decomposition', title: 'Decomposition & Boundaries', icon: Icons.target, keywords: ['decomposition', 'bounded context', 'business capability', 'subdomain', 'service size', 'conway', 'seams', 'ddd'], badge: '8', topics: ['Bounded Contexts', 'Business Capability', 'Subdomains', 'Service Sizing', "Conway's Law", 'Seams'], dataFile: 'data/levels/level-05/microservices/decomposition.js' },
                        { id: 'microservices-communication', title: 'Communication', icon: Icons.server, keywords: ['rest', 'grpc', 'messaging', 'api gateway', 'bff', 'service discovery', 'sync', 'async', 'protocols'], badge: '8', topics: ['Sync REST/gRPC', 'Async Messaging', 'API Gateway', 'BFF', 'Service Discovery', 'Sync vs Async'], dataFile: 'data/levels/level-05/microservices/communication.js' },
                        { id: 'microservices-data', title: 'Data Management', icon: Icons.database, keywords: ['database per service', 'eventual consistency', 'saga', 'outbox', 'cqrs', 'event sourcing', 'dual write', '2pc'], badge: '8', topics: ['Database per Service', 'Eventual Consistency', 'Saga', 'Transactional Outbox', 'CQRS', 'Event Sourcing'], dataFile: 'data/levels/level-05/microservices/data-management.js' },
                        { id: 'microservices-resilience', title: 'Resilience', icon: Icons.shield, keywords: ['timeout', 'retry', 'backoff', 'circuit breaker', 'bulkhead', 'fallback', 'rate limit', 'cascading failure', 'polly'], badge: '8', topics: ['Timeouts', 'Retry + Backoff', 'Circuit Breaker', 'Bulkhead', 'Fallback', 'Cascading Failures'], dataFile: 'data/levels/level-05/microservices/resilience.js' },
                        { id: 'microservices-observability', title: 'Observability', icon: Icons.trendingUp, keywords: ['logging', 'distributed tracing', 'opentelemetry', 'metrics', 'red', 'use', 'health checks', 'correlation id', 'alerting'], badge: '8', topics: ['Structured Logging', 'Distributed Tracing', 'Metrics (RED/USE)', 'Health Checks', 'Correlation IDs', 'Alerting'], dataFile: 'data/levels/level-05/microservices/observability.js' },
                        { id: 'microservices-deployment', title: 'Deployment & Operations', icon: Icons.box, keywords: ['docker', 'kubernetes', 'ci/cd', 'blue-green', 'canary', 'service mesh', 'config', 'secrets', 'gitops'], badge: '8', topics: ['Containers', 'Kubernetes', 'CI/CD per Service', 'Blue-Green/Canary', 'Service Mesh', 'Config & Secrets'], dataFile: 'data/levels/level-05/microservices/deployment.js' },
                        { id: 'microservices-patterns', title: 'Patterns Catalog', icon: Icons.grid, keywords: ['api gateway', 'aggregator', 'anti-corruption layer', 'strangler fig', 'sidecar', 'ambassador', 'saga', 'outbox', 'cqrs', 'event sourcing'], badge: '8', topics: ['Gateway', 'Aggregator', 'ACL', 'Strangler Fig', 'Sidecar', 'Saga', 'Outbox', 'CQRS'], dataFile: 'data/levels/level-05/microservices/patterns.js' },
                        { id: 'microservices-testing', title: 'Testing', icon: Icons.check, keywords: ['testing pyramid', 'unit', 'integration', 'testcontainers', 'contract testing', 'pact', 'component', 'e2e', 'chaos'], badge: '8', topics: ['Testing Pyramid', 'Integration (Testcontainers)', 'Contract Tests (Pact)', 'Component', 'E2E', 'Chaos'], dataFile: 'data/levels/level-05/microservices/testing.js' },
                        { id: 'microservices-bottlenecks', title: 'Bottlenecks & Performance', icon: Icons.zap, keywords: ['bottleneck', 'n+1', 'chatty', 'broker lag', 'hot service', 'serialization', 'connection pool', 'diagnosis', 'tracing', 'scaling'], badge: '8', topics: ['Chatty/N+1', 'Broker Lag', 'Hot Service', 'Serialization', 'Pool Exhaustion', 'Trace-First Diagnosis'], dataFile: 'data/levels/level-05/microservices/bottlenecks.js' },
                        { id: 'microservices-challenges', title: 'Challenges & Anti-Patterns', icon: Icons.alertTriangle, keywords: ['challenges', 'distributed monolith', 'data consistency', 'debugging', 'security', 'mtls', 'zero trust', 'config sprawl', 'versioning', 'anti-pattern'], badge: '8', topics: ['Data Consistency', 'Debugging', 'Security (mTLS)', 'Config Sprawl', 'Versioning', 'Distributed Monolith'], dataFile: 'data/levels/level-05/microservices/challenges.js' },
                        { id: 'microservices-case-studies', title: 'Case Studies', icon: Icons.award, keywords: ['netflix', 'amazon', 'uber', 'doma', 'monzo', 'spotify', 'betting', 'case study', 'lessons'], badge: '8', topics: ['Netflix', 'Amazon', 'Uber (DOMA)', 'Monzo', 'Spotify', 'Betting Platform'], dataFile: 'data/levels/level-05/microservices/case-studies.js' },
                        { id: 'microservices-advanced-patterns', title: 'Advanced Patterns (Expert)', icon: Icons.award, keywords: ['idempotency', 'cdc', 'debezium', 'schema evolution', 'fencing token', 'distributed lock', 'service mesh', 'multi-tenancy', 'zero-downtime', 'contract testing', 'pact', 'noisy neighbor'], badge: '8', topics: ['Idempotency Keys', 'CDC/Outbox Relay', 'Event Schema Evolution', 'Distributed Locking', 'Service Mesh Internals', 'Multi-Tenancy', 'Zero-Downtime Deploy', 'Contract Testing'], dataFile: 'data/levels/level-05/microservices/advanced-patterns.js' }
                    ]
                },
                {
                    id: 'distributed-systems',
                    title: 'Distributed Systems',
                    items: [
                        { id: 'arch-distributed', title: 'Distributed Patterns', icon: Icons.globe, keywords: ['cqrs', 'event sourcing', 'saga', 'outbox', 'circuit breaker', 'retry', 'bulkhead'], badge: '30', topics: ['CQRS', 'Event Sourcing', 'Saga', 'Outbox', 'Circuit Breaker', 'Retry', 'Bulkhead'], dataFile: 'data/arch-distributed.js' },
                        { id: 'event-driven-architecture', title: 'Event-Driven Architecture', icon: Icons.zap, keywords: ['event', 'eda', 'event sourcing', 'cqrs', 'kafka', 'rabbitmq', 'pub sub', 'message broker', 'outbox'], badge: '35', topics: ['Domain Events', 'Event Sourcing', 'CQRS', 'Outbox Pattern', 'Kafka vs RabbitMQ', 'Idempotent Consumers', 'Dead Letter Queue'], dataFile: 'data/levels/level-05/event-driven-architecture.js' },
                        { id: 'api-design-patterns', title: 'API Design Patterns', icon: Icons.server, keywords: ['rest', 'grpc', 'graphql', 'versioning', 'idempotency', 'pagination', 'api gateway', 'openapi'], badge: '30', topics: ['REST Maturity', 'gRPC', 'GraphQL', 'API Versioning', 'Idempotency', 'Cursor Pagination', 'Problem Details'], dataFile: 'data/levels/level-05/api-design-patterns.js' },
                        { id: 'arch-communication', title: 'Communication Patterns', icon: Icons.server, keywords: ['rest', 'graphql', 'grpc', 'websocket', 'eda', 'message', 'queue', 'api gateway'], badge: '25', topics: ['REST', 'GraphQL', 'gRPC', 'WebSocket', 'EDA', 'API Gateway', 'BFF', 'Service Mesh'], dataFile: 'data/arch-communication.js' },
                        { id: 'arch-cap', title: 'CAP, BASE & Theorems', icon: Icons.database, keywords: ['cap', 'base', 'acid', 'pacelc', 'consistency', 'availability', 'partition'], badge: '15', topics: ['CAP Theorem', 'BASE', 'ACID', 'PACELC', 'Eventual Consistency'], dataFile: 'data/arch-cap.js' },
                        { id: 'event-storming', title: 'Event Storming & Domain Discovery', icon: Icons.target, keywords: ['event storming', 'domain discovery', 'bounded context', 'aggregate', 'hot spot', 'command', 'policy', 'read model', 'big picture'], badge: '25', topics: ['Big Picture', 'Process Level', 'Design Level', 'Bounded Context Discovery', 'Aggregates', 'Policies', 'Hot Spots', 'Facilitating'], dataFile: 'data/levels/level-05/event-storming.js' }
                    ]
                },
                {
                    id: 'infrastructure-patterns',
                    title: 'Infrastructure Patterns',
                    items: [
                        { id: 'grpc-protobuf', title: 'gRPC & Protobuf', icon: Icons.zap, keywords: ['grpc', 'protobuf', 'protocol buffers', 'streaming', 'unary', 'bidirectional', 'http2', 'code generation', 'contract first'], badge: '25', topics: ['Unary/Streaming RPCs', 'Proto3 Schema', 'Code Generation', 'Interceptors', 'Deadlines', 'Error Handling', 'gRPC vs REST'], dataFile: 'data/grpc-protobuf.js' },
                        { id: 'message-brokers', title: 'Message Brokers Deep Dive', icon: Icons.server, keywords: ['rabbitmq', 'kafka', 'service bus', 'message queue', 'pub sub', 'exchange', 'partition', 'consumer group', 'dead letter'], badge: '30', topics: ['RabbitMQ vs Kafka vs Service Bus', 'Exchanges & Queues', 'Partitions & Consumer Groups', 'Exactly-Once', 'Dead Letter', 'Ordering', 'Backpressure'], dataFile: 'data/message-brokers.js' },
                        { id: 'kafka-deep-dive', title: 'Apache Kafka', icon: Icons.database, keywords: ['kafka', 'topic', 'partition', 'consumer group', 'offset', 'exactly-once', 'kafka streams', 'ksqldb', 'schema registry', 'connect', 'replication', 'isr', 'log compaction'], badge: '35', topics: ['Architecture', 'Partitioning', 'Consumer Groups', 'Exactly-Once', 'Kafka Streams', 'Schema Registry', 'Connect', 'Log Compaction', 'ISR'], dataFile: 'data/kafka-deep-dive.js' },
                        { id: 'nats-messaging', title: 'NATS & JetStream', icon: Icons.zap, keywords: ['nats', 'jetstream', 'subject', 'queue group', 'request reply', 'pub sub', 'key value', 'object store', 'leaf node', 'cloud native messaging'], badge: '20', topics: ['Core NATS', 'JetStream', 'Subject Hierarchy', 'Queue Groups', 'Request-Reply', 'Key-Value Store', 'Leaf Nodes', 'vs Kafka/RabbitMQ'], dataFile: 'data/nats-messaging.js' },
                        { id: 'redis-patterns', title: 'Redis Advanced Patterns', icon: Icons.database, keywords: ['redis', 'cache', 'pub sub', 'streams', 'sorted set', 'lua', 'distributed lock', 'rate limit', 'session', 'leaderboard'], badge: '25', topics: ['Data Structures', 'Pub/Sub', 'Streams', 'Distributed Locks', 'Rate Limiting', 'Lua Scripts', 'Cluster', 'Persistence'], dataFile: 'data/redis-patterns.js' },
                        { id: 'multitenancy', title: 'Multi-Tenancy Patterns', icon: Icons.users, keywords: ['multitenant', 'tenant', 'isolation', 'shared database', 'schema per tenant', 'database per tenant', 'saas', 'row level security'], badge: '25', topics: ['Shared DB', 'Schema-per-Tenant', 'DB-per-Tenant', 'Row-Level Security', 'Tenant Resolution', 'Data Isolation', 'Noisy Neighbor'], dataFile: 'data/multitenancy.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 6: SQL Server ──────────────────────────────────────
        {
            level: 6,
            title: 'SQL Server',
            description: 'Indexes, advanced queries, transactions, and concurrency',
            groups: [
                {
                    id: 'sql-core',
                    title: 'SQL Core',
                    items: [
                        { id: 'sql-fundamentals', title: 'Indexes & Optimization', icon: Icons.database, keywords: ['index', 'execution plan', 'optimization', 'statistics', 'fragmentation'], badge: '30', topics: ['Clustered Index', 'Non-Clustered', 'Covering Index', 'Execution Plans', 'Statistics'], dataFile: 'data/sql-fundamentals.js' },
                        { id: 'sql-advanced', title: 'Advanced Queries', icon: Icons.code, keywords: ['cte', 'window', 'partition', 'pivot', 'stored procedure', 'dynamic sql'], badge: '25', topics: ['CTEs', 'Window Functions', 'Partitioning', 'Stored Procedures', 'Dynamic SQL'], dataFile: 'data/sql-advanced.js' },
                        { id: 'sql-concurrency', title: 'Transactions & Concurrency', icon: Icons.shield, keywords: ['transaction', 'isolation', 'deadlock', 'lock', 'blocking', 'snapshot'], badge: '20', topics: ['Isolation Levels', 'Deadlocks', 'Blocking', 'SNAPSHOT', 'Optimistic Concurrency'], dataFile: 'data/sql-concurrency.js' }
                    ]
                },
                {
                    id: 'data-access',
                    title: 'Data Access',
                    items: [
                        { id: 'ef-core', title: 'Entity Framework Core', icon: Icons.layers, keywords: ['ef', 'orm', 'dbcontext', 'migration', 'linq to entities', 'n+1', 'tracking', 'change tracker'], badge: '30', topics: ['DbContext', 'Change Tracking', 'Migrations', 'Loading Strategies', 'N+1 Problem', 'AsNoTracking', 'Concurrency'], dataFile: 'data/levels/level-06/ef-core.js' },
                        { id: 'dapper-data-access', title: 'Dapper & Micro-ORMs', icon: Icons.zap, keywords: ['dapper', 'micro-orm', 'raw sql', 'performance', 'parameterized', 'multi-mapping', 'query'], badge: '20', topics: ['Query/Execute', 'Parameterization', 'Multi-Mapping', 'QueryMultiple', 'Stored Procedures', 'vs EF Core'], dataFile: 'data/levels/level-06/dapper-data-access.js' },
                        { id: 'database-migrations', title: 'Database Migration Strategies', icon: Icons.code, keywords: ['migration', 'schema', 'zero downtime', 'expand contract', 'flyway', 'dbup', 'ef migrations', 'backward compatible', 'rollback'], badge: '25', topics: ['Expand-Contract', 'Zero-Downtime Migrations', 'EF Core Migrations', 'DbUp/Flyway', 'Data Migrations', 'Rollback Strategies', 'Blue-Green DB'], dataFile: 'data/levels/level-06/database-migrations.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 7: Angular ─────────────────────────────────────────
        {
            level: 7,
            title: 'Angular',
            description: 'Components, signals, RxJS, routing, and state management',
            groups: [
                {
                    id: 'angular-core-group',
                    title: 'Angular Core',
                    items: [
                        { id: 'angular-core', title: 'Components & Signals', icon: Icons.code, keywords: ['component', 'signal', 'input', 'output', 'lifecycle', 'change detection'], badge: '25', topics: ['Components', 'Signals', 'Inputs', 'Outputs', 'Lifecycle', 'Change Detection'], dataFile: 'data/angular-core.js' },
                        { id: 'angular-rxjs', title: 'RxJS & Observables', icon: Icons.shuffle, keywords: ['rxjs', 'observable', 'subject', 'operator', 'pipe', 'subscription'], badge: '30', topics: ['Observables', 'Subjects', 'Operators', 'Error Handling', 'Memory Leaks'], dataFile: 'data/angular-rxjs.js' },
                        { id: 'angular-routing', title: 'Routing & Guards', icon: Icons.globe, keywords: ['route', 'guard', 'resolver', 'lazy', 'interceptor'], badge: '20', topics: ['Routing', 'Guards', 'Resolvers', 'Lazy Loading', 'Interceptors'], dataFile: 'data/angular-routing.js' },
                        { id: 'angular-state', title: 'State Management', icon: Icons.database, keywords: ['ngrx', 'state', 'store', 'effect', 'reducer', 'selector'], badge: '20', topics: ['NgRx', 'Store', 'Effects', 'Selectors', 'Component Store'], dataFile: 'data/angular-state.js' }
                    ]
                },
                {
                    id: 'angular-advanced',
                    title: 'Angular Advanced',
                    items: [
                        { id: 'angular-forms', title: 'Forms & Validation', icon: Icons.fileText, keywords: ['reactive forms', 'template forms', 'validation', 'custom validator', 'formgroup', 'formarray', 'async validator'], badge: '20', topics: ['Reactive vs Template-Driven', 'FormGroup/Control/Array', 'Typed Forms', 'Custom Validators', 'Async Validators', 'Cross-Field Validation'], dataFile: 'data/levels/level-07/angular-forms.js' },
                        { id: 'angular-testing', title: 'Angular Testing', icon: Icons.check, keywords: ['jasmine', 'karma', 'jest', 'component testing', 'e2e', 'testbed', 'httptestingcontroller', 'spy'], badge: '20', topics: ['TestBed', 'ComponentFixture', 'Spies & Mocks', 'HttpTestingController', 'Harnesses', 'fakeAsync', 'E2E'], dataFile: 'data/levels/level-07/angular-testing.js' },
                        { id: 'angular-performance', title: 'Angular Performance', icon: Icons.trendingUp, keywords: ['lazy loading', 'change detection', 'onpush', 'bundle size', 'signals', 'trackby', 'defer', 'zoneless'], badge: '25', topics: ['Change Detection', 'OnPush', 'Signals', 'trackBy', 'Lazy Loading', '@defer', 'Zoneless', 'Bundle Size'], dataFile: 'data/levels/level-07/angular-performance.js' }
                    ]
                },
                {
                    id: 'frontend-fundamentals',
                    title: 'Frontend Fundamentals',
                    items: [
                        { id: 'html-css-fundamentals', title: 'HTML, CSS & Responsive Design', icon: Icons.globe, keywords: ['html', 'css', 'flexbox', 'grid', 'responsive', 'media query', 'semantic', 'bem', 'css variables', 'animation'], badge: '25', topics: ['Semantic HTML', 'Flexbox vs Grid', 'Responsive Design', 'CSS Variables', 'BEM/SMACSS', 'Animations', 'CSS Architecture'], dataFile: 'data/html-css-fundamentals.js' },
                        { id: 'web-accessibility', title: 'Accessibility (WCAG)', icon: Icons.users, keywords: ['accessibility', 'a11y', 'wcag', 'aria', 'screen reader', 'keyboard navigation', 'contrast', 'focus management', 'semantic'], badge: '20', topics: ['WCAG 2.1 AA', 'ARIA Roles', 'Keyboard Navigation', 'Focus Management', 'Color Contrast', 'Screen Readers', 'Testing Tools'], dataFile: 'data/web-accessibility.js' },
                        { id: 'aurelia-framework', title: 'Aurelia Framework', icon: Icons.code, keywords: ['aurelia', 'convention', 'dependency injection', 'binding', 'router', 'custom element', 'value converter', 'aurelia 2'], badge: '25', topics: ['Convention over Configuration', 'Dependency Injection', 'Two-Way Binding', 'Router', 'Custom Elements', 'Value Converters', 'Aurelia 2'], dataFile: 'data/levels/level-07/aurelia-framework.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 8: Cloud ───────────────────────────────────────────
        {
            level: 8,
            title: 'Cloud',
            description: 'Azure and AWS compute, data, security, and monitoring',
            groups: [
                {
                    id: 'azure',
                    title: 'Azure',
                    items: [
                        { id: 'azure-compute', title: 'Compute Services', icon: Icons.server, keywords: ['app service', 'functions', 'aks', 'container', 'logic apps'], badge: '25', topics: ['App Service', 'Functions', 'AKS', 'Container Apps', 'Logic Apps'], dataFile: 'data/azure-compute.js' },
                        { id: 'azure-data', title: 'Data Services', icon: Icons.database, keywords: ['cosmos', 'sql', 'redis', 'storage', 'event hub'], badge: '25', topics: ['Cosmos DB', 'Azure SQL', 'Redis', 'Storage', 'Event Hub', 'Service Bus'], dataFile: 'data/azure-data.js' },
                        { id: 'azure-security', title: 'Security & Identity', icon: Icons.shield, keywords: ['key vault', 'managed identity', 'entra', 'rbac', 'private endpoint'], badge: '20', topics: ['Key Vault', 'Managed Identity', 'Entra ID', 'RBAC', 'Private Endpoints'], dataFile: 'data/azure-security.js' },
                        { id: 'azure-monitoring', title: 'Monitoring & Networking', icon: Icons.trendingUp, keywords: ['app insights', 'monitor', 'front door', 'load balancer', 'vnet'], badge: '20', topics: ['Application Insights', 'Azure Monitor', 'Front Door', 'Load Balancer', 'VNet'], dataFile: 'data/azure-monitoring.js' }
                    ]
                },
                {
                    id: 'aws',
                    title: 'AWS',
                    items: [
                        { id: 'aws-compute', title: 'Compute & Serverless', icon: Icons.server, keywords: ['ec2', 'lambda', 'ecs', 'eks', 'fargate'], badge: '20', topics: ['EC2', 'Lambda', 'ECS', 'EKS', 'Fargate'], dataFile: 'data/aws-compute.js' },
                        { id: 'aws-data', title: 'Data & Messaging', icon: Icons.database, keywords: ['s3', 'rds', 'aurora', 'dynamodb', 'sqs', 'sns'], badge: '20', topics: ['S3', 'RDS', 'Aurora', 'DynamoDB', 'SQS', 'SNS'], dataFile: 'data/aws-data.js' }
                    ]
                },
                {
                    id: 'cloud-tools',
                    title: 'Cloud Tools & Practices',
                    items: [
                        { id: 'cloud-networking', title: 'Cloud Networking', icon: Icons.globe, keywords: ['vpc', 'vnet', 'subnet', 'peering', 'nat gateway', 'load balancer', 'dns', 'private link', 'route table', 'network security group', 'firewall'], badge: '30', topics: ['VPC/VNet Design', 'Subnets (Public/Private)', 'Peering & Transit', 'NAT Gateway', 'Load Balancers (L4/L7)', 'DNS (Route53/Azure DNS)', 'Private Endpoints', 'NSG/Security Groups'], dataFile: 'data/cloud-networking.js' },
                        { id: 'cloud-native-patterns', title: 'Cloud-Native Patterns', icon: Icons.cloud, keywords: ['12-factor', 'cloud native', 'sidecar', 'ambassador', 'init container', 'service mesh', 'immutable infrastructure', 'cattle not pets', 'ephemeral', 'stateless'], badge: '25', topics: ['12-Factor App', 'Sidecar Pattern', 'Ambassador Pattern', 'Immutable Infrastructure', 'Cattle vs Pets', 'Config Externalization', 'Health Endpoints', 'Graceful Shutdown'], dataFile: 'data/cloud-native-patterns.js' },
                        { id: 'terraform-advanced', title: 'Terraform Advanced', icon: Icons.code, keywords: ['terraform', 'module', 'state', 'workspace', 'backend', 'provider', 'drift', 'plan', 'apply', 'import', 'taint', 'moved'], badge: '30', topics: ['Modules & Composition', 'State Management', 'Workspaces', 'Remote Backends', 'State Locking', 'Drift Detection', 'Import Existing Resources', 'CI/CD Integration'], dataFile: 'data/terraform-advanced.js' },
                        { id: 'cloud-migration', title: 'Cloud Migration Strategies', icon: Icons.trendingUp, keywords: ['migration', '6 rs', 'rehost', 'replatform', 'refactor', 'lift and shift', 'cloud adoption', 'assessment', 'wave planning', 'hybrid cloud', 'multi-cloud'], badge: '25', topics: ['6 Rs Framework', 'Assessment & Discovery', 'Wave Planning', 'Lift-and-Shift', 'Replatform', 'Refactor/Re-architect', 'Hybrid Cloud', 'Multi-Cloud Strategy'], dataFile: 'data/cloud-migration.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 9: DevOps ──────────────────────────────────────────
        {
            level: 9,
            title: 'DevOps',
            description: 'CI/CD pipelines, deployment strategies, Docker, and Kubernetes',
            groups: [
                {
                    id: 'cicd',
                    title: 'CI/CD',
                    items: [
                        { id: 'devops-pipelines', title: 'Azure Pipelines', icon: Icons.terminal, keywords: ['pipeline', 'yaml', 'ci', 'cd', 'release', 'artifact'], badge: '25', topics: ['YAML Pipelines', 'Stages', 'Jobs', 'Artifacts', 'Approvals', 'Environments'], dataFile: 'data/devops-pipelines.js' },
                        { id: 'devops-strategies', title: 'Deployment Strategies', icon: Icons.globe, keywords: ['blue green', 'canary', 'rolling', 'feature flag', 'gitflow'], badge: '20', topics: ['Blue-Green', 'Canary', 'Rolling', 'Feature Flags', 'GitFlow'], dataFile: 'data/devops-strategies.js' }
                    ]
                },
                {
                    id: 'containers',
                    title: 'Containers & Orchestration',
                    items: [
                        { id: 'docker-core', title: 'Docker', icon: Icons.box, keywords: ['docker', 'container', 'dockerfile', 'compose', 'image', 'volume'], badge: '25', topics: ['Dockerfile', 'Multi-stage', 'Compose', 'Volumes', 'Networking', 'Security'], dataFile: 'data/docker-core.js' },
                        { id: 'k8s-core', title: 'Kubernetes', icon: Icons.cloud, keywords: ['kubernetes', 'pod', 'deployment', 'service', 'ingress', 'helm', 'hpa'], badge: '30', topics: ['Pods', 'Deployments', 'Services', 'Ingress', 'ConfigMaps', 'HPA', 'Namespaces'], dataFile: 'data/k8s-core.js' }
                    ]
                },
                {
                    id: 'infrastructure',
                    title: 'Infrastructure',
                    items: [
                        { id: 'iac-terraform', title: 'Infrastructure as Code', icon: Icons.code, keywords: ['terraform', 'iac', 'bicep', 'arm', 'pulumi', 'state', 'hcl', 'drift', 'plan apply'], badge: '25', topics: ['Declarative vs Imperative', 'Terraform HCL', 'State Management', 'plan/apply', 'Modules', 'Drift', 'Secrets'], dataFile: 'data/levels/level-09/iac-terraform.js' },
                        { id: 'observability', title: 'Observability', icon: Icons.trendingUp, keywords: ['metrics', 'traces', 'logs', 'opentelemetry', 'grafana', 'slo', 'sli', 'prometheus', 'correlation id'], badge: '25', topics: ['Three Pillars', 'Structured Logging', 'Metrics (RED/USE)', 'Distributed Tracing', 'OpenTelemetry', 'SLI/SLO/SLA', 'Alerting'], dataFile: 'data/levels/level-09/observability.js' },
                        { id: 'kibana-elk', title: 'Kibana & ELK Stack', icon: Icons.search, keywords: ['kibana', 'elasticsearch', 'logstash', 'elk', 'opensearch', 'kql', 'index pattern', 'dashboard', 'apm', 'beats'], badge: '30', topics: ['Elasticsearch', 'Logstash', 'Kibana', 'Beats', 'KQL', 'Index Patterns', 'Dashboards', 'APM', 'Alerting'], dataFile: 'data/levels/level-09/kibana-elk.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 10: Security ───────────────────────────────────────
        {
            level: 10,
            title: 'Security',
            description: 'OWASP, authentication, encryption, and secure coding',
            groups: [
                {
                    id: 'security-core',
                    title: 'Security Engineering',
                    items: [
                        { id: 'security-owasp', title: 'OWASP & Web Security', icon: Icons.shield, keywords: ['owasp', 'xss', 'csrf', 'sql injection', 'cors', 'https'], badge: '30', topics: ['OWASP Top 10', 'XSS', 'CSRF', 'SQL Injection', 'CORS', 'HTTPS', 'CSP'], dataFile: 'data/security-owasp.js' },
                        { id: 'security-auth', title: 'Auth & Encryption', icon: Icons.shield, keywords: ['jwt', 'oauth', 'openid', 'encryption', 'certificate', 'secrets'], badge: '25', topics: ['JWT', 'OAuth 2.0', 'OpenID Connect', 'Encryption', 'Certificates', 'Secret Management'], dataFile: 'data/security-auth.js' }
                    ]
                },
                {
                    id: 'security-advanced',
                    title: 'Advanced Security',
                    items: [
                        { id: 'secure-coding', title: 'Secure Coding Practices', icon: Icons.code, keywords: ['input validation', 'sanitization', 'parameterized queries', 'csp', 'least privilege', 'idor', 'secrets'], badge: '25', topics: ['Input Validation', 'Output Encoding', 'Parameterized Queries', 'Least Privilege', 'IDOR', 'Secrets', 'Password Hashing'], dataFile: 'data/levels/level-10/secure-coding.js' },
                        { id: 'security-testing', title: 'Security Testing', icon: Icons.check, keywords: ['sast', 'dast', 'penetration', 'dependency scan', 'vulnerability', 'sca', 'threat modeling', 'stride'], badge: '25', topics: ['SAST', 'DAST', 'IAST', 'SCA', 'Threat Modeling (STRIDE)', 'Penetration Testing', 'Shift Left'], dataFile: 'data/levels/level-10/security-testing.js' },
                        { id: 'zero-trust', title: 'Zero Trust Architecture', icon: Icons.globe, keywords: ['zero trust', 'least privilege', 'microsegmentation', 'identity', 'never trust', 'beyondcorp', 'mtls'], badge: '20', topics: ['Never Trust Always Verify', 'Identity as Perimeter', 'Microsegmentation', 'Least Privilege', 'Continuous Verification', 'Assume Breach'], dataFile: 'data/levels/level-10/zero-trust.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 11: Performance ────────────────────────────────────
        {
            level: 11,
            title: 'Performance',
            description: 'Caching, optimization, profiling, and scaling strategies',
            groups: [
                {
                    id: 'performance-core',
                    title: 'Performance Engineering',
                    items: [
                        { id: 'perf-caching', title: 'Caching Strategies', icon: Icons.zap, keywords: ['cache', 'redis', 'memory', 'distributed', 'invalidation', 'aside'], badge: '20', topics: ['Cache-Aside', 'Write-Through', 'Redis', 'Invalidation', 'CDN'], dataFile: 'data/perf-caching.js' },
                        { id: 'perf-optimization', title: 'Optimization & Scaling', icon: Icons.trendingUp, keywords: ['benchmark', 'profile', 'load test', 'scaling', 'async', 'parallel'], badge: '25', topics: ['BenchmarkDotNet', 'Profiling', 'Load Testing', 'Horizontal Scaling', 'Vertical Scaling'], dataFile: 'data/perf-optimization.js' }
                    ]
                },
                {
                    id: 'performance-advanced',
                    title: 'Advanced Performance',
                    items: [
                        { id: 'database-perf', title: 'Database Performance', icon: Icons.database, keywords: ['query optimization', 'connection pool', 'read replica', 'sharding', 'index', 'execution plan', 'partitioning'], badge: '25', topics: ['Execution Plans', 'Indexing', 'Connection Pooling', 'Read Replicas', 'Partitioning', 'Sharding', 'Caching'], dataFile: 'data/levels/level-11/database-perf.js' },
                        { id: 'frontend-perf', title: 'Frontend Performance', icon: Icons.globe, keywords: ['core web vitals', 'lazy loading', 'code splitting', 'ssr', 'lcp', 'inp', 'cls', 'bundle'], badge: '25', topics: ['Core Web Vitals', 'Critical Rendering Path', 'Code Splitting', 'Lazy Loading', 'Caching/CDN', 'Image Optimization', 'SSR/SSG'], dataFile: 'data/levels/level-11/frontend-perf.js' },
                        { id: 'load-testing', title: 'Load Testing & SLOs', icon: Icons.target, keywords: ['k6', 'jmeter', 'slo', 'sli', 'sla', 'capacity planning', 'stress test', 'error budget'], badge: '25', topics: ['Load/Stress/Soak/Spike', 'Percentiles', 'k6/JMeter', 'SLI/SLO/SLA', 'Error Budgets', 'Capacity Planning'], dataFile: 'data/levels/level-11/load-testing.js' },
                        { id: 'rate-limiting', title: 'Rate Limiting & Throttling', icon: Icons.shield, keywords: ['rate limit', 'throttle', 'token bucket', 'sliding window', 'fixed window', 'leaky bucket', 'distributed', 'api gateway', '429'], badge: '25', topics: ['Token Bucket', 'Sliding Window', 'Fixed Window', 'Leaky Bucket', 'Distributed Rate Limiting', 'Client-Side Backoff', 'API Gateway', '.NET Rate Limiting'], dataFile: 'data/levels/level-11/rate-limiting.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 12: AI ─────────────────────────────────────────────
        {
            level: 12,
            title: 'AI & LLMs',
            description: 'LLMs, prompt engineering, RAG, AI agents, and tools',
            groups: [
                {
                    id: 'ai-core',
                    title: 'AI Fundamentals',
                    items: [
                        { id: 'ai-fundamentals', title: 'LLM & Prompt Engineering', icon: Icons.brain, keywords: ['llm', 'prompt', 'rag', 'embedding', 'vector', 'semantic'], badge: '25', topics: ['LLMs', 'Prompt Engineering', 'RAG', 'Embeddings', 'Vector DB', 'Semantic Search'], dataFile: 'data/ai-fundamentals.js' },
                        { id: 'ai-agents', title: 'AI Agents & Tools', icon: Icons.cpu, keywords: ['agent', 'mcp', 'semantic kernel', 'langchain', 'copilot', 'cursor', 'kiro'], badge: '20', topics: ['Semantic Kernel', 'LangChain', 'MCP', 'AI Agents', 'GitHub Copilot', 'AI Architecture'], dataFile: 'data/ai-agents.js' }
                    ]
                },
                {
                    id: 'ai-applications',
                    title: 'AI Applications',
                    items: [
                        { id: 'ai-integration', title: 'AI Integration Patterns', icon: Icons.layers, keywords: ['openai api', 'embeddings', 'fine-tuning', 'guardrails', 'rag', 'function calling', 'structured output', 'prompt injection'], badge: '25', topics: ['LLM APIs', 'RAG', 'Function Calling', 'Structured Output', 'Streaming', 'Guardrails', 'Cost/Latency'], dataFile: 'data/levels/level-12/ai-integration.js' },
                        { id: 'ai-responsible', title: 'Responsible AI', icon: Icons.shield, keywords: ['ethics', 'bias', 'fairness', 'transparency', 'governance', 'explainability', 'privacy', 'accountability'], badge: '20', topics: ['Fairness & Bias', 'Transparency', 'Explainability', 'Privacy', 'Human Oversight', 'Governance', 'Regulation'], dataFile: 'data/levels/level-12/ai-responsible.js' }
                    ]
                },
                {
                    id: 'ai-engineering-2',
                    title: 'AI Engineering 2.0',
                    items: [
                        { id: 'ai-mcp-agents', title: 'MCP, Agents & Multi-Agent Systems', icon: Icons.cpu, keywords: ['mcp', 'model context protocol', 'multi-agent', 'a2a', 'agent to agent', 'tool calling', 'orchestration', 'semantic kernel advanced'], badge: '35', topics: ['MCP Protocol', 'Multi-Agent Systems', 'A2A Communication', 'Tool Calling', 'Agent Orchestration', 'Semantic Kernel Advanced'], dataFile: 'data/levels/level-12/ai-mcp-agents.js' },
                        { id: 'ai-rag-advanced', title: 'Advanced RAG & Memory', icon: Icons.database, keywords: ['rag advanced', 'knowledge graph', 'hybrid search', 'vector database', 'memory architecture', 'chunking', 'reranking', 'pinecone', 'qdrant', 'weaviate'], badge: '30', topics: ['Memory Architectures', 'Knowledge Graph + RAG', 'Hybrid Search', 'Vector DB Comparison', 'Chunking Strategies', 'Re-ranking'], dataFile: 'data/levels/level-12/ai-rag-advanced.js' },
                        { id: 'ai-production', title: 'AI in Production', icon: Icons.shield, keywords: ['ai observability', 'guardrails', 'hallucination', 'cost optimization', 'model routing', 'evaluation', 'prompt caching', 'ai security', 'llm ops'], badge: '30', topics: ['AI Observability', 'Guardrails', 'Hallucination Detection', 'Cost Optimization', 'Model Routing', 'AI Evaluation', 'Prompt Caching'], dataFile: 'data/levels/level-12/ai-production.js' }
                    ]
                },
                {
                    id: 'ai-practices',
                    title: 'AI Engineering Practices',
                    items: [
                        { id: 'ai-prompt-engineering', title: 'Prompt Engineering Deep Dive', icon: Icons.code, keywords: ['prompt engineering', 'zero-shot', 'few-shot', 'chain of thought', 'tree of thought', 'structured output', 'prompt chaining', 'prompt versioning', 'rice', 'role prompting'], badge: '30', topics: ['Zero/Few-Shot', 'Chain of Thought', 'Tree of Thought', 'Structured Outputs', 'Prompt Chaining', 'Prompt Versioning', 'Role Prompting'], dataFile: 'data/levels/level-12/ai-prompt-engineering.js' },
                        { id: 'ai-assisted-development', title: 'AI-Assisted Development & SDLC', icon: Icons.zap, keywords: ['copilot', 'cursor', 'ai pair programming', 'ai code review', 'ai testing', 'ai sdlc', 'ai documentation', 'ai debugging', 'windsurf', 'kiro'], badge: '25', topics: ['AI Pair Programming', 'Copilot/Cursor/Kiro', 'AI Code Reviews', 'AI Testing', 'AI-Assisted SDLC', 'AI Documentation'], dataFile: 'data/levels/level-12/ai-assisted-development.js' },
                        { id: 'ai-architecture-patterns', title: 'AI Architecture Patterns', icon: Icons.layers, keywords: ['ai microservices', 'ai gateway', 'model routing', 'ai caching', 'fallback models', 'ai pipeline', 'orchestration', 'ai system design'], badge: '30', topics: ['AI Gateway', 'Model Routing', 'AI Caching', 'Fallback Patterns', 'AI Microservices', 'AI System Design'], dataFile: 'data/levels/level-12/ai-architecture-patterns.js' },
                        { id: 'ai-local-models', title: 'Open Source & Local LLMs', icon: Icons.box, keywords: ['hugging face', 'ollama', 'local llm', 'open source', 'llama', 'mistral', 'phi', 'fine-tuning', 'gguf', 'quantization'], badge: '25', topics: ['Hugging Face', 'Ollama', 'Local LLMs', 'Model Selection', 'Quantization', 'Fine-Tuning', 'When to Self-Host'], dataFile: 'data/levels/level-12/ai-local-models.js' },
                        { id: 'ai-hands-on-labs', title: 'AI Hands-On Labs & Projects', icon: Icons.code, keywords: ['rag project', 'ai chatbot', 'mcp server', 'semantic kernel project', 'ai lab', 'hands-on', 'capstone', 'portfolio'], badge: '30', topics: ['Build RAG App', 'Build MCP Server', 'Multi-Agent Workflow', 'AI Chatbot', 'Document Q&A', 'Evaluation Pipeline'], dataFile: 'data/levels/level-12/ai-hands-on-labs.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 13: Cloud-Native Engineering ─────────────────────────
        {
            level: 13,
            title: 'Cloud-Native Engineering',
            description: 'Docker, Kubernetes, Terraform, CI/CD, and production cloud operations',
            groups: [
                {
                    id: 'cloud-fundamentals',
                    title: 'Cloud Fundamentals',
                    items: [
                        { id: 'cloud-basics', title: 'Cloud Computing Basics', icon: Icons.globe, keywords: ['cloud', 'iaas', 'paas', 'saas', 'faas', 'availability', 'regions', 'ha', 'dr', 'scalability', 'capex', 'opex'], badge: '15', topics: ['IaaS/PaaS/SaaS/FaaS', 'Regions & Zones', 'High Availability', 'Disaster Recovery', 'Scalability', 'CAPEX vs OPEX'], dataFile: 'data/levels/level-13/cloud-basics.js' }
                    ]
                },
                {
                    id: 'docker',
                    title: 'Docker',
                    items: [
                        { id: 'docker-deep-dive', title: 'Docker Deep Dive', icon: Icons.box, keywords: ['docker', 'container', 'dockerfile', 'image', 'multi-stage', 'volume', 'network', 'compose', 'distroless', 'optimization'], badge: '25', topics: ['Images & Layers', 'Dockerfile', 'Multi-Stage Builds', 'Volumes', 'Networks', 'Compose', 'Security', 'Distroless'], dataFile: 'data/levels/level-13/docker-deep-dive.js' }
                    ]
                },
                {
                    id: 'kubernetes-core',
                    title: 'Kubernetes Core',
                    items: [
                        { id: 'k8s-architecture', title: 'Kubernetes Architecture', icon: Icons.server, keywords: ['kubernetes', 'k8s', 'control plane', 'worker node', 'kubelet', 'etcd', 'api server', 'scheduler', 'controller manager'], badge: '25', topics: ['Control Plane', 'Worker Nodes', 'kubelet', 'etcd', 'API Server', 'Scheduler', 'Controller Manager'], dataFile: 'data/levels/level-13/k8s-architecture.js' },
                        { id: 'k8s-workloads', title: 'Kubernetes Workloads', icon: Icons.layers, keywords: ['pod', 'replicaset', 'deployment', 'statefulset', 'daemonset', 'job', 'cronjob', 'workload'], badge: '25', topics: ['Pods', 'ReplicaSets', 'Deployments', 'StatefulSets', 'DaemonSets', 'Jobs', 'CronJobs'], dataFile: 'data/levels/level-13/k8s-workloads.js' }
                    ]
                },
                {
                    id: 'kubernetes-networking-storage',
                    title: 'Kubernetes Networking & Storage',
                    items: [
                        { id: 'k8s-networking', title: 'Kubernetes Networking', icon: Icons.globe, keywords: ['k8s service', 'clusterip', 'nodeport', 'loadbalancer', 'ingress', 'network policy', 'dns', 'cni'], badge: '25', topics: ['Services', 'ClusterIP', 'NodePort', 'LoadBalancer', 'Ingress', 'NetworkPolicies', 'DNS'], dataFile: 'data/levels/level-13/k8s-networking.js' },
                        { id: 'k8s-storage-scaling', title: 'Kubernetes Storage & Scaling', icon: Icons.database, keywords: ['pv', 'pvc', 'storageclass', 'hpa', 'vpa', 'cluster autoscaler', 'resource requests', 'limits'], badge: '25', topics: ['PV & PVC', 'StorageClasses', 'HPA', 'VPA', 'Cluster Autoscaler', 'Resource Requests/Limits'], dataFile: 'data/levels/level-13/k8s-storage-scaling.js' }
                    ]
                },
                {
                    id: 'kubernetes-production',
                    title: 'Kubernetes Production',
                    items: [
                        { id: 'k8s-production', title: 'Kubernetes Production Operations', icon: Icons.shield, keywords: ['rolling update', 'rollback', 'health check', 'readiness probe', 'liveness probe', 'startup probe', 'configmap', 'secret'], badge: '25', topics: ['Rolling Updates', 'Rollbacks', 'Health Checks', 'Readiness/Liveness/Startup Probes', 'ConfigMaps', 'Secrets'], dataFile: 'data/levels/level-13/k8s-production.js' }
                    ]
                },
                {
                    id: 'kubernetes-security-debugging',
                    title: 'Kubernetes Security & Debugging',
                    items: [
                        { id: 'k8s-security', title: 'Kubernetes Security', icon: Icons.shield, keywords: ['rbac', 'namespace', 'service account', 'pod security', 'network policy', 'secret management', 'admission controller'], badge: '20', topics: ['RBAC', 'Namespaces', 'Service Accounts', 'Pod Security', 'Network Policies', 'Admission Controllers'], dataFile: 'data/levels/level-13/k8s-security.js' },
                        { id: 'k8s-debugging', title: 'Kubernetes Debugging', icon: Icons.search, keywords: ['crashloopbackoff', 'imagepullbackoff', 'pending', 'oomkilled', 'dns failure', 'kubectl', 'troubleshoot'], badge: '25', topics: ['CrashLoopBackOff', 'ImagePullBackOff', 'Pending Pods', 'OOMKilled', 'DNS Failures', 'Diagnostic Commands'], dataFile: 'data/levels/level-13/k8s-debugging.js' }
                    ]
                },
                {
                    id: 'terraform',
                    title: 'Terraform',
                    items: [
                        { id: 'terraform-basics', title: 'Terraform Basics', icon: Icons.code, keywords: ['terraform', 'iac', 'hcl', 'provider', 'resource', 'variable', 'output', 'state', 'backend', 'workspace'], badge: '25', topics: ['IaC Concepts', 'HCL Syntax', 'Providers', 'Resources', 'Variables', 'Outputs', 'State', 'Backend'], dataFile: 'data/levels/level-13/terraform-basics.js' },
                        { id: 'terraform-advanced', title: 'Terraform Advanced', icon: Icons.layers, keywords: ['terraform module', 'remote state', 'lifecycle', 'dynamic block', 'azure', 'aws', 'provisioning'], badge: '25', topics: ['Modules', 'Remote State', 'Lifecycle Rules', 'Dynamic Blocks', 'Azure Provisioning', 'AWS Provisioning', 'Best Practices'], dataFile: 'data/levels/level-13/terraform-advanced.js' }
                    ]
                },
                {
                    id: 'cicd-gitops',
                    title: 'CI/CD & GitOps',
                    items: [
                        { id: 'cicd-pipelines', title: 'CI/CD Pipelines', icon: Icons.zap, keywords: ['github actions', 'azure devops', 'gitlab ci', 'pipeline', 'build', 'release', 'artifact', 'secret'], badge: '25', topics: ['GitHub Actions', 'Azure DevOps', 'GitLab CI', 'Build Pipelines', 'Release Pipelines', 'Secrets', 'Artifacts'], dataFile: 'data/levels/level-13/cicd-pipelines.js' },
                        { id: 'gitops', title: 'GitOps', icon: Icons.code, keywords: ['gitops', 'argocd', 'flux', 'declarative', 'drift detection', 'reconciliation', 'pull-based'], badge: '20', topics: ['GitOps Principles', 'ArgoCD', 'Flux', 'Declarative Deployments', 'Drift Detection', 'Reconciliation'], dataFile: 'data/levels/level-13/gitops.js' }
                    ]
                },
                {
                    id: 'helm-service-mesh',
                    title: 'Helm & Service Mesh',
                    items: [
                        { id: 'helm', title: 'Helm Charts', icon: Icons.box, keywords: ['helm', 'chart', 'template', 'values', 'dependency', 'release', 'upgrade', 'rollback'], badge: '20', topics: ['Charts', 'Templates', 'Values', 'Dependencies', 'Releases', 'Upgrades', 'Rollbacks'], dataFile: 'data/levels/level-13/helm.js' },
                        { id: 'service-mesh', title: 'Service Mesh', icon: Icons.globe, keywords: ['istio', 'linkerd', 'sidecar', 'traffic management', 'mtls', 'envoy', 'service mesh'], badge: '20', topics: ['Istio', 'Linkerd', 'Sidecars', 'Traffic Management', 'mTLS', 'Observability'], dataFile: 'data/levels/level-13/service-mesh.js' }
                    ]
                },
                {
                    id: 'cloud-observability-architecture',
                    title: 'Observability & Architecture',
                    items: [
                        { id: 'cloud-observability', title: 'Cloud Observability', icon: Icons.trendingUp, keywords: ['prometheus', 'grafana', 'loki', 'jaeger', 'opentelemetry', 'distributed tracing', 'alerts', 'metrics'], badge: '25', topics: ['Prometheus', 'Grafana', 'Loki', 'Jaeger', 'OpenTelemetry', 'Distributed Tracing', 'Alerts'], dataFile: 'data/levels/level-13/cloud-observability.js' },
                        { id: 'cloud-architecture', title: 'Cloud Architecture Patterns', icon: Icons.layers, keywords: ['blue-green', 'canary', 'rolling update', 'feature flag', 'zero-downtime', 'dr', 'multi-region'], badge: '25', topics: ['Blue-Green', 'Canary', 'Rolling Updates', 'Feature Flags', 'Zero-Downtime', 'DR', 'Multi-Region'], dataFile: 'data/levels/level-13/cloud-architecture.js' },
                        { id: 'production-troubleshooting', title: 'Production Troubleshooting', icon: Icons.alertTriangle, keywords: ['troubleshooting', 'diagnosis', 'root cause', 'symptoms', 'resolution', 'prevention', 'production issue'], badge: '30', topics: ['Symptom Analysis', 'Root Cause Identification', 'Diagnostic Commands', 'Resolution Patterns', 'Prevention Strategies', 'Incident Response'], dataFile: 'data/levels/level-13/production-troubleshooting.js' }
                    ]
                }
            ]
        },
        // ─── LEVEL 15: System Design ──────────────────────────────────
        {
            level: 15,
            title: 'System Design',
            description: 'Real-world system design case studies and trade-off analysis',
            groups: [
                {
                    id: 'system-design-cases',
                    title: 'Design Case Studies',
                    items: [
                        { id: 'sd-netflix', title: 'Design Netflix', icon: Icons.play, keywords: ['netflix', 'streaming', 'cdn', 'recommendation', 'microservice'], badge: '20', dataFile: 'data/sd-netflix.js' },
                        { id: 'sd-uber', title: 'Design Uber', icon: Icons.globe, keywords: ['uber', 'ride', 'matching', 'geolocation', 'realtime'], badge: '20', dataFile: 'data/sd-uber.js' },
                        { id: 'sd-whatsapp', title: 'Design WhatsApp', icon: Icons.globe, keywords: ['whatsapp', 'chat', 'message', 'websocket', 'queue'], badge: '20', dataFile: 'data/sd-whatsapp.js' },
                        { id: 'sd-payment', title: 'Payment Gateway', icon: Icons.shield, keywords: ['payment', 'transaction', 'idempotent', 'gateway', 'pci'], badge: '20', dataFile: 'data/sd-payment.js' },
                        { id: 'sd-notification', title: 'Notification System', icon: Icons.zap, keywords: ['notification', 'push', 'email', 'sms', 'queue', 'fanout'], badge: '15', dataFile: 'data/sd-notification.js' },
                        { id: 'sd-youtube', title: 'Design YouTube', icon: Icons.play, keywords: ['youtube', 'video', 'upload', 'transcode', 'stream', 'cdn'], badge: '20', dataFile: 'data/sd-youtube.js' }
                    ]
                },
                {
                    id: 'system-design-skills',
                    title: 'Design Skills',
                    items: [
                        { id: 'sd-framework', title: 'System Design Framework', icon: Icons.target, keywords: ['framework', 'requirements', 'estimation', 'trade-offs', 'capacity', 'high-level design', 'deep dive'], badge: '20', topics: ['Requirements', 'Estimation', 'API Design', 'Data Model', 'High-Level Design', 'Deep Dive', 'Trade-offs'], dataFile: 'data/levels/level-13/sd-framework.js' },
                        { id: 'sd-data-intensive', title: 'Data-Intensive Applications', icon: Icons.database, keywords: ['data pipeline', 'batch', 'stream', 'etl', 'lakehouse', 'kafka', 'lambda', 'kappa', 'idempotency'], badge: '20', topics: ['Reliability/Scalability/Maintainability', 'Batch vs Stream', 'ETL/ELT', 'Lake/Warehouse/Lakehouse', 'Idempotency', 'Lambda/Kappa'], dataFile: 'data/levels/level-13/sd-data-intensive.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 16: Production Engineering ─────────────────────────
        {
            level: 16,
            title: 'Production Engineering',
            description: 'Incident management, SRE practices, and reliability',
            groups: [
                {
                    id: 'sre',
                    title: 'Site Reliability',
                    items: [
                        { id: 'incident-management', title: 'Incident Management', icon: Icons.alertTriangle, keywords: ['incident', 'on-call', 'runbook', 'escalation', 'postmortem', 'mttr', 'incident commander', 'severity'], badge: '20', topics: ['Severity Levels', 'On-Call', 'Incident Commander', 'Runbooks', 'MTTD/MTTR', 'Blameless Postmortems'], dataFile: 'data/levels/level-14/incident-management.js' },
                        { id: 'reliability-patterns', title: 'Reliability Patterns', icon: Icons.shield, keywords: ['circuit breaker', 'bulkhead', 'timeout', 'retry', 'fallback', 'graceful degradation', 'cascading failure'], badge: '25', topics: ['Timeout', 'Retry + Backoff', 'Circuit Breaker', 'Bulkhead', 'Fallback', 'Rate Limiting', 'Health Checks'], dataFile: 'data/levels/level-14/reliability-patterns.js' },
                        { id: 'chaos-engineering', title: 'Chaos Engineering', icon: Icons.zap, keywords: ['chaos', 'fault injection', 'game day', 'resilience', 'blast radius', 'chaos monkey', 'steady state'], badge: '20', topics: ['Hypothesis-Driven', 'Steady State', 'Blast Radius', 'Fault Injection', 'Game Days', 'Chaos Monkey'], dataFile: 'data/levels/level-14/chaos-engineering.js' }
                    ]
                },
                {
                    id: 'production-practices',
                    title: 'Production Practices',
                    items: [
                        { id: 'feature-flags', title: 'Feature Flags & Rollouts', icon: Icons.settings, keywords: ['feature flag', 'progressive rollout', 'a/b test', 'canary', 'kill switch', 'feature toggle', 'deploy release'], badge: '20', topics: ['Deploy vs Release', 'Flag Types', 'Progressive Rollout', 'Kill Switches', 'A/B Testing', 'Flag Debt'], dataFile: 'data/levels/level-14/feature-flags.js' },
                        { id: 'zero-downtime', title: 'Zero-Downtime Deployments', icon: Icons.clock, keywords: ['zero downtime', 'migration', 'backward compatible', 'rolling', 'blue-green', 'expand contract', 'schema'], badge: '20', topics: ['Rolling/Blue-Green/Canary', 'Version Coexistence', 'Backward Compatibility', 'Expand-Contract', 'Online Migrations', 'Graceful Shutdown'], dataFile: 'data/levels/level-14/zero-downtime.js' },
                        { id: 'production-debugging', title: 'Production Debugging', icon: Icons.search, keywords: ['debugging', 'flame graph', 'heap dump', 'profiling', 'distributed tracing', 'memory leak', 'cpu spike', 'thread dump', 'live diagnosis'], badge: '30', topics: ['Flame Graphs', 'Heap Dumps', 'Thread Dumps', 'Memory Leak Diagnosis', 'CPU Profiling', 'Distributed Debugging', 'Log Correlation', 'Live Traffic Replay'], dataFile: 'data/levels/level-14/production-debugging.js' },
                        { id: 'on-call-survival', title: 'On-Call Survival & Ops Excellence', icon: Icons.alertTriangle, keywords: ['on-call', 'pager', 'runbook', 'escalation', 'alert fatigue', 'rotation', 'toil', 'operational excellence', 'handoff'], badge: '25', topics: ['Rotation Design', 'Alert Quality', 'Runbooks', 'Escalation Paths', 'Toil Reduction', 'Handoff Protocols', 'Burnout Prevention', 'Operational Review'], dataFile: 'data/levels/level-14/on-call-survival.js' },
                        { id: 'production-debugging-academy', title: 'Production Debugging Academy', icon: Icons.search, keywords: ['cpu spike', 'memory leak', 'deadlock', 'socket exhaustion', 'thread starvation', 'gc pressure', 'dns failure', 'kafka lag', 'crashloopbackoff'], badge: '35', topics: ['CPU 100%', 'Memory Leak', 'Deadlock', 'Socket Exhaustion', 'Thread Starvation', 'GC Pressure', 'DNS Failure', 'Kafka Lag'], dataFile: 'data/levels/level-14/production-debugging-academy.js' },
                        { id: 'failure-case-studies', title: 'Failure Case Studies', icon: Icons.alertTriangle, keywords: ['knight capital', 'healthcare.gov', 'gitlab deletion', 'crowdstrike', 'aws outage', 'facebook outage', 'incident', 'postmortem'], badge: '25', topics: ['Knight Capital $440M', 'Healthcare.gov', 'GitLab DB Deletion', 'CrowdStrike 2024', 'AWS us-east-1', 'Facebook 6hr Outage'], dataFile: 'data/levels/level-14/failure-case-studies.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 17: Leadership ─────────────────────────────────────
        {
            level: 17,
            title: 'Leadership',
            description: 'Technical leadership, mentoring, process, and estimation',
            groups: [
                {
                    id: 'tech-leadership',
                    title: 'Technical Leadership',
                    items: [
                        { id: 'leadership-core', title: 'Technical Leadership', icon: Icons.users, keywords: ['code review', 'mentoring', 'conflict', 'stakeholder', 'decision'], badge: '30', topics: ['Code Reviews', 'Mentoring', 'Conflict Resolution', 'Stakeholder Management', 'Decision Making'], dataFile: 'data/leadership-core.js' },
                        { id: 'leadership-process', title: 'Process & Estimation', icon: Icons.target, keywords: ['sprint', 'estimation', 'hiring', 'incident', 'rca', 'architecture review'], badge: '25', topics: ['Sprint Planning', 'Estimation', 'Hiring', 'Architecture Review', 'Production Incidents', 'RCA'], dataFile: 'data/leadership-process.js' }
                    ]
                },
                {
                    id: 'leadership-advanced',
                    title: 'Engineering Management',
                    items: [
                        { id: 'tech-strategy', title: 'Technical Strategy', icon: Icons.target, keywords: ['technology radar', 'adr', 'rfc', 'tech debt', 'roadmap', 'build vs buy', 'boring technology'], badge: '20', topics: ['Business Alignment', 'ADRs', 'RFCs', 'Tech Radar', 'Tech Debt', 'Build vs Buy', 'Decision Reversibility'], dataFile: 'data/levels/level-15/tech-strategy.js' },
                        { id: 'team-building', title: 'Team Building', icon: Icons.users, keywords: ['hiring', 'onboarding', 'culture', '1:1', 'growth', 'psychological safety', 'feedback'], badge: '20', topics: ['Psychological Safety', 'Hiring', 'Onboarding', '1:1s', 'Feedback (SBI)', 'Growth', 'Culture Add'], dataFile: 'data/levels/level-15/team-building.js' },
                        { id: 'communication', title: 'Communication & Influence', icon: Icons.globe, keywords: ['presentation', 'stakeholder', 'writing', 'influence', 'bluf', 'audience', 'disagree and commit'], badge: '20', topics: ['Audience Awareness', 'BLUF', 'Technical Writing', 'Influence Without Authority', 'Driving Alignment', 'Disagree & Commit'], dataFile: 'data/levels/level-15/communication.js' },
                        { id: 'tech-debt-management', title: 'Technical Debt Management', icon: Icons.code, keywords: ['tech debt', 'debt quadrant', 'refactoring', 'prioritization', 'code health', 'boy scout', 'debt ratio', 'buy-in'], badge: '25', topics: ['Debt Quadrant', 'Quantifying Debt', 'Prioritization Frameworks', 'Getting Buy-In', 'Boy Scout Rule', 'Debt Sprints', 'Metrics', 'Prevention'], dataFile: 'data/levels/level-15/tech-debt-management.js' },
                        { id: 'hiring-interviews', title: 'Interviewing & Hiring', icon: Icons.users, keywords: ['hiring', 'interviewing', 'bar raiser', 'structured interview', 'rubric', 'signal extraction', 'debrief', 'pipeline'], badge: '25', topics: ['Structured Interviews', 'Rubrics', 'Signal Extraction', 'Bar Raiser', 'Debrief Process', 'Bias Mitigation', 'Hiring Pipeline', 'Selling the Role'], dataFile: 'data/levels/level-15/hiring-interviews.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 18: Career & Interview Mastery ─────────────────────
        {
            level: 18,
            title: 'Career & Interview Mastery',
            description: 'Interview preparation, career growth, and industry readiness',
            groups: [
                {
                    id: 'interview-prep',
                    title: 'Interview Preparation',
                    items: [
                        { id: 'behavioral-interviews', title: 'Behavioral Interviews', icon: Icons.users, keywords: ['behavioral', 'star', 'situation', 'leadership', 'conflict', 'story bank', 'failure'], badge: '20', topics: ['STAR Method', 'Story Bank', 'Leadership Principles', 'Conflict/Failure Questions', 'I vs We', 'Authenticity'], dataFile: 'data/levels/level-16/behavioral-interviews.js' },
                        { id: 'system-design-interviews', title: 'System Design Interviews', icon: Icons.grid, keywords: ['system design interview', 'whiteboard', 'trade-offs', 'estimation', 'communication', 'depth'], badge: '20', topics: ['Driving the Round', 'Time Management', 'Depth vs Breadth', 'Thinking Out Loud', 'Curveballs', 'Level Signals'], dataFile: 'data/levels/level-16/system-design-interviews.js' },
                        { id: 'coding-interviews', title: 'Coding Interviews', icon: Icons.code, keywords: ['leetcode', 'algorithm', 'data structure', 'problem solving', 'umpire', 'patterns', 'big-o'], badge: '25', topics: ['UMPIRE Framework', 'Patterns', 'Communication', 'Big-O', 'Edge Cases', 'When Stuck', 'Prep Strategy'], dataFile: 'data/levels/level-16/coding-interviews.js' },
                        { id: 'scenario-based-questions', title: 'Scenario-Based Questions', icon: Icons.target, keywords: ['scenario', 'production', 'debugging', 'scalability', 'architecture', 'real-world', 'investigation', 'performance'], badge: '25', topics: ['API Performance', 'Concurrency', 'Scalability', 'Security', 'Caching', 'Real-Time', 'CI/CD', 'Rollback'], dataFile: 'data/levels/level-16/scenario-based-questions.js' }
                    ]
                },
                {
                    id: 'career-growth',
                    title: 'Career Growth',
                    items: [
                        { id: 'career-frameworks', title: 'Career Frameworks', icon: Icons.trendingUp, keywords: ['career ladder', 'ic track', 'management track', 'promotion', 'leveling', 'scope', 'staff'], badge: '20', topics: ['Career Ladders', 'IC vs Management', 'Scope/Impact/Autonomy', 'Leveling', 'Promotions', 'Growth Planning'], dataFile: 'data/levels/level-16/career-frameworks.js' },
                        { id: 'open-source', title: 'Open Source Contributing', icon: Icons.globe, keywords: ['open source', 'contribution', 'pr', 'community', 'good first issue', 'license', 'fork'], badge: '15', topics: ['Finding Projects', 'Contribution Workflow', 'PR Etiquette', 'Community Norms', 'Licensing', 'Reputation'], dataFile: 'data/levels/level-16/open-source.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 19: Full-Stack & Architect ─────────────────────
        {
            level: 19,
            title: 'Full-Stack & Architect',
            description: 'End-to-end full-stack patterns, solution architecture, and principal engineer topics',
            groups: [
                {
                    id: 'fullstack-patterns',
                    title: 'Full-Stack Patterns',
                    items: [
                        { id: 'fullstack-auth', title: 'Authentication Flows (E2E)', icon: Icons.shield, keywords: ['oauth', 'jwt', 'refresh token', 'session', 'cookie', 'pkce', 'bff', 'token storage'], badge: '30', topics: ['OAuth 2.0 Flows', 'PKCE', 'JWT Handling', 'Refresh Tokens', 'BFF Pattern', 'Session vs Token', 'Token Storage'], dataFile: 'data/levels/level-17/fullstack-auth.js' },
                        { id: 'fullstack-api-design', title: 'API Design Mastery', icon: Icons.server, keywords: ['rest', 'graphql', 'versioning', 'hateoas', 'pagination', 'error handling', 'idempotency', 'rate limiting'], badge: '35', topics: ['REST Maturity Model', 'API Versioning', 'Error Responses', 'Pagination', 'Idempotency', 'Rate Limiting', 'GraphQL vs REST'], dataFile: 'data/levels/level-17/fullstack-api-design.js' },
                        { id: 'fullstack-state', title: 'State Management (E2E)', icon: Icons.database, keywords: ['state', 'cache', 'optimistic', 'pessimistic', 'eventual', 'real-time', 'websocket', 'sse'], badge: '25', topics: ['Client State vs Server State', 'Optimistic Updates', 'Cache Invalidation', 'Real-Time Sync', 'Offline-First', 'Conflict Resolution'], dataFile: 'data/levels/level-17/fullstack-state.js' },
                        { id: 'fullstack-testing', title: 'Testing Strategy (E2E)', icon: Icons.check, keywords: ['testing pyramid', 'contract test', 'integration', 'e2e', 'playwright', 'testcontainers', 'chaos'], badge: '25', topics: ['Testing Diamond', 'Contract Tests', 'Integration Tests', 'E2E Strategy', 'Test Data', 'CI Pipeline', 'Chaos Testing'], dataFile: 'data/levels/level-17/fullstack-testing.js' }
                    ]
                },
                {
                    id: 'solution-architecture',
                    title: 'Solution Architecture',
                    items: [
                        { id: 'arch-decisions', title: 'Architecture Decision Making', icon: Icons.target, keywords: ['adr', 'trade-off', 'fitness function', 'reversibility', 'build vs buy', 'boring tech', 'rfc'], badge: '30', topics: ['ADRs', 'Trade-Off Analysis', 'Fitness Functions', 'Reversibility', 'Build vs Buy', 'Boring Technology', 'RFCs'], dataFile: 'data/levels/level-17/arch-decisions.js' },
                        { id: 'arch-scalability', title: 'Scalability Patterns', icon: Icons.trendingUp, keywords: ['horizontal', 'vertical', 'sharding', 'partitioning', 'read replica', 'cqrs', 'back pressure', 'throttling'], badge: '35', topics: ['Horizontal vs Vertical', 'Database Sharding', 'Read Replicas', 'CQRS Application', 'Back Pressure', 'Auto-Scaling', 'Load Shedding'], dataFile: 'data/levels/level-17/arch-scalability.js' },
                        { id: 'arch-migration', title: 'Legacy Migration & Tech Debt', icon: Icons.code, keywords: ['strangler fig', 'legacy', 'migration', 'tech debt', 'modernization', 'rewrite', 'refactor', 'monolith'], badge: '30', topics: ['Strangler Fig', 'Anti-Corruption Layer', 'Incremental Migration', 'Tech Debt Quadrant', 'Rewrite vs Refactor', 'Feature Parity'], dataFile: 'data/levels/level-17/arch-migration.js' },
                        { id: 'arch-data-modeling', title: 'Data Modeling & Schema Design', icon: Icons.database, keywords: ['normalization', 'denormalization', 'nosql modeling', 'schema evolution', 'polyglot', 'event sourcing'], badge: '25', topics: ['Normalization Forms', 'Denormalization', 'NoSQL Patterns', 'Schema Evolution', 'Polyglot Persistence', 'Data Ownership'], dataFile: 'data/levels/level-17/arch-data-modeling.js' },
                        { id: 'arch-observability-practice', title: 'Production Observability', icon: Icons.trendingUp, keywords: ['slo', 'sli', 'error budget', 'runbook', 'on-call', 'alert fatigue', 'dashboards', 'golden signals'], badge: '25', topics: ['Golden Signals', 'SLO/SLI/SLA', 'Error Budgets', 'Alert Design', 'Runbooks', 'On-Call Practices', 'Dashboards'], dataFile: 'data/levels/level-17/arch-observability-practice.js' },
                        { id: 'architecture-under-uncertainty', title: 'Architecture Under Uncertainty', icon: Icons.target, keywords: ['uncertainty', 'decision making', 'reversibility', 'option value', 'last responsible moment', 'evolutionary architecture', 'time to learn', 'two-way door'], badge: '30', topics: ['Reversible vs Irreversible Decisions', 'Last Responsible Moment', 'Option Value', 'Two-Way Doors', 'Evolutionary Architecture', 'Time-to-Learn', 'Decision Journals'], dataFile: 'data/levels/level-17/architecture-under-uncertainty.js' }
                    ]
                },
                {
                    id: 'principal-engineer',
                    title: 'Principal Engineer',
                    items: [
                        { id: 'pe-system-thinking', title: 'Systems Thinking', icon: Icons.globe, keywords: ['systems thinking', 'feedback loop', 'emergence', 'second order', 'conway', 'sociotechnical', 'complexity'], badge: '20', topics: ['Feedback Loops', 'Emergence', 'Second-Order Effects', "Conway's Law", 'Sociotechnical Systems', 'Complexity Theory'], dataFile: 'data/levels/level-17/pe-system-thinking.js' },
                        { id: 'pe-cost-engineering', title: 'Cost Engineering & FinOps', icon: Icons.trendingUp, keywords: ['finops', 'cloud cost', 'reserved', 'spot', 'rightsizing', 'cost allocation', 'unit economics'], badge: '20', topics: ['FinOps Principles', 'Reserved vs Spot', 'Rightsizing', 'Cost Allocation', 'Unit Economics', 'Cost-Aware Architecture'], dataFile: 'data/levels/level-17/pe-cost-engineering.js' },
                        { id: 'cost-aware-architecture', title: 'Cost-Aware Architecture', icon: Icons.trendingUp, keywords: ['cost optimization', 'architecture cost', 'trade-off', 'cloud spend', 'right-sizing', 'serverless cost', 'reserved capacity', 'spot instances', 'cost modeling'], badge: '30', topics: ['Cost Modeling', 'Architecture Trade-Offs', 'Right-Sizing', 'Serverless Economics', 'Data Transfer Costs', 'Storage Tiering', 'Cost Observability', 'Budget Guardrails'], dataFile: 'data/levels/level-17/cost-aware-architecture.js' },
                        { id: 'pe-platform-engineering', title: 'Platform Engineering', icon: Icons.layers, keywords: ['platform', 'internal developer', 'golden path', 'self-service', 'developer experience', 'idp', 'backstage'], badge: '25', topics: ['Internal Developer Platform', 'Golden Paths', 'Self-Service', 'Developer Experience', 'Backstage/Port', 'Platform Team'], dataFile: 'data/levels/level-17/pe-platform-engineering.js' },
                        { id: 'distributed-systems-internals', title: 'Distributed Systems Internals', icon: Icons.globe, keywords: ['consensus', 'raft', 'paxos', 'vector clock', 'crdt', 'consistent hashing', 'gossip', 'quorum', 'linearizability', 'byzantine', 'two generals', 'bloom filter'], badge: '35', topics: ['Consensus (Raft/Paxos)', 'Vector Clocks', 'CRDTs', 'Consistent Hashing', 'Gossip Protocol', 'Quorum', 'Linearizability', 'CAP Deep Dive'], dataFile: 'data/levels/level-17/distributed-systems-internals.js' },
                        { id: 'dotnet-performance', title: '.NET Performance & Internals', icon: Icons.zap, keywords: ['span', 'memory', 'aot', 'native aot', 'benchmark', 'profiling', 'pipelines', 'array pool', 'object pool', 'allocation', 'gc tuning', 'jit'], badge: '30', topics: ['Span<T> & Memory<T>', 'ArrayPool', 'System.IO.Pipelines', 'Native AOT', 'BenchmarkDotNet', 'GC Tuning', 'Allocation-Free Code'], dataFile: 'data/levels/level-17/dotnet-performance.js' },
                        { id: 'modular-monolith', title: 'Modular Monolith & Vertical Slice', icon: Icons.grid, keywords: ['modular monolith', 'vertical slice', 'feature folder', 'module boundary', 'internal event', 'composition root', 'bounded context monolith'], badge: '25', topics: ['Modular Monolith', 'Vertical Slice Architecture', 'Feature Folders', 'Module Communication', 'When NOT Microservices', 'Migration Path'], dataFile: 'data/levels/level-17/modular-monolith.js' },
                        { id: 'realtime-architecture', title: 'Real-Time Architecture', icon: Icons.zap, keywords: ['websocket', 'signalr', 'sse', 'server sent events', 'long polling', 'real-time', 'push notification', 'connection management', 'scaling websocket'], badge: '25', topics: ['WebSocket vs SSE vs Polling', 'SignalR Scaling', 'Connection Management', 'Backplane (Redis)', 'Fan-Out Patterns', 'Presence Systems'], dataFile: 'data/levels/level-17/realtime-architecture.js' },
                        { id: 'api-governance', title: 'API Governance & Evolution', icon: Icons.shield, keywords: ['api governance', 'versioning', 'breaking change', 'deprecation', 'contract first', 'openapi', 'backward compatible', 'api lifecycle', 'consumer-driven'], badge: '30', topics: ['Versioning Strategies', 'Breaking vs Non-Breaking', 'Contract-First Design', 'Deprecation Policy', 'API Lifecycle', 'Consumer-Driven Contracts', 'API Standards'], dataFile: 'data/levels/level-17/api-governance.js' },
                        { id: 'data-mesh', title: 'Data Mesh & Data Architecture', icon: Icons.database, keywords: ['data mesh', 'data product', 'domain ownership', 'federated governance', 'data lakehouse', 'data contract', 'analytical data', 'self-serve platform'], badge: '30', topics: ['Data Mesh Principles', 'Domain Data Ownership', 'Data as a Product', 'Federated Governance', 'Self-Serve Platform', 'Data Contracts', 'When NOT Data Mesh'], dataFile: 'data/levels/level-17/data-mesh.js' },
                        { id: 'multi-region', title: 'Multi-Region & Global Architecture', icon: Icons.globe, keywords: ['multi-region', 'active-active', 'geo-replication', 'conflict resolution', 'latency budget', 'global load balancer', 'data sovereignty', 'crdt', 'eventual consistency'], badge: '35', topics: ['Active-Active vs Active-Passive', 'Geo-Replication', 'Conflict Resolution (CRDTs)', 'Latency Budgets', 'Data Sovereignty', 'Global Traffic Management', 'Failover Patterns'], dataFile: 'data/levels/level-17/multi-region.js' },
                        { id: 'architecture-communication', title: 'Architecture Communication', icon: Icons.users, keywords: ['architecture document', 'c4 model', 'stakeholder', 'rfc', 'adr', 'diagram', 'presenting architecture', 'influence', 'executive summary'], badge: '25', topics: ['C4 Model', 'Architecture Documents', 'Presenting to Executives', 'RFCs', 'Diagramming Standards', 'Influencing Decisions', 'Writing ADRs'], dataFile: 'data/levels/level-17/architecture-communication.js' },
                        { id: 'production-incident-architecture', title: 'Production Incident Architecture', icon: Icons.alertTriangle, keywords: ['incident', 'debuggable', 'diagnosable', 'recoverable', 'blast radius', 'circuit breaker', 'graceful degradation', 'feature kill switch', 'rollback'], badge: '30', topics: ['Designing for Debuggability', 'Blast Radius Containment', 'Graceful Degradation', 'Kill Switches', 'Automated Rollback', 'Incident-Proof Architecture', 'Recovery Patterns'], dataFile: 'data/levels/level-17/production-incident-architecture.js' },
                        { id: 'architecture-decisions-library', title: 'Architecture Decision Library', icon: Icons.target, keywords: ['kafka vs rabbitmq', 'sql vs nosql', 'monolith vs microservices', 'redis vs memcached', 'rest vs grpc', 'cqrs vs crud', 'trade-off', 'decision'], badge: '35', topics: ['Kafka vs RabbitMQ', 'SQL vs NoSQL', 'Monolith vs Microservices', 'REST vs gRPC', 'CQRS vs CRUD', 'K8s vs Container Apps'], dataFile: 'data/levels/level-17/architecture-decisions-library.js' },
                        { id: 'technology-comparisons', title: 'Technology Comparison Center', icon: Icons.grid, keywords: ['comparison', 'redis vs memcached', 'angular vs react', 'docker vs podman', 'cosmos vs mongodb', 'blazor vs angular', 'azure vs aws'], badge: '30', topics: ['Redis vs Memcached', 'Angular vs React', 'Azure vs AWS', 'Cosmos vs MongoDB', 'SignalR vs WebSockets', 'Docker Compose vs K8s'], dataFile: 'data/levels/level-17/technology-comparisons.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 20: Enterprise Software Delivery ───────────────────
        {
            level: 20,
            title: 'Enterprise Software Delivery',
            description: 'SDLC, team structures, enterprise terminology, release management, and delivery metrics',
            groups: [
                {
                    id: 'enterprise-sdlc',
                    title: 'SDLC & Agile',
                    items: [
                        { id: 'enterprise-sdlc', title: 'SDLC & Agile Frameworks', icon: Icons.shuffle, keywords: ['sdlc', 'agile', 'scrum', 'kanban', 'safe', 'sprint', 'velocity', 'estimation', 'story points', 'waterfall'], badge: '35', topics: ['Waterfall vs Agile', 'Scrum', 'Kanban', 'SAFe', 'Sprint Ceremonies', 'Story Points', 'Velocity', 'Estimation'], dataFile: 'data/levels/level-18/enterprise-sdlc.js' }
                    ]
                },
                {
                    id: 'enterprise-teams',
                    title: 'Teams & Terminology',
                    items: [
                        { id: 'enterprise-teams', title: 'Team Structures & Enterprise Terms', icon: Icons.users, keywords: ['squad', 'pod', 'tribe', 'team topologies', 'bau', 'rca', 'uat', 'okr', 'kpi', 'raci', 'enterprise jargon'], badge: '30', topics: ['Squads/Pods/Tribes', 'Team Topologies', 'Enterprise Terminology', 'RAG Status', 'OKRs/KPIs', 'RACI Matrix'], dataFile: 'data/levels/level-18/enterprise-teams.js' }
                    ]
                },
                {
                    id: 'enterprise-delivery',
                    title: 'Delivery & Governance',
                    items: [
                        { id: 'enterprise-delivery', title: 'Release, QA, Incidents & Metrics', icon: Icons.trendingUp, keywords: ['release management', 'hotfix', 'qa', 'smoke test', 'regression', 'incident management', 'dora', 'space', 'governance', 'compliance', 'togaf'], badge: '35', topics: ['Release Management', 'QA Terminology', 'Incident Severity', 'DORA Metrics', 'SPACE Framework', 'Governance', 'Enterprise Architecture'], dataFile: 'data/levels/level-18/enterprise-delivery.js' }
                    ]
                }
            ]
        },

        // ─── LEVEL 21: Networking & Infrastructure ────────────────────
        {
            level: 21,
            title: 'Networking & Infrastructure',
            description: 'Networking fundamentals, load balancing, DNS, CDN, service mesh, and production networking scenarios',
            groups: [
                {
                    id: 'networking-core',
                    title: 'Networking Fundamentals',
                    items: [
                        { id: 'networking-fundamentals', title: 'Networking & Load Balancing', icon: Icons.globe, keywords: ['osi', 'tcp', 'udp', 'dns', 'http', 'load balancer', 'round robin', 'consistent hashing', 'tls', 'proxy', 'caching'], badge: '35', topics: ['OSI/TCP-IP', 'HTTP Lifecycle', 'DNS Deep Dive', 'Load Balancing Algorithms', 'TLS Handshake', 'Caching Layers', 'Connection Pooling'], dataFile: 'data/levels/level-19/networking-fundamentals.js' }
                    ]
                },
                {
                    id: 'networking-production',
                    title: 'Production Networking',
                    items: [
                        { id: 'networking-production', title: 'CDN, Service Mesh & Production Scenarios', icon: Icons.server, keywords: ['cdn', 'reverse proxy', 'nginx', 'service mesh', 'istio', 'kubernetes networking', 'ingress', 'nat', 'vpc', 'production scenarios'], badge: '30', topics: ['Reverse Proxy', 'CDN', 'Service Mesh', 'K8s Networking', 'VPC/VNet', 'Real Production Scenarios'], dataFile: 'data/levels/level-19/networking-production.js' }
                    ]
                }
            ]
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // HELPER METHODS (backward-compatible)
    // ═══════════════════════════════════════════════════════════════

    // Helper: get flat list of all page IDs
    getAllPageIds() {
        const ids = [];
        this.levels.forEach(level => {
            level.groups.forEach(group => {
                group.items.forEach(item => ids.push(item.id));
            });
        });
        return ids;
    },

    // Helper: find page info by ID
    getPageInfo(pageId) {
        for (const level of this.levels) {
            for (const group of level.groups) {
                for (const item of group.items) {
                    if (item.id === pageId) {
                        return {
                            ...item,
                            section: group.title,
                            sectionId: group.id,
                            level: level.level,
                            levelTitle: level.title
                        };
                    }
                }
            }
        }
        return null;
    },

    // Helper: get previous & next pages
    getNavigation(pageId) {
        const allIds = this.getAllPageIds();
        const idx = allIds.indexOf(pageId);
        return {
            prev: idx > 0 ? this.getPageInfo(allIds[idx - 1]) : null,
            next: idx < allIds.length - 1 ? this.getPageInfo(allIds[idx + 1]) : null
        };
    },

    // ═══════════════════════════════════════════════════════════════
    // NEW HELPER METHODS (level-aware)
    // ═══════════════════════════════════════════════════════════════

    // Get level metadata by level number
    getLevelInfo(levelNum) {
        return this.levels.find(l => l.level === levelNum) || null;
    },

    // Get all items in a level (flat array)
    getLevelItems(levelNum) {
        const level = this.getLevelInfo(levelNum);
        if (!level) return [];
        const items = [];
        level.groups.forEach(group => {
            group.items.forEach(item => items.push(item));
        });
        return items;
    },

    // Get the data file path for a page ID
    getDataFilePath(pageId) {
        const info = this.getPageInfo(pageId);
        return info ? info.dataFile : null;
    },

    // Get the level number for a page ID
    getLevelForPage(pageId) {
        for (const level of this.levels) {
            for (const group of level.groups) {
                for (const item of group.items) {
                    if (item.id === pageId) return level.level;
                }
            }
        }
        return null;
    }
};
