import express from "express";
import path from "path";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { authStore } from "./src/server/authStore";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const app = express();
const PORT = 3000;
const NVIDIA_MODEL = (process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct").trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
const GROQ_MODEL = (process.env.GROQ_MODEL || "openai/gpt-oss-20b").trim();
const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").trim().toLowerCase();

function logEnvironmentSnapshot(stage: string) {
  const nvidiaKey = (process.env.NVIDIA_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  const environmentSnapshot = {
    stage,
    activeProvider: AI_PROVIDER,
    groqModel: GROQ_MODEL,
    groqApiKeyConfigured: Boolean(groqKey && !groqKey.includes("YOUR_")),
    geminiModel: GEMINI_MODEL,
    geminiApiKeyConfigured: Boolean(geminiKey && !geminiKey.includes("YOUR_") && !geminiKey.includes("MY_")),
    nvidiaModel: NVIDIA_MODEL,
    nvidiaApiKeyConfigured: Boolean(nvidiaKey && nvidiaKey !== "YOUR_NVIDIA_API_KEY_HERE"),
    nodeEnv: process.env.NODE_ENV || "undefined",
    vercel: process.env.VERCEL || "undefined",
    cwd: process.cwd(),
  };

  console.log(`[AI_ENV] ${JSON.stringify(environmentSnapshot)}`);
}

logEnvironmentSnapshot("startup");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Basic CORS headers for API responses to allow cross-origin requests from the client.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function getNvidiaClient() {
  return new OpenAI({
    apiKey: (process.env.NVIDIA_API_KEY || "").trim(),
    baseURL: "https://integrate.api.nvidia.com/v1",
  });
}

function getGeminiClient() {
  return new GoogleGenAI({
    apiKey: (process.env.GEMINI_API_KEY || "").trim(),
  });
}

function getGroqClient() {
  return new OpenAI({
    apiKey: (process.env.GROQ_API_KEY || "").trim(),
    baseURL: "https://api.groq.com/openai/v1",
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

  // Security: Redact potential raw API keys from error messages
  msg = msg.replace(/nvapi-[A-Za-z0-9_-]{20,}/g, "nvapi-[REDACTED]");
  msg = msg.replace(/gsk_[A-Za-z0-9_-]{20,}/g, "gsk_[REDACTED]");
  msg = msg.replace(/AIza[0-9A-Za-z-_]{35}/g, "AIza[REDACTED]");

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

  if (
    msg.includes("API key not valid") ||
    msg.includes("API_KEY_INVALID") ||
    msg.toLowerCase().includes("invalid api key") ||
    msg.toLowerCase().includes("invalid_api_key")
  ) {
    return "API key is invalid or unauthorized.";
  }

  return msg;
}

function getNvidiaError(error: any): { status: number; message: string } {
  const status = Number(error?.status) || Number(error?.response?.status) || 502;
  const providerError = error?.error || error?.response?.data?.error || error?.response?.data;
  const message = typeof providerError === "string"
    ? providerError
    : providerError?.message || error?.message || "NVIDIA API request failed.";
  return { status: status >= 400 && status < 600 ? status : 502, message: cleanErrorMessage(message) };
}

function getGeminiError(error: any): { status: number; message: string } {
  const status = Number(error?.status) || 500;
  const message = error?.message || (typeof error === "string" ? error : "Google Gemini API request failed.");
  return { status: status >= 400 && status < 600 ? status : 500, message: cleanErrorMessage(message) };
}

function getGroqError(error: any): { status: number; message: string } {
  const status = Number(error?.status) || Number(error?.response?.status) || 502;
  const providerError = error?.error || error?.response?.data?.error || error?.response?.data;
  const message = typeof providerError === "string"
    ? providerError
    : providerError?.message || error?.message || "Groq API request failed.";
  return { status: status >= 400 && status < 600 ? status : 502, message: cleanErrorMessage(message) };
}

function resolveProvider(reqBody: any): { provider: "gemini" | "nvidia" | "groq"; model: string } {
  const rawModel = (typeof reqBody?.modelIdentifier === "string" ? reqBody.modelIdentifier.trim() : "");
  const modelIdentifier = rawModel === "auto" ? "" : rawModel;
  const requestedProvider = (typeof reqBody?.provider === "string" ? reqBody.provider.trim().toLowerCase() : "");

  const nvidiaKey = (process.env.NVIDIA_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  const isNvidia = Boolean(nvidiaKey && nvidiaKey !== "YOUR_NVIDIA_API_KEY_HERE");
  const isGemini = Boolean(geminiKey && !geminiKey.includes("YOUR_") && !geminiKey.includes("MY_"));
  const isGroq = Boolean(groqKey && !groqKey.includes("YOUR_"));

  // 1. Determine active server provider configured in .env
  const envProv = (AI_PROVIDER as any) === "groq" ? "groq" : ((AI_PROVIDER as any) === "nvidia" ? "nvidia" : "gemini");

  let provider: "gemini" | "nvidia" | "groq";

  // 2. If client explicitly passed a provider parameter ("groq" | "nvidia" | "gemini")
  if (requestedProvider === "groq" && isGroq) {
    provider = "groq";
  } else if (requestedProvider === "nvidia" && isNvidia) {
    provider = "nvidia";
  } else if (requestedProvider === "gemini" && isGemini) {
    provider = "gemini";
  } else if (!modelIdentifier) {
    // No model specified or "auto": always follow .env AI_PROVIDER
    if (envProv === "groq" && isGroq) provider = "groq";
    else if (envProv === "nvidia" && isNvidia) provider = "nvidia";
    else if (envProv === "gemini" && isGemini) provider = "gemini";
    else if (isGroq) provider = "groq";
    else if (isNvidia) provider = "nvidia";
    else if (isGemini) provider = "gemini";
    else provider = envProv;
  } else {
    // 3. Client sent a modelIdentifier.
    // If model matches envProv, use envProv.
    // If the server has a configured envProv, prioritize the server's AI_PROVIDER over stale browser caches!
    const m = modelIdentifier.toLowerCase();
    const isModelGemini = m.includes("gemini");
    const isModelGroq = m.includes("groq") || m.includes("qwen") || m.includes("gpt-oss") || m.includes("llama-3.3") || m.includes("llama-3.1");
    const isModelNvidia = m.includes("meta") || m.includes("llama-3.2") || m.includes("muse");

    if (envProv === "groq" && isModelGroq && isGroq) {
      provider = "groq";
    } else if (envProv === "nvidia" && isModelNvidia && isNvidia) {
      provider = "nvidia";
    } else if (envProv === "gemini" && isModelGemini && isGemini) {
      provider = "gemini";
    } else if (envProv === "groq" && isGroq) {
      provider = "groq";
    } else if (envProv === "nvidia" && isNvidia) {
      provider = "nvidia";
    } else if (envProv === "gemini" && isGemini) {
      provider = "gemini";
    } else if (isModelGroq && isGroq) {
      provider = "groq";
    } else if (isModelNvidia && isNvidia) {
      provider = "nvidia";
    } else if (isModelGemini && isGemini) {
      provider = "gemini";
    } else {
      provider = envProv;
    }
  }

  // 4. Resolve Model:
  let model = modelIdentifier;
  const isTargetMatchingProvider =
    (provider === "gemini" && model.toLowerCase().includes("gemini")) ||
    (provider === "groq" && (model.toLowerCase().includes("groq") || model.toLowerCase().includes("qwen") || model.toLowerCase().includes("gpt-oss") || model.toLowerCase().includes("llama-3.3") || model.toLowerCase().includes("llama-3.1"))) ||
    (provider === "nvidia" && (model.toLowerCase().includes("meta") || model.toLowerCase().includes("llama-3.2") || model.toLowerCase().includes("muse")));

  if (!model || !isTargetMatchingProvider) {
    if (provider === "groq") model = GROQ_MODEL;
    else if (provider === "gemini") model = GEMINI_MODEL;
    else model = NVIDIA_MODEL;
  }

  return { provider, model };
}

interface InputMessage {
  role: string;
  content?: string;
  images?: Array<{ mimeType: string; data: string }>;
  isError?: boolean;
}

function toOpenAIMessages(
  contents: Array<{ role: "user" | "model"; parts: any[] }>,
  systemInstruction: string,
  supportsVision: boolean = true
) {
  return [
    { role: "system", content: systemInstruction },
    ...contents.map((content) => {
      if (!supportsVision) {
        const textParts = content.parts
          .map((p: any) => p.text || (p.inlineData ? "[Attached Image]" : ""))
          .filter(Boolean)
          .join("\n\n");
        return {
          role: content.role === "model" ? "assistant" : "user",
          content: textParts || "...",
        };
      }

      const parts = content.parts
        .map((part: any) => {
          if (part.text) {
            return { type: "text" as const, text: part.text };
          }
          if (part.inlineData?.data) {
            return {
              type: "image_url" as const,
              image_url: {
                url: `data:${part.inlineData.mimeType || "image/jpeg"};base64,${part.inlineData.data}`,
              },
            };
          }
          return null;
        })
        .filter(Boolean);

      return {
        role: content.role === "model" ? "assistant" : "user",
        content: parts.length > 0 ? parts : [{ type: "text" as const, text: "..." }],
      };
    }),
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];
}

const toNvidiaMessages = toOpenAIMessages;

/**
 * Formats and validates the message history for the NVIDIA API:
 * - Prunes excessive ancient history to keep requests lightning fast
 * - Filters empty / error turns
 * - Extracts clean base64 data & MIME types for images
 * - Ensures alternating 'user' <-> 'model' turns starting with 'user'
 * - Merges consecutive same-role turns to avoid 400 Bad Request
 * - Preserves multimodal images for active questions
 */
function formatContentsForNvidia(messages: InputMessage[]) {
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
  const nvidiaKey = (process.env.NVIDIA_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  const isNvidiaConfigured = Boolean(nvidiaKey && nvidiaKey !== "YOUR_NVIDIA_API_KEY_HERE");
  const isGeminiConfigured = Boolean(geminiKey && !geminiKey.includes("YOUR_") && !geminiKey.includes("MY_"));
  const isGroqConfigured = Boolean(groqKey && !groqKey.includes("YOUR_"));

  let activeModel = NVIDIA_MODEL;
  if (AI_PROVIDER === "gemini") activeModel = GEMINI_MODEL;
  else if (AI_PROVIDER === "groq") activeModel = GROQ_MODEL;

  res.json({
    status: "ok",
    name: "Vishwamedha AI",
    activeProvider: AI_PROVIDER,
    activeModel,
    configuredProviders: {
      nvidia: isNvidiaConfigured,
      gemini: isGeminiConfigured,
      groq: isGroqConfigured,
    },
    ready: isNvidiaConfigured || isGeminiConfigured || isGroqConfigured,
  });
});

// NVIDIA OpenAI-compatible chat endpoint
app.post("/api/nvidia-chat", async (req, res) => {
  try {
    const apiKey = (process.env.NVIDIA_API_KEY || "").trim();
    if (!apiKey || apiKey === "YOUR_NVIDIA_API_KEY_HERE") {
      return res.status(500).json({ error: "NVIDIA_API_KEY is not configured in the server environment." });
    }

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const nvidiaMessages = messages.map((message: any) => {
      const content: any[] = [];
      if (message.content?.trim()) {
        content.push({ type: "text", text: message.content.trim() });
      }
      for (const image of message.images || []) {
        if (image.data) {
          content.push({
            type: "image_url",
            image_url: { url: image.data },
          });
        }
      }
      return {
        role: message.role === "user" ? "user" : "assistant",
        content: content.length === 1 && content[0].type === "text" ? content[0].text : content,
      };
    });

    const completion = await getNvidiaClient().chat.completions.create({
      model: NVIDIA_MODEL,
      messages: nvidiaMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 8192,
      stream: false,
    });

    res.json({
      content: completion.choices[0]?.message?.content || "",
      response: completion,
    });
  } catch (error: any) {
    const providerError = getNvidiaError(error);
    console.error(`NVIDIA chat error: status=${providerError.status} message=${providerError.message}`);
    res.status(providerError.status).json({ error: providerError.message });
  }
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

// Fast chat completion endpoint with SSE streaming and multimodal images.
app.post("/api/chat/stream", async (req, res) => {
  const routeStart = Date.now();
  const { provider, model } = resolveProvider(req.body);

  const nvidiaKey = (process.env.NVIDIA_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  const isNvidiaConfigured = Boolean(nvidiaKey && nvidiaKey !== "YOUR_NVIDIA_API_KEY_HERE");
  const isGeminiConfigured = Boolean(geminiKey && !geminiKey.includes("YOUR_") && !geminiKey.includes("MY_"));
  const isGroqConfigured = Boolean(groqKey && !groqKey.includes("YOUR_"));

  console.log(`[STREAM] request-start`, {
    route: "/api/chat/stream",
    provider,
    model,
    isGeminiConfigured,
    isGroqConfigured,
    isNvidiaConfigured,
    messageCount: Array.isArray(req.body?.messages) ? req.body.messages.length : 0,
  });

  try {
    if (provider === "gemini" && !isGeminiConfigured) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in your server environment. Please set your Google AI Studio API key in .env.",
      });
    }
    if (provider === "groq" && !isGroqConfigured) {
      return res.status(500).json({
        error: "GROQ_API_KEY is not configured in your server environment. Please set your Groq API key in .env.",
      });
    }
    if (provider === "nvidia" && !isNvidiaConfigured) {
      return res.status(500).json({
        error: "NVIDIA_API_KEY is not configured in your server environment.",
      });
    }

    const { messages, studentGrade, subjectFocus } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const currentDateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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

    const formattedContents = formatContentsForNvidia(messages);

    if (formattedContents.length === 0) {
      return res.status(400).json({ error: "No valid user message content found." });
    }

    let isClientClosed = false;
    req.on("close", () => {
      isClientClosed = true;
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    if (provider === "gemini") {
      console.log(`[GEMINI_STREAM] provider-call-start`, {
        model,
        messageCount: formattedContents.length,
        routeMs: Date.now() - routeStart,
      });

      const stream = await getGeminiClient().models.generateContentStream({
        model,
        contents: formattedContents as any,
        config: {
          systemInstruction,
        },
      });

      for await (const chunk of stream) {
        if (isClientClosed) break;
        let chunkText = "";
        try {
          chunkText = chunk.text || chunk.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
        } catch {
          chunkText = chunk.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
        }
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText, provider: "gemini", model })}\n\n`);
          if (typeof (res as any).flush === "function") {
            (res as any).flush();
          }
        }
      }

      if (!isClientClosed) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
      const elapsedMs = Date.now() - routeStart;
      console.log(`[GEMINI_STREAM] provider-call-complete`, {
        elapsedMs,
        model,
      });
      console.log(`[Chat Reply Stream] [Gemini - ${model}] Stream completed in ${elapsedMs}ms (${(elapsedMs / 1000).toFixed(2)}s)`);
    } else if (provider === "groq") {
      console.log(`[GROQ_STREAM] provider-call-start`, {
        model,
        messageCount: formattedContents.length,
        routeMs: Date.now() - routeStart,
      });

      const isVisionModel = model.toLowerCase().includes("vision");
      const stream = await getGroqClient().chat.completions.create({
        model,
        messages: toOpenAIMessages(formattedContents, systemInstruction, isVisionModel),
        temperature: 0.7,
        max_tokens: 8192,
        stream: true,
      });

      for await (const chunk of stream) {
        if (isClientClosed) break;
        const chunkText = chunk.choices[0]?.delta?.content || "";
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText, provider: "groq", model })}\n\n`);
          if (typeof (res as any).flush === "function") {
            (res as any).flush();
          }
        }
      }

      if (!isClientClosed) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
      const elapsedMs = Date.now() - routeStart;
      console.log(`[GROQ_STREAM] provider-call-complete`, {
        elapsedMs,
        model,
      });
      console.log(`[Chat Reply Stream] [Groq - ${model}] Stream completed in ${elapsedMs}ms (${(elapsedMs / 1000).toFixed(2)}s)`);
    } else {
      console.log(`[NVIDIA_STREAM] provider-call-start`, {
        model,
        messageCount: formattedContents.length,
        firstRole: formattedContents[0]?.role,
        routeMs: Date.now() - routeStart,
      });

      const stream = await getNvidiaClient().chat.completions.create({
        model,
        messages: toNvidiaMessages(formattedContents, systemInstruction),
        temperature: 0.95,
        top_p: 1,
        max_tokens: 8192,
        stream: true,
      });

      for await (const chunk of stream) {
        if (isClientClosed) break;
        const chunkText = chunk.choices[0]?.delta?.content || "";
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText, provider: "nvidia", model })}\n\n`);
          if (typeof (res as any).flush === "function") {
            (res as any).flush();
          }
        }
      }

      if (!isClientClosed) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
      const elapsedMs = Date.now() - routeStart;
      console.log(`[NVIDIA_STREAM] provider-call-complete`, {
        elapsedMs,
        model,
        backend: process.env.VERCEL === "1" ? "vercel" : "local",
      });
      console.log(`[Chat Reply Stream] [NVIDIA - ${model}] Stream completed in ${elapsedMs}ms (${(elapsedMs / 1000).toFixed(2)}s)`);
    }
  } catch (error: any) {
    const prov = resolveProvider(req.body).provider;
    const providerError = prov === "gemini" ? getGeminiError(error) : (prov === "groq" ? getGroqError(error) : getNvidiaError(error));
    console.error(`[STREAM_ERROR]`, {
      status: providerError.status,
      message: providerError.message,
      provider: prov,
      model,
      elapsedMs: Date.now() - routeStart,
      stack: error?.stack,
    });
    if (!res.headersSent) {
      res.status(providerError.status).json({ error: providerError.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: providerError.message, status: providerError.status })}\n\n`);
      res.end();
    }
  }
});

// Non-streaming chat endpoint (supports Google Gemini, Groq, and NVIDIA)
app.post("/api/chat", async (req, res) => {
  const routeStart = Date.now();
  const { provider, model } = resolveProvider(req.body);

  const nvidiaKey = (process.env.NVIDIA_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  const isNvidiaConfigured = Boolean(nvidiaKey && nvidiaKey !== "YOUR_NVIDIA_API_KEY_HERE");
  const isGeminiConfigured = Boolean(geminiKey && !geminiKey.includes("YOUR_") && !geminiKey.includes("MY_"));
  const isGroqConfigured = Boolean(groqKey && !groqKey.includes("YOUR_"));

  console.log(`[CHAT_JSON] request-start`, {
    route: "/api/chat",
    provider,
    model,
    isGeminiConfigured,
    isGroqConfigured,
    isNvidiaConfigured,
    messageCount: Array.isArray(req.body?.messages) ? req.body.messages.length : 0,
  });

  try {
    if (provider === "gemini" && !isGeminiConfigured) {
      console.error(`[GEMINI_JSON] missing-key`, { route: "/api/chat", elapsedMs: Date.now() - routeStart });
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in your .env file. Please set your Google AI Studio API key (GEMINI_API_KEY) in .env to test Gemini.",
      });
    }

    if (provider === "groq" && !isGroqConfigured) {
      console.error(`[GROQ_JSON] missing-key`, { route: "/api/chat", elapsedMs: Date.now() - routeStart });
      return res.status(500).json({
        error: "GROQ_API_KEY is not configured in your .env file. Please set your Groq API key (GROQ_API_KEY) in .env to test Groq.",
      });
    }

    if (provider === "nvidia" && !isNvidiaConfigured) {
      console.error(`[NVIDIA_JSON] missing-key`, { route: "/api/chat", elapsedMs: Date.now() - routeStart });
      return res.status(500).json({
        error: "NVIDIA_API_KEY is not configured in your server environment.",
      });
    }

    const { messages, studentGrade, subjectFocus } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const currentDateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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

    const formattedContents = formatContentsForNvidia(messages);

    if (formattedContents.length === 0) {
      return res.status(400).json({ error: "No valid user message content found." });
    }

    if (provider === "gemini") {
      console.log(`[GEMINI_JSON] provider-call-start`, {
        route: "/api/chat",
        model,
        messageCount: formattedContents.length,
        elapsedMs: Date.now() - routeStart,
      });

      const geminiClient = getGeminiClient();
      const response = await geminiClient.models.generateContent({
        model,
        contents: formattedContents as any,
        config: {
          systemInstruction,
        },
      });

      let responseText = response.text || "";
      if (!responseText && response.candidates?.[0]?.content?.parts) {
        responseText = response.candidates[0].content.parts.map((p: any) => p.text || "").join("");
      }
      const elapsedMs = Date.now() - routeStart;
      console.log(`[GEMINI_JSON] provider-call-complete`, {
        route: "/api/chat",
        model,
        elapsedMs,
        responseLength: responseText.length,
      });
      console.log(`[Chat Reply] [Gemini: ${model}] Total time to generate reply: ${elapsedMs}ms (${(elapsedMs / 1000).toFixed(2)}s)`);

      return res.json({ text: responseText, provider: "gemini", model });
    } else if (provider === "groq") {
      console.log(`[GROQ_JSON] provider-call-start`, {
        route: "/api/chat",
        model,
        messageCount: formattedContents.length,
        elapsedMs: Date.now() - routeStart,
      });

      const isVisionModel = model.toLowerCase().includes("vision");
      let responseText = "";
      try {
        const completion = await getGroqClient().chat.completions.create({
          model,
          messages: toOpenAIMessages(formattedContents, systemInstruction, isVisionModel),
          temperature: 0.7,
          max_tokens: 8192,
          stream: false,
        });
        responseText = completion.choices[0]?.message?.content || "";
      } catch (chatErr: any) {
        if (typeof (getGroqClient().responses as any)?.create === "function") {
          const lastMsg = formattedContents[formattedContents.length - 1];
          const inputText = lastMsg?.parts?.map((p: any) => p.text || "").join("\n") || "";
          const resp = await (getGroqClient().responses as any).create({
            model,
            input: inputText,
            instructions: systemInstruction,
          });
          responseText = resp.output_text || resp.output?.[0]?.content?.[0]?.text || "";
        } else {
          throw chatErr;
        }
      }

      const elapsedMs = Date.now() - routeStart;
      console.log(`[GROQ_JSON] provider-call-complete`, {
        route: "/api/chat",
        model,
        elapsedMs,
        responseLength: responseText.length,
      });
      console.log(`[Chat Reply] [Groq: ${model}] Total time to generate reply: ${elapsedMs}ms (${(elapsedMs / 1000).toFixed(2)}s)`);

      return res.json({ text: responseText, provider: "groq", model });
    } else {
      console.log(`[NVIDIA_JSON] provider-call-start`, {
        route: "/api/chat",
        model,
        messageCount: formattedContents.length,
        elapsedMs: Date.now() - routeStart,
      });

      const completion = await getNvidiaClient().chat.completions.create({
        model,
        messages: toNvidiaMessages(formattedContents, systemInstruction),
        temperature: 0.95,
        top_p: 1,
        max_tokens: 8192,
        stream: false,
      });

      const responseText = completion.choices[0]?.message?.content || "";
      const elapsedMs = Date.now() - routeStart;
      console.log(`[NVIDIA_JSON] provider-call-complete`, {
        route: "/api/chat",
        model,
        elapsedMs,
        responseLength: responseText.length,
      });
      console.log(`[Chat Reply] [NVIDIA: ${model}] Total time to generate reply: ${elapsedMs}ms (${(elapsedMs / 1000).toFixed(2)}s)`);

      return res.json({ text: responseText, provider: "nvidia", model });
    }
  } catch (error: any) {
    const prov = resolveProvider(req.body).provider;
    const providerError = prov === "gemini" ? getGeminiError(error) : (prov === "groq" ? getGroqError(error) : getNvidiaError(error));
    console.error(`[CHAT_ERROR]`, {
      route: "/api/chat",
      status: providerError.status,
      message: providerError.message,
      provider: prov,
      model,
      elapsedMs: Date.now() - routeStart,
      stack: error?.stack,
    });
    res.status(providerError.status).json({ error: providerError.message });
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
    console.log(`Vishwamedha AI server listening on port ${PORT}`);
  });
}

// Only start the server automatically if we are not running in a serverless environment like Vercel
if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
