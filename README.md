# PeerNexus

A responsive campus mentorship and collaboration app with a React/Vite frontend and an Express API.

## Start locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`. Set `GEMINI_API_KEY` to a Google AI Studio key to enable live Gemini responses. `GEMINI_MODEL` defaults to `gemini-2.5-flash`. The key stays on the Express server and is never exposed to the browser.
3. Optional: add Firebase web-app settings to enable Firebase Auth. Without Firebase, use the Student, Faculty, or Admin team-demo buttons on `/login`; demo accounts and workspace changes are saved in the browser.
4. Run `npm run dev` and keep that terminal open while using the site. Vite serves the UI and Express runs the API on port 4000. If that process stops, the browser reports `ERR_CONNECTION_REFUSED`; restart `npm run dev` to restore the site.
5. Run `npm run build` to create the production frontend bundle. Run `npm start` to start the API.

Profilify analyzes the actual transcript and activity notes entered in its session workspace. With Gemini configured, it sends those notes to the selected Gemini model and generates a tailored summary, next steps, and three session-specific quiz questions. If no key is configured or Gemini is temporarily unavailable, a topic-aware local analysis is used and its source is shown in the UI. Mentor matches, demo accounts, posts, votes, requests, notifications, feedback, and learning progress use local demo data; deploy with Firebase/Firestore security rules and a configured OAuth provider before using real student accounts or sensitive records.

## Deploy to Render

Create a Render **Web Service** from this repository and leave the Root Directory blank. Use:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`

The Express server serves both the built React app and the `/api` endpoints. Set `GEMINI_API_KEY` in the Render service environment to enable Gemini; without it, Profilify uses its local contextual analysis. Firebase and LinkedIn authentication require their own provider configuration before production use.
