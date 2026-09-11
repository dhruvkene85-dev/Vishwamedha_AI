import express from "express";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const app = express();
const NVIDIA_MODEL = (process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct").trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
const GROQ_MODEL = (process.env.GROQ_MODEL || "openai/gpt-oss-20b").trim();
const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").trim().toLowerCase();

function getGeminiClient() {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  return new GoogleGenAI({
    apiKey,
  });
}

function getGroqClient() {
  return new OpenAI({
    apiKey: (process.env.GROQ_API_KEY || "").trim(),
    baseURL: "https://api.groq.com/openai/v1",
  });
}

export interface GroqQuotaTelemetry {
  remainingRequests: string | null;
  limitRequests: string | null;
  remainingTokens: string | null;
  limitTokens: string | null;
  resetTokens: string | null;
  resetRequests: string | null;
  lastUpdated: number | null;
}

let latestGroqTelemetry: GroqQuotaTelemetry = {
  remainingRequests: null,
  limitRequests: null,
  remainingTokens: null,
  limitTokens: null,
  resetTokens: null,
  resetRequests: null,
  lastUpdated: null,
};

const sessionMetrics = {
  totalRequests: 0,
  groqRequests: 0,
  nvidiaRequests: 0,
  geminiRequests: 0,
  startTime: Date.now(),
};

function updateGroqTelemetryFromHeaders(headers: any) {
  if (!headers) return;
  const getHeader = (name: string) => {
    if (typeof headers.get === "function") return headers.get(name);
    return headers[name] || headers[name.toLowerCase()] || null;
  };

  const remainingReq = getHeader("x-ratelimit-remaining-requests");
  const limitReq = getHeader("x-ratelimit-limit-requests");
  const remainingTok = getHeader("x-ratelimit-remaining-tokens");
  const limitTok = getHeader("x-ratelimit-limit-tokens");
  const resetTok = getHeader("x-ratelimit-reset-tokens");
  const resetReq = getHeader("x-ratelimit-reset-requests");

  if (remainingReq !== null || remainingTok !== null || limitReq !== null) {
    latestGroqTelemetry = {
      remainingRequests: remainingReq,
      limitRequests: limitReq,
      remainingTokens: remainingTok,
      limitTokens: limitTok,
      resetTokens: resetTok,
      resetRequests: resetReq,
      lastUpdated: Date.now(),
    };
  }
}

function parseResetToSeconds(resetStr: string | null): number {
  if (!resetStr) return 0;
  let totalSec = 0;
  const dMatch = resetStr.match(/(\d+(?:\.\d+)?)d/);
  if (dMatch) totalSec += parseFloat(dMatch[1]) * 86400;
  const hMatch = resetStr.match(/(\d+(?:\.\d+)?)h/);
  if (hMatch) totalSec += parseFloat(hMatch[1]) * 3600;
  const mMatch = resetStr.match(/(\d+(?:\.\d+)?)m(?!s)/);
  if (mMatch) totalSec += parseFloat(mMatch[1]) * 60;
  const msMatch = resetStr.match(/(\d+(?:\.\d+)?)ms/);
  if (msMatch) totalSec += parseFloat(msMatch[1]) / 1000;
  const withoutMs = resetStr.replace(/(\d+(?:\.\d+)?)ms/g, '');
  const sMatch = withoutMs.match(/(\d+(?:\.\d+)?)s/);
  if (sMatch) totalSec += parseFloat(sMatch[1]);
  if (!dMatch && !hMatch && !mMatch && !msMatch && !sMatch) {
    const rawNum = parseFloat(resetStr);
    if (!isNaN(rawNum)) totalSec = rawNum;
  }
  return totalSec;
}

function getDynamicGroqTelemetry(): GroqQuotaTelemetry {
  if (!latestGroqTelemetry.lastUpdated) {
    return latestGroqTelemetry;
  }

  const elapsedSec = Math.max(0, (Date.now() - latestGroqTelemetry.lastUpdated) / 1000);
  const tokenResetSec = parseResetToSeconds(latestGroqTelemetry.resetTokens);
  const requestResetSec = parseResetToSeconds(latestGroqTelemetry.resetRequests);

  let dynamicRemainingTokens = latestGroqTelemetry.remainingTokens;
  let dynamicResetTokens = latestGroqTelemetry.resetTokens;

  if (latestGroqTelemetry.limitTokens && latestGroqTelemetry.remainingTokens) {
    const limitTok = parseFloat(latestGroqTelemetry.limitTokens);
    const remTok = parseFloat(latestGroqTelemetry.remainingTokens);
    if (!isNaN(limitTok) && !isNaN(remTok)) {
      if (tokenResetSec <= 0 || elapsedSec >= tokenResetSec) {
        dynamicRemainingTokens = String(limitTok);
        dynamicResetTokens = "0s";
      } else {
        const ratio = elapsedSec / tokenResetSec;
        const recovered = Math.min(limitTok, Math.round(remTok + (limitTok - remTok) * ratio));
        dynamicRemainingTokens = String(recovered);
        dynamicResetTokens = `${Math.max(0, tokenResetSec - elapsedSec).toFixed(1)}s`;
      }
    }
  }

  let dynamicRemainingRequests = latestGroqTelemetry.remainingRequests;
  let dynamicResetRequests = latestGroqTelemetry.resetRequests;

  if (latestGroqTelemetry.limitRequests && latestGroqTelemetry.remainingRequests) {
    const limitReq = parseFloat(latestGroqTelemetry.limitRequests);
    const remReq = parseFloat(latestGroqTelemetry.remainingRequests);
    if (!isNaN(limitReq) && !isNaN(remReq)) {
      if (requestResetSec <= 0 || elapsedSec >= requestResetSec) {
        dynamicRemainingRequests = String(limitReq);
        dynamicResetRequests = "0s";
      } else {
        const remainingTime = Math.max(0, requestResetSec - elapsedSec);
        if (remainingTime > 60) {
          dynamicResetRequests = `${Math.floor(remainingTime / 60)}m ${Math.round(remainingTime % 60)}s`;
        } else {
          dynamicResetRequests = `${remainingTime.toFixed(1)}s`;
        }
      }
    }
  }

  return {
    ...latestGroqTelemetry,
    remainingTokens: dynamicRemainingTokens,
    resetTokens: dynamicResetTokens,
    remainingRequests: dynamicRemainingRequests,
    resetRequests: dynamicResetRequests,
  };
}

function resolveProvider(reqBody: any): { provider: "gemini" | "nvidia" | "groq"; model: string } {
  const rawModel = (
    typeof reqBody?.modelIdentifier === "string"
      ? reqBody.modelIdentifier.trim()
      : (typeof reqBody?.model === "string" ? reqBody.model.trim() : "")
  );
  const modelIdentifier = rawModel === "auto" ? "" : rawModel;
  const requestedProvider = (typeof reqBody?.provider === "string" ? reqBody.provider.trim().toLowerCase() : "");

  const nvidiaKey = (process.env.NVIDIA_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  const isNvidia = Boolean(nvidiaKey && nvidiaKey !== "YOUR_NVIDIA_API_KEY_HERE");
  const isGemini = Boolean(geminiKey && !geminiKey.includes("YOUR_") && !geminiKey.includes("MY_"));
  const isGroq = Boolean(groqKey && !groqKey.includes("YOUR_"));

  // Default provider from .env
  const envProv = (AI_PROVIDER as any) === "groq" ? "groq" : ((AI_PROVIDER as any) === "nvidia" ? "nvidia" : "gemini");

  let provider: "gemini" | "nvidia" | "groq" = envProv;
  let model: string = "";

  // 1. Explicit provider requested in body
  if (requestedProvider === "groq" && isGroq) {
    provider = "groq";
  } else if (requestedProvider === "nvidia" && isNvidia) {
    provider = "nvidia";
  } else if (requestedProvider === "gemini" && isGemini) {
    provider = "gemini";
  } else if (modelIdentifier) {
    // 2. Explicit model selected by user in Settings UI
    const m = modelIdentifier.toLowerCase();
    const isGroqModel = m.includes("groq") || m.includes("qwen") || m.includes("gpt-oss") || m.includes("llama-3.3") || m.includes("llama-3.1");
    const isNvidiaModel = m.includes("nvidia") || m.includes("nemotron") || m.includes("meta") || m.includes("llama") || m.includes("muse");
    const isGeminiModel = m.includes("gemini");

    if (isGroqModel && isGroq) {
      provider = "groq";
      model = modelIdentifier;
    } else if (isNvidiaModel && isNvidia) {
      provider = "nvidia";
      model = modelIdentifier;
    } else if (isGeminiModel && isGemini) {
      provider = "gemini";
      model = modelIdentifier;
    }
  }

  // 3. Fallback if the chosen provider has no valid API key configured
  if (provider === "groq" && !isGroq) {
    provider = isNvidia ? "nvidia" : (isGemini ? "gemini" : "groq");
  } else if (provider === "nvidia" && !isNvidia) {
    provider = isGroq ? "groq" : (isGemini ? "gemini" : "nvidia");
  } else if (provider === "gemini" && !isGemini) {
    provider = isGroq ? "groq" : (isNvidia ? "nvidia" : "gemini");
  }

  // 4. Default model if not explicitly resolved
  if (!model) {
    if (provider === "groq") model = GROQ_MODEL;
    else if (provider === "gemini") model = GEMINI_MODEL;
    else model = NVIDIA_MODEL;
  }

  return { provider, model };
}

function modelSupportsVision(model: string): boolean {
  const m = model.toLowerCase();
  if (m.includes("gpt-oss") || m.includes("llama-3.3") || m.includes("llama-3.1")) {
    return false;
  }
  return true;
}

function logEnvironmentSnapshot(stage: string) {
  const nvidiaKey = (process.env.NVIDIA_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  console.log(`[AI_ENV] ${JSON.stringify({
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
  })}`);
}

logEnvironmentSnapshot("vercel-api-startup");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (_req, res) => {
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
    groqTelemetry: latestGroqTelemetry,
    sessionMetrics,
    ready: isNvidiaConfigured || isGeminiConfigured || isGroqConfigured,
  });
});

app.get("/api/quotas", async (req, res) => {
  const nvidiaKey = (process.env.NVIDIA_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  const isNvidiaConfigured = Boolean(nvidiaKey && nvidiaKey !== "YOUR_NVIDIA_API_KEY_HERE");
  const isGeminiConfigured = Boolean(geminiKey && !geminiKey.includes("YOUR_") && !geminiKey.includes("MY_"));
  const isGroqConfigured = Boolean(groqKey && !groqKey.includes("YOUR_"));

  // Probe Groq live endpoint if explicitly requested (e.g. user clicked Refresh in UI)
  if (req.query.probe === "true" && isGroqConfigured) {
    try {
      const probeModel = GROQ_MODEL || "qwen/qwen3.8-27b";
      const rawRes = await getGroqClient().chat.completions.create({
        model: probeModel,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }).withResponse();
      updateGroqTelemetryFromHeaders(rawRes.response.headers);
    } catch (probeErr: any) {
      console.warn("[GROQ_PROBE] Live header probe error:", probeErr?.message || probeErr);
    }
  }

  const dynamicGroq = getDynamicGroqTelemetry();

  res.json({
    activeProvider: AI_PROVIDER,
    groq: {
      configured: isGroqConfigured,
      model: GROQ_MODEL,
      telemetryType: "live_headers",
      telemetry: dynamicGroq,
      publishedLimits: {
        note: "Transmitted live via x-ratelimit headers on every request",
        requestsPerDay: "14,400 RPD",
        tokensPerMinute: "6,000 TPM",
      },
      dashboardUrl: "https://console.groq.com/settings/limits",
    },
    gemini: {
      configured: isGeminiConfigured,
      model: GEMINI_MODEL,
      telemetryType: "published_specs",
      publishedLimits: {
        rpm: 15,
        rpd: 1500,
        tpm: 1000000,
        note: "Google AI Studio does not provide real-time headers for 200 OK responses.",
      },
      dashboardUrl: "https://aistudio.google.com/",
    },
    nvidia: {
      configured: isNvidiaConfigured,
      model: NVIDIA_MODEL,
      telemetryType: "published_specs",
      publishedLimits: {
        rpm: 40,
        note: "NVIDIA NIM operates on a fixed trial rate limit of 40 RPM.",
      },
      dashboardUrl: "https://build.nvidia.com/",
    },
    sessionMetrics,
  });
});

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
      console.error(`[GEMINI_JSON] missing-key`, { route: "/api/chat" });
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in your server environment. Please add your Google AI Studio API key (GEMINI_API_KEY) in .env to test Gemini.",
      });
    }

    if (provider === "groq" && !isGroqConfigured) {
      console.error(`[GROQ_JSON] missing-key`, { route: "/api/chat" });
      return res.status(500).json({
        error: "GROQ_API_KEY is not configured in your server environment. Please add your Groq API key (GROQ_API_KEY) in .env to test Groq.",
      });
    }

    if (provider === "nvidia" && !isNvidiaConfigured) {
      console.error(`[NVIDIA_JSON] missing-key`, { route: "/api/chat" });
      return res.status(500).json({
        error: "NVIDIA_API_KEY is not configured in your server environment.",
      });
    }

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    if (provider === "gemini") {
      console.log(`[GEMINI_JSON] provider-call-start`, {
        route: "/api/chat",
        model,
        messageCount: messages.length,
        elapsedMs: Date.now() - routeStart,
      });

      // Format for Gemini
      const formattedContents = messages
        .filter((m: any) => !m.isError && (m.content?.trim() || (m.images && m.images.length > 0)))
        .map((m: any) => {
          const parts: any[] = [];
          for (const img of m.images || []) {
            if (img.data) {
              const cleanData = img.data.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
              parts.push({
                inlineData: {
                  mimeType: img.mimeType || "image/jpeg",
                  data: cleanData,
                },
              });
            }
          }
          if (m.content?.trim()) {
            parts.push({ text: m.content.trim() });
          }
          return {
            role: m.role === "assistant" || m.role === "model" ? "model" : "user",
            parts,
          };
        });

      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model,
        contents: formattedContents as any,
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
      const isVision = modelSupportsVision(model);
      const groqMessages = messages.map((message: any) => {
        const isAssistant = message.role !== "user";
        const text = message.content?.trim() || "";

        if (isAssistant || !isVision) {
          return {
            role: isAssistant ? "assistant" : "user",
            content: text || (message.images?.length ? "[Attached Image]" : "..."),
          };
        }

        const imageParts = (message.images || [])
          .filter((img: any) => img.data)
          .map((img: any) => ({
            type: "image_url",
            image_url: { url: img.data },
          }));

        if (imageParts.length > 0) {
          const textParts = text ? [{ type: "text", text }] : [];
          return {
            role: "user",
            content: [...textParts, ...imageParts],
          };
        }

        return {
          role: "user",
          content: text || "...",
        };
      });

      console.log(`[GROQ_JSON] provider-call-start`, {
        route: "/api/chat",
        model,
        messageCount: messages.length,
        elapsedMs: Date.now() - routeStart,
      });

      const client = getGroqClient();
      let responseText = "";
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: groqMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
          temperature: 0.7,
          max_tokens: 8192,
          stream: false,
        });
        responseText = completion.choices?.[0]?.message?.content || "";
      } catch (chatErr: any) {
        if (typeof (client.responses as any)?.create === "function") {
          const lastMsg = messages[messages.length - 1];
          const resp = await (client.responses as any).create({
            model,
            input: lastMsg?.content || "",
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
      const nvidiaMessages = messages.map((message: any) => {
        const content: any[] = [];
        if (message.content?.trim()) {
          content.push({ type: "text", text: message.content.trim() });
        }
        for (const image of message.images || []) {
          if (image.data) {
            content.push({ type: "image_url", image_url: { url: image.data } });
          }
        }
        return {
          role: message.role === "user" ? "user" : "assistant",
          content: content.length === 1 && content[0].type === "text" ? content[0].text : content,
        };
      });

      console.log(`[NVIDIA_JSON] provider-call-start`, {
        route: "/api/chat",
        model,
        messageCount: messages.length,
        elapsedMs: Date.now() - routeStart,
      });

      const client = new OpenAI({
        apiKey: nvidiaKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });

      const completion = await client.chat.completions.create({
        model,
        messages: nvidiaMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: 1,
        top_p: 0.95,
        max_tokens: 8192,
        stream: false,
      });

      const responseText = completion.choices?.[0]?.message?.content || "";
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
    const status = Number(error?.status) || Number(error?.response?.status) || 502;
    const providerError = error?.error || error?.response?.data?.error || error?.response?.data;
    let message = typeof providerError === "string"
      ? providerError
      : providerError?.message || error?.message || "API request failed.";

    // Security: Redact potential raw API keys from error messages
    message = message.replace(/nvapi-[A-Za-z0-9_-]{20,}/g, "nvapi-[REDACTED]");
    message = message.replace(/gsk_[A-Za-z0-9_-]{20,}/g, "gsk_[REDACTED]");
    message = message.replace(/AIza[0-9A-Za-z-_]{35}/g, "AIza[REDACTED]");

    console.error(`[CHAT_ERROR]`, {
      route: "/api/chat",
      status,
      message,
      provider,
      model,
      elapsedMs: Date.now() - routeStart,
      stack: error?.stack,
    });

    res.status(status >= 400 && status < 600 ? status : 502).json({ error: message });
  }
});

app.post("/api/chat/stream", async (req, res) => {
  if (process.env.VERCEL) {
    console.warn(`[NVIDIA_STREAM] route-disabled-vercel-serverless`, {
      route: "/api/chat/stream",
      vercel: process.env.VERCEL || "undefined",
      vercelEnv: process.env.VERCEL_ENV || "undefined",
      nodeEnv: process.env.NODE_ENV || "undefined",
      model: NVIDIA_MODEL,
    });
    return res.status(501).json({
      error: "Streaming route is disabled on Vercel serverless. Use /api/chat for production. Streaming is available only on a long-lived local or dedicated backend server.",
    });
  }

  const routeStart = Date.now();
  const apiKey = (process.env.NVIDIA_API_KEY || "").trim();
  const apiKeyRead = Boolean(apiKey && apiKey !== "YOUR_NVIDIA_API_KEY_HERE");
  console.log(`[NVIDIA_STREAM] request-start`, {
    route: "/api/chat/stream",
    vercel: process.env.VERCEL || "undefined",
    vercelEnv: process.env.VERCEL_ENV || "undefined",
    nodeEnv: process.env.NODE_ENV || "undefined",
    nvidiaModel: NVIDIA_MODEL,
    nvidiaApiKeyConfigured: apiKeyRead,
    nvidiaApiKeyLength: apiKey.length,
    messageCount: Array.isArray(req.body?.messages) ? req.body.messages.length : 0,
  });

  try {
    if (!apiKey || apiKey === "YOUR_NVIDIA_API_KEY_HERE") {
      console.error(`[NVIDIA_STREAM] missing-key`, {
        route: "/api/chat/stream",
        vercel: process.env.VERCEL || "undefined",
        vercelEnv: process.env.VERCEL_ENV || "undefined",
        nodeEnv: process.env.NODE_ENV || "undefined",
        nvidiaApiKeyConfigured: false,
      });
      return res.status(500).json({ error: "NVIDIA_API_KEY is not configured in your server environment." });
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
          content.push({ type: "image_url", image_url: { url: image.data } });
        }
      }
      return {
        role: message.role === "user" ? "user" : "assistant",
        content: content.length === 1 && content[0].type === "text" ? content[0].text : content,
      };
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    console.log(`[NVIDIA_STREAM] provider-call-start`, {
      route: "/api/chat/stream",
      vercel: process.env.VERCEL || "undefined",
      vercelEnv: process.env.VERCEL_ENV || "undefined",
      nodeEnv: process.env.NODE_ENV || "undefined",
      model: NVIDIA_MODEL,
      messageCount: nvidiaMessages.length,
      elapsedMs: Date.now() - routeStart,
    });

    const client = new OpenAI({
      apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    const stream = await client.chat.completions.create({
      model: NVIDIA_MODEL,
      messages: nvidiaMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 8192,
      stream: true,
    });

    for await (const chunk of stream) {
      const chunkText = chunk.choices[0]?.delta?.content || "";
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    console.log(`[NVIDIA_STREAM] provider-call-complete`, {
      route: "/api/chat/stream",
      vercel: process.env.VERCEL || "undefined",
      vercelEnv: process.env.VERCEL_ENV || "undefined",
      nodeEnv: process.env.NODE_ENV || "undefined",
      model: NVIDIA_MODEL,
      elapsedMs: Date.now() - routeStart,
    });
  } catch (error: any) {
    const status = Number(error?.status) || Number(error?.response?.status) || 502;
    const providerError = error?.error || error?.response?.data?.error || error?.response?.data;
    const message = typeof providerError === "string"
      ? providerError
      : providerError?.message || error?.message || "NVIDIA API request failed.";

    console.error(`[NVIDIA_STREAM] provider-error`, {
      route: "/api/chat/stream",
      status,
      message,
      vercel: process.env.VERCEL || "undefined",
      vercelEnv: process.env.VERCEL_ENV || "undefined",
      nodeEnv: process.env.NODE_ENV || "undefined",
      model: NVIDIA_MODEL,
      elapsedMs: Date.now() - routeStart,
      stack: error?.stack,
    });

    if (!res.headersSent) {
      return res.status(status >= 400 && status < 600 ? status : 502).json({ error: message });
    }

    res.write(`data: ${JSON.stringify({ error: message, status })}\n\n`);
    res.end();
  }
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

export default app;
