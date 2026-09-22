/**
 * Likhakriti database layer — libSQL.
 *  - Local dev: file database at DATABASE_PATH (default ./data/likhakriti.db)
 *  - Production (Vercel etc.): Turso — set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 * Every private query is scoped by user_id in ./repo.ts.
 */
import { createClient, type Client, type InValue } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

declare global {
  var __likhakriti_db: Client | undefined;
  var __likhakriti_migrated: Promise<void> | undefined;
}

function open(): Client {
  if (process.env.TURSO_DATABASE_URL) {
    return createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  const p = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "likhakriti.db");
  try { fs.mkdirSync(path.dirname(p), { recursive: true }); } catch { /* read-only fs */ }
  return createClient({ url: `file:${p}` });
}

function client(): Client {
  if (!global.__likhakriti_db) global.__likhakriti_db = open();
  return global.__likhakriti_db;
}

async function migrate(db: Client) {
  const stmts = `
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT, provider TEXT NOT NULL DEFAULT 'email', role TEXT NOT NULL DEFAULT 'user', plan TEXT NOT NULL DEFAULT 'free', created_at INTEGER NOT NULL, last_seen_at INTEGER);
  CREATE TABLE IF NOT EXISTS profiles (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, username TEXT UNIQUE, display_name TEXT, bio TEXT, avatar_url TEXT, links_json TEXT DEFAULT '{}', is_public INTEGER NOT NULL DEFAULT 0, onboarding_json TEXT DEFAULT '{}', settings_json TEXT DEFAULT '{}');
  CREATE TABLE IF NOT EXISTS voice_profiles (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, manual_json TEXT NOT NULL DEFAULT '{}', learned_json TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, project_id TEXT, kind TEXT NOT NULL DEFAULT 'poem', title TEXT NOT NULL DEFAULT '', subtitle TEXT DEFAULT '', body TEXT NOT NULL DEFAULT '', language TEXT DEFAULT 'auto', tags_json TEXT DEFAULT '[]', theme TEXT DEFAULT '', cover_url TEXT DEFAULT '', visibility TEXT NOT NULL DEFAULT 'draft', slug TEXT, keep_imperfections INTEGER NOT NULL DEFAULT 0, word_count INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, published_at INTEGER);
  CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(visibility, published_at DESC);
  CREATE TABLE IF NOT EXISTS versions (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE, user_id TEXT NOT NULL, body TEXT NOT NULL, title TEXT, label TEXT, created_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_versions_doc ON versions(document_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, day TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', mood TEXT DEFAULT '', favorite INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id, day DESC);
  CREATE TABLE IF NOT EXISTS memories (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, note TEXT DEFAULT '', happened_on TEXT NOT NULL, kind TEXT DEFAULT 'milestone', created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'book', description TEXT DEFAULT '', meta_json TEXT DEFAULT '{}', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS ai_conversations (id TEXT PRIMARY KEY, user_id TEXT, title TEXT DEFAULT '', messages_json TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_conv_user ON ai_conversations(user_id, updated_at DESC);
  CREATE TABLE IF NOT EXISTS bookmarks (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE, created_at INTEGER NOT NULL, PRIMARY KEY (user_id, document_id));
  CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, reporter_id TEXT, reason TEXT, status TEXT NOT NULL DEFAULT 'open', created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS analytics (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, event TEXT NOT NULL, meta_json TEXT DEFAULT '{}', created_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event, created_at DESC);
  CREATE TABLE IF NOT EXISTS ai_usage (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, task TEXT NOT NULL, engine TEXT NOT NULL, provider TEXT NOT NULL, tokens_in INTEGER DEFAULT 0, tokens_out INTEGER DEFAULT 0, ok INTEGER NOT NULL DEFAULT 1, error TEXT, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL);
  `.split(";").map((s) => s.trim()).filter(Boolean);
  await db.batch(stmts.map((sql) => ({ sql, args: [] })), "write");
}

async function ready(): Promise<Client> {
  const db = client();
  if (!global.__likhakriti_migrated) global.__likhakriti_migrated = migrate(db).catch((e) => { global.__likhakriti_migrated = undefined; throw e; });
  await global.__likhakriti_migrated;
  return db;
}

export type Row = Record<string, unknown>;
type Args = InValue[] | Record<string, InValue>;

/** Run a write statement. Returns number of affected rows. */
export async function run(sql: string, args: Args = []): Promise<number> {
  const db = await ready();
  const r = await db.execute({ sql, args });
  return r.rowsAffected;
}
export async function all<T = Row>(sql: string, args: Args = []): Promise<T[]> {
  const db = await ready();
  const r = await db.execute({ sql, args });
  return r.rows.map((row) => ({ ...row })) as unknown as T[];
}
export async function get<T = Row>(sql: string, args: Args = []): Promise<T | undefined> {
  const rows = await all<T>(sql, args);
  return rows[0];
}

export function now() { return Date.now(); }
export function id(prefix = "") { return prefix + crypto.randomUUID().replace(/-/g, "").slice(0, 20); }
