import { requireUser } from "@/lib/auth";
import { voice } from "@/lib/repo";
import { learnVoice } from "@/lib/voiceLearn";
import { body, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() { try { const u = await requireUser(); return ok(voice.get(u.id)); } catch (e) { return handle(e); } }
export async function PUT(req: Request) { try { const u = await requireUser(); voice.setManual(u.id, await body(req)); return ok(voice.get(u.id)); } catch (e) { return handle(e); } }
export async function POST() { try { const u = await requireUser(); const learned = learnVoice(u.id); return ok({ ...voice.get(u.id), learned }); } catch (e) { return handle(e); } }
