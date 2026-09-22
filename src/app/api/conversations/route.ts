import { requireUser } from "@/lib/auth";
import { conversations } from "@/lib/repo";
import { body, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try { const u = await requireUser(); const id = new URL(req.url).searchParams.get("id"); if (id) { const c = await conversations.get(u.id, id); return ok({ conversation: c ? { ...c, messages: JSON.parse(c.messages_json) } : null }); } return ok({ conversations: await conversations.list(u.id) }); } catch (e) { return handle(e); }
}
export async function POST(req: Request) {
  try { const u = await requireUser(); const b = await body<{ id?: string; messages: unknown[]; title: string }>(req); return ok({ id: await conversations.save(u.id, b.id ?? null, b.messages ?? [], (b.title || "").slice(0, 80)) }); } catch (e) { return handle(e); }
}
export async function DELETE(req: Request) { try { const u = await requireUser(); const { id } = await body<{ id: string }>(req); return ok({ ok: await conversations.remove(u.id, id) }); } catch (e) { return handle(e); } }
