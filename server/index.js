import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT) || 4000;
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const distPath = fileURLToPath(new URL("../dist", import.meta.url));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: "64kb" }));

function parseJsonText(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("AI provider returned an invalid response.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateWithGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) return null;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(25_000),
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`Gemini request failed (${response.status}):`, detail.slice(0, 500));
    throw new Error("Gemini is temporarily unavailable. Your personalized local analysis is shown instead.");
  }
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
  if (!text) throw new Error("Gemini returned an empty response.");
  return parseJsonText(text);
}

function inferTopic(text, activities) {
  const content = `${text} ${activities.join(" ")}`.toLowerCase();
  const topics = [
    { name: "React state management", words: ["react", "state", "component", "frontend", "hook"] },
    { name: "machine learning workflows", words: ["machine learning", "ml", "model", "dataset", "training", "python"] },
    { name: "product design and prototyping", words: ["design", "figma", "prototype", "portfolio", "ux", "user"] },
    { name: "data structures and algorithms", words: ["algorithm", "dsa", "graph", "dynamic programming", "complexity"] },
    { name: "recursion and base cases", words: ["recursion", "recursive", "factorial", "base case"] },
    { name: "career and interview preparation", words: ["interview", "resume", "internship", "career", "job"] },
    { name: "full-stack development", words: ["api", "backend", "database", "full-stack", "full stack", "server"] },
  ];
  return topics.map((topic) => ({ ...topic, score: topic.words.filter((word) => content.includes(word)).length }))
    .sort((a, b) => b.score - a.score)[0];
}

function buildLocalAnalysis(transcript, activities) {
  const topic = inferTopic(transcript, activities);
  const sentences = transcript.split(/[.!?\n]+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 18);
  const meaningfulActivities = activities.filter((activity) => activity.trim().length > 2);
  const stopWords = new Set(["and", "the", "for", "not", "but", "you", "are", "was", "were", "can", "how", "why", "all", "any", "our", "out", "get", "got", "has", "had", "its", "his", "her", "she", "him", "them", "than", "then", "too", "very", "into", "from", "with", "have", "this", "that", "what", "when", "which", "their", "there", "about", "would", "could", "should", "because", "during", "using", "today", "first", "after", "before", "were", "they", "your", "will", "just", "need", "still", "also", "tried", "work", "works", "working", "mentee", "mentor", "session", "learn", "learning"]);
  const words = `${transcript} ${activities.join(" ")}`.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || [];
  const wordCounts = new Map();
  for (const word of words) {
    if (!stopWords.has(word) && !/^\d+$/.test(word)) wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }
  const keywords = [...wordCounts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([word]) => word);
  const focus = topic.score ? topic.name : keywords.join(", ") || "the ideas discussed";
  const mentorEvidence = sentences.find((sentence) => /\b(mentor|try|use|start|because|first|remember|key|important|means|helps)\b/i.test(sentence)) || sentences[0];
  const topicHash = [...focus].reduce((total, character) => total + character.charCodeAt(0), 0);
  const withAnswer = (question, correct, distractors, explanation) => {
    const answer = topicHash % 3;
    const options = [...distractors];
    options.splice(answer, 0, correct);
    return { question, options, answer, explanation };
  };
  const observations = [
    mentorEvidence ? `Session evidence: “${mentorEvidence.slice(0, 160)}${mentorEvidence.length > 160 ? "…" : ""}.”` : `The activity log shows work focused on ${focus}.`,
    meaningfulActivities.length
      ? `Practice evidence: ${meaningfulActivities.slice(0, 2).join("; ")}.`
      : "Add the mentee's practice activities to make the review more specific.",
  ];
  const cleanActivities = meaningfulActivities.length ? meaningfulActivities : [`Revisit the key ideas in ${focus}`, `Complete one small exercise applying ${focus}`];
  return {
    title: `Session reflection: ${focus}`,
    summary: `This conversation focused on ${focus}.${mentorEvidence ? ` The mentor's explanation was: “${mentorEvidence.slice(0, 180)}${mentorEvidence.length > 180 ? "…" : ""}.”` : ""}${meaningfulActivities.length ? ` The mentee recorded ${meaningfulActivities.length} concrete practice ${meaningfulActivities.length === 1 ? "activity" : "activities"}.` : " No hands-on activities were recorded yet."}`,
    strengths: observations,
    nextSteps: cleanActivities.slice(0, 3).map((activity, index) => ({
      title: index === 0 ? `Revisit ${focus}` : `Practice: ${activity.slice(0, 85)}`,
      detail: activity,
      timeframe: index === 0 ? "Today · 15 min" : "This week · 30 min",
    })),
    quiz: [
      withAnswer(
        `What did the mentor emphasize while discussing ${focus}?`,
        mentorEvidence ? mentorEvidence.slice(0, 115) : `Work through a small example involving ${focus}`,
        [`Ignore the ${focus} question and change topics`, "Assume the approach works without checking"],
        "This answer is drawn from the mentor's words in the supplied conversation.",
      ),
      withAnswer(
        "Which hands-on activity did the mentee actually record?",
        (meaningfulActivities[0] || cleanActivities[0]).slice(0, 115),
        ["No practice was attempted", "The topic was postponed without trying an example"],
        "This answer comes directly from the activity notes supplied for the session.",
      ),
      withAnswer(
        `Which concrete detail from the conversation should guide the next ${focus} practice?`,
        (meaningfulActivities.at(-1) || sentences.at(-1) || `Revisit ${focus} with a worked example`).slice(0, 115),
        ["Skip checking the result", "Repeat the session without trying the idea"],
        "Use the recorded final activity or discussion to choose the next practice step.",
      ),
    ],
    source: "local-contextual",
  };
}

function validateAnalysis(result) {
  if (!result || typeof result.summary !== "string" || !Array.isArray(result.quiz) || result.quiz.length < 3) {
    throw new Error("AI response did not include a session summary and three quiz questions.");
  }
  return {
    title: typeof result.title === "string" ? result.title.slice(0, 120) : "Mentorship session reflection",
    summary: result.summary.slice(0, 1200),
    strengths: Array.isArray(result.strengths) ? result.strengths.filter((value) => typeof value === "string").slice(0, 4) : [],
    nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps.filter((step) => typeof step?.title === "string" && typeof step?.detail === "string").slice(0, 4) : [],
    quiz: result.quiz.slice(0, 3).map((question) => {
      if (typeof question.question !== "string" || !Array.isArray(question.options) || question.options.length < 2 || !Number.isInteger(question.answer) || !question.options[question.answer]) {
        throw new Error("AI response included a malformed quiz question.");
      }
      return {
        question: question.question.slice(0, 300),
        options: question.options.filter((option) => typeof option === "string").slice(0, 4).map((option) => option.slice(0, 180)),
        answer: question.answer,
        explanation: typeof question.explanation === "string" ? question.explanation.slice(0, 300) : "Review the session notes and try again.",
      };
    }),
  };
}

async function analyzeSession(transcript, activities) {
  const local = buildLocalAnalysis(transcript, activities);
  if (!process.env.GEMINI_API_KEY) return { ...validateAnalysis(local), provider: "local-contextual" };

  const prompt = `You are Profilify, a careful peer-mentorship learning assistant. Analyze ONLY the supplied session and mentee activity; do not invent facts, claim mastery without evidence, or repeat generic advice. Make every output specific to the transcript. Return valid JSON with exactly these fields: title (string), summary (string), strengths (array of 1-4 short strings grounded in evidence), nextSteps (array of 2-4 objects with title, detail, timeframe), quiz (exactly 3 objects with question, options array of 3 short strings, answer zero-based integer, explanation grounded in the session). Questions should test different ideas actually discussed, not generic definitions.

SESSION TRANSCRIPT:
${transcript || "(No transcript supplied)"}

MENTEE ACTIVITIES:
${activities.length ? activities.map((activity) => `- ${activity}`).join("\n") : "(No activities supplied)"}`;

  const generated = await generateWithGemini(prompt);
  return { ...validateAnalysis(generated), provider: "gemini", model };
}

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "peernexus-api",
    aiProvider: process.env.GEMINI_API_KEY ? "gemini" : "local-contextual",
    model: process.env.GEMINI_API_KEY ? model : null,
  });
});

app.post("/api/ai/session-analysis", async (request, response, next) => {
  const { transcript, activities } = request.body || {};
  if (typeof transcript !== "string" || transcript.length > 12_000 || !Array.isArray(activities) || activities.length > 20 || activities.some((activity) => typeof activity !== "string" || activity.length > 500)) {
    return response.status(400).json({ error: "Provide a transcript of up to 12,000 characters and up to 20 activity notes." });
  }
  if (!transcript.trim() && activities.length === 0) {
    return response.status(400).json({ error: "Add a session conversation or at least one mentee activity before analysis." });
  }
  try {
    const analysis = await analyzeSession(transcript.trim(), activities.map((activity) => activity.trim()).filter(Boolean));
    response.json(analysis);
  } catch (error) {
    if (process.env.GEMINI_API_KEY) {
      console.warn("Using contextual local analysis because Gemini could not complete the request:", error.message);
      const fallback = validateAnalysis(buildLocalAnalysis(transcript.trim(), activities));
      return response.json({ ...fallback, provider: "local-contextual-fallback", notice: error.message });
    }
    next(error);
  }
});

app.post("/api/ai/roadmap", async (request, response, next) => {
  const { goal, activities = [] } = request.body || {};
  if (typeof goal !== "string" || goal.trim().length < 3 || goal.length > 1000 || !Array.isArray(activities) || activities.length > 12 || activities.some((activity) => typeof activity !== "string")) {
    return response.status(400).json({ error: "Provide a goal between 3 and 1,000 characters and up to 12 activity notes." });
  }
  const topic = inferTopic(goal, []);
  const focus = topic.score ? topic.name : goal.trim();
  const local = {
    goal: goal.trim(),
    title: `A practical path toward ${focus}`,
    summary: `Start from your goal — “${goal.trim().slice(0, 220)}” — and build evidence through small, reviewable milestones.`,
    roadmap: [
      { title: `Map your current ${focus} skills`, detail: `List what you have already tried related to ${focus} and choose one specific gap to work on.`, timeframe: "This week" },
      { title: `Build a small ${focus} project`, detail: "Apply the new idea in a focused project, then record what worked and where you got stuck.", timeframe: "Next 1–2 weeks" },
      { title: "Review the evidence with a peer", detail: "Share your result with a mentor, ask one focused question, and update your next goal from their feedback.", timeframe: "After your first project" },
    ],
  };
  if (!process.env.GEMINI_API_KEY) return response.json({ ...local, provider: "local-contextual" });

  try {
    const result = await generateWithGemini(`Create a concise, realistic, personalized student learning roadmap. Use the student's specific goal and activities; do not reuse a generic template. Return valid JSON: {"title": string, "summary": string, "roadmap": [{"title": string, "detail": string, "timeframe": string}]} with 3 or 4 steps.
GOAL: ${goal.trim()}
ACTIVITIES: ${activities.length ? activities.join("\n") : "None supplied"}`);
    if (typeof result.title !== "string" || typeof result.summary !== "string" || !Array.isArray(result.roadmap) || result.roadmap.length < 2) throw new Error("AI did not return a complete roadmap.");
    response.json({ goal: goal.trim(), title: result.title.slice(0, 160), summary: result.summary.slice(0, 1200), roadmap: result.roadmap.slice(0, 4), provider: "gemini", model });
  } catch (error) {
    console.warn("Using contextual local roadmap because Gemini could not complete the request:", error.message);
    response.json({ ...local, provider: "local-contextual-fallback", notice: error.message });
  }
});

app.post("/api/mentors/match", (request, response) => {
  const query = request.body?.query;
  if (typeof query !== "string" || query.trim().length < 2 || query.length > 500) {
    return response.status(400).json({ error: "Provide a search prompt between 2 and 500 characters." });
  }
  const normalized = query.toLowerCase();
  const profiles = [
    { id: 1, skills: ["react", "typescript", "system design", "frontend", "javascript", "web development", "debugging", "state management"] },
    { id: 2, skills: ["machine learning", "python", "mlops", "data science", "research", "dataset", "model training", "statistics"] },
    { id: 3, skills: ["product design", "figma", "portfolio", "user experience", "ui", "ux", "prototyping", "visual design"] },
  ];
  const aliases = {
    "bug": ["debugging"],
    "bugs": ["debugging"],
    "debug": ["debugging"],
    "state": ["state management"],
    "ml": ["machine learning", "mlops"],
    "pipeline": ["mlops", "data science"],
    "design": ["product design", "system design"],
    "interface": ["ui", "user experience"],
    "wireframe": ["prototyping", "product design"],
    "career": ["portfolio"],
    "resume": ["portfolio"],
    "experiment": ["research"],
    "prediction": ["model training", "machine learning"],
    "neural": ["machine learning"],
  };
  const tokens = normalized.split(/[^a-z0-9+#.]+/).filter((token) => token.length > 2);
  const expanded = new Set([...tokens, ...tokens.flatMap((token) => aliases[token] || [])]);
  const ranked = profiles.map((profile) => ({
    id: profile.id,
    matchedSkills: profile.skills.filter((skill) => skill.length <= 2 ? expanded.has(skill) : normalized.includes(skill) || expanded.has(skill)),
  })).map((profile) => ({ ...profile, score: profile.matchedSkills.reduce((score, skill) => score + (normalized.includes(skill) ? 2 : 1), 0) }))
    .sort((a, b) => b.score - a.score || a.id - b.id);
  response.json({
    query: query.trim(),
    matchedSkills: ranked.flatMap((profile) => profile.matchedSkills),
    rankedMentorIds: ranked.map((profile) => profile.id),
    provider: "local-skill-match",
  });
});

app.post("/api/safety/reflection", (request, response) => {
  const reflection = request.body?.reflection;
  if (typeof reflection !== "string" || reflection.trim().length < 20 || reflection.length > 2000) {
    return response.status(400).json({ error: "A reflection between 20 and 2,000 characters is required." });
  }
  response.status(202).json({ status: "received", moderation: "human-review-required" });
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API endpoint not found." });
});

app.use(express.static(distPath));
app.get("*", (_request, response, next) => {
  response.sendFile(fileURLToPath(new URL("../dist/index.html", import.meta.url)), (error) => {
    if (error) next(error);
  });
});

app.use((error, _request, response, _next) => {
  console.error("API request failed:", error);
  response.status(500).json({ error: error.message || "An unexpected server error occurred." });
});

app.listen(port, () => {
  console.log(`PeerNexus API listening on http://localhost:${port} (${process.env.GEMINI_API_KEY ? `Gemini ${model}` : "local contextual AI"})`);
});
