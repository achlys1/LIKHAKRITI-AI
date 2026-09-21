/**
 * Likhakriti database layer.
 *
 * SQLite (better-sqlite3) for a zero-config MVP. Every query that touches
 * private content is scoped by user_id — see repositories in ./repo.ts.
 * To move to Postgres, replace this adapter; the repo layer only uses
 * `run`, `get`, `all`.
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "likhakriti.db");

declare global {
  // eslint-disable-next-line no-var
  var __likhakriti_db: Database.Database | undefined;
}

function open() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

export function getDb() {
  if (!global.__likhakriti_db) global.__likhakriti_db = open();
  return global.__likhakriti_db;
}

function migrate(db: Database.Database) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    provider TEXT NOT NULL DEFAULT 'email',
    role TEXT NOT NULL DEFAULT 'user',
    plan TEXT NOT NULL DEFAULT 'free',
    created_at INTEGER NOT NULL,
    last_seen_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    links_json TEXT DEFAULT '{}',
    is_public INTEGER NOT NULL DEFAULT 0,
    onboarding_json TEXT DEFAULT '{}',
    settings_json TEXT DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS voice_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    manual_json TEXT NOT NULL DEFAULT '{}',
    learned_json TEXT NOT NULL DEFAULT '{}',
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT,
    kind TEXT NOT NULL DEFAULT 'poem',
    title TEXT NOT NULL DEFAULT '',
    subtitle TEXT DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    language TEXT DEFAULT 'auto',
    tags_json TEXT DEFAULT '[]',
    theme TEXT DEFAULT '',
    cover_url TEXT DEFAULT '',
    visibility TEXT NOT NULL DEFAULT 'draft',
    slug TEXT,
    keep_imperfections INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    published_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(visibility, published_at DESC);
  CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    body TEXT NOT NULL,
    title TEXT,
    label TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_versions_doc ON versions(document_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    mood TEXT DEFAULT '',
    favorite INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id, day DESC);
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    note TEXT DEFAULT '',
    happened_on TEXT NOT NULL,
    kind TEXT DEFAULT 'milestone',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'book',
    description TEXT DEFAULT '',
    meta_json TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT DEFAULT '',
    messages_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_conv_user ON ai_conversations(user_id, updated_at DESC);
  CREATE TABLE IF NOT EXISTS bookmarks (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, document_id)
  );
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    reporter_id TEXT,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    event TEXT NOT NULL,
    meta_json TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event, created_at DESC);
  CREATE TABLE IF NOT EXISTS ai_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    task TEXT NOT NULL,
    engine TEXT NOT NULL,
    provider TEXT NOT NULL,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    ok INTEGER NOT NULL DEFAULT 1,
    error TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL
  );
  `);
}

export function now() {
  return Date.now();
}
export function id(prefix = "") {
  return prefix + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}
