import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { runAI } from "@/lib/ai/orchestrator";
import { voice } from "@/lib/repo";
import { providerStatus } from "@/lib/ai/providers";
import type { AIRequest, Task } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TASKS: Task[] = ["chat","write","continue","rewrite","refine","humanize","deepen","simplify","translate","analyze","title","caption","prompt","idea","why","lab","first_reader","seo","social","author","poem","creator"];
const schema = z.object({
  task: z.enum(TASKS as [Task, ...Task[]]),
  input: z.string().max(20000).default(""),
  instruction: z.string().max(4000).optional(),
  options: z.record(z.string(), z.any()).optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string().max(20000) })).max(40).optional(),
  documentTitle: z.string().max(300).optional(),
  useVoice: z.boolean().optional(),
});

// simple in-memory rate limit per ip/user (swap for Redis in prod)
const hits = new Map<string, { n: number; t: number }>();
function limited(key: string, max = 60) {
  const now = Date.now(); const h = hits.get(key);
  if (!h || now - h.t > 60_000) { hits.set(key, { n: 1, t: now }); return false; }
  h.n++; return h.n > max;
}

export async function GET() { return Response.json(providerStatus()); }

export async function POST(req: Request) {
  const user = await getSessionUser();
  const key = user?.id || req.headers.get("x-forwarded-for") || "anon";
  if (limited(key, user ? 90 : 30)) return Response.json({ error: "You're writing faster than the ink can dry. Give it a minute." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "That request didn't make sense to the ink. Try again." }, { status: 400 });
  const d = parsed.data;
  if (!d.input.trim() && !d.instruction?.trim() && d.task !== "prompt") return Response.json({ error: "Give me a few words first." }, { status: 400 });

  const aiReq: AIRequest = {
    task: d.task, input: d.input, instruction: d.instruction, options: d.options, history: d.history,
    documentTitle: d.documentTitle, userId: user?.id ?? null,
    voice: user && d.useVoice !== false ? ((await voice.get(user.id)) as unknown as AIRequest["voice"]) : null,
  };
  const ac = new AbortController();
  req.signal.addEventListener("abort", () => ac.abort());
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of runAI(aiReq, ac.signal)) controller.enqueue(enc.encode(chunk));
      } catch (e) {
        controller.enqueue(enc.encode(`\n\n⟂ ${e instanceof Error ? e.message : "Something interrupted the ink. Try again."}`));
      } finally { controller.close(); }
    },
    cancel() { ac.abort(); },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-likhakriti-provider": providerStatus().provider } });
}
