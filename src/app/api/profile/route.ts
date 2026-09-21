import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { body, fail, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  try { const u = await requireUser(); const p = getDb().prepare("SELECT * FROM profiles WHERE user_id = ?").get(u.id) as Record<string, unknown>; return ok({ profile: { ...p, links: JSON.parse((p.links_json as string) || "{}"), settings: JSON.parse((p.settings_json as string) || "{}"), onboarding: JSON.parse((p.onboarding_json as string) || "{}") }, email: u.email, plan: u.plan, role: u.role }); } catch (e) { return handle(e); }
}
export async function PATCH(req: Request) {
  try {
    const u = await requireUser();
    const s = z.object({ username: z.string().regex(/^[a-z0-9_]{3,24}$/).optional(), display_name: z.string().max(60).optional(), bio: z.string().max(600).optional(), avatar_url: z.string().max(500).optional(), links: z.record(z.string(), z.string().max(300)).optional(), is_public: z.boolean().optional(), settings: z.record(z.string(), z.any()).optional(), onboarding: z.record(z.string(), z.any()).optional() }).safeParse(await body(req));
    if (!s.success) return fail("Username: 3–24 lowercase letters, numbers or underscores.");
    const d = s.data; const db = getDb();
    if (d.username) { const taken = db.prepare("SELECT user_id FROM profiles WHERE username = ? AND user_id != ?").get(d.username, u.id); if (taken) return fail("That username is already someone's ink.", 409); }
    const cur = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(u.id) as Record<string, string>;
    db.prepare("UPDATE profiles SET username = ?, display_name = ?, bio = ?, avatar_url = ?, links_json = ?, is_public = ?, settings_json = ?, onboarding_json = ? WHERE user_id = ?")
      .run(d.username ?? cur.username, d.display_name ?? cur.display_name, d.bio ?? cur.bio, d.avatar_url ?? cur.avatar_url, JSON.stringify(d.links ?? JSON.parse(cur.links_json || "{}")), d.is_public === undefined ? cur.is_public : d.is_public ? 1 : 0, JSON.stringify({ ...JSON.parse(cur.settings_json || "{}"), ...(d.settings || {}) }), JSON.stringify(d.onboarding ?? JSON.parse(cur.onboarding_json || "{}")), u.id);
    return ok({ ok: true });
  } catch (e) { return handle(e); }
}
