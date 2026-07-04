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
ThinkRoom AI employs a robust and scalable architecture, utilizing a modern web stack. It uses a Progressive Web App (PWA) frontend with React and Vite, communicating via Socket.IO with an Express.js Node backend. The backend interfaces with PostgreSQL for data persistence and leverages the Groq and OpenAI APIs for AI extraction and persona pipelines.

## 4. Tech Stack
* **Frontend:** React, Vite, Framer Motion, Zustand, Clerk (Auth)
* **Backend:** Node.js, Express, Socket.IO
* **Database:** PostgreSQL
* **AI Integration:** Groq API, OpenAI API

## 5. Installation

Clone the repository:
```bash
git clone https://github.com/your-username/thinkroom-ai.git
cd thinkroom-ai
```

Install dependencies for both frontend and backend:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

## 6. Environment Variables
Create a `.env` file in the root directory and add the necessary variables:
```env
VITE_SOCKET_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
DATABASE_URL=your_postgresql_connection_string
GROQ_API_KEY=your_groq_api_key
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
