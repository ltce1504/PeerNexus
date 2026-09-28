import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const port = Number(process.env.PORT) || 4000;
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "peernexus-api", aiProvider: process.env.OPENAI_API_KEY ? "openai-ready" : process.env.GEMINI_API_KEY ? "gemini-ready" : "stub" });
});

app.post("/api/mentors/match", (request, response) => {
  const query = request.body?.query;
  if (typeof query !== "string" || query.trim().length < 2 || query.length > 500) {
    return response.status(400).json({ error: "Provide a search prompt between 2 and 500 characters." });
  }
  const normalized = query.toLowerCase();
  const skills = ["react", "typescript", "system design", "machine learning", "python", "mlops", "product design", "figma", "portfolio"];
  const matchedSkills = skills.filter((skill) => normalized.includes(skill.split(" ")[0]));
  response.json({ query: query.trim(), matchedSkills, rankedMentorIds: matchedSkills.includes("machine learning") || matchedSkills.includes("python") ? [2, 1, 3] : matchedSkills.includes("figma") || matchedSkills.includes("product design") ? [3, 1, 2] : [1, 2, 3], provider: "stub" });
});

app.post("/api/ai/roadmap", (request, response) => {
  const goal = request.body?.goal;
  if (typeof goal !== "string" || goal.trim().length < 3 || goal.length > 1000) {
    return response.status(400).json({ error: "Provide a goal between 3 and 1,000 characters." });
  }
  response.json({
    goal: goal.trim(),
    provider: process.env.OPENAI_API_KEY ? "openai-stub" : process.env.GEMINI_API_KEY ? "gemini-stub" : "stub",
    roadmap: [
      { title: "Find your starting point", timeframe: "This week" },
      { title: "Learn by building", timeframe: "Weeks 2–3" },
      { title: "Share what you've learned", timeframe: "Week 4" },
    ],
  });
});

app.post("/api/safety/reflection", (request, response) => {
  const reflection = request.body?.reflection;
  if (typeof reflection !== "string" || reflection.trim().length < 20 || reflection.length > 2000) {
    return response.status(400).json({ error: "A reflection between 20 and 2,000 characters is required." });
  }
  response.status(202).json({ status: "received", moderation: "human-review-required" });
});

app.use((error, _request, response, _next) => {
  console.error("API request failed:", error);
  response.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(port, () => {
  console.log(`PeerNexus API listening on http://localhost:${port}`);
});
