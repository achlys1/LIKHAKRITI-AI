import { getSessionUser } from "@/lib/auth";
import { ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() { return ok({ user: await getSessionUser() }); }
