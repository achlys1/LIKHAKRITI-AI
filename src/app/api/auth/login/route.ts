import { z } from "zod";
import { loginUser, createSession } from "@/lib/auth";
import { body, fail, handle, ok } from "@/lib/api";
import { track } from "@/lib/repo";
export async function POST(req: Request) {
  try {
    const s = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(await body(req));
    if (!s.success) return fail("Enter your email and password.");
    const uid = await loginUser(s.data.email, s.data.password);
    await createSession(uid);
    track("login", uid);
    return ok({ ok: true });
  } catch (e) { if (e instanceof Error && /couldn't find/.test(e.message)) return fail(e.message, 401); return handle(e); }
}
