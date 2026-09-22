/** Poem → artwork. Uses OpenAI Images when IMAGE_PROVIDER=openai and a key exists; otherwise returns a generated SVG "ink & moon" card (no text overlay). */
import { getSessionUser } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { emotionProfile, imagesIn } from "@/lib/ai/textstats";
export async function POST(req: Request) {
  const u = await getSessionUser();
  const { text, style } = await body<{ text: string; style?: string }>(req);
  const e = emotionProfile(text || ""); const im = imagesIn(text || "");
  const prompt = `${style || "cinematic, minimal, literary"} artwork evoking ${e.primary}${im.length ? `, featuring ${im.slice(0, 2).join(" and ")}` : ""}; moonlit, ink and paper textures, muted midnight blue and antique gold, no text, no letters, no words.`;
  if (process.env.IMAGE_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch(`${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/images/generations`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: process.env.IMAGE_MODEL || "gpt-image-1", prompt, size: "1024x1024", n: 1 }) });
      const j = await r.json();
      const b64 = j.data?.[0]?.b64_json; const url = j.data?.[0]?.url;
      if (b64) return ok({ url: `data:image/png;base64,${b64}`, prompt, provider: "openai" });
      if (url) return ok({ url, prompt, provider: "openai" });
    } catch (err) { console.error("[image]", err); }
  }
  // Fallback: procedural SVG artwork seeded by the poem
  const seed = Array.from(text || "x").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
  const rnd = (n: number) => { const x = Math.sin(seed + n * 9973) * 10000; return x - Math.floor(x); };
  const palette: Record<string, [string, string]> = { grief: ["#070a14", "#26304a"], longing: ["#0a0f1f", "#2b2a55"], love: ["#150a14", "#4a2436"], hope: ["#0b1220", "#4a4030"], nostalgia: ["#120f0a", "#3b3020"], loneliness: ["#080b12", "#1f2a3a"], peace: ["#0a1412", "#233a36"], fear: ["#05060a", "#1a1d2b"], anger: ["#140808", "#4a1e1e"] };
  const [c1, c2] = palette[e.primary] || ["#0a0f1c", "#22305a"];
  const stars = Array.from({ length: 70 }, (_, i) => `<circle cx="${(rnd(i) * 1024).toFixed(0)}" cy="${(rnd(i + 100) * 640).toFixed(0)}" r="${(rnd(i + 200) * 1.4 + 0.3).toFixed(2)}" fill="#f3e9d2" opacity="${(rnd(i + 300) * 0.7 + 0.2).toFixed(2)}"/>`).join("");
  const ink = Array.from({ length: 6 }, (_, i) => `<ellipse cx="${(200 + rnd(i + 400) * 620).toFixed(0)}" cy="${(700 + rnd(i + 500) * 260).toFixed(0)}" rx="${(120 + rnd(i + 600) * 240).toFixed(0)}" ry="${(30 + rnd(i + 700) * 70).toFixed(0)}" fill="#000" opacity="${(0.25 + rnd(i + 800) * 0.35).toFixed(2)}"/>`).join("");
  const rain = e.primary === "longing" || im.includes("rain") || im.includes("baarish") || im.includes("बारिश") ? Array.from({ length: 90 }, (_, i) => `<line x1="${(rnd(i + 900) * 1024).toFixed(0)}" y1="${(rnd(i + 1000) * 1024).toFixed(0)}" x2="${(rnd(i + 900) * 1024 - 6).toFixed(0)}" y2="${(rnd(i + 1000) * 1024 + 26).toFixed(0)}" stroke="#c9b27a" stroke-opacity="0.18" stroke-width="1"/>`).join("") : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><defs><radialGradient id="g" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></radialGradient><radialGradient id="m" cx="50%" cy="50%" r="50%"><stop offset="0.7" stop-color="#f1e6c8"/><stop offset="1" stop-color="#c9b27a" stop-opacity="0"/></radialGradient><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.08"/></feComponentTransfer></filter></defs><rect width="1024" height="1024" fill="url(#g)"/>${stars}<circle cx="${(300 + rnd(1) * 420).toFixed(0)}" cy="${(180 + rnd(2) * 160).toFixed(0)}" r="${(60 + rnd(3) * 50).toFixed(0)}" fill="url(#m)" opacity="0.9"/>${rain}<rect y="640" width="1024" height="384" fill="${c1}" opacity="0.7"/>${ink}<rect width="1024" height="1024" filter="url(#grain)" opacity="0.5"/></svg>`;
  return ok({ url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, prompt, provider: "local", userId: u?.id ?? null });
}
