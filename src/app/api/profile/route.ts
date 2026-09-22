import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { get, run } from "@/lib/db";
import { body, fail, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
type Prof = { username: string; display_name: string; bio: string; avatar_url: string; links_json: string; is_public: number; settings_json: string; onboarding_json: string };
export async function GET() {
  try { const u = await requireUser(); const p = (await get<Prof>("SELECT * FROM profiles WHERE user_id = ?", [u.id]))!; return ok({ profile: { ...p, is_public: Number(p.is_public), links: JSON.parse(p.links_json || "{}"), settings: JSON.parse(p.settings_json || "{}"), onboarding: JSON.parse(p.onboarding_json || "{}") }, email: u.email, plan: u.plan, role: u.role }); } catch (e) { return handle(e); }
}
export async function PATCH(req: Request) {
  try {
    const u = await requireUser();
    const s = z.object({ username: z.string().regex(/^[a-z0-9_]{3,24}$/).optional(), display_name: z.string().max(60).optional(), bio: z.string().max(600).optional(), avatar_url: z.string().max(500).optional(), links: z.record(z.string(), z.string().max(300)).optional(), is_public: z.boolean().optional(), settings: z.record(z.string(), z.any()).optional(), onboarding: z.record(z.string(), z.any()).optional() }).safeParse(await body(req));
    if (!s.success) return fail("Username: 3–24 lowercase letters, numbers or underscores.");
    const d = s.data;
    if (d.username) { const taken = await get("SELECT user_id FROM profiles WHERE username = ? AND user_id != ?", [d.username, u.id]); if (taken) return fail("That username is already someone's ink.", 409); }
    const cur = (await get<Prof>("SELECT * FROM profiles WHERE user_id = ?", [u.id]))!;
    await run("UPDATE profiles SET username = ?, display_name = ?, bio = ?, avatar_url = ?, links_json = ?, is_public = ?, settings_json = ?, onboarding_json = ? WHERE user_id = ?",
      [d.username ?? cur.username, d.display_name ?? cur.display_name, d.bio ?? cur.bio, d.avatar_url ?? cur.avatar_url, JSON.stringify(d.links ?? JSON.parse(cur.links_json || "{}")), d.is_public === undefined ? Number(cur.is_public) : d.is_public ? 1 : 0, JSON.stringify({ ...JSON.parse(cur.settings_json || "{}"), ...(d.settings || {}) }), JSON.stringify(d.onboarding ?? JSON.parse(cur.onboarding_json || "{}")), u.id]);
    return ok({ ok: true });
  } catch (e) { return handle(e); }
}
