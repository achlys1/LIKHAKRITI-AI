import { requireUser } from "@/lib/auth";
import { projects } from "@/lib/repo";
import { body, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() { try { const u = await requireUser(); return ok({ projects: projects.list(u.id) }); } catch (e) { return handle(e); } }
export async function POST(req: Request) { try { const u = await requireUser(); return ok({ project: projects.create(u.id, await body(req)) }); } catch (e) { return handle(e); } }
