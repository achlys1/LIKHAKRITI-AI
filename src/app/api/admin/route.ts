import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/repo";
import { providerStatus } from "@/lib/ai/providers";
import { body, fail, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
async function admin() { const u = await requireUser(); if (u.role !== "admin") throw Object.assign(new Error("Admins only."), { status: 403 }); return u; }
export async function GET() {
  try {
    await admin(); const db = getDb(); const day = Date.now() - 86400000; const week = Date.now() - 7 * 86400000;
    const q = <T,>(sql: string, ...a: unknown[]) => db.prepare(sql).all(...a) as T[];
    const g = <T,>(sql: string, ...a: unknown[]) => db.prepare(sql).get(...a) as T;
    return ok({
      health: { db: "ok", provider: providerStatus(), uptime: process.uptime(), memoryMB: Math.round(process.memoryUsage().rss / 1e6) },
      counts: { users: g<{ c: number }>("SELECT COUNT(*) c FROM users").c, activeDay: g<{ c: number }>("SELECT COUNT(*) c FROM users WHERE last_seen_at > ?", day).c, activeWeek: g<{ c: number }>("SELECT COUNT(*) c FROM users WHERE last_seen_at > ?", week).c, documents: g<{ c: number }>("SELECT COUNT(*) c FROM documents").c, poems: g<{ c: number }>("SELECT COUNT(*) c FROM documents WHERE kind='poem'").c, published: g<{ c: number }>("SELECT COUNT(*) c FROM documents WHERE visibility='public'").c, journalEntries: g<{ c: number }>("SELECT COUNT(*) c FROM journal_entries").c, aiRequests: g<{ c: number }>("SELECT COUNT(*) c FROM ai_usage").c, aiErrors: g<{ c: number }>("SELECT COUNT(*) c FROM ai_usage WHERE ok=0").c, tokensIn: g<{ s: number }>("SELECT COALESCE(SUM(tokens_in),0) s FROM ai_usage").s, tokensOut: g<{ s: number }>("SELECT COALESCE(SUM(tokens_out),0) s FROM ai_usage").s },
      usageByTask: q("SELECT task, COUNT(*) n, SUM(ok=0) errors FROM ai_usage GROUP BY task ORDER BY n DESC"),
      recentErrors: q("SELECT task, provider, error, created_at FROM ai_usage WHERE ok=0 ORDER BY created_at DESC LIMIT 20"),
      events: q("SELECT event, COUNT(*) n FROM analytics WHERE created_at > ? GROUP BY event ORDER BY n DESC", week),
      users: q("SELECT u.id,u.email,u.role,u.plan,u.created_at,u.last_seen_at,p.username FROM users u LEFT JOIN profiles p ON p.user_id=u.id ORDER BY u.created_at DESC LIMIT 100"),
      published: q("SELECT d.id,d.title,d.kind,d.language,d.slug,d.published_at,p.username FROM documents d LEFT JOIN profiles p ON p.user_id=d.user_id WHERE d.visibility='public' ORDER BY d.published_at DESC LIMIT 100"),
      reports: q("SELECT r.*, d.title, d.slug FROM reports r LEFT JOIN documents d ON d.id=r.document_id ORDER BY r.created_at DESC LIMIT 100"),
      features: settings.get("features", { explore: true, publishing: true, imageGen: false, creatorMode: true, seo: true }),
      plans: settings.get("plans", { free: { label: "Free", price: null, limits: { aiPerDay: 100 } }, creator: { label: "Creator", price: null, limits: { aiPerDay: 1000 } }, pro: { label: "Pro", price: null, limits: { aiPerDay: 5000 } }, studio: { label: "Studio", price: null, limits: { aiPerDay: -1 } } }),
    });
  } catch (e) { const s = (e as { status?: number }).status; return s === 403 ? fail("Admins only.", 403) : handle(e); }
}
export async function POST(req: Request) {
  try {
    await admin(); const b = await body<{ action: string; [k: string]: unknown }>(req); const db = getDb();
    if (b.action === "features") settings.set("features", b.features);
    else if (b.action === "plans") settings.set("plans", b.plans);
    else if (b.action === "unpublish") db.prepare("UPDATE documents SET visibility='private' WHERE id = ?").run(b.id);
    else if (b.action === "resolveReport") db.prepare("UPDATE reports SET status='resolved' WHERE id = ?").run(b.id);
    else if (b.action === "setRole") db.prepare("UPDATE users SET role = ? WHERE id = ?").run(b.role, b.id);
    else if (b.action === "setPlan") db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(b.plan, b.id);
    return ok({ ok: true });
  } catch (e) { const s = (e as { status?: number }).status; return s === 403 ? fail("Admins only.", 403) : handle(e); }
}
