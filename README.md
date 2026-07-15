# Interview Handbook

A comprehensive, offline-first interview preparation handbook covering software engineering from fundamentals to technical leadership. Built as a pure static site (HTML + CSS + JS) with no build tools or backend required.

## Live Demo

**[View the Handbook](https://YOUR_USERNAME.github.io/interview-handbook/)**

## Features

- **17-Level Curriculum** — From computing basics (Level 0) to career mastery (Level 16)
- **100+ Topics** — C#, .NET, Angular, Design Patterns, Architecture, SQL, Cloud, DevOps, Security, AI, System Design, Leadership
- **500+ Interview Questions** — Spanning junior to architect levels with detailed explanations and code examples
- **Offline-First PWA** — Service worker caches everything for study without internet
- **Mermaid Diagrams** — Architecture flows, design patterns, and system design visuals
- **Progress Tracking** — Track completed topics and interview readiness percentage
- **Search** — Full-text search across all topics and questions (Ctrl+K)
- **Dark/Light Theme** — Easy on the eyes for late-night study sessions
- **Bookmarks** — Save questions for quick review
- **Keyboard Navigation** — Full keyboard shortcut support
- **Zero Dependencies** — No npm, no build step, no framework. Just open `index.html`

## Curriculum Overview

| Level | Topic | Focus |
|-------|-------|-------|
| 0 | Prerequisites | Binary, Boolean Logic, OS, Networking |
| 1 | C# Fundamentals | Types, Collections, LINQ, Async, Generics, Memory |
| 2 | Advanced .NET | ASP.NET Core, Middleware, Auth, SignalR, Caching |
| 3 | Engineering Principles | SOLID, Clean Code, Refactoring, Testing |
| 4 | Design Patterns | GoF Creational, Structural, Behavioral + Enterprise |
| 5 | Architecture | DDD, Microservices, Event-Driven, Distributed Systems |
| 6 | SQL Server | Indexes, Advanced Queries, Concurrency, EF Core, Dapper |
| 7 | Angular | Components, Signals, RxJS, Routing, State, Forms, Testing |
| 8 | Cloud | Azure (Compute, Data, Security, Monitoring), AWS |
| 9 | DevOps | CI/CD, Docker, Kubernetes, IaC, Observability |
| 10 | Security | OWASP, Auth, Encryption, Secure Coding, Zero Trust |
| 11 | Performance | Caching, DB Perf, Frontend Perf, Load Testing |
| 12 | AI & LLMs | Prompt Engineering, RAG, Agents, Responsible AI |
| 13 | System Design | Netflix, Uber, WhatsApp, Payment, YouTube + Framework |
| 14 | Production Engineering | Incidents, Reliability, Chaos, Feature Flags |
| 15 | Leadership | Technical Strategy, Team Building, Communication |
| 16 | Career & Interview Mastery | Behavioral, System Design, Coding Interviews |

## Quick Start

### Option 1: Open Locally
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/interview-handbook.git

# Open in browser (no server needed for basic use)
open interview-handbook/index.html

# OR use any static server for full PWA/offline support
cd interview-handbook
npx serve .
# or
python -m http.server 8080
```

### Option 2: GitHub Pages
The site deploys automatically via GitHub Pages. Push to `main` and it's live.

## Project Structure

```
interview-handbook/
├── index.html              # Single-page app shell
├── sw.js                   # Service worker (offline caching)
├── manifest.webmanifest    # PWA manifest
├── .nojekyll               # Bypass Jekyll on GitHub Pages
├── css/
│   ├── tokens.css          # Design tokens (colors, spacing, fonts)
│   ├── base.css            # Reset and base styles
│   ├── layout.css          # App shell layout (sidebar, header, content)
│   ├── components.css      # Reusable component styles
│   └── pages.css           # Page-specific styles
├── js/
│   ├── app.js              # Main app controller
│   ├── sitemap.js          # Navigation structure (17 levels)
│   ├── page-loader.js      # Dynamic content renderer
│   ├── lazy-loader.js      # On-demand data file loading
│   ├── search.js           # Full-text search
│   ├── navigation.js       # Sidebar navigation
│   ├── theme.js            # Dark/light theme toggle
│   ├── progress.js         # Topic completion tracking
│   ├── keyboard.js         # Keyboard shortcuts
│   ├── scrollspy.js        # Table of contents highlight
│   ├── quiz.js             # Knowledge check component
│   ├── code-blocks.js      # Syntax highlighting + copy
│   └── icons.js            # SVG icon library
├── data/
│   ├── page-data.js        # Central data registry
│   ├── *.js                # Root-level topic data files
│   └── levels/
│       ├── _template.js    # Template for new topics
│       ├── level-00/       # Prerequisites (5 topics)
│       ├── level-03/       # Clean Code (3 topics)
│       ├── level-04/       # Enterprise Patterns (2 topics)
│       ├── level-05/       # Architecture + Microservices (16 topics)
│       ├── level-06/       # Data Access (2 topics)
│       ├── level-07/       # Angular Advanced (3 topics)
│       ├── level-09/       # Infrastructure (2 topics)
│       ├── level-10/       # Security Advanced (3 topics)
│       ├── level-11/       # Performance Advanced (3 topics)
│       ├── level-12/       # AI Applications (2 topics)
│       ├── level-13/       # System Design Skills (2 topics)
│       ├── level-14/       # Production Engineering (5 topics)
│       ├── level-15/       # Leadership Advanced (3 topics)
│       └── level-16/       # Career & Interviews (5 topics)
└── vendor/
    └── mermaid.min.js      # Vendored Mermaid.js (offline diagrams)
```

## How to Contribute Content

1. Copy `data/levels/_template.js` to the appropriate level folder
2. Register the topic in `js/sitemap.js` under the correct level and group
3. Fill in sections following the 16-section format (see template)
4. Add 8-15 interview questions spanning junior to architect levels
5. Include at least 2 Mermaid diagrams for visual topics
6. No build step — just save and refresh

## Deploying to GitHub Pages

1. Create a new GitHub repository
2. Push this code to the `main` branch
3. Go to Settings > Pages > Source: Deploy from branch > `main` / `/ (root)`
4. The `.nojekyll` file ensures GitHub serves all files directly
5. Your handbook is live at `https://YOUR_USERNAME.github.io/interview-handbook/`

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Markup | HTML5 | Semantic, accessible, no templating needed |
| Styling | CSS3 (Custom Properties) | Design tokens, no preprocessor needed |
| Logic | Vanilla JS (ES2020) | No framework dependency, fast load |
| Diagrams | Mermaid.js (vendored) | Offline architecture diagrams |
| Offline | Service Worker | PWA-grade offline support |
| Hosting | GitHub Pages | Free, zero-config static hosting |

## Offline Usage

Once you visit the site, the service worker caches:
- The full app shell (HTML, CSS, JS)
- Topic data files as you browse them (stale-while-revalidate)
- Mermaid.js library

After first visit, the entire handbook works without internet. New topics cache automatically as you open them.

## License

MIT
