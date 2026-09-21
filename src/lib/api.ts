import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function ok(data: unknown, init?: ResponseInit) { return NextResponse.json(data, init); }
export function fail(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
export function handle(e: unknown) {
  if (e instanceof AuthError) return fail(e.message, 401);
  const msg = e instanceof Error ? e.message : "Something interrupted the ink. Try again.";
  console.error("[api]", e);
  return fail(process.env.NODE_ENV === "production" ? "Something interrupted the ink. Try again." : msg, 500);
}
export async function body<T = Record<string, unknown>>(req: Request): Promise<T> { try { return (await req.json()) as T; } catch { return {} as T; } }
