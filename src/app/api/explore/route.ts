import { docs } from "@/lib/repo";
import { ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const u = new URL(req.url);
  return ok({ items: docs.explore({ category: u.searchParams.get("category") || "all", sort: (u.searchParams.get("sort") as "new" | "trending" | "picks") || "new" }) });
}
