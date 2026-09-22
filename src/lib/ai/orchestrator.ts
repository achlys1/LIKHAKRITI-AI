/**
 * Likhakriti AI Orchestrator
 *   AI Provider → Orchestrator → Task Router → Engine prompt → stream
 * Context selection: current document > user instructions > voice profile > history (trimmed).
 */
import { getProvider, localProvider, ProviderError } from "./providers";
import { buildSystemPrompt, buildUserMessage, ENGINE_FOR_TASK } from "./persona";
import type { AIRequest, ChatMessage } from "./types";
import { logUsage, track } from "../repo";

const MAX_HISTORY = 12;
const MAX_HISTORY_CHARS = 9000;

export function selectContext(req: AIRequest): ChatMessage[] {
  const system = buildSystemPrompt(req);
  const msgs: ChatMessage[] = [{ role: "system", content: system }];
  // trimmed history (most recent first, bounded by chars)
  const hist = (req.history || []).filter((m) => m.role !== "system").slice(-MAX_HISTORY);
  let budget = MAX_HISTORY_CHARS;
  const kept: ChatMessage[] = [];
  for (let i = hist.length - 1; i >= 0; i--) {
    const c = hist[i].content.slice(0, 4000);
    if (budget - c.length < 0) break;
    budget -= c.length;
    kept.unshift({ role: hist[i].role, content: c });
  }
  msgs.push(...kept);
  const user = buildUserMessage(req).slice(0, 12000);
  // avoid duplicating the last user message if the client already included it in history
  if (!(kept.length && kept[kept.length - 1].role === "user" && kept[kept.length - 1].content === user)) msgs.push({ role: "user", content: user });
  return msgs;
}

export async function* runAI(req: AIRequest, signal?: AbortSignal): AsyncGenerator<string> {
  const provider = getProvider();
  const engine = ENGINE_FOR_TASK[req.task];
  const messages = selectContext(req);
  const tokensIn = Math.round(messages.reduce((n, m) => n + m.content.length, 0) / 4);
  let out = 0;
  const temp = req.task === "analyze" || req.task === "why" || req.task === "seo" || req.task === "refine" ? 0.5 : req.task === "poem" || req.task === "lab" || req.task === "write" ? 0.9 : 0.75;
  const attempt = async function* (p: typeof provider) {
    for await (const chunk of p.stream(messages, { temperature: temp, signal })) { out += chunk.length; yield chunk; }
  };
  try {
    try {
      yield* attempt(provider);
      logUsage({ userId: req.userId, task: req.task, engine, provider: provider.name, tokensIn, tokensOut: Math.round(out / 4), ok: true });
      track("ai_request", req.userId, { task: req.task, engine, provider: provider.name, mode: req.options?.mode });
    } catch (e) {
      if (signal?.aborted) return;
      const err = e instanceof Error ? e.message : String(e);
      console.error("[likhakriti-ai]", req.task, provider.name, err);
      logUsage({ userId: req.userId, task: req.task, engine, provider: provider.name, tokensIn, ok: false, error: err.slice(0, 300) });
      // Fall back to the offline engine when the remote provider failed before producing output
      // (rate limit / free quota exhausted / upstream down / network error). Never fall back mid-stream.
      const canFallback = provider.name !== "local" && out === 0 && (!(e instanceof ProviderError) || e.retryable || e.status === 401 || e.status === 403 || e.status === 404);
      if (!canFallback) throw e;
      const local = localProvider();
      console.warn("[likhakriti-ai] falling back to local engine for", req.task);
      yield* attempt(local);
      logUsage({ userId: req.userId, task: req.task, engine, provider: "local(fallback)", tokensIn, tokensOut: Math.round(out / 4), ok: true });
      track("ai_fallback", req.userId, { task: req.task, from: provider.name, reason: err.slice(0, 80) });
    }
  } catch (e) {
    if (signal?.aborted) return;
    console.error("[likhakriti-ai] unrecoverable", req.task, e);
    throw new Error("Something interrupted the ink. Try again.");
  }
}
