/* ===================================================================
 DOCKER DEEP DIVE - Level 13: Cloud-Native Engineering
 Container vs VM, Docker architecture, Dockerfile, multi-stage builds,
 image layers, volumes, networking, Compose, security, optimization.
 =================================================================== */
'use strict';
PageData.register('docker-deep-dive', {
 title: 'Docker Deep Dive',
 level: 13,
 group: 'cloud-native',
 description: 'Master containerization with Docker: architecture, Dockerfiles, multi-stage builds, networking, volumes, security, and production optimization.',
 difficulty: 'intermediate',
 estimatedMinutes: 55,
 prerequisites: ['linux-fundamentals', 'cloud-basics'],
 sections: [
 {
 title: 'Introduction',
 content: '<p><strong>Docker</strong> revolutionized software delivery by packaging applications and their dependencies into lightweight, portable containers that run consistently across any environment. Unlike virtual machines, containers share the host OS kernel, making them faster to start, smaller in footprint, and more efficient with resources.</p><p>Docker is the foundation of modern cloud-native development. Understanding it deeply is essential for microservices, CI/CD pipelines, and orchestration platforms like Kubernetes.</p><p>In this module you will learn:</p><ul><li>How containers differ from VMs at the kernel level</li><li>Docker architecture: daemon, client, registry, and runtime</li><li>Writing production-quality Dockerfiles</li><li>Multi-stage builds for minimal images</li><li>Image layers, caching, and optimization strategies</li><li>Volumes, bind mounts, and persistent storage</li><li>Docker networking models</li><li>Docker Compose for multi-container applications</li><li>Security best practices: rootless, distroless, scanning</li></ul>'
 },
 {
 title: 'Containers vs Virtual Machines',
 content: '<p>Both containers and VMs provide isolation, but at fundamentally different levels:</p><h4>Virtual Machines</h4><ul><li>Run a complete guest OS on a hypervisor (VMware, Hyper-V, KVM)</li><li>Full hardware virtualization with dedicated kernel per VM</li><li>Size: Gigabytes. Boot time: minutes.</li><li>Strong isolation boundary (separate kernels)</li><li>Good for: running different OS types, strong security isolation, legacy applications</li></ul><h4>Containers</h4><ul><li>Share the host OS kernel, isolated via Linux namespaces and cgroups</li><li>Package only the application and its dependencies</li><li>Size: Megabytes. Start time: milliseconds to seconds.</li><li>Process-level isolation (weaker than VM boundary)</li><li>Good for: microservices, CI/CD, consistent dev/prod environments, density</li></ul><h4>Kernel Technologies</h4><ul><li><strong>Namespaces:</strong> Isolate what a process can SEE (PID, network, mount, user, IPC, UTS)</li><li><strong>Cgroups:</strong> Limit what a process can USE (CPU, memory, I/O, network bandwidth)</li><li><strong>Union filesystem:</strong> Layer images efficiently (OverlayFS)</li></ul>',
 mermaid: 'graph TD; subgraph Virtual Machine; App1[App A] --> GuestOS1[Guest OS]; App2[App B] --> GuestOS2[Guest OS]; GuestOS1 --> Hypervisor; GuestOS2 --> Hypervisor; Hypervisor --> HostOS[Host OS]; HostOS --> HW[Hardware]; end; subgraph Containers; AppC[App C] --> Bins1[Libs/Bins]; AppD[App D] --> Bins2[Libs/Bins]; Bins1 --> DockerEngine[Container Runtime]; Bins2 --> DockerEngine; DockerEngine --> HostOS2[Host OS]; HostOS2 --> HW2[Hardware]; end'
 },
 {
 title: 'Docker Architecture',
 content: '<p>Docker uses a client-server architecture with several key components:</p><h4>Docker Daemon (dockerd)</h4><p>The background service that manages images, containers, networks, and volumes. It exposes a REST API that the client communicates with.</p><h4>Docker Client (docker CLI)</h4><p>The primary interface for users. Commands like <code>docker build</code>, <code>docker run</code>, and <code>docker push</code> communicate with the daemon via the API.</p><h4>Container Runtime (containerd + runc)</h4><p>containerd manages the complete container lifecycle. runc is the low-level runtime that creates containers using Linux kernel features (namespaces, cgroups).</p><h4>Docker Registry</h4><p>Stores and distributes Docker images. Docker Hub is the default public registry. Organizations typically run private registries (ECR, ACR, GCR, Harbor).</p><h4>Docker Objects</h4><ul><li><strong>Images:</strong> Read-only templates for creating containers. Built in layers.</li><li><strong>Containers:</strong> Running instances of images. Adds a writable layer on top.</li><li><strong>Volumes:</strong> Persistent storage that outlives containers.</li><li><strong>Networks:</strong> Communication channels between containers.</li></ul>',
 mermaid: 'graph LR; CLI[Docker CLI] -->|REST API| Daemon[Docker Daemon]; Daemon --> Containerd[containerd]; Containerd --> Runc[runc]; Runc --> Container1[Container]; Runc --> Container2[Container]; Daemon --> Registry[Registry - Hub/ECR]; Daemon --> Volumes[Volumes]; Daemon --> Networks[Networks]'
 },
 {
 title: 'Dockerfile Deep Dive',
 content: '<p>A Dockerfile is a text file with instructions for building a Docker image. Each instruction creates a layer in the image.</p><h4>Key Instructions</h4><ul><li><strong>FROM:</strong> Base image. Every Dockerfile starts here. Use specific tags, never <code>latest</code> in production.</li><li><strong>RUN:</strong> Execute commands during build. Each RUN creates a layer.</li><li><strong>COPY/ADD:</strong> Copy files from build context into the image. COPY is preferred.</li><li><strong>WORKDIR:</strong> Set the working directory for subsequent instructions.</li><li><strong>ENV:</strong> Set environment variables available at build time and runtime.</li><li><strong>EXPOSE:</strong> Document which ports the container listens on (does not publish them).</li><li><strong>ENTRYPOINT:</strong> The executable that runs when the container starts. Use exec form.</li><li><strong>CMD:</strong> Default arguments to ENTRYPOINT, or the default command if no ENTRYPOINT.</li><li><strong>ARG:</strong> Build-time variables (not available at runtime).</li><li><strong>HEALTHCHECK:</strong> Tell Docker how to test if the container is healthy.</li></ul><h4>ENTRYPOINT vs CMD</h4><p>ENTRYPOINT defines WHAT runs. CMD defines DEFAULT ARGUMENTS. Together they give you a fixed executable with overridable arguments.</p>',
 code: `# Production Node.js Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \`
 CMD wget -qO- http://localhost:3000/health || exit 1
ENTRYPOINT ["node"]
CMD ["dist/server.js"]`,
 language: 'dockerfile'
 },
 {
 title: 'Multi-Stage Builds',
 content: '<p>Multi-stage builds let you use multiple FROM statements in one Dockerfile. Each FROM starts a new build stage. You can copy artifacts from earlier stages into later ones, discarding everything else.</p><h4>Why Multi-Stage?</h4><ul><li><strong>Smaller images:</strong> Final image only contains runtime dependencies, not build tools (compiler, npm devDependencies, test frameworks)</li><li><strong>Security:</strong> Fewer packages in production image means smaller attack surface</li><li><strong>Single Dockerfile:</strong> No need for separate build and runtime Dockerfiles</li><li><strong>Cache efficiency:</strong> Build stages can be cached independently</li></ul><h4>Common Patterns</h4><ul><li><strong>Builder pattern:</strong> Compile in stage 1, copy binary to minimal stage 2</li><li><strong>Test stage:</strong> Run tests in an intermediate stage before building production image</li><li><strong>Development vs Production:</strong> Target different stages for local dev vs deployment</li></ul><p>Use <code>docker build --target=stage-name</code> to stop at a specific stage (useful for development images that include debug tools).</p>'
 },
 {
 title: 'Image Layers and Caching',
 content: '<p>Docker images are built as a stack of read-only layers. Each Dockerfile instruction (FROM, RUN, COPY) creates a new layer. When running a container, Docker adds a thin writable layer on top.</p><h4>Layer Caching Rules</h4><ul><li>Docker checks each instruction against its cache. If the instruction and all previous layers are unchanged, it reuses the cached layer.</li><li>COPY/ADD: Cache is invalidated if any file in the build context has changed (checksum comparison).</li><li>RUN: Cache is invalidated if the command string changes. Docker does NOT know if the command would produce different output.</li><li>Once a cache miss occurs, ALL subsequent layers are rebuilt.</li></ul><h4>Optimization Strategies</h4><ul><li><strong>Order by change frequency:</strong> Put rarely-changing instructions first (install OS packages) and frequently-changing ones last (copy source code).</li><li><strong>Separate dependency install from code copy:</strong> COPY package.json first, RUN npm install, THEN COPY source code. Dependencies are only reinstalled when package.json changes.</li><li><strong>Combine RUN commands:</strong> Multiple RUN statements create multiple layers. Combine with and-and to reduce layer count and image size.</li><li><strong>Use .dockerignore:</strong> Exclude node_modules, .git, logs, and other irrelevant files from the build context.</li></ul>'
 },
 {
 title: 'Volumes and Persistent Storage',
 content: '<p>Container filesystems are ephemeral - data written inside a container is lost when the container is removed. Docker provides three mechanisms for persistent and shared storage:</p><h4>Named Volumes</h4><p>Managed by Docker in /var/lib/docker/volumes/. Best for production data that should persist. Docker handles the lifecycle.</p><h4>Bind Mounts</h4><p>Map a host directory directly into the container. Best for development (live code reloading) and configuration files. The host path must exist.</p><h4>tmpfs Mounts</h4><p>Stored in host memory only. Never written to disk. Good for sensitive data (secrets, tokens) that should not persist.</p><h4>Volume Best Practices</h4><ul><li>Use named volumes for database data, uploads, and any state that must survive container recreation</li><li>Use bind mounts for development source code and config files</li><li>Never store important data in the container writable layer</li><li>Use volume drivers for cloud-backed storage (EBS, Azure Disk) in production</li><li>Back up volumes regularly: <code>docker run --rm -v mydata:/data -v /backup:/backup alpine tar czf /backup/data.tar.gz /data</code></li></ul>'
 },
 {
 title: 'Docker Networking',
 content: '<p>Docker provides several network drivers for different use cases:</p><h4>Bridge (default)</h4><p>Containers on the same bridge network can communicate by name. Isolated from the host network. Use for single-host multi-container apps.</p><h4>Host</h4><p>Container shares the host network stack directly. No NAT overhead, best performance. Use for network-intensive applications where port mapping overhead matters.</p><h4>Overlay</h4><p>Spans multiple Docker hosts (Swarm or custom). Containers on different machines communicate as if on the same network. Use for multi-host orchestration.</p><h4>None</h4><p>No networking. Container is completely isolated. Use for batch jobs that need no network access.</p><h4>Macvlan</h4><p>Assigns a MAC address to the container, making it appear as a physical device on the network. Use for legacy applications that need to be on the LAN.</p><h4>Key Networking Concepts</h4><ul><li><strong>DNS resolution:</strong> Containers on user-defined networks can reach each other by container name</li><li><strong>Port publishing:</strong> -p 8080:3000 maps host port 8080 to container port 3000</li><li><strong>Network isolation:</strong> Containers on different networks cannot communicate (security boundary)</li><li><strong>Service discovery:</strong> Docker DNS + custom networks = built-in service discovery</li></ul>'
 },
 {
 title: 'Docker Compose',
 content: '<p>Docker Compose defines and runs multi-container applications using a YAML file. It handles networking, volumes, environment variables, dependencies, and startup order in a declarative format.</p><h4>Key Features</h4><ul><li><strong>Service definitions:</strong> Each service is a container with its own config</li><li><strong>Automatic networking:</strong> All services in a compose file share a network by default</li><li><strong>Volume management:</strong> Named volumes and bind mounts declared in one place</li><li><strong>Environment management:</strong> .env files, env_file directive, and inline variables</li><li><strong>Dependency ordering:</strong> depends_on with health check conditions</li><li><strong>Profiles:</strong> Group services for different environments (dev, test, debug)</li></ul><h4>Production Considerations</h4><p>Docker Compose is excellent for local development and single-host deployments. For multi-host production, use Kubernetes, ECS, or Docker Swarm. Compose files can be a starting point for generating K8s manifests (kompose).</p>',
 code: `# docker-compose.yml - Full-stack application
version: '3.9'
services:
 api:
 build:
 context: ./api
 target: production
 ports:
 - "3000:3000"
 environment:
 - DATABASE_URL=postgres://user:pass@db:5432/app
 - REDIS_URL=redis://cache:6379
 depends_on:
 db:
 condition: service_healthy
 restart: unless-stopped

 db:
 image: postgres:16-alpine
 volumes:
 - pgdata:/var/lib/postgresql/data
 environment:
 POSTGRES_DB: app
 POSTGRES_USER: user
 POSTGRES_PASSWORD: pass
 healthcheck:
 test: pg_isready -U user -d app
 interval: 5s
 retries: 5

 cache:
 image: redis:7-alpine
 restart: unless-stopped

volumes:
 pgdata:`,
 language: 'yaml'
 },
 {
 title: 'Security Best Practices',
 content: '<p>Container security requires attention at every layer: base images, build process, runtime configuration, and orchestration.</p><h4>Image Security</h4><ul><li><strong>Minimal base images:</strong> Use Alpine (5MB) or distroless (no shell, no package manager). Fewer packages = smaller attack surface.</li><li><strong>Pin versions:</strong> Use <code>node:20.11-alpine</code> not <code>node:latest</code>. Reproducible builds.</li><li><strong>Scan for vulnerabilities:</strong> Use Trivy, Snyk, or Docker Scout in CI/CD pipeline. Fail builds on critical CVEs.</li><li><strong>Multi-stage builds:</strong> Build tools and source code never reach production image.</li></ul><h4>Runtime Security</h4><ul><li><strong>Non-root user:</strong> Always add <code>USER node</code> or <code>USER 1000</code>. Never run as root in production.</li><li><strong>Read-only filesystem:</strong> Use <code>--read-only</code> flag. Mount specific writable directories as tmpfs.</li><li><strong>Drop capabilities:</strong> Use <code>--cap-drop=ALL</code> then add back only what is needed.</li><li><strong>No privilege escalation:</strong> Use <code>--security-opt=no-new-privileges</code>.</li><li><strong>Resource limits:</strong> Always set <code>--memory</code> and <code>--cpus</code> limits to prevent noisy neighbor issues.</li></ul><h4>Supply Chain Security</h4><ul><li>Sign images with Docker Content Trust (Notary)</li><li>Use private registries with vulnerability scanning</li><li>Pin base image digests: <code>FROM node@sha256:abc123...</code></li><li>Audit and update base images regularly (Dependabot, Renovate)</li></ul>'
 },
 {
 title: 'Image Optimization',
 content: '<p>Optimized images deploy faster, use less bandwidth, and have smaller attack surfaces. Target: production images under 100MB for most applications.</p><h4>Optimization Techniques</h4><ul><li><strong>Choose minimal base:</strong> Alpine (~5MB) vs Ubuntu (~77MB) vs Distroless (~2MB for static binaries)</li><li><strong>Combine RUN statements:</strong> <code>RUN apt-get update and-and apt-get install -y pkg and-and rm -rf /var/lib/apt/lists/*</code> in one layer</li><li><strong>Clean up in the same layer:</strong> Delete caches, temp files, and package manager artifacts in the same RUN instruction</li><li><strong>.dockerignore file:</strong> Exclude .git, node_modules, test files, docs, IDE config. Reduces build context transfer time.</li><li><strong>Order layers by change frequency:</strong> System dependencies first, application code last</li><li><strong>Use multi-stage builds:</strong> Final image contains only runtime artifacts</li><li><strong>Avoid installing unnecessary packages:</strong> Use <code>--no-install-recommends</code> with apt-get</li></ul><h4>Alpine vs Distroless</h4><p><strong>Alpine:</strong> Tiny (5MB), includes shell and package manager (apk). Good for debugging. Uses musl libc (occasionally causes compatibility issues with glibc-compiled binaries).</p><p><strong>Distroless:</strong> No shell, no package manager, nothing except the application runtime. Smallest attack surface. Harder to debug (use debug images for troubleshooting).</p>',
 table: {
 headers: ['Base Image', 'Size', 'Shell', 'Package Mgr', 'Best For'],
 rows: [
 ['ubuntu:22.04', '77MB', 'Yes', 'apt', 'Development, familiar tooling'],
 ['alpine:3.19', '5MB', 'Yes', 'apk', 'Small production images'],
 ['distroless/static', '2MB', 'No', 'None', 'Go/Rust static binaries'],
 ['distroless/base', '20MB', 'No', 'None', 'Java, Node.js production'],
 ['scratch', '0MB', 'No', 'None', 'Single static binary']
 ]
 }
 },
 {
 title: 'Hands-On Lab: Containerize a Full-Stack App',
 content: '<p><strong>Objective:</strong> Build production-ready Docker images for a Node.js API + React frontend + PostgreSQL database, orchestrated with Docker Compose.</p><h4>Lab Steps</h4><ol><li>Write a multi-stage Dockerfile for the Node.js API (builder stage for TypeScript compilation, production stage with Alpine)</li><li>Write a multi-stage Dockerfile for the React app (build stage with node, serve stage with nginx:alpine)</li><li>Create a docker-compose.yml with all three services, health checks, and proper dependency ordering</li><li>Add a .dockerignore file for each service</li><li>Implement a volume for PostgreSQL data persistence</li><li>Add resource limits (memory and CPU) to each service</li><li>Run the stack locally and verify all services communicate</li><li>Optimize: get the API image under 80MB and the frontend under 25MB</li></ol><h4>Success Criteria</h4><ul><li>All services start with a single <code>docker compose up</code></li><li>API image is under 80MB, frontend under 25MB</li><li>Containers run as non-root users</li><li>Database data persists across container recreation</li><li>Health checks pass and restart unhealthy containers</li></ul>'
 },
 {
 title: 'Interview Tips',
 content: '<p>Docker questions range from basic usage to deep architecture understanding. Be prepared to discuss trade-offs, not just commands.</p>',
 callout: { type: 'tip', title: 'What Interviewers Look For', text: 'Junior: Can you write a basic Dockerfile and explain what containers are? Mid: Can you optimize images, explain multi-stage builds, and set up Compose? Senior: Can you design a secure container strategy, explain layer caching in depth, and discuss production orchestration trade-offs? Architect: Can you design a container platform strategy including image pipelines, security scanning, runtime policies, and multi-tenancy?' }
 }
 ],
 questions: [
 {
 id: 'docker-q1',
 level: 'junior',
 title: 'What is the difference between a container and a virtual machine?',
 answer: '<p>A <strong>VM</strong> runs a complete guest operating system on a hypervisor, with full hardware virtualization. It is heavyweight (GB-sized) and takes minutes to boot.</p><p>A <strong>container</strong> shares the host OS kernel and uses Linux namespaces for isolation and cgroups for resource limits. It packages only the application and its dependencies. Containers are lightweight (MB-sized), start in milliseconds, and are more resource-efficient.</p><p>Key trade-off: VMs provide stronger isolation (separate kernels) while containers provide better density and speed.</p>'
 },
 {
 id: 'docker-q2',
 level: 'junior',
 title: 'What is a Dockerfile and what are the most common instructions?',
 answer: '<p>A Dockerfile is a text file containing instructions for building a Docker image. Key instructions:</p><ul><li><strong>FROM:</strong> Specifies the base image</li><li><strong>RUN:</strong> Executes commands during build (installing packages, compiling)</li><li><strong>COPY:</strong> Copies files from the build context into the image</li><li><strong>WORKDIR:</strong> Sets the working directory</li><li><strong>EXPOSE:</strong> Documents the port the app listens on</li><li><strong>CMD:</strong> Specifies the default command when a container starts</li><li><strong>ENTRYPOINT:</strong> Sets the main executable for the container</li></ul>'
 },
 {
 id: 'docker-q3',
 level: 'mid',
 title: 'Explain Docker image layers and how caching works during builds.',
 answer: '<p>Each Dockerfile instruction creates a read-only layer. Layers are stacked and each one only stores the diff from the previous layer (union filesystem).</p><p><strong>Caching rules:</strong> Docker checks each instruction against its cache. If the instruction text and all file checksums (for COPY/ADD) match a cached layer, it reuses it. Once a cache miss occurs, all subsequent layers are rebuilt.</p><p><strong>Optimization:</strong> Put rarely-changing instructions first (install OS deps), copy dependency manifests before source code, and combine related RUN commands to minimize layers.</p>'
 },
 {
 id: 'docker-q4',
 level: 'mid',
 title: 'What is a multi-stage build and why would you use one?',
 answer: '<p>A multi-stage build uses multiple FROM statements in a single Dockerfile. Each FROM starts a new stage. You can copy artifacts from earlier stages into later ones.</p><p><strong>Benefits:</strong></p><ul><li>Final image only contains runtime artifacts (no compilers, build tools, source code)</li><li>Dramatically smaller images (often 10-50x reduction)</li><li>Smaller attack surface (fewer packages to exploit)</li><li>Single Dockerfile for the entire build pipeline</li></ul><p>Example: Stage 1 compiles TypeScript to JavaScript. Stage 2 copies only the compiled JS and production node_modules into a minimal Alpine image.</p>'
 },
 {
 id: 'docker-q5',
 level: 'mid',
 title: 'What is the difference between ENTRYPOINT and CMD in a Dockerfile?',
 answer: '<p><strong>ENTRYPOINT</strong> defines the executable that always runs. <strong>CMD</strong> provides default arguments that can be overridden at runtime.</p><p>When both are set: ENTRYPOINT is the command, CMD provides default args. <code>docker run myimage newarg</code> overrides CMD but not ENTRYPOINT.</p><p><strong>Best practice:</strong> Use ENTRYPOINT for the main process (the thing this container IS) and CMD for sensible defaults that users might want to override. Always use exec form (JSON array) to ensure proper signal handling.</p>'
 },
 {
 id: 'docker-q6',
 level: 'senior',
 title: 'How would you secure a Docker container for production? List your top 5 security measures.',
 answer: '<p>Top 5 production container security measures:</p><ol><li><strong>Run as non-root:</strong> Add USER directive. Never run application processes as root. Use <code>--security-opt=no-new-privileges</code>.</li><li><strong>Minimal base image:</strong> Use distroless or Alpine. Fewer packages = fewer CVEs. No shell = no shell exploits.</li><li><strong>Vulnerability scanning in CI:</strong> Trivy/Snyk scans on every build. Fail pipeline on critical/high CVEs. Scan both base image and application dependencies.</li><li><strong>Read-only filesystem:</strong> Use <code>--read-only</code> with specific tmpfs mounts where writes are needed. Prevents runtime tampering.</li><li><strong>Resource limits and capabilities:</strong> Set memory/CPU limits. Drop ALL capabilities and add back only required ones. Use seccomp profiles to restrict syscalls.</li></ol>'
 },
 {
 id: 'docker-q7',
 level: 'senior',
 title: 'Explain Docker networking modes. When would you use bridge vs host vs overlay?',
 answer: '<p><strong>Bridge (default):</strong> Creates an isolated network. Containers communicate by name. Best for: single-host multi-container apps where you want network isolation.</p><p><strong>Host:</strong> Container uses host network stack directly. No NAT, no port mapping overhead. Best for: high-performance networking where port mapping latency matters (monitoring agents, network tools).</p><p><strong>Overlay:</strong> Spans multiple Docker hosts via VXLAN tunneling. Containers on different machines appear on the same network. Best for: multi-host orchestration (Swarm services, cross-host communication).</p><p><strong>None:</strong> Complete network isolation. Best for: batch processing jobs that should never make network calls (security/compliance).</p><p>In Kubernetes, you typically use a CNI plugin instead of Docker networking, but understanding these modes helps debug connectivity issues.</p>'
 },
 {
 id: 'docker-q8',
 level: 'senior',
 title: 'How do you debug a container that keeps crashing on startup?',
 answer: '<p>Systematic debugging approach:</p><ol><li><strong>Check logs:</strong> <code>docker logs container-name</code> - shows stdout/stderr output including crash messages</li><li><strong>Check exit code:</strong> <code>docker inspect --format={{.State.ExitCode}} container</code> - OOMKilled (137), segfault (139), app error (1)</li><li><strong>Override entrypoint:</strong> <code>docker run --entrypoint sh myimage</code> - get a shell to investigate the filesystem and environment</li><li><strong>Check resource limits:</strong> Container might be OOM-killed. Check <code>docker stats</code> and event logs.</li><li><strong>Verify environment:</strong> <code>docker inspect</code> to check env vars, mounts, network settings are correct</li><li><strong>Check health:</strong> If HEALTHCHECK is failing, the container restarts. Review health check command.</li><li><strong>Use debug image:</strong> Multi-stage build with a debug target that includes diagnostic tools (curl, netcat, strace)</li></ol>'
 },
 {
 id: 'docker-q9',
 level: 'lead',
 title: 'How would you design a Docker image build pipeline for a team of 30 developers?',
 answer: '<p>A scalable image build pipeline needs speed, security, and consistency:</p><ul><li><strong>Base image management:</strong> Maintain internal base images (hardened, scanned, approved). Teams extend these, not public images directly. Monthly refresh cycle with automated rebuilds.</li><li><strong>CI/CD integration:</strong> Build images on every PR. Use BuildKit for parallel stage execution and better caching. Cache layers in registry (--cache-from/--cache-to).</li><li><strong>Security gates:</strong> Vulnerability scanning (Trivy/Snyk) as a required CI step. Block merges if critical CVEs found. SBOM generation for supply chain visibility.</li><li><strong>Image tagging strategy:</strong> Semantic versioning for releases, git SHA for traceability, environment tags for deployment (staging, production).</li><li><strong>Registry management:</strong> Private registry (ECR/ACR/Harbor) with retention policies. Automated cleanup of old images. Geo-replicated for multi-region deployments.</li><li><strong>Developer experience:</strong> Fast builds via BuildKit parallelism and registry caching. Local build should match CI build exactly. Compose for local development.</li></ul>'
 },
 {
 id: 'docker-q10',
 level: 'lead',
 title: 'What are the trade-offs between Docker Compose, Docker Swarm, and Kubernetes for production orchestration?',
 answer: '<p><strong>Docker Compose:</strong> Single-host only. No automatic failover, no horizontal scaling, no service mesh. Perfect for: local development, single-server deployments, CI environments.</p><p><strong>Docker Swarm:</strong> Multi-host orchestration built into Docker. Simple setup, familiar docker-compose syntax. Limited ecosystem, fewer features than K8s. Good for: small teams wanting multi-host without K8s complexity.</p><p><strong>Kubernetes:</strong> Industry standard orchestrator. Rich ecosystem (service mesh, GitOps, operators). Steep learning curve, operational overhead. Good for: any team needing auto-scaling, self-healing, rolling deployments, multi-tenancy at scale.</p><p>Rule of thumb: Start with Compose for development. If you need multi-host production, jump to Kubernetes (Swarm is effectively deprecated). Use managed K8s (EKS, AKS, GKE) to reduce operational burden.</p>'
 },
 {
 id: 'docker-q11',
 level: 'architect',
 title: 'Design a container platform strategy for a large enterprise migrating from VMs. What are the key architectural decisions?',
 answer: '<p>Enterprise container platform strategy requires decisions across multiple dimensions:</p><ul><li><strong>Runtime platform:</strong> Managed Kubernetes (EKS/AKS/GKE) for most teams. Serverless containers (Fargate/Cloud Run) for teams that want zero infra management. VM-based for legacy apps that cannot be containerized.</li><li><strong>Multi-tenancy model:</strong> Namespace per team with RBAC and ResourceQuotas? Cluster per team for strong isolation? Virtual clusters (vCluster) for a middle ground?</li><li><strong>Image supply chain:</strong> Approved base images catalog, automated scanning pipeline, signed images with admission controllers that reject unsigned images, SBOM generation.</li><li><strong>Networking:</strong> Service mesh (Istio/Linkerd) for mTLS, traffic management, observability. Network policies for microsegmentation. Ingress strategy (API gateway vs ingress controller).</li><li><strong>Observability:</strong> Standardized logging (structured JSON, shipped to central platform), metrics (Prometheus/Datadog), distributed tracing (OpenTelemetry). Container-aware dashboards.</li><li><strong>Developer experience:</strong> Internal developer platform (Backstage), standardized templates, GitOps deployment (ArgoCD/Flux), local development that mirrors production (Telepresence/Tilt).</li><li><strong>Migration strategy:</strong> Start with stateless web services (easiest). Then APIs. Databases and stateful services last. Use the strangler fig pattern.</li></ul>'
 },
 {
 id: 'docker-q12',
 level: 'architect',
 title: 'How would you handle persistent storage for stateful applications in a containerized environment?',
 answer: '<p>Stateful containers are the hardest part of container orchestration. Strategy depends on the workload:</p><ul><li><strong>Databases:</strong> Prefer managed services (RDS, Cloud SQL) over containerized databases for production. If containerizing, use StatefulSets with stable network identities and PersistentVolumeClaims backed by cloud block storage (EBS, Azure Disk).</li><li><strong>Storage classes:</strong> Define storage classes for different tiers: SSD for OLTP databases, HDD for logs/archives, shared filesystem (EFS/Azure Files) for read-many workloads.</li><li><strong>Backup strategy:</strong> Volume snapshots at the infrastructure level. Application-consistent backups via pre/post hooks. Test restores regularly.</li><li><strong>Data locality:</strong> StatefulSets with pod affinity to keep pods on the same node as their data. Use local-path provisioner for highest I/O performance (trade-off: lose portability).</li><li><strong>Operator pattern:</strong> Use purpose-built operators (PostgreSQL Operator, MongoDB Operator) that automate failover, backup, scaling, and upgrades for specific databases.</li><li><strong>Hybrid approach:</strong> Containerize stateless services. Keep databases on managed services. Use containers for dev/test database instances (acceptable to lose data).</li></ul>'
 }
 ]
});
