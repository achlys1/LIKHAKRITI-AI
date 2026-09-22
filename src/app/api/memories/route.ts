import { requireUser } from "@/lib/auth";
import { memories } from "@/lib/repo";
import { body, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() { try { const u = await requireUser(); return ok({ memories: await memories.list(u.id) }); } catch (e) { return handle(e); } }
export async function POST(req: Request) { try { const u = await requireUser(); return ok({ memory: await memories.create(u.id, await body(req)) }); } catch (e) { return handle(e); } }
export async function DELETE(req: Request) { try { const u = await requireUser(); const { id } = await body<{ id: string }>(req); return ok({ ok: await memories.remove(u.id, id) }); } catch (e) { return handle(e); } }
