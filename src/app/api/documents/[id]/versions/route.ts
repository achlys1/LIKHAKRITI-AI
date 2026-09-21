import { requireUser } from "@/lib/auth";
import { docs } from "@/lib/repo";
import { handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const u = await requireUser(); const { id } = await params; return ok({ versions: docs.versions(u.id, id) }); } catch (e) { return handle(e); }
}
