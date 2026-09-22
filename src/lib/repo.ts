/**
 * Repositories. Every private read/write is scoped by user_id.
 */
import { all, get, run, id, now } from "./db";
import { detectLanguage } from "./ai/textstats";

export type Visibility = "draft" | "private" | "unlisted" | "public";
export interface Doc {
  id: string; user_id: string; project_id: string | null; kind: string; title: string; subtitle: string; body: string;
  language: string; tags_json: string; theme: string; cover_url: string; visibility: Visibility; slug: string | null;
  keep_imperfections: number; word_count: number; created_at: number; updated_at: number; published_at: number | null;
}
export type PublicDoc = Doc & { username: string | null; display_name: string | null };

export const wordCount = (s: string) => (s.trim().match(/\S+/g) || []).length;
export function slugify(s: string) {
  const base = s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return (base || "untitled") + "-" + Math.random().toString(36).slice(2, 7);
}
const n = (v: unknown) => (v === null || v === undefined ? v : Number(v));
function normDoc(d: Doc): Doc {
  return { ...d, keep_imperfections: Number(d.keep_imperfections), word_count: Number(d.word_count), created_at: Number(d.created_at), updated_at: Number(d.updated_at), published_at: n(d.published_at) as number | null };
}

/* ---------- Documents ---------- */
export const docs = {
  async list(userId: string, opts: { kind?: string; projectId?: string } = {}) {
    const where = ["user_id = ?"]; const args: string[] = [userId];
    if (opts.kind) { where.push("kind = ?"); args.push(opts.kind); }
    if (opts.projectId) { where.push("project_id = ?"); args.push(opts.projectId); }
    return (await all<Doc>(`SELECT * FROM documents WHERE ${where.join(" AND ")} ORDER BY updated_at DESC`, args)).map(normDoc);
  },
  async get(userId: string, docId: string) {
    const d = await get<Doc>("SELECT * FROM documents WHERE id = ? AND user_id = ?", [docId, userId]);
    return d ? normDoc(d) : undefined;
  },
  async create(userId: string, data: Partial<Doc> = {}) {
    const t = now();
    const d: Doc = {
      id: id("doc_"), user_id: userId, project_id: data.project_id ?? null, kind: data.kind ?? "poem", title: data.title ?? "", subtitle: data.subtitle ?? "",
      body: data.body ?? "", language: data.language ?? "auto", tags_json: data.tags_json ?? "[]", theme: data.theme ?? "", cover_url: data.cover_url ?? "",
      visibility: data.visibility ?? "draft", slug: null, keep_imperfections: data.keep_imperfections ?? 0, word_count: wordCount(data.body ?? ""), created_at: t, updated_at: t, published_at: null,
    };
    await run(`INSERT INTO documents (id,user_id,project_id,kind,title,subtitle,body,language,tags_json,theme,cover_url,visibility,slug,keep_imperfections,word_count,created_at,updated_at,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [d.id, d.user_id, d.project_id, d.kind, d.title, d.subtitle, d.body, d.language, d.tags_json, d.theme, d.cover_url, d.visibility, d.slug, d.keep_imperfections, d.word_count, d.created_at, d.updated_at, d.published_at]);
    return d;
  },
  async update(userId: string, docId: string, patch: Partial<Doc>, opts: { snapshot?: boolean; label?: string } = {}) {
    const existing = await this.get(userId, docId);
    if (!existing) return undefined;
    if (opts.snapshot && existing.body && existing.body !== patch.body) {
      await run("INSERT INTO versions (id,document_id,user_id,body,title,label,created_at) VALUES (?,?,?,?,?,?,?)", [id("ver_"), docId, userId, existing.body, existing.title, opts.label ?? "autosave", now()]);
      await run(`DELETE FROM versions WHERE document_id = ? AND id NOT IN (SELECT id FROM versions WHERE document_id = ? ORDER BY created_at DESC LIMIT 50)`, [docId, docId]);
    }
    const next = { ...existing, ...patch, updated_at: now() } as Doc;
    next.word_count = wordCount(next.body);
    if (next.visibility !== "draft" && next.visibility !== "private" && !next.slug) next.slug = slugify(next.title || next.body.slice(0, 30));
    if ((next.visibility === "public" || next.visibility === "unlisted") && !next.published_at) next.published_at = now();
    if (next.visibility !== "draft" && (!next.language || next.language === "auto")) { const l = detectLanguage(next.body); next.language = l === "unknown" ? "english" : l; }
    await run(`UPDATE documents SET project_id=?,kind=?,title=?,subtitle=?,body=?,language=?,tags_json=?,theme=?,cover_url=?,visibility=?,slug=?,keep_imperfections=?,word_count=?,updated_at=?,published_at=? WHERE id=? AND user_id=?`,
      [next.project_id, next.kind, next.title, next.subtitle, next.body, next.language, next.tags_json, next.theme, next.cover_url, next.visibility, next.slug, Number(next.keep_imperfections), next.word_count, next.updated_at, next.published_at, next.id, next.user_id]);
    return next;
  },
  async remove(userId: string, docId: string) { return (await run("DELETE FROM documents WHERE id = ? AND user_id = ?", [docId, userId])) > 0; },
  async versions(userId: string, docId: string) {
    return all<{ id: string; label: string; title: string; created_at: number; size: number; body: string }>("SELECT id,label,title,created_at,length(body) as size,body FROM versions WHERE document_id = ? AND user_id = ? ORDER BY created_at DESC", [docId, userId]);
  },
  async publicBySlug(slug: string) {
    const d = await get<PublicDoc>(`SELECT d.*, p.username, p.display_name FROM documents d LEFT JOIN profiles p ON p.user_id = d.user_id WHERE d.slug = ? AND d.visibility IN ('public','unlisted')`, [slug]);
    return d ? (normDoc(d) as PublicDoc) : undefined;
  },
  async explore(opts: { category?: string; sort?: "new" | "trending" | "picks"; limit?: number } = {}) {
    const where = ["d.visibility = 'public'"]; const args: (string | number)[] = [];
    if (opts.category && opts.category !== "all") {
      if (["hindi", "english", "hinglish"].includes(opts.category)) { where.push("d.language = ?"); args.push(opts.category); }
      else { where.push("(d.kind = ? OR d.tags_json LIKE ?)"); args.push(opts.category, `%"${opts.category}"%`); }
    }
    const order = opts.sort === "trending" ? "(SELECT COUNT(*) FROM bookmarks b WHERE b.document_id = d.id) DESC, d.published_at DESC" : opts.sort === "picks" ? "(d.word_count BETWEEN 20 AND 400) DESC, d.published_at DESC" : "d.published_at DESC";
    args.push(opts.limit ?? 40);
    return (await all<PublicDoc>(`SELECT d.*,p.username,p.display_name FROM documents d LEFT JOIN profiles p ON p.user_id=d.user_id WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ?`, args)).map((d) => normDoc(d) as PublicDoc);
  },
  async publicByUser(userId: string) { return (await all<Doc>("SELECT * FROM documents WHERE user_id = ? AND visibility = 'public' ORDER BY published_at DESC", [userId])).map(normDoc); },
};

/* ---------- Journal ---------- */
export interface JournalEntry { id: string; user_id: string; day: string; body: string; mood: string; favorite: number; created_at: number; updated_at: number; }
export const journal = {
  async list(userId: string, q?: string) {
    if (q) return all<JournalEntry>("SELECT * FROM journal_entries WHERE user_id = ? AND body LIKE ? ORDER BY day DESC", [userId, `%${q}%`]);
    return all<JournalEntry>("SELECT * FROM journal_entries WHERE user_id = ? ORDER BY day DESC, created_at DESC", [userId]);
  },
  async upsert(userId: string, e: Partial<JournalEntry>) {
    if (e.id) {
      const ex = await get<JournalEntry>("SELECT * FROM journal_entries WHERE id = ? AND user_id = ?", [e.id, userId]);
      if (!ex) return undefined;
      const nx = { ...ex, ...e, updated_at: now() };
      await run("UPDATE journal_entries SET day=?, body=?, mood=?, favorite=?, updated_at=? WHERE id=? AND user_id=?", [nx.day, nx.body, nx.mood, Number(nx.favorite), nx.updated_at, nx.id, userId]);
      return nx;
    }
    const t = now();
    const nx: JournalEntry = { id: id("jr_"), user_id: userId, day: e.day ?? new Date().toISOString().slice(0, 10), body: e.body ?? "", mood: e.mood ?? "", favorite: e.favorite ?? 0, created_at: t, updated_at: t };
    await run("INSERT INTO journal_entries VALUES (?,?,?,?,?,?,?,?)", [nx.id, nx.user_id, nx.day, nx.body, nx.mood, nx.favorite, nx.created_at, nx.updated_at]);
    return nx;
  },
  async remove(userId: string, eid: string) { return (await run("DELETE FROM journal_entries WHERE id = ? AND user_id = ?", [eid, userId])) > 0; },
  async streak(userId: string) {
    const days = (await all<{ day: string }>("SELECT DISTINCT day FROM journal_entries WHERE user_id = ? ORDER BY day DESC", [userId])).map((r) => r.day);
    if (!days.length) return 0;
    const set = new Set(days); let streak = 0; const cur = new Date();
    if (!set.has(cur.toISOString().slice(0, 10))) cur.setDate(cur.getDate() - 1); // today not written yet doesn't break the streak
    while (set.has(cur.toISOString().slice(0, 10)) && streak < 3650) { streak++; cur.setDate(cur.getDate() - 1); }
    return streak;
  },
};

/* ---------- Memories ---------- */
export interface Memory { id: string; user_id: string; title: string; note: string; happened_on: string; kind: string; created_at: number; }
export const memories = {
  list(userId: string) { return all<Memory>("SELECT * FROM memories WHERE user_id = ? ORDER BY happened_on ASC", [userId]); },
  async create(userId: string, m: Partial<Memory>) {
    const nx: Memory = { id: id("mem_"), user_id: userId, title: m.title ?? "Untitled memory", note: m.note ?? "", happened_on: m.happened_on ?? new Date().toISOString().slice(0, 10), kind: m.kind ?? "milestone", created_at: now() };
    await run("INSERT INTO memories VALUES (?,?,?,?,?,?,?)", [nx.id, nx.user_id, nx.title, nx.note, nx.happened_on, nx.kind, nx.created_at]);
    return nx;
  },
  async remove(userId: string, mid: string) { return (await run("DELETE FROM memories WHERE id = ? AND user_id = ?", [mid, userId])) > 0; },
};

/* ---------- Projects ---------- */
export interface Project { id: string; user_id: string; title: string; kind: string; description: string; meta_json: string; created_at: number; updated_at: number; }
export const projects = {
  list(userId: string) { return all<Project>("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC", [userId]); },
  get(userId: string, pid: string) { return get<Project>("SELECT * FROM projects WHERE id = ? AND user_id = ?", [pid, userId]); },
  async create(userId: string, p: Partial<Project>) {
    const t = now();
    const nx: Project = { id: id("prj_"), user_id: userId, title: p.title ?? "Untitled project", kind: p.kind ?? "book", description: p.description ?? "", meta_json: p.meta_json ?? JSON.stringify({ characters: "", themes: "", symbols: "", notes: "" }), created_at: t, updated_at: t };
    await run("INSERT INTO projects VALUES (?,?,?,?,?,?,?,?)", [nx.id, nx.user_id, nx.title, nx.kind, nx.description, nx.meta_json, nx.created_at, nx.updated_at]);
    return nx;
  },
  async update(userId: string, pid: string, patch: Partial<Project>) {
    const ex = await this.get(userId, pid); if (!ex) return undefined;
    const nx = { ...ex, ...patch, updated_at: now() };
    await run("UPDATE projects SET title=?, kind=?, description=?, meta_json=?, updated_at=? WHERE id=? AND user_id=?", [nx.title, nx.kind, nx.description, nx.meta_json, nx.updated_at, nx.id, userId]);
    return nx;
  },
  async remove(userId: string, pid: string) { return (await run("DELETE FROM projects WHERE id = ? AND user_id = ?", [pid, userId])) > 0; },
};

/* ---------- Voice profile ---------- */
export interface VoiceManual { languages?: string[]; themes?: string[]; structures?: string[]; intensity?: string; editingDegree?: string; notes?: string; avoidWords?: string[]; }
export interface VoiceLearned { samples: number; avgSentenceLen: number; avgLineLen: number; lowercaseRatio: number; punctuation: Record<string, number>; topWords: string[]; languages: Record<string, number>; recurringImages: string[]; }
export const voice = {
  async get(userId: string) {
    const r = await get<{ manual_json: string; learned_json: string; updated_at: number }>("SELECT * FROM voice_profiles WHERE user_id = ?", [userId]);
    return { manual: (r ? JSON.parse(r.manual_json) : {}) as VoiceManual, learned: (r ? JSON.parse(r.learned_json) : null) as VoiceLearned | null, updated_at: Number(r?.updated_at ?? 0) };
  },
  async setManual(userId: string, manual: VoiceManual) {
    const cur = await this.get(userId);
    await run("INSERT INTO voice_profiles (user_id, manual_json, learned_json, updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET manual_json = excluded.manual_json, updated_at = excluded.updated_at", [userId, JSON.stringify(manual), JSON.stringify(cur.learned ?? {}), now()]);
  },
  async setLearned(userId: string, learned: VoiceLearned) {
    const cur = await this.get(userId);
    await run("INSERT INTO voice_profiles (user_id, manual_json, learned_json, updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET learned_json = excluded.learned_json, updated_at = excluded.updated_at", [userId, JSON.stringify(cur.manual ?? {}), JSON.stringify(learned), now()]);
  },
};

/* ---------- Conversations ---------- */
export const conversations = {
  list(userId: string) { return all<{ id: string; title: string; updated_at: number }>("SELECT id,title,updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50", [userId]); },
  get(userId: string, cid: string) { return get<{ id: string; title: string; messages_json: string }>("SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?", [cid, userId]); },
  async save(userId: string, cid: string | null, messages: unknown[], title: string) {
    if (cid && (await this.get(userId, cid))) {
      await run("UPDATE ai_conversations SET messages_json = ?, title = ?, updated_at = ? WHERE id = ? AND user_id = ?", [JSON.stringify(messages), title, now(), cid, userId]);
      return cid;
    }
    const nid = id("cnv_");
    await run("INSERT INTO ai_conversations VALUES (?,?,?,?,?,?)", [nid, userId, title, JSON.stringify(messages), now(), now()]);
    return nid;
  },
  async remove(userId: string, cid: string) { return (await run("DELETE FROM ai_conversations WHERE id = ? AND user_id = ?", [cid, userId])) > 0; },
};

/* ---------- Bookmarks ---------- */
export const bookmarks = {
  async toggle(userId: string, docId: string) {
    const ex = await get("SELECT 1 as x FROM bookmarks WHERE user_id = ? AND document_id = ?", [userId, docId]);
    if (ex) { await run("DELETE FROM bookmarks WHERE user_id = ? AND document_id = ?", [userId, docId]); return false; }
    await run("INSERT INTO bookmarks VALUES (?,?,?)", [userId, docId, now()]);
    return true;
  },
  list(userId: string) {
    return all<{ id: string; title: string; body: string; slug: string; kind: string; username: string | null }>("SELECT d.id,d.title,d.body,d.slug,d.kind,d.language,p.username,p.display_name FROM bookmarks b JOIN documents d ON d.id=b.document_id LEFT JOIN profiles p ON p.user_id=d.user_id WHERE b.user_id = ? AND d.visibility IN ('public','unlisted') ORDER BY b.created_at DESC", [userId]);
  },
};

/* ---------- Analytics / usage / settings ---------- */
export function track(event: string, userId?: string | null, meta: Record<string, unknown> = {}) {
  run("INSERT INTO analytics (user_id, event, meta_json, created_at) VALUES (?,?,?,?)", [userId ?? null, event, JSON.stringify(meta), now()]).catch((e) => console.error("[analytics]", e));
}
export function logUsage(u: { userId?: string | null; task: string; engine: string; provider: string; tokensIn?: number; tokensOut?: number; ok: boolean; error?: string }) {
  run("INSERT INTO ai_usage (user_id, task, engine, provider, tokens_in, tokens_out, ok, error, created_at) VALUES (?,?,?,?,?,?,?,?,?)", [u.userId ?? null, u.task, u.engine, u.provider, u.tokensIn ?? 0, u.tokensOut ?? 0, u.ok ? 1 : 0, u.error ?? null, now()]).catch((e) => console.error("[usage]", e));
}
export const settings = {
  async get<T>(key: string, fallback: T): Promise<T> {
    const r = await get<{ value_json: string }>("SELECT value_json FROM settings WHERE key = ?", [key]);
    return r ? (JSON.parse(r.value_json) as T) : fallback;
  },
  set(key: string, value: unknown) { return run("INSERT INTO settings (key, value_json) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json", [key, JSON.stringify(value)]); },
};
export function reportDoc(docId: string, reporterId: string | null, reason: string) {
  return run("INSERT INTO reports (id, document_id, reporter_id, reason, status, created_at) VALUES (?,?,?,?,?,?)", [id("rep_"), docId, reporterId, reason, "open", now()]);
}
