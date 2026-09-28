# PeerNexus

A responsive campus mentorship and collaboration app with a React/Vite frontend and an Express API.

## Start locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and add Firebase web-app settings to enable Firebase initialization. The app remains usable in demo mode without credentials.
3. Run `npm run dev` and open the Vite URL printed in the terminal. The API runs on port 4000.
4. Run `npm run build` to create the production frontend bundle. Run `npm start` to start the API.

The AI endpoints are intentionally stubs; they validate input and return predictable responses without sending prompts to an external provider. OAuth, production persistence, and actual AI model calls require provider credentials and server-side integration.
