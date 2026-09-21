/**
 * Provider abstraction. Swap providers via AI_PROVIDER env.
 *  - openai    : any OpenAI-compatible chat completions endpoint (OpenAI, Groq, OpenRouter, Together, Ollama…)
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

function openAICompatible(): AIProvider {
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  return {
    name: "openai",
    model,
    async *stream(messages, { temperature = 0.8, maxTokens = 1400, signal }) {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: true }),
        signal,
      });
      if (!res.ok || !res.body) throw new Error(`provider ${res.status}: ${(await res.text()).slice(0, 300)}`);
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
      if (!res.ok || !res.body) throw new Error(`provider ${res.status}: ${(await res.text()).slice(0, 300)}`);
      for await (const data of sseLines(res, signal)) {
        try { const j = JSON.parse(data); if (j.type === "content_block_delta" && j.delta?.text) yield j.delta.text as string; } catch { /* ignore */ }
      }
    },
  };
}

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
  if (p === "openai" && process.env.OPENAI_API_KEY) return openAICompatible();
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return anthropic();
  if (!p || p === "local") {
    if (process.env.OPENAI_API_KEY) return openAICompatible();
    if (process.env.ANTHROPIC_API_KEY) return anthropic();
  }
  return local();
}

export function providerStatus() {
  const p = getProvider();
  return { provider: p.name, model: p.model, live: p.name !== "local" };
}
