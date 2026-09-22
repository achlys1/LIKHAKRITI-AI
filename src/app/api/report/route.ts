import { getSessionUser } from "@/lib/auth";
import { reportDoc } from "@/lib/repo";
import { body, ok } from "@/lib/api";
export async function POST(req: Request) { const u = await getSessionUser(); const { documentId, reason } = await body<{ documentId: string; reason: string }>(req); if (documentId) await reportDoc(documentId, u?.id ?? null, (reason || "").slice(0, 500)); return ok({ ok: true }); }
