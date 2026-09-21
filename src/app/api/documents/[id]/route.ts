import { requireUser } from "@/lib/auth";
import { docs, track } from "@/lib/repo";
import { body, fail, handle, ok } from "@/lib/api";
import { learnVoice } from "@/lib/voiceLearn";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Ctx) {
  try { const u = await requireUser(); const { id } = await params; const d = docs.get(u.id, id); return d ? ok({ document: d }) : fail("That page doesn't exist — or isn't yours.", 404); } catch (e) { return handle(e); }
}
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const u = await requireUser(); const { id } = await params; const b = await body<Record<string, unknown> & { _snapshot?: boolean; _label?: string }>(req);
    const { _snapshot, _label, ...patch } = b;
    const before = docs.get(u.id, id);
    const d = docs.update(u.id, id, patch, { snapshot: !!_snapshot, label: _label });
    if (!d) return fail("That page doesn't exist — or isn't yours.", 404);
    if (before && before.visibility !== d.visibility && (d.visibility === "public" || d.visibility === "unlisted")) track("published", u.id, { kind: d.kind });
    if (_snapshot && Math.random() < 0.2) learnVoice(u.id); // opportunistic voice learning
    return ok({ document: d });
  } catch (e) { return handle(e); }
}
export async function DELETE(_: Request, { params }: Ctx) {
  try { const u = await requireUser(); const { id } = await params; return ok({ ok: docs.remove(u.id, id) }); } catch (e) { return handle(e); }
}
