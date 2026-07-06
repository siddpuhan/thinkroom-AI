# ThinkRoom AI

Tagline:
AI-native collaborative workspace where AI behaves like a teammate instead of a chatbot.

## 1. Project Overview
ThinkRoom AI is an innovative, real-time collaboration environment designed to integrate artificial intelligence seamlessly into team workflows. Instead of acting as a standalone chatbot, the AI functions as an active participant—a teammate that extracts tasks, logs decisions, and maintains the workspace in real time. 

## 2. Features
* Realtime collaborative rooms
* AI personas
* AI task extraction
* AI workspace
* Shadow AI note-taking
* Decision intelligence
* Documentation generation
* Summaries
* Realtime sync

## 3. Architecture
ThinkRoom AI employs a robust and scalable architecture, utilizing a modern web stack. It uses a Next.js frontend, communicating via Socket.IO with an Express.js Node backend. The backend interfaces with PostgreSQL for data persistence and leverages the Gemini and OpenAI APIs for AI extraction and persona pipelines.

## 4. Tech Stack
* **Frontend:** Next.js, Framer Motion, Zustand, Auth0 (Auth)
* **Backend:** Node.js, Express, Socket.IO
* **Database:** PostgreSQL
* **AI Integration:** Gemini API, OpenAI API

## 5. Installation

Clone the repository:
```bash
git clone https://github.com/your-username/thinkroom-ai.git
cd thinkroom-ai
```

Install dependencies:
```bash
pnpm install
```

## 6. Environment Variables
Create a `.env.local` file in the root directory:
```env
APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_SECRET=your_session_secret
AUTH0_AUDIENCE=your_api_audience
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

## 7. Running Locally

Start the backend server:
```bash
cd server
npm run dev
```

Start the frontend application:
```bash
# In the root directory
npm run dev
```

## 8. Future Roadmap
* Enhanced AI-driven project management
* Extended integration with external tools (GitHub, Jira, etc.)
* Customizable AI personas for distinct team roles
* Advanced metrics and analytics for team productivity

## 9. Screenshots placeholder
[Placeholder for application screenshots showing the workspace, AI task extraction, and decision intelligence features.]

## 10. Why ThinkRoom AI is different
Unlike conventional tools where AI is siloed in a separate chat window, ThinkRoom AI embeds intelligence into the collaboration layer. The Shadow AI actively listens, analyzes conversations, and synthesizes actionable insights automatically. Teams can focus on brainstorming and problem-solving, while the AI teammate takes care of documentation, task assignment, and capturing critical decisions.
