# famio - Family Social Network

Version: 2.0.0 - Progressive Web App Edition

## Features
- Progressive Web App (PWA) with offline support
- Push Notifications via Firebase Cloud Messaging
- Share Target - receive content from other apps
- Background Sync for offline actions
- App Shortcuts for quick access
- Real-time messaging and AI chat
- Family connections and events
- Live streaming and gallery

## 🤖 Famio AI OS v2 — Agentic Intelligence Platform

Famio integrates an autonomous, multi-agent operating system powered by **GPT-5.6 Luna**, the OpenAI Agents SDK, Model Context Protocol (MCP), and three-tier memory architecture.

### 🛡️ Agent Guardrails & Security Policies
- **Group Posting Rights**: Agents are granted read, write, and edit access to Famio groups to assist users with drafting, formatting, and publishing group content when explicitly requested.
- **Mandatory User Confirmation Before Posting**: Before publishing any content to any group, agents MUST request explicit user confirmation to prevent unauthorized broadcasts.
- **NO Post or Comment Deletion Access**: NO agent has deletion rights. Agents CANNOT delete any posts, comments, media, or groups on Famio.
- **NO Database Administrative/Deletion Access**: Agents do NOT have database modification or deletion privileges. Database collections cannot be altered, dropped, or wiped by agents.

### 🧠 Agent Frameworks & Core Architecture
1. **OpenAI Agents SDK**: Orchestrates agent handoffs, context preservation, dynamic routing, and autonomous task execution.
2. **LangGraph & LangChain**: Autonomous "Thinking -> Acting -> Observing" feedback loops and state management for multi-step tasks.
3. **Model Context Protocol (MCP)**: Dynamic tool integration layer allowing agents to query tools (Tavily search, Vector DB RAG, Group Post Publishing) as structured server endpoints.
4. **Three-Tier Memory Architecture**:
   - **L1 Working Memory**: Active task context managed inside OpenAI Agent SDK sessions.
   - **L2 High-Speed Cache**: Redis database for low-latency session state and prompt caching.
   - **L3 Long-Term Memory**: Pinecone Vector DB for dense semantic retrieval (1536-dimensional `text-embedding-3-small` embeddings).

### 👥 25 Specialized AI Agent Personas
Every user request is analyzed by the **Master Planner Agent** and routed to one or more specialized agents:
1. **Master Planner Agent**: Decomposes user requests into subtasks and manages multi-agent coordination.
2. **Research Agent**: Multi-domain research with evidence scoring, citations, and summaries.
3. **Writing Agent**: Publication-ready whitepapers, essays, speeches, and articles.
4. **Coding Agent**: Production-grade software development across Python, TypeScript, Go, SQL, C++, and Rust.
5. **Data Science Agent**: Statistics, analytics, ML model design, and PyTorch/Pandas workflows.
6. **Finance Agent**: DCF models, market analysis, stock valuation, crypto, and portfolio risk.
7. **Legal Agent**: Regulatory compliance, contract breakdown, and policy analysis (informational).
8. **Medical Research Agent**: PubMed, clinical trials, and medical literature synthesis (informational).
9. **Education Agent**: Step-by-step tutoring, lesson plans, and custom flashcards.
10. **Math Agent**: Calculus, statistics, linear algebra, and symbolic proofs.
11. **Business Strategy Agent**: SWOT frameworks, competitive analysis, and GTM strategy.
12. **Startup Advisor Agent**: Pitch decks, MVP roadmaps, VC strategy, and unit economics.
13. **Marketing Agent**: SEO/SEM campaigns, content funnels, and growth analytics.
14. **UX/UI Design Agent**: Design systems, wireframes, user flows, and accessibility audit.
15. **DevOps Agent**: Docker, Kubernetes, CI/CD, Terraform, and cloud scaling.
16. **AI Engineer Agent**: OpenAI Agent SDK, RAG pipelines, and MCP server development.
17. **Security Agent**: Threat modeling, OWASP risk audit, encryption, and auth protocols.
18. **QA Agent**: Test plan generation, edge case validation, and regression suites.
19. **Reflection Agent**: Evaluates agent outputs for hallucinations, logic gaps, and quality.
20. **Verification Agent**: Cross-references claims against multi-source evidence.
21. **Memory Agent**: Manages long-term Pinecone vector embeddings and Redis cache.
22. **Tool Selection Agent**: Selects optimal MCP tools and API parameters per subtask.
23. **Automation Agent**: Builds multi-step workflow automation scripts.
24. **Knowledge Graph Agent**: Links entity relationships between people, projects, and documents.
25. **Multi-Agent Debate Agent**: Facilitates structured debates between agents to refine answers.

---

## Tech Stack
- **Primary AI Model**: OpenAI **GPT-5.6 Luna**
- **Core Framework**: Next.js 16 (App Router & Server Actions)
- **Backend & Database**: Firebase Admin (Firestore, Auth, Storage, Messaging)
- **Vector DB**: Pinecone (`text-embedding-3-small`, 1536-dim)
- **Cache DB**: Redis Database
- **Styling & PWA**: Tailwind CSS, Workbox PWA

Developed by Chancellor Minus @ ChanceTEK | Founder & CEO
Last updated: July 2026