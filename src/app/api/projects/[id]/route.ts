import { requireUser } from "@/lib/auth";
import { docs, projects } from "@/lib/repo";
import { body, fail, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Ctx) {
  try { const u = await requireUser(); const { id } = await params; const p = await projects.get(u.id, id); if (!p) return fail("Not found", 404); return ok({ project: p, chapters: (await docs.list(u.id, { projectId: id })).sort((a, b) => a.created_at - b.created_at) }); } catch (e) { return handle(e); }
}
export async function PATCH(req: Request, { params }: Ctx) {
  try { const u = await requireUser(); const { id } = await params; const p = await projects.update(u.id, id, await body(req)); return p ? ok({ project: p }) : fail("Not found", 404); } catch (e) { return handle(e); }
}
export async function DELETE(_: Request, { params }: Ctx) {
  try { const u = await requireUser(); const { id } = await params; return ok({ ok: await projects.remove(u.id, id) }); } catch (e) { return handle(e); }
}
