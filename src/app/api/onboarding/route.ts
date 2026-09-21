import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { voice, track } from "@/lib/repo";
import { body, handle, ok } from "@/lib/api";
export async function POST(req: Request) {
  try {
    const u = await requireUser(); const b = await body<{ writes: string[]; languages: string[]; help: string[] }>(req);
    getDb().prepare("UPDATE profiles SET onboarding_json = ? WHERE user_id = ?").run(JSON.stringify(b), u.id);
    const cur = voice.get(u.id).manual; voice.setManual(u.id, { ...cur, languages: b.languages, themes: cur.themes ?? [], structures: b.writes });
    track("onboarded", u.id); return ok({ ok: true });
  } catch (e) { return handle(e); }
}
