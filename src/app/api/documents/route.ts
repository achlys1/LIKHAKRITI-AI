import { requireUser } from "@/lib/auth";
import { docs, track } from "@/lib/repo";
import { body, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try { const u = await requireUser(); const url = new URL(req.url); return ok({ documents: await docs.list(u.id, { kind: url.searchParams.get("kind") || undefined, projectId: url.searchParams.get("project") || undefined }) }); } catch (e) { return handle(e); }
}
export async function POST(req: Request) {
  try { const u = await requireUser(); const b = await body(req); const d = await docs.create(u.id, b); track("document_created", u.id, { kind: d.kind }); return ok({ document: d }); } catch (e) { return handle(e); }
}
