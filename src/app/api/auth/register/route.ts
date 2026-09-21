import { z } from "zod";
import { registerUser, createSession } from "@/lib/auth";
import { body, fail, handle, ok } from "@/lib/api";
import { track } from "@/lib/repo";
export async function POST(req: Request) {
  try {
    const s = z.object({ email: z.string().email(), password: z.string().min(8).max(200), name: z.string().max(60).optional() }).safeParse(await body(req));
    if (!s.success) return fail("Use a real email and a password of at least 8 characters.");
    const uid = await registerUser(s.data.email, s.data.password, s.data.name);
    await createSession(uid);
    track("signup", uid);
    return ok({ ok: true });
  } catch (e) { if (e instanceof Error && /already/.test(e.message)) return fail(e.message, 409); return handle(e); }
}
