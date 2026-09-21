/**
 * Repositories. Every private read/write is scoped by user_id.
 */
import { getDb, id, now } from "./db";
import { detectLanguage } from "./ai/textstats";

export type Visibility = "draft" | "private" | "unlisted" | "public";
export interface Doc {
  id: string;
  user_id: string;
  project_id: string | null;
  kind: string;
  title: string;
  subtitle: string;
  body: string;
  language: string;
  tags_json: string;
  theme: string;
  cover_url: string;
  visibility: Visibility;
  slug: string | null;
  keep_imperfections: number;
  word_count: number;
  created_at: number;
  updated_at: number;
  published_at: number | null;
}

export const wordCount = (s: string) => (s.trim().match(/\S+/g) || []).length;

export function slugify(s: string) {
  const base = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return (base || "untitled") + "-" + Math.random().toString(36).slice(2, 7);
}

/* ---------- Documents ---------- */
export const docs = {
  list(userId: string, opts: { kind?: string; projectId?: string } = {}) {
    const db = getDb();
    const where = ["user_id = ?"];
    const args: unknown[] = [userId];
    if (opts.kind) { where.push("kind = ?"); args.push(opts.kind); }
    if (opts.projectId) { where.push("project_id = ?"); args.push(opts.projectId); }
    return db
      .prepare(`SELECT * FROM documents WHERE ${where.join(" AND ")} ORDER BY updated_at DESC`)
      .all(...args) as Doc[];
  },
  get(userId: string, docId: string) {
    return getDb().prepare("SELECT * FROM documents WHERE id = ? AND user_id = ?").get(docId, userId) as Doc | undefined;
  },
  create(userId: string, data: Partial<Doc> = {}) {
    const t = now();
    const d: Doc = {
      id: id("doc_"),
      user_id: userId,
      project_id: data.project_id ?? null,
      kind: data.kind ?? "poem",
      title: data.title ?? "",
      subtitle: data.subtitle ?? "",
      body: data.body ?? "",
      language: data.language ?? "auto",
      tags_json: data.tags_json ?? "[]",
      theme: data.theme ?? "",
      cover_url: data.cover_url ?? "",
      visibility: data.visibility ?? "draft",
      slug: null,
      keep_imperfections: data.keep_imperfections ?? 0,
      word_count: wordCount(data.body ?? ""),
      created_at: t,
      updated_at: t,
      published_at: null,
    };
    getDb()
      .prepare(`INSERT INTO documents (id,user_id,project_id,kind,title,subtitle,body,language,tags_json,theme,cover_url,visibility,slug,keep_imperfections,word_count,created_at,updated_at,published_at)
      VALUES (@id,@user_id,@project_id,@kind,@title,@subtitle,@body,@language,@tags_json,@theme,@cover_url,@visibility,@slug,@keep_imperfections,@word_count,@created_at,@updated_at,@published_at)`)
      .run(d);
    return d;
  },
  update(userId: string, docId: string, patch: Partial<Doc>, opts: { snapshot?: boolean; label?: string } = {}) {
    const db = getDb();
    const existing = this.get(userId, docId);
    if (!existing) return undefined;
    if (opts.snapshot && existing.body && existing.body !== patch.body) {
      db.prepare("INSERT INTO versions (id,document_id,user_id,body,title,label,created_at) VALUES (?,?,?,?,?,?,?)")
        .run(id("ver_"), docId, userId, existing.body, existing.title, opts.label ?? "autosave", now());
      // keep only last 50 versions
      db.prepare(`DELETE FROM versions WHERE document_id = ? AND id NOT IN (SELECT id FROM versions WHERE document_id = ? ORDER BY created_at DESC LIMIT 50)`).run(docId, docId);
    }
    const next = { ...existing, ...patch, updated_at: now() } as Doc;
    next.word_count = wordCount(next.body);
    if (next.visibility !== "draft" && next.visibility !== "private" && !next.slug) next.slug = slugify(next.title || next.body.slice(0, 30));
    if ((next.visibility === "public" || next.visibility === "unlisted") && !next.published_at) next.published_at = now();
    if (next.visibility !== "draft" && (!next.language || next.language === "auto")) { const l = detectLanguage(next.body); next.language = l === "unknown" ? "english" : l; }
    db.prepare(`UPDATE documents SET project_id=@project_id,kind=@kind,title=@title,subtitle=@subtitle,body=@body,language=@language,tags_json=@tags_json,theme=@theme,cover_url=@cover_url,visibility=@visibility,slug=@slug,keep_imperfections=@keep_imperfections,word_count=@word_count,updated_at=@updated_at,published_at=@published_at WHERE id=@id AND user_id=@user_id`).run(next);
    return next;
  },
  remove(userId: string, docId: string) {
    return getDb().prepare("DELETE FROM documents WHERE id = ? AND user_id = ?").run(docId, userId).changes > 0;
  },
  versions(userId: string, docId: string) {
    return getDb().prepare("SELECT id,label,title,created_at,length(body) as size,body FROM versions WHERE document_id = ? AND user_id = ? ORDER BY created_at DESC").all(docId, userId) as { id: string; label: string; title: string; created_at: number; size: number; body: string }[];
  },
  /* public reads — no user scoping, but only non-private visibility */
  publicBySlug(slug: string) {
    return getDb()
      .prepare(`SELECT d.*, p.username, p.display_name FROM documents d LEFT JOIN profiles p ON p.user_id = d.user_id WHERE d.slug = ? AND d.visibility IN ('public','unlisted')`)
      .get(slug) as (Doc & { username: string | null; display_name: string | null }) | undefined;
  },
  explore(opts: { category?: string; sort?: "new" | "trending" | "picks"; limit?: number } = {}) {
    const where = ["d.visibility = 'public'"];
    const args: unknown[] = [];
    if (opts.category && opts.category !== "all") {
      if (["hindi", "english", "hinglish"].includes(opts.category)) { where.push("d.language = ?"); args.push(opts.category); }
      else { where.push("(d.kind = ? OR d.tags_json LIKE ?)"); args.push(opts.category, `%"${opts.category}"%`); }
    }
    const order = opts.sort === "trending"
      ? "(SELECT COUNT(*) FROM bookmarks b WHERE b.document_id = d.id) DESC, d.published_at DESC"
      : opts.sort === "picks" ? "d.word_count BETWEEN 20 AND 400 DESC, d.published_at DESC" : "d.published_at DESC";
    return getDb()
      .prepare(`SELECT d.id,d.title,d.subtitle,d.body,d.kind,d.language,d.tags_json,d.theme,d.slug,d.published_at,d.word_count,p.username,p.display_name FROM documents d LEFT JOIN profiles p ON p.user_id=d.user_id WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ?`)
      .all(...args, opts.limit ?? 40) as (Doc & { username: string | null; display_name: string | null })[];
  },
  publicByUser(userId: string) {
    return getDb().prepare("SELECT * FROM documents WHERE user_id = ? AND visibility = 'public' ORDER BY published_at DESC").all(userId) as Doc[];
  },
};

/* ---------- Journal ---------- */
export interface JournalEntry { id: string; user_id: string; day: string; body: string; mood: string; favorite: number; created_at: number; updated_at: number; }
export const journal = {
  list(userId: string, q?: string) {
    if (q) return getDb().prepare("SELECT * FROM journal_entries WHERE user_id = ? AND body LIKE ? ORDER BY day DESC").all(userId, `%${q}%`) as JournalEntry[];
    return getDb().prepare("SELECT * FROM journal_entries WHERE user_id = ? ORDER BY day DESC, created_at DESC").all(userId) as JournalEntry[];
  },
  upsert(userId: string, e: Partial<JournalEntry>) {
    const db = getDb();
    if (e.id) {
      const ex = db.prepare("SELECT * FROM journal_entries WHERE id = ? AND user_id = ?").get(e.id, userId) as JournalEntry | undefined;
      if (!ex) return undefined;
      const n = { ...ex, ...e, updated_at: now() };
      db.prepare("UPDATE journal_entries SET day=@day, body=@body, mood=@mood, favorite=@favorite, updated_at=@updated_at WHERE id=@id AND user_id=@user_id").run(n);
      return n;
    }
    const t = now();
    const n: JournalEntry = { id: id("jr_"), user_id: userId, day: e.day ?? new Date().toISOString().slice(0, 10), body: e.body ?? "", mood: e.mood ?? "", favorite: e.favorite ?? 0, created_at: t, updated_at: t };
    db.prepare("INSERT INTO journal_entries VALUES (@id,@user_id,@day,@body,@mood,@favorite,@created_at,@updated_at)").run(n);
    return n;
  },
  remove(userId: string, eid: string) {
    return getDb().prepare("DELETE FROM journal_entries WHERE id = ? AND user_id = ?").run(eid, userId).changes > 0;
  },
  streak(userId: string) {
    const days = (getDb().prepare("SELECT DISTINCT day FROM journal_entries WHERE user_id = ? ORDER BY day DESC").all(userId) as { day: string }[]).map((r) => r.day);
    let streak = 0;
    const cur = new Date();
    for (;;) {
      const key = cur.toISOString().slice(0, 10);
      if (days.includes(key)) { streak++; cur.setDate(cur.getDate() - 1); }
      else if (streak === 0 && days.length) { cur.setDate(cur.getDate() - 1); const k2 = cur.toISOString().slice(0, 10); if (!days.includes(k2)) break; }
      else break;
      if (streak > 3650) break;
    }
    return streak;
  },
};

/* ---------- Memories (Writing Journey) ---------- */
export interface Memory { id: string; user_id: string; title: string; note: string; happened_on: string; kind: string; created_at: number; }
export const memories = {
  list(userId: string) { return getDb().prepare("SELECT * FROM memories WHERE user_id = ? ORDER BY happened_on ASC").all(userId) as Memory[]; },
  create(userId: string, m: Partial<Memory>) {
    const n: Memory = { id: id("mem_"), user_id: userId, title: m.title ?? "Untitled memory", note: m.note ?? "", happened_on: m.happened_on ?? new Date().toISOString().slice(0, 10), kind: m.kind ?? "milestone", created_at: now() };
    getDb().prepare("INSERT INTO memories VALUES (@id,@user_id,@title,@note,@happened_on,@kind,@created_at)").run(n);
    return n;
  },
  remove(userId: string, mid: string) { return getDb().prepare("DELETE FROM memories WHERE id = ? AND user_id = ?").run(mid, userId).changes > 0; },
};

/* ---------- Projects (Author Mode) ---------- */
export interface Project { id: string; user_id: string; title: string; kind: string; description: string; meta_json: string; created_at: number; updated_at: number; }
export const projects = {
  list(userId: string) { return getDb().prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC").all(userId) as Project[]; },
  get(userId: string, pid: string) { return getDb().prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?").get(pid, userId) as Project | undefined; },
  create(userId: string, p: Partial<Project>) {
    const t = now();
    const n: Project = { id: id("prj_"), user_id: userId, title: p.title ?? "Untitled project", kind: p.kind ?? "book", description: p.description ?? "", meta_json: p.meta_json ?? JSON.stringify({ characters: "", themes: "", symbols: "", notes: "" }), created_at: t, updated_at: t };
    getDb().prepare("INSERT INTO projects VALUES (@id,@user_id,@title,@kind,@description,@meta_json,@created_at,@updated_at)").run(n);
    return n;
  },
  update(userId: string, pid: string, patch: Partial<Project>) {
    const ex = this.get(userId, pid); if (!ex) return undefined;
    const n = { ...ex, ...patch, updated_at: now() };
    getDb().prepare("UPDATE projects SET title=@title, kind=@kind, description=@description, meta_json=@meta_json, updated_at=@updated_at WHERE id=@id AND user_id=@user_id").run(n);
    return n;
  },
  remove(userId: string, pid: string) { return getDb().prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(pid, userId).changes > 0; },
};

/* ---------- Voice profile ---------- */
export interface VoiceManual { languages?: string[]; themes?: string[]; structures?: string[]; intensity?: string; editingDegree?: string; notes?: string; avoidWords?: string[]; }
export interface VoiceLearned { samples: number; avgSentenceLen: number; avgLineLen: number; lowercaseRatio: number; punctuation: Record<string, number>; topWords: string[]; languages: Record<string, number>; recurringImages: string[]; }
export const voice = {
  get(userId: string) {
    const r = getDb().prepare("SELECT * FROM voice_profiles WHERE user_id = ?").get(userId) as { manual_json: string; learned_json: string; updated_at: number } | undefined;
    return { manual: (r ? JSON.parse(r.manual_json) : {}) as VoiceManual, learned: (r ? JSON.parse(r.learned_json) : null) as VoiceLearned | null, updated_at: r?.updated_at ?? 0 };
  },
  setManual(userId: string, manual: VoiceManual) {
    const cur = this.get(userId);
    getDb().prepare("INSERT INTO voice_profiles (user_id, manual_json, learned_json, updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET manual_json = excluded.manual_json, updated_at = excluded.updated_at")
      .run(userId, JSON.stringify(manual), JSON.stringify(cur.learned ?? {}), now());
  },
  setLearned(userId: string, learned: VoiceLearned) {
    const cur = this.get(userId);
    getDb().prepare("INSERT INTO voice_profiles (user_id, manual_json, learned_json, updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET learned_json = excluded.learned_json, updated_at = excluded.updated_at")
      .run(userId, JSON.stringify(cur.manual ?? {}), JSON.stringify(learned), now());
  },
};

/* ---------- Conversations ---------- */
export const conversations = {
  list(userId: string) { return getDb().prepare("SELECT id,title,updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50").all(userId) as { id: string; title: string; updated_at: number }[]; },
  get(userId: string, cid: string) { return getDb().prepare("SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?").get(cid, userId) as { id: string; title: string; messages_json: string } | undefined; },
  save(userId: string, cid: string | null, messages: unknown[], title: string) {
    const db = getDb();
    if (cid && this.get(userId, cid)) {
      db.prepare("UPDATE ai_conversations SET messages_json = ?, title = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(JSON.stringify(messages), title, now(), cid, userId);
      return cid;
    }
    const nid = id("cnv_");
    db.prepare("INSERT INTO ai_conversations VALUES (?,?,?,?,?,?)").run(nid, userId, title, JSON.stringify(messages), now(), now());
    return nid;
  },
  remove(userId: string, cid: string) { return getDb().prepare("DELETE FROM ai_conversations WHERE id = ? AND user_id = ?").run(cid, userId).changes > 0; },
};

/* ---------- Bookmarks ---------- */
export const bookmarks = {
  toggle(userId: string, docId: string) {
    const db = getDb();
    const ex = db.prepare("SELECT 1 FROM bookmarks WHERE user_id = ? AND document_id = ?").get(userId, docId);
    if (ex) { db.prepare("DELETE FROM bookmarks WHERE user_id = ? AND document_id = ?").run(userId, docId); return false; }
    db.prepare("INSERT INTO bookmarks VALUES (?,?,?)").run(userId, docId, now());
    return true;
  },
  list(userId: string) {
    return getDb().prepare("SELECT d.id,d.title,d.body,d.slug,d.kind,p.username FROM bookmarks b JOIN documents d ON d.id=b.document_id LEFT JOIN profiles p ON p.user_id=d.user_id WHERE b.user_id = ? AND d.visibility IN ('public','unlisted') ORDER BY b.created_at DESC").all(userId) as { id: string; title: string; body: string; slug: string; kind: string; username: string | null }[];
  },
};

/* ---------- Analytics / usage / settings ---------- */
export function track(event: string, userId?: string | null, meta: Record<string, unknown> = {}) {
  try { getDb().prepare("INSERT INTO analytics (user_id, event, meta_json, created_at) VALUES (?,?,?,?)").run(userId ?? null, event, JSON.stringify(meta), now()); } catch (e) { console.error("[analytics]", e); }
}
export function logUsage(u: { userId?: string | null; task: string; engine: string; provider: string; tokensIn?: number; tokensOut?: number; ok: boolean; error?: string }) {
  try { getDb().prepare("INSERT INTO ai_usage (user_id, task, engine, provider, tokens_in, tokens_out, ok, error, created_at) VALUES (?,?,?,?,?,?,?,?,?)").run(u.userId ?? null, u.task, u.engine, u.provider, u.tokensIn ?? 0, u.tokensOut ?? 0, u.ok ? 1 : 0, u.error ?? null, now()); } catch (e) { console.error("[usage]", e); }
}
export const settings = {
  get<T>(key: string, fallback: T): T {
    const r = getDb().prepare("SELECT value_json FROM settings WHERE key = ?").get(key) as { value_json: string } | undefined;
    return r ? (JSON.parse(r.value_json) as T) : fallback;
  },
  set(key: string, value: unknown) {
    getDb().prepare("INSERT INTO settings (key, value_json) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json").run(key, JSON.stringify(value));
  },
};
export function reportDoc(docId: string, reporterId: string | null, reason: string) {
  getDb().prepare("INSERT INTO reports (id, document_id, reporter_id, reason, status, created_at) VALUES (?,?,?,?,?,?)").run(id("rep_"), docId, reporterId, reason, "open", now());
}
