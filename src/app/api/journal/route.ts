import { requireUser } from "@/lib/auth";
import { journal, track } from "@/lib/repo";
import { body, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try { const u = await requireUser(); const q = new URL(req.url).searchParams.get("q") || undefined; return ok({ entries: await journal.list(u.id, q), streak: await journal.streak(u.id) }); } catch (e) { return handle(e); }
}
export async function POST(req: Request) {
  try { const u = await requireUser(); const e = await journal.upsert(u.id, await body(req)); track("journal_saved", u.id); return ok({ entry: e }); } catch (e) { return handle(e); }
}
export async function DELETE(req: Request) {
  try { const u = await requireUser(); const { id } = await body<{ id: string }>(req); return ok({ ok: await journal.remove(u.id, id) }); } catch (e) { return handle(e); }
}
