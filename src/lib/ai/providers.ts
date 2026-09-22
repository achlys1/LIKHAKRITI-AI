/**
 * Provider abstraction. Swap providers via AI_PROVIDER env.
 *  - openrouter: OpenRouter (default model "openrouter/free" — routes to free models; no paid key needed)
 *  - openai    : any OpenAI-compatible chat completions endpoint (OpenAI, Groq, Together, Ollama…)
 *  - anthropic : Anthropic Messages API
 *  - local     : offline heuristic engine (no key; used for demo / fallback)
 */
import type { AIProvider, ChatMessage } from "./types";
import { localRespond } from "./local";

async function* sseLines(res: Response, signal?: AbortSignal) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    if (signal?.aborted) { reader.cancel(); return; }
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() || "";
    for (const line of parts) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") return;
      yield data;
    }
  }
}

/** Thrown for errors where falling back to the local engine makes sense (rate limit, quota, upstream down). */
export class ProviderError extends Error {
  constructor(message: string, public status: number, public retryable: boolean) { super(message); }
}

function openAICompatible(cfg: { name: string; base: string; key: string; model: string; extraHeaders?: Record<string, string>; extraBody?: Record<string, unknown> }): AIProvider {
  const { name, base, key, model } = cfg;
  return {
    name,
    model,
    async *stream(messages, { temperature = 0.8, maxTokens = 1400, signal }) {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}`, ...(cfg.extraHeaders || {}) },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: true, ...(cfg.extraBody || {}) }),
        signal,
      });
      if (!res.ok || !res.body) {
        const text = (await res.text().catch(() => "")).slice(0, 300);
        // 402 = credits exhausted, 429 = rate/free limit, 5xx/408/409 = upstream trouble → retryable (fall back to local)
        const retryable = res.status === 402 || res.status === 429 || res.status === 408 || res.status === 409 || res.status >= 500;
        throw new ProviderError(`${name} ${res.status}: ${text}`, res.status, retryable);
      }
      for await (const data of sseLines(res, signal)) {
        try { const j = JSON.parse(data); const d = j.choices?.[0]?.delta?.content; if (d) yield d as string; } catch { /* ignore keepalives */ }
      }
    },
  };
}

function anthropic(): AIProvider {
  const model = process.env.AI_MODEL || "claude-3-5-haiku-latest";
  return {
    name: "anthropic",
    model,
    async *stream(messages, { temperature = 0.8, maxTokens = 1400, signal }) {
      const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
      const rest = messages.filter((m) => m.role !== "system");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, system, messages: rest, temperature, max_tokens: maxTokens, stream: true }),
        signal,
      });
      if (!res.ok || !res.body) { const t = (await res.text().catch(() => "")).slice(0, 300); throw new ProviderError(`anthropic ${res.status}: ${t}`, res.status, res.status === 429 || res.status >= 500); }
      for await (const data of sseLines(res, signal)) {
        try { const j = JSON.parse(data); if (j.type === "content_block_delta" && j.delta?.text) yield j.delta.text as string; } catch { /* ignore */ }
      }
    },
  };
}

function openRouter(): AIProvider {
  const model = process.env.AI_MODEL || "openrouter/free";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://likhakriti.app";
  return openAICompatible({
    name: "openrouter",
    base: "https://openrouter.ai/api/v1",
    key: process.env.OPENROUTER_API_KEY || "",
    model,
    // OpenRouter attributes usage to the app; these headers are optional but recommended.
    extraHeaders: { "HTTP-Referer": site, "X-Title": "Likhakriti AI" },
    // Optional ordered fallback list of free models, e.g. "meta-llama/llama-3.3-70b-instruct:free,google/gemma-3-27b-it:free"
    extraBody: process.env.OPENROUTER_FALLBACK_MODELS ? { models: process.env.OPENROUTER_FALLBACK_MODELS.split(",").map((m) => m.trim()).filter(Boolean) } : undefined,
  });
}

function openAI(): AIProvider {
  return openAICompatible({ name: "openai", base: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""), key: process.env.OPENAI_API_KEY || "", model: process.env.AI_MODEL || "gpt-4o-mini" });
}

export function localProvider(): AIProvider { return local(); }

function local(): AIProvider {
  return {
    name: "local",
    model: "likhakriti-local-heuristic",
    async *stream(messages: ChatMessage[], { signal }) {
      const text = localRespond(messages);
      // stream in small chunks so the UX matches remote providers
      const chunks = text.match(/[\s\S]{1,14}/g) || [];
      for (const c of chunks) {
        if (signal?.aborted) return;
        yield c;
        await new Promise((r) => setTimeout(r, 10));
      }
    },
  };
}

export function getProvider(): AIProvider {
  const p = (process.env.AI_PROVIDER || "").toLowerCase();
  if (p === "openrouter" && process.env.OPENROUTER_API_KEY) return openRouter();
  if (p === "openai" && process.env.OPENAI_API_KEY) return openAI();
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return anthropic();
  if (!p || p === "local" || p === "auto") {
    if (process.env.OPENROUTER_API_KEY) return openRouter();
    if (process.env.OPENAI_API_KEY) return openAI();
    if (process.env.ANTHROPIC_API_KEY) return anthropic();
  }
  return local();
}

export function providerStatus() {
  const p = getProvider();
  return { provider: p.name, model: p.model, live: p.name !== "local" };
}
