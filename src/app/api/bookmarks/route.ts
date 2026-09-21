import { requireUser } from "@/lib/auth";
import { bookmarks } from "@/lib/repo";
import { body, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() { try { const u = await requireUser(); return ok({ bookmarks: bookmarks.list(u.id) }); } catch (e) { return handle(e); } }
export async function POST(req: Request) { try { const u = await requireUser(); const { documentId } = await body<{ documentId: string }>(req); return ok({ saved: bookmarks.toggle(u.id, documentId) }); } catch (e) { return handle(e); } }
