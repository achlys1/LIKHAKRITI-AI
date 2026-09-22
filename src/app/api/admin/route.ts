import { requireUser } from "@/lib/auth";
import { all, get, run } from "@/lib/db";
import { settings } from "@/lib/repo";
import { providerStatus } from "@/lib/ai/providers";
import { body, fail, handle, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
async function admin() { const u = await requireUser(); if (u.role !== "admin") throw Object.assign(new Error("Admins only."), { status: 403 }); return u; }
const num = async (sql: string, args: (string | number)[] = []) => Number((await get<{ c: number }>(sql, args))?.c ?? 0);
export async function GET() {
  try {
    await admin(); const day = Date.now() - 86400000; const week = Date.now() - 7 * 86400000;
    const [users, activeDay, activeWeek, documents, poems, published, journalEntries, aiRequests, aiErrors, tokensIn, tokensOut] = await Promise.all([
      num("SELECT COUNT(*) c FROM users"), num("SELECT COUNT(*) c FROM users WHERE last_seen_at > ?", [day]), num("SELECT COUNT(*) c FROM users WHERE last_seen_at > ?", [week]),
      num("SELECT COUNT(*) c FROM documents"), num("SELECT COUNT(*) c FROM documents WHERE kind='poem'"), num("SELECT COUNT(*) c FROM documents WHERE visibility='public'"),
      num("SELECT COUNT(*) c FROM journal_entries"), num("SELECT COUNT(*) c FROM ai_usage"), num("SELECT COUNT(*) c FROM ai_usage WHERE ok=0"),
      num("SELECT COALESCE(SUM(tokens_in),0) c FROM ai_usage"), num("SELECT COALESCE(SUM(tokens_out),0) c FROM ai_usage"),
    ]);
    const [usageByTask, recentErrors, events, userList, publishedList, reports, features, plans] = await Promise.all([
      all("SELECT task, COUNT(*) n, SUM(ok=0) errors FROM ai_usage GROUP BY task ORDER BY n DESC"),
      all("SELECT task, provider, error, created_at FROM ai_usage WHERE ok=0 ORDER BY created_at DESC LIMIT 20"),
      all("SELECT event, COUNT(*) n FROM analytics WHERE created_at > ? GROUP BY event ORDER BY n DESC", [week]),
      all("SELECT u.id,u.email,u.role,u.plan,u.created_at,u.last_seen_at,p.username FROM users u LEFT JOIN profiles p ON p.user_id=u.id ORDER BY u.created_at DESC LIMIT 100"),
      all("SELECT d.id,d.title,d.kind,d.language,d.slug,d.published_at,p.username FROM documents d LEFT JOIN profiles p ON p.user_id=d.user_id WHERE d.visibility='public' ORDER BY d.published_at DESC LIMIT 100"),
      all("SELECT r.*, d.title, d.slug FROM reports r LEFT JOIN documents d ON d.id=r.document_id ORDER BY r.created_at DESC LIMIT 100"),
      settings.get("features", { explore: true, publishing: true, imageGen: false, creatorMode: true, seo: true }),
      settings.get("plans", { free: { label: "Free", price: null, limits: { aiPerDay: 100 } }, creator: { label: "Creator", price: null, limits: { aiPerDay: 1000 } }, pro: { label: "Pro", price: null, limits: { aiPerDay: 5000 } }, studio: { label: "Studio", price: null, limits: { aiPerDay: -1 } } }),
    ]);
    const fix = (rows: Record<string, unknown>[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v])));
    return ok({
      health: { db: "ok", provider: providerStatus(), uptime: process.uptime(), memoryMB: Math.round(process.memoryUsage().rss / 1e6) },
      counts: { users, activeDay, activeWeek, documents, poems, published, journalEntries, aiRequests, aiErrors, tokensIn, tokensOut },
      usageByTask: fix(usageByTask), recentErrors: fix(recentErrors), events: fix(events), users: fix(userList), published: fix(publishedList), reports: fix(reports), features, plans,
    });
  } catch (e) { const s = (e as { status?: number }).status; return s === 403 ? fail("Admins only.", 403) : handle(e); }
}
export async function POST(req: Request) {
  try {
    await admin(); const b = await body<{ action: string; id?: string; role?: string; plan?: string; features?: unknown; plans?: unknown }>(req);
    if (b.action === "features") await settings.set("features", b.features);
    else if (b.action === "plans") await settings.set("plans", b.plans);
    else if (b.action === "unpublish") await run("UPDATE documents SET visibility='private' WHERE id = ?", [b.id!]);
    else if (b.action === "resolveReport") await run("UPDATE reports SET status='resolved' WHERE id = ?", [b.id!]);
    else if (b.action === "setRole") await run("UPDATE users SET role = ? WHERE id = ?", [b.role!, b.id!]);
    else if (b.action === "setPlan") await run("UPDATE users SET plan = ? WHERE id = ?", [b.plan!, b.id!]);
    return ok({ ok: true });
  } catch (e) { const s = (e as { status?: number }).status; return s === 403 ? fail("Admins only.", 403) : handle(e); }
}
