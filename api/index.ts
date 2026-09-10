import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

dotenv.config({ path: ".env.local", override: true });

const app = express();
const NVIDIA_MODEL = (process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct").trim();

function logEnvironmentSnapshot(stage: string) {
  const apiKey = (process.env.NVIDIA_API_KEY || "").trim();
  const apiKeyRead = Boolean(apiKey && apiKey !== "YOUR_NVIDIA_API_KEY_HERE");
  console.log(`[NVIDIA_ENV] ${JSON.stringify({
    stage,
    nodeEnv: process.env.NODE_ENV || "undefined",
    vercel: process.env.VERCEL || "undefined",
    vercelEnv: process.env.VERCEL_ENV || "undefined",
    nvidiaModel: NVIDIA_MODEL,
    nvidiaApiKeyConfigured: apiKeyRead,
    nvidiaApiKeyLength: apiKey.length,
    envFileLoaded: Boolean(process.env.NVIDIA_API_KEY),
    cwd: process.cwd(),
  })}`);
}

logEnvironmentSnapshot("vercel-api-startup");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", name: "Vishwamedha AI", ready: !!process.env.NVIDIA_API_KEY });
});

app.post("/api/chat", async (req, res) => {
  const routeStart = Date.now();
  const apiKey = (process.env.NVIDIA_API_KEY || "").trim();
  const apiKeyRead = Boolean(apiKey && apiKey !== "YOUR_NVIDIA_API_KEY_HERE");
  console.log(`[NVIDIA_JSON] request-start`, {
    route: "/api/chat",
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
      console.error(`[NVIDIA_JSON] missing-key`, {
        route: "/api/chat",
        vercel: process.env.VERCEL || "undefined",
        vercelEnv: process.env.VERCEL_ENV || "undefined",
        nodeEnv: process.env.NODE_ENV || "undefined",
        nvidiaApiKeyConfigured: false,
        nvidiaModel: NVIDIA_MODEL,
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

    console.log(`[NVIDIA_JSON] provider-call-start`, {
      route: "/api/chat",
      vercel: process.env.VERCEL || "undefined",
      vercelEnv: process.env.VERCEL_ENV || "undefined",
      nodeEnv: process.env.NODE_ENV || "undefined",
      model: NVIDIA_MODEL,
      messageCount: messages.length,
      elapsedMs: Date.now() - routeStart,
    });

    const client = new OpenAI({
      apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    const completion = await client.chat.completions.create({
      model: NVIDIA_MODEL,
      messages: nvidiaMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 8192,
      stream: false,
    });

    console.log(`[NVIDIA_JSON] provider-call-complete`, {
      route: "/api/chat",
      vercel: process.env.VERCEL || "undefined",
      vercelEnv: process.env.VERCEL_ENV || "undefined",
      nodeEnv: process.env.NODE_ENV || "undefined",
      model: NVIDIA_MODEL,
      elapsedMs: Date.now() - routeStart,
      responseLength: completion.choices?.[0]?.message?.content?.length || 0,
    });

    res.json({ text: completion.choices[0]?.message?.content || "" });
  } catch (error: any) {
    const status = Number(error?.status) || Number(error?.response?.status) || 502;
    const providerError = error?.error || error?.response?.data?.error || error?.response?.data;
    const message = typeof providerError === "string"
      ? providerError
      : providerError?.message || error?.message || "NVIDIA API request failed.";

    console.error(`[NVIDIA_JSON] provider-error`, {
      route: "/api/chat",
      status,
      message,
      vercel: process.env.VERCEL || "undefined",
      vercelEnv: process.env.VERCEL_ENV || "undefined",
      nodeEnv: process.env.NODE_ENV || "undefined",
      model: NVIDIA_MODEL,
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
