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

## Agentic AI & AI Features
famio integrates a sophisticated multi-modal AI Agent system designed to enhance the family social experience, powered by state-of-the-art agentic frameworks.

### Agentic Frameworks & Infrastructure
- **LangGraph**: Used to orchestrate autonomous agent behavior, state definition, and autonomous "Thinking -> Acting -> Observing" loops. 
- **LangChain**: Utilized for tool integration and execution, feeding results back into the agent's state.
- **Model Context Protocol (MCP)**: The system is designed to be MCP-ready, allowing tools to be structured and modular so the agents can dynamically access external data sources and capabilities via MCP servers.
- **RAG & Pinecone Vector DB**: Provides agents with context-awareness and knowledge retrieval across the platform's data.

### Supervisor & Worker Agents (LangGraph Architecture)
The autonomous loops in the platform follow a Supervisor-Worker pattern:
- **The Supervisor Agent (LLM Reasoning Core)**: Responsible for analyzing the user's prompt, maintaining the conversation state (memory), and deciding which tools or actions are necessary. It acts as the intelligent orchestrator, delegating sub-tasks to the appropriate tools or worker nodes.
- **The Worker Agents (Tool Nodes)**: Responsible for executing the specific tasks delegated by the Supervisor (e.g., querying Tavily for internet search, fetching RAG context from Pinecone). They return their execution results back to the Supervisor, allowing it to synthesize a final response or take further action.

### Multi-Modal AI Agents
The platform features specialized agent personas tailored for different tasks:
- **General Assistant**: A helpful, everyday AI for answering questions and assisting with general platform tasks.
- **Tutor**: Simplifies complex concepts, optimized for kids and students.
- **Executive**: Provides concise, actionable summaries for busy professionals.
- **Biographer**: An interactive agent that conducts friendly interviews to capture life stories and preserve important family memories.
- **Architect**: Focused on detailed technical or structured problem solving.

### Agentic Features & Tooling
- **Tavily Search Tool**: Gives agents real-time internet access to fetch up-to-date information, current events, and news.
- **Magic Draft & Emotional Intelligence**: A built-in AI tool that instantly transforms rough ideas into polished posts with user-controlled emotional tones (e.g., Enthusiastic, Healing Energy, Storyteller, Witty).
- **Contextual Ask AI**: Allows users to select any post in their feed and ask the AI Assistant for specific context, summaries, or translations.
- **Multi-Model Support**: Dynamically routes tasks to powerful models including OpenAI GPT-4o / GPT-5.2, Anthropic Claude, and Google Gemini based on the requirements.

## Tech Stack
- Next.js 14 (App Router)
- Firebase (Auth, Firestore, Storage, Messaging)
- TypeScript
- Tailwind CSS
- Workbox (PWA)

## Deployment
Hosted on Firebase App Hosting

Last updated: January 25, 2026