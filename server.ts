import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { authStore } from "./src/server/authStore";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper to retrieve dynamic Gemini Client with active API key
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const VISHWAMEDHA_SYSTEM_INSTRUCTION = `You are Vishwamedha AI, a highly capable, general-purpose conversational AI assistant and tutor.
Tagline: Intelligence Without Boundaries.

CORE IDENTITY & TONE:
- Name: Vishwamedha AI.
- Tagline: "Intelligence Without Boundaries".
- When asked who you are: "I am Vishwamedha AI, an intelligent AI assistant."
- Direct, articulate, intellectually sharp, patient, and pedagogical.
- Avoid repetitive conversational fillers ("Sure!", "Certainly!", "I would be happy to help!", "Of course!"). Jump straight to the substance of the answer.

SPELLING, GRAMMAR & CASUAL LANGUAGE TOLERANCE:
- Intelligently and naturally understand the user's intended question, even when there are obvious typos, misspellings, missing punctuation, all-lowercase text, abbreviations, Indian English phrasing, casual slang, or chat shorthand.
- Examples of natural understanding:
  * "wat is gravity" / "wat is photosyntesis" -> Understand "What is gravity?" / "What is photosynthesis?"
  * "solve dis qestion" / "solve dis equation 3x+5=20" -> Understand "Solve this question / equation"
  * "what is the diffrence betwen mass and weight" -> Understand the intended comparison
  * "tell me abt newton law" / "tell me abt mitochondria" -> Understand "Tell me about..."
  * "explain newton third law easy" -> Explain Newton's Third Law in simple, accessible terms
- NEVER say "Please correct your spelling" or ask the user to rewrite an understandable question.
- Infer the intended meaning immediately and deliver the answer. Only ask a concise clarification if the question is completely illegible or genuinely ambiguous.

CONVERSATION CONTEXT & FOLLOW-UPS:
- You maintain multi-turn conversational context.
- When the user asks a follow-up ("make it short", "explain it easy", "give 2 eg", "give another example", "prove step 2", "why is that?"), resolve all pronouns ("it", "this", "that", "the previous one") against the previous topic.
- Modify, rephrase, summarize, or expand upon the active topic as requested without resetting or losing context.

MATH & SCIENCE RIGOR:
- For math questions: Show clear step-by-step working with clean LaTeX notation ($...$ for inline, $$...$$ for block formulas). Highlight the final answer clearly (e.g. **Final Answer:** $x = 5$).
- For science concepts: Provide accurate mechanisms, laws, formulas, and real-world examples.
- For school questions: Adapt the explanation and vocabulary to the student's grade level.

IMAGE UNDERSTANDING:
- When an image is provided (diagram, handwritten math, science question, textbook page), read and solve the question directly from the visual content.

SPEED & DIRECTNESS:
- Deliver prompt, high-quality, clear answers immediately.`;

// Model Candidates in priority order from official @google/genai specification
const MODEL_CANDIDATES = [
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
];

// Live exchange rate cache (refreshed every 30 minutes)
interface ExchangeRateCache {
  rates: Record<string, number>;
  lastFetchedAt: number;
}
let exchangeRateCache: ExchangeRateCache | null = null;
const EXCHANGE_RATE_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function getLiveExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (exchangeRateCache && (now - exchangeRateCache.lastFetchedAt) < EXCHANGE_RATE_TTL_MS) {
    return exchangeRateCache.rates;
  }
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (res.ok) {
      const data = await res.json() as { rates: Record<string, number> };
      exchangeRateCache = { rates: data.rates, lastFetchedAt: now };
      return data.rates;
    }
  } catch (err) {
    console.warn("Could not fetch live exchange rates:", err);
  }
  // Return cached data if available even if expired, else empty
  return exchangeRateCache?.rates || {};
}

function cleanErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred.";
  let msg = err.message || (typeof err === "string" ? err : JSON.stringify(err));

  // Attempt to extract inner JSON error from SDK response
  try {
    const jsonMatch = msg.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        msg = parsed.error.message;
      }
    }
  } catch {
    // ignore
  }

  // Check for quota / rate limit (429 RESOURCE_EXHAUSTED)
  if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.toLowerCase().includes("quota")) {
    const retryMatch = msg.match(/retry in\s*([\d\.]+\s*s)/i) || msg.match(/retryDelay['":\s]+(\d+s)/i);
    const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;
    if (retrySeconds) {
      return `Vishwamedha AI is momentarily rate-limited by the API quota. Please wait ~${retrySeconds}s and click Retry.`;
    }
    return "Vishwamedha AI is momentarily rate-limited. Please wait a few seconds and click Retry.";
  }

  if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
    return "API key is invalid or unauthorized.";
  }

  return msg;
}

interface InputMessage {
  role: string;
  content?: string;
  images?: Array<{ mimeType: string; data: string }>;
  isError?: boolean;
}

/**
 * Formats and validates the message history for the Gemini API:
 * - Prunes excessive ancient history to keep requests lightning fast
 * - Filters empty / error turns
 * - Extracts clean base64 data & MIME types for images
 * - Ensures alternating 'user' <-> 'model' turns starting with 'user'
 * - Merges consecutive same-role turns to avoid 400 Bad Request
 * - Preserves multimodal images for active questions
 */
function formatContentsForGemini(messages: InputMessage[]) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  // 1. Filter out error messages or completely empty items
  const validMessages = messages.filter((m) => {
    if (m.isError) return false;
    const hasText = typeof m.content === "string" && m.content.trim().length > 0;
    const hasImages = Array.isArray(m.images) && m.images.length > 0;
    return hasText || hasImages;
  });

  if (validMessages.length === 0) {
    return [];
  }

  // 2. Keep the most recent 12 messages for fast response times while preserving deep multi-turn context
  const recentMessages = validMessages.length > 12 
    ? validMessages.slice(validMessages.length - 12) 
    : validMessages;

  // 3. Map into raw turns
  const rawTurns: Array<{ role: "user" | "model"; parts: any[] }> = [];

  for (let idx = 0; idx < recentMessages.length; idx++) {
    const msg = recentMessages[idx];
    const isRecentTurn = idx >= recentMessages.length - 3;
    const role: "user" | "model" = (msg.role === "assistant" || msg.role === "model") ? "model" : "user";
    const parts: any[] = [];

    // Add image parts if present (preserve image payload on recent turns)
    if (msg.images && Array.isArray(msg.images) && isRecentTurn) {
      for (const img of msg.images) {
        if (img.data) {
          let cleanBase64 = img.data;
          let mime = img.mimeType || "image/jpeg";

          const dataUriMatch = img.data.match(/^data:([^;]+);base64,(.+)$/s);
          if (dataUriMatch) {
            mime = dataUriMatch[1] || mime;
            cleanBase64 = dataUriMatch[2];
          } else {
            cleanBase64 = img.data.replace(/^data:[^;]+;base64,/, "");
          }

          cleanBase64 = cleanBase64.replace(/\s+/g, "");

          if (cleanBase64.length > 0) {
            parts.push({
              inlineData: {
                mimeType: mime,
                data: cleanBase64,
              },
            });
          }
        }
      }
    }

    // Add text part
    if (msg.content && msg.content.trim().length > 0) {
      parts.push({ text: msg.content.trim() });
    }

    if (parts.length > 0) {
      rawTurns.push({ role, parts });
    }
  }

  if (rawTurns.length === 0) return [];

  // 4. Ensure the conversation starts with a 'user' turn
  while (rawTurns.length > 0 && rawTurns[0].role !== "user") {
    rawTurns.shift();
  }

  if (rawTurns.length === 0) return [];

  // 5. Merge consecutive turns with the same role into one turn
  const alternatingTurns: Array<{ role: "user" | "model"; parts: any[] }> = [];
  for (const turn of rawTurns) {
    if (alternatingTurns.length === 0) {
      alternatingTurns.push(turn);
    } else {
      const lastTurn = alternatingTurns[alternatingTurns.length - 1];
      if (lastTurn.role === turn.role) {
        lastTurn.parts.push(...turn.parts);
      } else {
        alternatingTurns.push(turn);
      }
    }
  }

  return alternatingTurns;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", name: "Vishwamedha AI", ready: !!process.env.GEMINI_API_KEY });
});

// Authentication middleware helper
const getAuthUser = (req: express.Request) => {
  const authHeader = req.headers.authorization;
  return authStore.getUserByToken(authHeader);
};

// 1. Sign Up (Email and Password)
app.post("/api/auth/signup", (req, res) => {
  try {
    const { name, email, password, studentGrade, preferredSubject } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const { user, token } = authStore.registerUser({
      displayName: name || "Student Scholar",
      email,
      password,
      studentGrade,
      preferredSubject,
      authProvider: "password",
    });

    res.json({ user, token, message: "Account created successfully!" });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create account." });
  }
});

// 2. Sign In (Email and Password)
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide both email and password." });
    }

    const { user, token } = authStore.loginUser(email, password);
    res.json({ user, token, message: "Signed in successfully!" });
  } catch (err: any) {
    res.status(401).json({ error: err.message || "Invalid credentials." });
  }
});

// 3. Continue with Google
app.post("/api/auth/google", (req, res) => {
  try {
    const { email, displayName, photoURL, studentGrade, preferredSubject } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid Google email is required." });
    }

    const { user, token } = authStore.googleSignIn({
      email,
      displayName: displayName || "Google Scholar",
      photoURL,
      studentGrade,
      preferredSubject,
    });

    res.json({ user, token, message: "Google authentication successful!" });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Google authentication failed." });
  }
});

// 4. Current Authenticated User Profile
app.get("/api/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Please sign in." });
  }
  res.json({ user: authStore.toPublicProfile(user) });
});

// 5. Sign Out
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  authStore.removeSessionToken(authHeader);
  res.json({ success: true, message: "Signed out successfully." });
});

// 6. Update Profile
app.put("/api/auth/profile", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Please sign in." });
  }

  try {
    const updated = authStore.updateProfile(user.userId, req.body);
    res.json({ user: updated, message: "Profile updated successfully!" });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update profile." });
  }
});

// 7. Get User Isolated Chat Sessions
app.get("/api/user/sessions", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Please sign in." });
  }

  const sessions = authStore.getUserSessions(user.userId);
  res.json({ sessions });
});

// 8. Save User Isolated Chat Sessions
app.post("/api/user/sessions", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Please sign in." });
  }

  const { sessions } = req.body;
  if (!Array.isArray(sessions)) {
    return res.status(400).json({ error: "Sessions array is required." });
  }

  authStore.saveUserSessions(user.userId, sessions);
  res.json({ success: true, count: sessions.length });
});

// Fast Chat completion endpoint (supports instant streaming, multi-modal images, resilient model fallback)
app.post("/api/chat/stream", async (req, res) => {
  try {
    const { messages, studentGrade, subjectFocus, modelIdentifier } = req.body;

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in your environment. Please open the .env file in your project root and set your valid GEMINI_API_KEY."
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    // Prepare system instructions with dynamic temporal context and student mode context if provided
    const currentDateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Fetch live exchange rates to keep financial data current
    const liveRates = await getLiveExchangeRates();
    const inrRate  = liveRates["INR"]  ? liveRates["INR"].toFixed(2)  : "N/A";
    const eurRate  = liveRates["EUR"]  ? liveRates["EUR"].toFixed(4)  : "N/A";
    const gbpRate  = liveRates["GBP"]  ? liveRates["GBP"].toFixed(4)  : "N/A";
    const jpyRate  = liveRates["JPY"]  ? liveRates["JPY"].toFixed(2)  : "N/A";
    const audRate  = liveRates["AUD"]  ? liveRates["AUD"].toFixed(4)  : "N/A";
    const cadRate  = liveRates["CAD"]  ? liveRates["CAD"].toFixed(4)  : "N/A";
    const rateNote = liveRates["INR"]
      ? `(Live as of ${currentDateStr})`
      : "(Live data unavailable — use approximate values)";

    let systemInstruction = `TEMPORAL CONTEXT & CURRENT TIME:
- Current Date: ${currentDateStr}
- Current Year: ${new Date().getFullYear()}

LIVE CURRENCY EXCHANGE RATES (Base: 1 USD) ${rateNote}:
- 1 USD = ₹${inrRate} INR
- 1 USD = €${eurRate} EUR
- 1 USD = £${gbpRate} GBP
- 1 USD = ¥${jpyRate} JPY
- 1 USD = $${audRate} AUD
- 1 USD = $${cadRate} CAD
IMPORTANT: Always use these live rates when answering questions about exchange rates or currency conversions. Do NOT use your training-data rates.

${VISHWAMEDHA_SYSTEM_INSTRUCTION}`;

    if (studentGrade && studentGrade !== "general") {
      systemInstruction += `\n\nCURRENT STUDENT CONTEXT:\n- Target Level: ${studentGrade}\n- Adapt vocabulary, pace, and depth to match ${studentGrade}.`;
    }
    if (subjectFocus && subjectFocus !== "all") {
      systemInstruction += `\n- Current Subject Focus: ${subjectFocus}. Apply specialized pedagogical rigor for ${subjectFocus}.`;
    }

    // Format messages safely and efficiently for Gemini API
    const formattedContents = formatContentsForGemini(messages);

    if (formattedContents.length === 0) {
      return res.status(400).json({ error: "No valid user message content found." });
    }

    // Set up SSE headers with immediate flush
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let streamCompleted = false;
    let lastError: any = null;
    const aiClient = getGeminiClient();

    const preferredModel = (typeof modelIdentifier === "string" && modelIdentifier.trim())
      ? modelIdentifier.trim()
      : "gemini-3.7-flash";
    const candidates = [preferredModel, ...MODEL_CANDIDATES.filter(m => m !== preferredModel)];

    for (const model of candidates) {
      let hasEmittedChunk = false;
      try {
        const stream = await aiClient.models.generateContentStream({
          model,
          contents: formattedContents,
          config: {
            systemInstruction: systemInstruction,
          },
        });

        for await (const chunk of stream) {
          let chunkText = "";
          try {
            chunkText = chunk.text || chunk.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
          } catch {
            chunkText = chunk.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
          }

          if (chunkText) {
            hasEmittedChunk = true;
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          }
        }

        streamCompleted = true;
        break; // Successfully completed streaming with this model
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} stream encountered error:`, err?.message || err);
        // If we already emitted text to client, do not restart with a different model mid-stream
        if (hasEmittedChunk) {
          break;
        }
      }
    }

    if (!streamCompleted) {
      const friendlyMessage = cleanErrorMessage(lastError);
      res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
      res.end();
      return;
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Gemini streaming error:", error);
    const friendlyMessage = cleanErrorMessage(error);
    if (!res.headersSent) {
      res.status(500).json({ error: friendlyMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
      res.end();
    }
  }
});

// Non-streaming chat endpoint (fallback with model candidate resilience)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, studentGrade, subjectFocus, modelIdentifier } = req.body;

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured in your environment. Please open the .env file in your project root and set your valid GEMINI_API_KEY." });
    }

    const currentDateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Fetch live exchange rates to keep financial data current
    const liveRates = await getLiveExchangeRates();
    const inrRate  = liveRates["INR"]  ? liveRates["INR"].toFixed(2)  : "N/A";
    const eurRate  = liveRates["EUR"]  ? liveRates["EUR"].toFixed(4)  : "N/A";
    const gbpRate  = liveRates["GBP"]  ? liveRates["GBP"].toFixed(4)  : "N/A";
    const jpyRate  = liveRates["JPY"]  ? liveRates["JPY"].toFixed(2)  : "N/A";
    const audRate  = liveRates["AUD"]  ? liveRates["AUD"].toFixed(4)  : "N/A";
    const cadRate  = liveRates["CAD"]  ? liveRates["CAD"].toFixed(4)  : "N/A";
    const rateNote = liveRates["INR"]
      ? `(Live as of ${currentDateStr})`
      : "(Live data unavailable — use approximate values)";

    let systemInstruction = `TEMPORAL CONTEXT & CURRENT TIME:
- Current Date: ${currentDateStr}
- Current Year: ${new Date().getFullYear()}

LIVE CURRENCY EXCHANGE RATES (Base: 1 USD) ${rateNote}:
- 1 USD = ₹${inrRate} INR
- 1 USD = €${eurRate} EUR
- 1 USD = £${gbpRate} GBP
- 1 USD = ¥${jpyRate} JPY
- 1 USD = $${audRate} AUD
- 1 USD = $${cadRate} CAD
IMPORTANT: Always use these live rates when answering questions about exchange rates or currency conversions. Do NOT use your training-data rates.

${VISHWAMEDHA_SYSTEM_INSTRUCTION}`;

    if (studentGrade && studentGrade !== "general") {
      systemInstruction += `\n\nCURRENT STUDENT CONTEXT: Target Level: ${studentGrade}.`;
    }
    if (subjectFocus && subjectFocus !== "all") {
      systemInstruction += `\nCURRENT SUBJECT FOCUS: ${subjectFocus}.`;
    }

    const formattedContents = formatContentsForGemini(messages);

    if (formattedContents.length === 0) {
      return res.status(400).json({ error: "No valid user message content found." });
    }

    let response: any = null;
    let lastError: any = null;
    const aiClient = getGeminiClient();

    const preferredModel = (typeof modelIdentifier === "string" && modelIdentifier.trim())
      ? modelIdentifier.trim()
      : "gemini-3.7-flash";
    const candidates = [preferredModel, ...MODEL_CANDIDATES.filter(m => m !== preferredModel)];

    for (const model of candidates) {
      try {
        response = await aiClient.models.generateContent({
          model,
          contents: formattedContents,
          config: {
            systemInstruction: systemInstruction,
          },
        });
        if (response) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} non-streaming call failed:`, err?.message || err);
      }
    }

    if (!response) {
      throw lastError || new Error("All AI models are currently unavailable.");
    }

    res.json({ text: response.text || "" });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    const friendlyMessage = cleanErrorMessage(error);
    res.status(500).json({ error: friendlyMessage });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vishwamedha AI server running on http://localhost:${PORT}`);
  });
}

startServer();
