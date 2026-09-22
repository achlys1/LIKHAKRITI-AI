import { requireUser } from "@/lib/auth";
import { run } from "@/lib/db";
import { voice, track } from "@/lib/repo";
import { body, handle, ok } from "@/lib/api";
export async function POST(req: Request) {
  try {
    const u = await requireUser(); const b = await body<{ writes: string[]; languages: string[]; help: string[] }>(req);
    await run("UPDATE profiles SET onboarding_json = ? WHERE user_id = ?", [JSON.stringify(b), u.id]);
    const cur = (await voice.get(u.id)).manual; await voice.setManual(u.id, { ...cur, languages: b.languages, themes: cur.themes ?? [], structures: b.writes });
    track("onboarded", u.id); return ok({ ok: true });
  } catch (e) { return handle(e); }
}
