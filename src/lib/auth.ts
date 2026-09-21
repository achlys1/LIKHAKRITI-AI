import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { getDb, id, now } from "./db";

const COOKIE = "lk_session";

function secret() {
  let s = process.env.AUTH_SECRET;
  if (!s) {
    // Dev convenience: persist a generated secret so sessions survive restarts.
    const p = path.join(process.cwd(), "data", ".secret");
    try {
      if (fs.existsSync(p)) s = fs.readFileSync(p, "utf8");
      else { s = crypto.randomUUID() + crypto.randomUUID(); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }
    } catch { s = "likhakriti-dev-secret-change-me"; }
    if (process.env.NODE_ENV === "production") console.warn("[auth] AUTH_SECRET not set — using generated local secret. Set AUTH_SECRET in production.");
  }
  return new TextEncoder().encode(s);
}

export interface SessionUser { id: string; email: string; role: string; plan: string; username: string | null; display_name: string | null; onboarded: boolean; }

export function isAdminEmail(email: string) {
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret());
  const c = await cookies();
  c.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function destroySession() {
  const c = await cookies();
  c.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const c = await cookies();
    const token = c.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const uid = payload.uid as string;
    const row = getDb().prepare(`SELECT u.id,u.email,u.role,u.plan,p.username,p.display_name,p.onboarding_json FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id = ?`).get(uid) as (SessionUser & { onboarding_json: string }) | undefined;
    if (!row) return null;
    getDb().prepare("UPDATE users SET last_seen_at = ? WHERE id = ?").run(now(), uid);
    const role = isAdminEmail(row.email) ? "admin" : row.role;
    return { id: row.id, email: row.email, role, plan: row.plan, username: row.username, display_name: row.display_name, onboarded: !!row.onboarding_json && row.onboarding_json !== "{}" };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const u = await getSessionUser();
  if (!u) throw new AuthError();
  return u;
}
export class AuthError extends Error { status = 401; constructor() { super("Sign in to continue."); } }

export async function registerUser(email: string, password: string, displayName?: string) {
  const db = getDb();
  email = email.trim().toLowerCase();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) throw new Error("That email already has an account. Try signing in.");
  const uid = id("usr_");
  const hash = await bcrypt.hash(password, 10);
  const role = isAdminEmail(email) ? "admin" : (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c === 0 ? "admin" : "user";
  db.prepare("INSERT INTO users (id,email,password_hash,provider,role,plan,created_at,last_seen_at) VALUES (?,?,?,?,?,?,?,?)").run(uid, email, hash, "email", role, "free", now(), now());
  const base = (displayName || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9_]+/g, "").slice(0, 20) || "writer";
  let username = base; let n = 1;
  while (db.prepare("SELECT 1 FROM profiles WHERE username = ?").get(username)) username = `${base}${++n}`;
  db.prepare("INSERT INTO profiles (user_id, username, display_name, bio, is_public) VALUES (?,?,?,?,0)").run(uid, username, displayName || base, "");
  return uid;
}

export async function loginUser(email: string, password: string) {
  const row = getDb().prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email.trim().toLowerCase()) as { id: string; password_hash: string | null } | undefined;
  if (!row || !row.password_hash) throw new Error("We couldn't find that account, or the password doesn't match.");
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw new Error("We couldn't find that account, or the password doesn't match.");
  return row.id;
}
