/* ═══════════════════════════════════════════════════════════════════
   Docker — Containers, Dockerfile, Multi-stage Builds, Compose
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('docker-core', {
    title: 'Docker & Containers',
    description: 'Dockerfile best practices, multi-stage builds for .NET, Docker Compose, networking, volumes, security, and production container patterns.',
    quickRecall: [
        'Image = read-only blueprint; Container = running instance with writable layer',
        'Each Dockerfile instruction creates a cached layer — order matters for speed',
        'Multi-stage builds: compile in SDK image, copy output to slim runtime image',
        'Volumes persist data beyond container lifecycle — bind mounts or named volumes',
        'Docker Compose: define multi-container apps in one YAML file',
        'Security: run as non-root user, scan images, use minimal base (alpine/distroless)'
    ],
    sections: [
        {
            title: 'Docker Image Layering',
            mermaid: `graph TB
    subgraph Build["Multi-Stage Build"]
        SDK["Stage 1: SDK Image<br/>dotnet restore + publish"]
        RT["Stage 2: Runtime Image<br/>COPY --from=build, minimal base"]
        SDK -->|artifacts only| RT
    end
    subgraph Layers["Image Layers (Read-Only)"]
        L1["Base OS (alpine 5MB)"]
        L2["Runtime (.NET 8 ASP 80MB)"]
        L3["App Dependencies"]
        L4["Application Code"]
    end
    subgraph Run["Container"]
        RW["Writable Layer"]
        L4R["Layers (shared, cached)"]
    end
    RT --> Layers
    Layers -->|docker run| Run`,
            content: `<p>Each Dockerfile instruction creates a read-only layer. Multi-stage builds use a full SDK image for compilation but copy only the published output into a minimal runtime image — reducing final size from 700MB+ to under 100MB.</p>`
        },
        {
            title: 'Dockerfile Best Practices for .NET',
            content: `<p>A well-structured Dockerfile uses <strong>multi-stage builds</strong> to separate build environment from runtime, minimizing image size and attack surface.</p>`,
            code: `# Multi-stage Dockerfile for ASP.NET Core API
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj first (layer caching for NuGet restore)
COPY ["MyApi/MyApi.csproj", "MyApi/"]
COPY ["MyApi.Domain/MyApi.Domain.csproj", "MyApi.Domain/"]
RUN dotnet restore "MyApi/MyApi.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/MyApi"
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: Runtime (minimal image, no SDK!)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app

# Security: run as non-root user
RUN adduser -D -u 1000 appuser
USER appuser

# Copy only published output
COPY --from=build /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD wget -qO- http://localhost:8080/health || exit 1

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "MyApi.dll"]`,
            language: 'dockerfile'
        },
        {
            title: 'Docker Compose & Networking',
            content: `<p><strong>Docker Compose</strong> defines multi-container applications. It handles networking, volumes, and dependencies between services for local development and testing.</p>`,
            code: `# docker-compose.yml — full development environment
services:
  api:
    build:
      context: .
      dockerfile: MyApi/Dockerfile
    ports:
      - "5000:8080"
    environment:
      - ConnectionStrings__Default=Server=db;Database=MyApp;User=sa;Password=P@ssw0rd!;TrustServerCertificate=true
      - Redis__Connection=redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app-network

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=P@ssw0rd!
    ports:
      - "1433:1433"
    volumes:
      - sql-data:/var/opt/mssql
    healthcheck:
      test: /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "P@ssw0rd!" -Q "SELECT 1"
      interval: 10s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network

volumes:
  sql-data:

networks:
  app-network:
    driver: bridge`,
            language: 'yaml'
        },
        {
            title: 'Container Security & Optimization',
            content: `<p>Production containers need minimal attack surface, non-root execution, proper secrets management, and image scanning.</p>`,
            code: `# Security best practices:
# 1. Use minimal base images (alpine, distroless)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine  # ~100MB vs 200MB+

# 2. Run as non-root
USER 1000:1000

# 3. Read-only filesystem where possible
# docker run --read-only --tmpfs /tmp myapp

# 4. No secrets in image (use env vars, mounted secrets, or vault)
# NEVER: COPY appsettings.Production.json .
# INSTEAD: Mount at runtime or use environment variables

# 5. Pin image versions (not :latest)
FROM mcr.microsoft.com/dotnet/aspnet:8.0.3-alpine3.19  # Specific version

# 6. Scan for vulnerabilities
# docker scout cves myimage:latest
# Or: trivy image myimage:latest

# Optimization tips:
# - .dockerignore to exclude bin/, obj/, .git/, node_modules/
# - Layer ordering: least-changing first (restore → build → publish)
# - Combine RUN commands to reduce layers
# - Use --no-restore on publish if restore is separate step`,
            language: 'dockerfile'
        }
    ],
    questions: [
        {
            question: 'What is a multi-stage Docker build and why is it important for .NET?',
            difficulty: 'medium',
            answer: `<p>A <strong>multi-stage build</strong> uses multiple FROM statements. The first stage uses the full SDK (to build/publish), and the final stage uses only the runtime image (no SDK, no source code). This produces much smaller, more secure production images — typically 100-200MB vs 1GB+ with the SDK.</p>`,
            bestPractices: ['Always use multi-stage: SDK for build, runtime-only for final image', 'Copy csproj files first for NuGet restore layer caching', 'Use Alpine-based images for smallest size', 'Run as non-root user in production containers'],
            commonMistakes: ['Shipping the SDK in production images (large, insecure)', 'Not leveraging layer caching (copying all source before restore)', 'Using :latest tag (non-reproducible builds)', 'Running containers as root (unnecessary privilege escalation risk)'],
            interviewTip: 'Explain the two concerns: build-time needs (SDK, source code, tools) vs runtime needs (just the compiled app + runtime). Multi-stage separates these cleanly. Mention the image size reduction (1.2GB → 150MB).',
            followUp: ['How does Docker layer caching work?', 'What is a distroless image?', 'How do you handle secrets in containers?'],
            seniorPerspective: 'I standardize on a company-wide base Dockerfile template: multi-stage, Alpine runtime, non-root, health check, proper .dockerignore. Teams copy the template and only change the project-specific bits.',
            architectPerspective: 'Container image strategy is a supply chain security concern. I enforce: signed base images from approved registries, vulnerability scanning in CI/CD, image immutability (never :latest in production), and minimal privilege through read-only filesystems and non-root execution.'
        },
        {
            question: 'How does Docker layer caching work and how do you optimize build times?',
            difficulty: 'medium',
            answer: `<p>Docker builds images layer-by-layer from Dockerfile instructions. Each layer is cached — if the instruction and its input haven't changed, Docker reuses the cached layer. <strong>Optimization strategy:</strong> order instructions from least-changing to most-changing, so cache invalidation affects only the minimum layers.</p>`,
            code: `# OPTIMIZED layer ordering for .NET:
# Layer 1: Base image (changes rarely)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Layer 2: Copy ONLY csproj files (changes when dependencies change)
COPY ["src/MyApi/MyApi.csproj", "src/MyApi/"]
COPY ["src/MyApi.Domain/MyApi.Domain.csproj", "src/MyApi.Domain/"]

# Layer 3: Restore (cached if csproj unchanged — saves 30-60 seconds!)
RUN dotnet restore "src/MyApi/MyApi.csproj"

# Layer 4: Copy source and build (invalidated on ANY code change)
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Why this order matters:
# - Most builds only change source code (Layer 4)
# - NuGet restore (Layer 3) is cached from previous build
# - Saves 30-60 seconds per build in CI/CD
# - If you COPY . . before restore, EVERY code change invalidates restore cache!`,
            language: 'dockerfile',
            bestPractices: ['Order Dockerfile instructions from least to most frequently changing', 'Copy package manifests (csproj, package.json) separately before source code', 'Use .dockerignore to exclude bin/, obj/, .git/, node_modules/', 'Multi-stage builds avoid caching debug/build tools in final image'],
            commonMistakes: ['COPY . . before restore (invalidates package restore cache on every code change)', 'Not using .dockerignore (sending GB of unnecessary context to Docker daemon)', 'Too many layers (each RUN creates a layer — combine related commands)', 'Using ADD when COPY suffices (ADD has extra features you usually dont need)'],
            interviewTip: 'The key insight: Docker invalidates a layer and ALL layers after it when input changes. So put rarely-changing instructions first (base image → dependencies → source code). Show a before/after Dockerfile with timing improvement.',
            followUp: ['What is BuildKit and how does it improve caching?', 'How do you cache NuGet packages across builds?', 'What is the Docker build context?'],
            seniorPerspective: 'I measure Docker build times in CI/CD and optimize: separate csproj copy + restore saves 30-60 seconds per build. For monorepos, I use BuildKit cache mounts for NuGet/npm caches shared across builds.',
            architectPerspective: 'In CI/CD pipelines running 50+ builds/day, Docker cache optimization saves hours of compute daily. I implement remote caching (BuildKit cache export to registry) so all CI agents share layer caches — even the first build on a new agent is fast.'
        },
        {
            question: 'What is a distroless image and how does it compare to Alpine for production containers?',
            difficulty: 'hard',
            answer: `<p>A <strong>distroless</strong> image contains only your application and its runtime dependencies — no shell, no package manager, no busybox, no general-purpose OS utilities. <strong>Alpine</strong> is a tiny full Linux distro (musl libc + busybox + apk) that still includes a shell and package manager.</p>
            <ul>
                <li><strong>Security</strong>: distroless has a far smaller attack surface — no shell means a compromised process cannot spawn <code>/bin/sh</code>, and fewer packages means fewer CVEs.</li>
                <li><strong>Debuggability</strong>: Alpine lets you <code>exec</code> in and poke around; distroless does not (use ephemeral debug containers or a <code>:debug</code> variant).</li>
                <li><strong>libc</strong>: Alpine uses musl, which can cause subtle issues with some native dependencies; distroless variants use glibc.</li>
            </ul>`,
            explanation: 'Alpine is a small but fully furnished apartment — compact, yet it still has a kitchen and tools an intruder could use. Distroless is a sealed room with only what your app needs; there is literally no shell for an attacker to break into.',
            code: `# Distroless runtime stage for a published .NET app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish MyApi/MyApi.csproj -c Release -o /app/publish

# Distroless: no shell, no package manager, non-root by default
FROM mcr.microsoft.com/dotnet/runtime-deps:8.0-jammy-chiseled AS runtime
WORKDIR /app
COPY --from=build /app/publish .
USER 1000
ENTRYPOINT ["./MyApi"]
# No RUN/CMD shell form works here — there is no /bin/sh to interpret it.`,
            language: 'dockerfile',
            bestPractices: ['Use distroless or chiseled images for production to shrink attack surface', 'Use shell-based images only in build stages, never final runtime', 'Run as non-root (distroless/chiseled default to this)', 'Use ephemeral debug containers (kubectl debug) instead of baking a shell in'],
            commonMistakes: ['Using shell-form CMD/ENTRYPOINT in distroless (no /bin/sh to run it)', 'Trying to exec a shell into a distroless container to debug', 'Assuming musl (Alpine) is drop-in compatible with native glibc dependencies', 'Adding back a shell/package manager "just for debugging" and shipping it'],
            interviewTip: 'Lead with attack surface: no shell means a whole class of post-exploitation (spawning /bin/sh, installing tools) is impossible. Then acknowledge the trade-off — debugging requires ephemeral/debug containers, and you must use exec-form ENTRYPOINT.',
            followUp: ['How do you debug a distroless container in production?', 'Why does shell-form ENTRYPOINT fail in distroless?', 'What are .NET chiseled images?'],
            seniorPerspective: 'For services that handle untrusted input I push for distroless or chiseled images specifically to remove the shell — it eliminates the easiest pivot after a process compromise. I pair it with kubectl debug ephemeral containers so we lose nothing on the troubleshooting side.',
            architectPerspective: 'Minimal images are a supply-chain control: fewer packages means fewer CVEs to track and patch, and no shell means a smaller blast radius if a process is compromised. I standardize the org on chiseled/distroless runtime bases with scanning in CI, treating image composition as part of the security boundary.'
        },
        {
            question: 'Explain Docker volumes versus bind mounts and how container data persistence works.',
            difficulty: 'medium',
            answer: `<p>Containers have an ephemeral writable layer that is destroyed when the container is removed. To persist data you mount storage:</p>
            <ul>
                <li><strong>Named volumes</strong>: managed by Docker, stored in Docker's area (e.g., <code>/var/lib/docker/volumes</code>). Portable, backup-friendly, the right choice for databases and stateful data.</li>
                <li><strong>Bind mounts</strong>: map a specific host path into the container. Great for local development (mount source code for live reload) but tightly coupled to the host's filesystem layout.</li>
                <li><strong>tmpfs</strong>: stored in host memory only, never written to disk — for secrets/scratch data.</li>
            </ul>
            <p>The container's own writable layer should be treated as disposable; anything that must survive a restart or redeploy belongs in a volume.</p>`,
            explanation: 'The container filesystem is a hotel room — cleared when you check out. A named volume is a safe-deposit box the hotel manages for you; a bind mount is a drawer in your own house that you let the room access directly.',
            code: `# Named volume (managed, portable) for a database
docker volume create pgdata
docker run -d --name db -v pgdata:/var/lib/postgresql/data postgres:16

# Bind mount (host path) for live-reload development
docker run -d --name web -v "$(pwd)/src:/app/src" my-web:dev

# tmpfs (in-memory, never persisted) for sensitive scratch data
docker run --tmpfs /tmp:rw,size=64m my-app

# Compose equivalent
# services:
#   db:
#     image: postgres:16
#     volumes:
#       - pgdata:/var/lib/postgresql/data
# volumes:
#   pgdata:`,
            language: 'bash',
            bestPractices: ['Use named volumes for stateful data (databases, uploads)', 'Use bind mounts mainly for development source mounting', 'Use tmpfs for secrets and scratch that must never touch disk', 'Back up named volumes explicitly — they are not in your image'],
            commonMistakes: ['Storing important data in the container writable layer (lost on removal)', 'Using bind mounts in production (host-path coupling, permission issues)', 'Forgetting to back up named volumes', 'Mounting over a directory and unexpectedly hiding the image content there'],
            interviewTip: 'Anchor on the ephemeral writable layer: explain that container removal destroys it, so persistence requires a mount. Then differentiate named volumes (Docker-managed, production) from bind mounts (host path, development).',
            followUp: ['Why are named volumes preferred over bind mounts in production?', 'How do you back up a Docker volume?', 'What happens to a volume when the container is deleted?'],
            seniorPerspective: 'My rule: treat the container filesystem as disposable. Stateful data goes in named volumes (or, in Kubernetes, PersistentVolumes), and bind mounts stay in the dev inner loop. That mental model prevents the classic "we redeployed and lost the data" incident.',
            architectPerspective: 'In orchestrated environments I avoid running stateful workloads in containers when a managed data service exists, because volume lifecycle, backup, and failover are genuinely hard. When state must be containerized, I design around explicit persistent volumes with tested backup/restore rather than relying on local volumes.'
        },
        {
            question: 'How does Docker networking work, and how do containers communicate within and across hosts?',
            difficulty: 'medium',
            answer: `<p>Docker provides several network drivers:</p>
            <ul>
                <li><strong>bridge</strong> (default): containers on a user-defined bridge network get an internal IP and can reach each other <strong>by service/container name</strong> via Docker's embedded DNS. This is how Compose services talk to each other.</li>
                <li><strong>host</strong>: the container shares the host's network stack (no isolation, no port mapping) — high performance, less isolation.</li>
                <li><strong>none</strong>: no networking.</li>
                <li><strong>overlay</strong>: spans multiple hosts (Swarm/orchestration) so containers on different machines communicate as if on one network.</li>
            </ul>
            <p><code>-p host:container</code> publishes a container port to the host. The default bridge does not provide name resolution — you must create a user-defined network (Compose does this automatically) to get DNS-based service discovery.</p>`,
            explanation: 'A user-defined bridge network is like an office with an internal phone directory: each service has a name everyone can dial. Publishing a port is installing an external line so the outside world can call in.',
            code: `# User-defined bridge gives DNS by container name
docker network create app-net
docker run -d --name db --network app-net postgres:16
docker run -d --name api --network app-net -p 5000:8080 my-api:1.0
# Inside 'api', the DB is reachable at host "db" (Docker DNS), not an IP.

# Compose: all services share a network; reach each other by service name
# services:
#   api:   { build: ., ports: ["5000:8080"], depends_on: [db] }
#   db:    { image: postgres:16 }
# api connects with: Host=db;Port=5432   (service name = hostname)`,
            language: 'bash',
            bestPractices: ['Use user-defined networks so containers resolve each other by name', 'Only publish (-p) ports that truly need host/external exposure', 'Segment networks (e.g., frontend vs backend) to limit reachability', 'Rely on Compose service names rather than hardcoded IPs'],
            commonMistakes: ['Relying on the default bridge and then finding no name resolution', 'Hardcoding container IP addresses (they change on restart)', 'Publishing database ports to the host unnecessarily (exposure risk)', 'Confusing the container port with the published host port in -p mapping'],
            interviewTip: 'The key fact interviewers want: on a user-defined bridge, containers resolve each other by name via Docker DNS — that is why Compose services use service names as hostnames. Contrast with the default bridge, which lacks DNS.',
            followUp: ['Why does the default bridge network not provide DNS resolution?', 'When would you use host networking?', 'What is an overlay network used for?'],
            seniorPerspective: 'I lean on user-defined networks and service-name DNS so configuration is portable across environments — no hardcoded IPs. I also keep port publishing minimal; if a service is only consumed internally, it should not be exposed on the host at all.',
            architectPerspective: 'Network segmentation is a security primitive even at the container layer. I separate tiers onto distinct networks so a compromised frontend cannot directly reach internal data services, mirroring the same zero-trust segmentation we apply in Kubernetes NetworkPolicies and cloud subnets.'
        },
        {
            question: 'A production .NET container image is over 1GB and slow to start. Walk through how you would diagnose and reduce it.',
            difficulty: 'advanced',
            answer: `<p>I would attack it systematically:</p>
            <ol>
                <li><strong>Inspect layers</strong>: <code>docker history</code> / dive to see which layers contribute the bulk — usually the SDK, copied source, or build artifacts left in the final image.</li>
                <li><strong>Multi-stage</strong>: ensure the runtime stage uses <code>aspnet</code>/<code>runtime-deps</code>, not <code>sdk</code>. Shipping the SDK alone adds ~700MB+.</li>
                <li><strong>Minimal base</strong>: switch to alpine, jammy-chiseled, or distroless runtime images.</li>
                <li><strong>.dockerignore</strong>: exclude bin/, obj/, .git/, tests, node_modules so build context and copied junk shrink.</li>
                <li><strong>Trimming/AOT</strong>: for self-contained apps, enable IL trimming or ReadyToRun/AOT to cut size and improve cold start.</li>
                <li><strong>Startup</strong>: slow start is often image pull time (size) plus JIT — smaller images pull faster, and ReadyToRun reduces JIT warmup.</li>
            </ol>`,
            explanation: 'It is like a bloated suitcase: first you see what is taking space (layer history), remove the toolbox you only needed while packing (the SDK), use a smaller suitcase (minimal base), and stop packing things you never use (.dockerignore).',
            code: `# Diagnose layer sizes
docker history --no-trunc my-api:1.0
# (or: dive my-api:1.0  for an interactive layer breakdown)

# Common culprit: final stage still on the SDK
# BAD:  FROM mcr.microsoft.com/dotnet/sdk:8.0      # ~800MB+ runtime image
# GOOD: FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine

# .dockerignore to shrink build context and avoid copying artifacts
# bin/
# obj/
# .git/
# **/node_modules/
# tests/

# ReadyToRun + trim for self-contained publish (faster cold start, smaller)
# dotnet publish -c Release -r linux-musl-x64 --self-contained true \\
#   -p:PublishReadyToRun=true -p:PublishTrimmed=true`,
            language: 'bash',
            bestPractices: ['Always separate SDK build stage from runtime stage', 'Pick the smallest runtime base that still runs your app (alpine/chiseled/distroless)', 'Maintain a .dockerignore to keep context and final image lean', 'Measure with docker history/dive before guessing'],
            commonMistakes: ['Final image built FROM the SDK (huge and insecure)', 'No .dockerignore (copying bin/obj/.git into the image)', 'Optimizing blindly without inspecting layer sizes first', 'Confusing image size with startup time — investigate pull time and JIT separately'],
            interviewTip: 'Show a method, not a single trick: measure (docker history/dive) → fix the biggest layer (usually SDK in final stage) → minimal base → .dockerignore → trimming/ReadyToRun. Tie size back to startup via faster pulls and reduced JIT.',
            followUp: ['How does ReadyToRun differ from full AOT for startup?', 'What tools show per-layer image size?', 'How does image size affect Kubernetes pod scheduling and autoscaling?'],
            seniorPerspective: 'Nine times out of ten the 1GB image is the SDK leaking into the final stage or a missing .dockerignore. I always start by measuring with docker history or dive rather than guessing, then move to a minimal runtime base. The startup win is mostly faster pulls plus ReadyToRun cutting JIT warmup.',
            architectPerspective: 'Image size is an operational cost multiplier: it slows every pull, every autoscale event, and every rollout across the fleet. I set org-wide base-image standards and a size budget enforced in CI, because at scale a bloated base image silently taxes deploy speed and node disk pressure everywhere.'
        },
        {
            question: 'What is the difference between a Docker image and a container? How does layering work?',
            difficulty: 'easy',
            answer: `<p>A <strong>Docker image</strong> is a read-only template \u2014 a snapshot of a filesystem with application code, runtime, libraries, and configuration. A <strong>container</strong> is a running instance of an image \u2014 it adds a thin writable layer on top of the image layers.</p>
<ul>
<li><strong>Image</strong>: Immutable, versioned, shareable (push/pull to registries). Built from a Dockerfile. Think of it as a class definition.</li>
<li><strong>Container</strong>: Mutable runtime instance with its own process space, network, and writable layer. Think of it as an object instance.</li>
<li><strong>Layering</strong>: Each Dockerfile instruction (FROM, RUN, COPY) creates a new layer. Layers are stacked and cached. Shared base layers are reused across images, saving disk and bandwidth. The union filesystem presents all layers as one merged view.</li>
</ul>
<p>Multiple containers can share the same image layers (read-only) while each having their own writable layer \u2014 this is why containers are lightweight to start.</p>`,
            interviewTip: 'Use the class/object analogy: image is the class (blueprint), container is the instance (running). Then explain layering as an optimization \u2014 shared base layers mean 10 containers from the same image use the disk space of 1 image + 10 thin writable layers.',
            followUp: ['What happens to the writable layer when a container is removed?', 'How does copy-on-write work with layers?', 'Can you modify a running container and save it as a new image?'],
            seniorPerspective: 'Understanding layering is essential for optimization: I order Dockerfile instructions so rarely-changing layers (base image, package restore) come first, maximizing cache reuse. I also use docker history and dive to identify unexpectedly large layers during troubleshooting.',
            architectPerspective: 'The image layering model enables efficient distribution at scale \u2014 base layers shared across hundreds of services are pulled once per node. I standardize on common base images so the fleet benefits from maximum layer sharing, reducing pull times during rollouts and autoscaling events.'
        },
        {
            question: 'Explain multi-stage Docker builds. Why are they important for production images?',
            difficulty: 'medium',
            answer: `<p><strong>Multi-stage builds</strong> use multiple <code>FROM</code> statements in a single Dockerfile. Each stage can use a different base image. The key insight: only the final stage becomes the production image \u2014 earlier stages are discarded.</p>
<p>Why they matter:</p>
<ul>
<li><strong>Size reduction</strong>: Build stage uses the full SDK (700MB+), but the final stage only includes the compiled output on a minimal runtime (100-150MB). 5-10x smaller images.</li>
<li><strong>Security</strong>: Source code, build tools, and development dependencies never ship to production. Smaller attack surface.</li>
<li><strong>Build reproducibility</strong>: The build environment is defined in the Dockerfile, not dependent on the CI agent's installed tools.</li>
<li><strong>Layer caching</strong>: Each stage caches independently, so changing source code does not invalidate the NuGet restore stage.</li>
</ul>`,
            interviewTip: 'Explain the separation of concerns: build-time needs (SDK, compiler, test tools) vs runtime needs (just the compiled binary + minimal runtime). Multi-stage keeps them in one Dockerfile but only ships the runtime. Quantify the improvement: 1.2GB SDK image down to 100-150MB runtime.',
            followUp: ['Can you copy files between stages?', 'How do you debug a multi-stage build that fails in an intermediate stage?', 'What is the difference between the SDK and runtime base images?'],
            seniorPerspective: 'Multi-stage is non-negotiable for production .NET containers. I also add a test stage between build and runtime that runs unit tests \u2014 if tests fail, the image is never produced. This makes the Dockerfile the single source of truth for the build pipeline.',
            architectPerspective: 'Multi-stage builds are a supply chain security control: by ensuring the SDK and source code never reach production, you eliminate whole categories of information leakage and attack surface. I enforce this via CI policies that reject single-stage Dockerfiles for production services.'
        },
        {
            question: 'What is the difference between CMD, ENTRYPOINT, and RUN in a Dockerfile?',
            difficulty: 'medium',
            answer: `<p>These three instructions serve fundamentally different purposes:</p>
<ul>
<li><strong>RUN</strong>: Executes a command <em>during the build</em> and commits the result as a new image layer. Used for installing packages, compiling code, creating directories. Runs once at build time.</li>
<li><strong>ENTRYPOINT</strong>: Defines the <em>executable</em> that runs when a container starts. Configures the container as an executable. Not easily overridden (requires <code>--entrypoint</code> flag).</li>
<li><strong>CMD</strong>: Provides <em>default arguments</em> to ENTRYPOINT, or the default command if no ENTRYPOINT is set. Easily overridden by passing arguments to <code>docker run</code>.</li>
</ul>
<p><strong>Best practice for production</strong>: Use ENTRYPOINT in exec form for the main process: <code>ENTRYPOINT ["dotnet", "MyApi.dll"]</code>. Use CMD for default arguments that can be overridden. Always prefer exec form (<code>["cmd", "arg"]</code>) over shell form (<code>cmd arg</code>) so signals (SIGTERM) reach the process directly for graceful shutdown.</p>`,
            interviewTip: 'The key distinction: RUN is build-time (creates layers), ENTRYPOINT+CMD are run-time (define what the container does). Then explain exec vs shell form: exec form runs the process directly (PID 1, receives signals), shell form wraps in /bin/sh -c (signal issues, extra process).',
            followUp: ['What happens if you specify both ENTRYPOINT and CMD?', 'Why does shell form cause graceful shutdown problems?', 'How do you override ENTRYPOINT at runtime?'],
            seniorPerspective: 'I always use exec form ENTRYPOINT for .NET apps: ENTRYPOINT ["dotnet", "MyApi.dll"]. Shell form wraps in /bin/sh which swallows SIGTERM, breaking graceful shutdown in Kubernetes (pod gets killed after terminationGracePeriodSeconds instead of shutting down cleanly).',
            architectPerspective: 'Correct ENTRYPOINT configuration is critical for orchestrated environments: Kubernetes sends SIGTERM for graceful shutdown during rolling updates. If the process is not PID 1 (shell form), it never receives the signal, leading to hard kills, dropped connections, and data inconsistency. I standardize exec-form ENTRYPOINT in our base Dockerfile templates.'
        },
        {
            question: 'How do you optimize Docker image size? What are the best practices for .NET applications?',
            difficulty: 'hard',
            answer: `<p>Docker image optimization for .NET follows a systematic approach:</p>
<ol>
<li><strong>Multi-stage builds</strong>: Separate SDK (build) from runtime. SDK adds 700MB+ that is unnecessary in production.</li>
<li><strong>Minimal base images</strong>: Use <code>aspnet:8.0-alpine</code> (~100MB) or <code>runtime-deps:8.0-jammy-chiseled</code> (~50MB) instead of the full Debian-based image (~200MB+).</li>
<li><strong>.dockerignore</strong>: Exclude bin/, obj/, .git/, node_modules/, tests/ to reduce build context and avoid copying unnecessary files.</li>
<li><strong>Layer ordering</strong>: Copy csproj files first, run restore, then copy source. Code changes only invalidate the final layer, not the restore cache.</li>
<li><strong>Combine RUN commands</strong>: Each RUN creates a layer. Combine related commands with <code>&&</code> and clean up in the same layer (<code>apt-get install && rm -rf /var/lib/apt/lists/*</code>).</li>
<li><strong>IL Trimming / AOT</strong>: For self-contained apps, <code>PublishTrimmed=true</code> removes unused code. NativeAOT can produce even smaller, faster-starting binaries.</li>
<li><strong>Pin versions</strong>: Use specific tags (not :latest) for reproducibility and smaller deltas on updates.</li>
</ol>`,
            interviewTip: 'Show a methodology: measure first (docker history/dive to find big layers), then fix the biggest wins (SDK in final stage, missing .dockerignore, wrong base image). Quantify: a typical .NET API goes from 1.2GB to 100-150MB with multi-stage + Alpine.',
            followUp: ['What is the difference between Alpine and chiseled images?', 'How does NativeAOT affect container size and startup?', 'What are the trade-offs of IL trimming?'],
            seniorPerspective: 'I enforce a size budget in CI: if an image exceeds a threshold (e.g., 200MB for an API), the build fails with a warning to investigate. The usual culprits are SDK leaking into the final stage, a missing .dockerignore, or an accidental COPY of test projects.',
            architectPerspective: 'Image size impacts operational velocity across the fleet: pull times during autoscaling, registry storage costs, network bandwidth during rollouts. At scale, shaving 100MB per image across 50 services and multiple environments adds up to meaningful infrastructure savings and faster scaling response times.'
        },
        {
            question: 'Explain Docker networking modes (bridge, host, overlay). When would you use each?',
            difficulty: 'hard',
            answer: `<p>Docker provides several network drivers for different isolation and performance needs:</p>
<ul>
<li><strong>Bridge (default)</strong>: Creates an isolated virtual network. Containers get internal IPs and communicate via Docker DNS (on user-defined bridges). Use port publishing (-p) to expose to the host. <em>Use for</em>: most single-host applications, local development, Compose services.</li>
<li><strong>Host</strong>: Container shares the host's network namespace directly \u2014 no isolation, no NAT, no port mapping. The container binds directly to host ports. <em>Use for</em>: performance-critical networking where NAT overhead matters, or when a container must see all host network traffic.</li>
<li><strong>Overlay</strong>: Spans multiple Docker hosts using VXLAN tunneling. Containers on different physical machines communicate as if on the same network. <em>Use for</em>: multi-host clustering (Docker Swarm), or when containers across hosts need direct L2 connectivity.</li>
<li><strong>None</strong>: No networking at all. <em>Use for</em>: batch jobs that need complete network isolation, or security-sensitive tasks.</li>
<li><strong>Macvlan</strong>: Assigns a real MAC address to a container, making it appear as a physical device on the network. <em>Use for</em>: legacy applications that need to be directly addressable on the physical network.</li>
</ul>`,
            interviewTip: 'Bridge is the default and correct choice for 95% of cases. Host mode sacrifices isolation for performance. Overlay enables multi-host communication. Structure your answer by trade-off: isolation vs performance vs multi-host reach.',
            followUp: ['Why does the default bridge not provide DNS resolution but user-defined bridges do?', 'What is the performance overhead of bridge networking vs host?', 'How does overlay networking work under the hood (VXLAN)?'],
            seniorPerspective: 'I use user-defined bridge networks for all Compose-based development (DNS by service name, network isolation between stacks). In production Kubernetes, the CNI plugin (Calico, Cilium) handles networking, which is conceptually similar to overlay but more sophisticated with network policies.',
            architectPerspective: 'Network mode choice is a security and performance decision. I segment by tier: frontend containers on one network, backend on another, databases on a third \u2014 mimicking cloud VPC subnets. This limits blast radius: a compromised frontend container cannot directly reach the database network.'
        },
        {
            question: 'How do you handle secrets in Docker? Compare build-time secrets, runtime secrets, and Docker Secrets.',
            difficulty: 'advanced',
            answer: `<p>Secrets in Docker require different handling depending on when they are needed:</p>
<ul>
<li><strong>Build-time secrets (BuildKit)</strong>: For secrets needed during image build (private NuGet feed credentials, SSH keys for private repos). Use <code>--mount=type=secret</code> in RUN instructions \u2014 the secret is available during that layer but never persisted in the image. <em>Never use ARG/ENV for secrets \u2014 they are baked into layers.</em></li>
<li><strong>Runtime secrets (environment/files)</strong>: For secrets needed when the container runs (connection strings, API keys). Pass via environment variables or mounted files. Environment variables are visible in <code>docker inspect</code> and process listings \u2014 mounted files are slightly more secure.</li>
<li><strong>Docker Swarm Secrets</strong>: Encrypted at rest in the Swarm raft log, delivered to containers as in-memory files at <code>/run/secrets/</code>. Only available to services that are explicitly granted access.</li>
<li><strong>External secret managers</strong>: Vault, AWS Secrets Manager, Azure Key Vault. The container fetches secrets at startup via SDK/sidecar. Best practice for production \u2014 centralized, audited, rotatable.</li>
</ul>
<p><strong>Never</strong>: COPY secret files into the image, use ARG for secrets (visible in history), or hardcode in Dockerfiles.</p>`,
            interviewTip: 'The critical point: anything in a Dockerfile ARG, ENV, or COPY becomes part of the image layers and is extractable by anyone with the image. BuildKit secrets and runtime injection are the two safe approaches. Mention docker history showing ARG values as the proof of why ARGs are unsafe.',
            followUp: ['Why are ARG values visible in docker history?', 'How does BuildKit --mount=type=secret work?', 'How do you rotate secrets without redeploying containers?'],
            seniorPerspective: 'My rules: (1) never pass secrets as build ARGs (they leak into image layers), (2) use BuildKit --mount=type=secret for build-time needs like private feed credentials, (3) inject at runtime via the orchestrator (K8s Secrets, Vault sidecar) so images are secret-free and portable across environments.',
            architectPerspective: 'Secret management is a platform concern, not an application concern. I design the platform to inject secrets at runtime via a standard mechanism (K8s External Secrets syncing from Vault) so application teams never handle raw secrets in their Dockerfiles or CI pipelines. The secret lifecycle (creation, rotation, revocation, audit) is centralized and automated.'
        }
    ],
    sections_mermaid: [
        {
            title: 'Docker Image Layering & Multi-Stage Build',
            content: `<p>How Docker image layers stack and how multi-stage builds separate build from runtime.</p>`,
            diagram: `graph TD
    subgraph "Multi-Stage Dockerfile"
        subgraph "Stage 1: Build (SDK ~800MB)"
            B1[FROM dotnet/sdk:8.0]
            B2[COPY *.csproj + restore]
            B3[COPY source + publish]
        end
        subgraph "Stage 2: Runtime (~100MB)"
            R1[FROM dotnet/aspnet:8.0-alpine]
            R2[COPY --from=build /app/publish]
            R3[USER nonroot]
            R4[ENTRYPOINT dotnet MyApi.dll]
        end
    end

    B3 -->|COPY --from=build| R2

    subgraph "Image Layers (Final)"
        L1[Base OS Layer - Alpine]
        L2[ASP.NET Runtime Layer]
        L3[Application Layer]
        L4[Writable Container Layer]
    end

    R1 --> L1
    R1 --> L2
    R2 --> L3
    L3 -.->|Container Start| L4

    style B1 fill:#ff9800
    style R1 fill:#4caf50
    style L4 fill:#e3f2fd,stroke-dasharray: 5 5`,
            diagramType: 'mermaid'
        }
    ]
});
