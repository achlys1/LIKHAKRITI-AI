/**
 * Local heuristic engine — runs with no API key.
 * It is deliberately honest about its limits: it analyses, suggests, structures, and
 * drafts from the writer's OWN words rather than pretending to be a large model.
 * When a provider key is configured this engine is only a fallback.
 */
import type { ChatMessage } from "./types";
import { aiPatternsIn, clichesIn, detectLanguage, emotionProfile, imagesIn, lines, readingTime, rhymeCheck, sentences, strongestLine, weakestLine, words } from "./textstats";

function meta(messages: ChatMessage[]) {
  const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
  const last = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const engine = (sys.match(/Engine: (\w+)/) || [])[1] || "Conversation";
  const brutal = /BRUTAL HONESTY/.test(sys);
  const raw = /MODE: RAW/.test(sys);
  const literary = /MODE: LITERARY/.test(sys);
  const humanize = /MODE: HUMANIZE/.test(sys);
  const target = (sys.match(/Target language for translation: ([^\n.]+)/) || [])[1];
  // separate the instruction line from the body
  const idx = last.indexOf("\n\n");
  const head = idx > -1 ? last.slice(0, idx) : last;
  let body = idx > -1 ? last.slice(idx + 2) : "";
  const notesIdx = body.lastIndexOf("\n\nNotes: ");
  let notes = "";
  if (notesIdx > -1) { notes = body.slice(notesIdx + 9); body = body.slice(0, notesIdx); }
  return { sys, last, engine, brutal, raw, literary, humanize, target, head, body: body.trim(), notes };
}

const pick = <T,>(arr: T[], seed: string) => arr[Math.abs(hash(seed)) % arr.length];
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function localRespond(messages: ChatMessage[]): string {
  const m = meta(messages);
  const h = m.head.toLowerCase();
  if (m.engine === "Analysis" && /why does this line work/.test(h)) return whyLine(m.body || m.head.replace(/why does this line work\?/i, ""));
  if (m.engine === "Analysis" && /first reader/.test(h)) return firstReader(m.body);
  if (m.engine === "Analysis") return analyze(m.body, m.brutal);
  if (m.engine === "Editing") return edit(m.body, m);
  if (m.engine === "Translation") return translate(m.body, m.target);
  if (m.engine === "Poetry" && /poetry lab/.test(h)) return lab(m.body);
  if (m.engine === "Poetry") return poem(m.body, m);
  if (m.engine === "Voice") return continueText(m.body);
  if (m.engine === "SEO") return seo(m.body);
  if (m.engine === "Author") return author(m.body, m.head);
  if (m.engine === "Writing") {
    if (/titles/.test(h)) return titles(m.body);
    if (/captions/.test(h)) return captions(m.body);
    if (/writing prompts/.test(h)) return prompts(m.head);
    if (/writing concepts/.test(h)) return ideas(m.body);
    if (/publish everywhere/.test(h)) return social(m.body);
    if (/deepen/.test(h)) return deepen(m.body);
    return writeFrom(m.body || m.head);
  }
  return chat(m.last, messages);
}

/* ---------------- conversation ---------------- */
function chat(text: string, messages: ChatMessage[]): string {
  const t = text.trim();
  const tl = t.toLowerCase();
  const isPoemish = lines(t).length >= 3;
  if (/who are you|tumhara naam|what are you|are you yash|kaun ho/i.test(tl)) {
    return "I'm Likhakriti AI — the writing companion inside Likhakriti. Not Yash; he founded this place, I just live in it. I'm here to help you find your words without losing your voice. What are you carrying today?";
  }
  if (/don't know what i'm feeling|dont know what i feel|pata nahi kya feel|samajh nahi aa raha|kya likhun|what should i write/i.test(tl)) {
    return "That's a real place to start from, honestly. Most poems begin before the feeling has a name.\n\nTry one of these, no pressure:\n\n1. Finish this without thinking: \"Today the weight is mostly in my ___.\"\n2. Describe the last thing you looked at for too long.\n3. Tell me one object from your day. Just the object. I'll help you find what it's holding.\n\nPick whichever one you flinch at slightly. That's usually the one.";
  }
  if (/three endings|3 endings|teen endings/i.test(tl) && messages.length > 1) {
    const prev = [...messages].reverse().find((x) => x.role === "user" && lines(x.content).length >= 2)?.content || t;
    const img = imagesIn(prev)[0] || "the door";
    return `Three ways this could close — different temperatures, same room:\n\nEnding 1 (quiet):\n${cap(img)} stays where it is.\nSo do I.\n\nEnding 2 (turn):\nI thought I was writing about ${img}.\nI was writing about the waiting.\n\nEnding 3 (open):\nAnd if ${img} remembers any of this,\nit hasn't said.\n\nThe first trusts the reader most. The second explains a little — use it only if the poem earned it. Which one feels like yours?`;
  }
  if (isPoemish) {
    const lang = detectLanguage(t); const e = emotionProfile(t); const s = strongestLine(t);
    const cl = clichesIn(t);
    return `Okay, this has something.\n\nThe pulse is in this line: "${s}". It's specific, and specific is where feeling hides.\n\nWhat I'm reading underneath: ${e.primary}${e.secondary ? `, with ${e.secondary} under it` : ""}. ${lang === "hindi" || lang === "hinglish" ? "The Hindi is doing quiet work — don't translate it out." : ""}${cl.length ? `\n\nOne honest note: "${cl[0]}" is a phrase readers have met before. You have better images in here already.` : ""}\n\nWhat do you want from it — deepen it, make it raw, tighten it, or should I just tell you what stayed with me as a reader?`;
  }
  if (/forced|zabardasti|sounds off|does this (line|work)/i.test(tl)) {
    const q = (t.match(/["“”'‘’]([^"“”'‘’]{4,})["“”'‘’]/) || [])[1];
    if (q) return whyLine(q, true);
    return "Paste the line in quotes and I'll tell you honestly whether it's forced — and where the force is coming from (usually it's the adjective or the last word).";
  }
  if (/turn (this|it) into a poem|poem bana|isse poem|make (this|it) a poem/i.test(tl)) {
    const src = t.replace(/turn (this|it) into a poem|poem bana do|make (this|it) a poem/gi, "").trim() || [...messages].reverse().find((x) => x.role === "user" && x !== messages[messages.length - 1])?.content || t;
    return "There's already a poem hiding inside that. Here's one door into it — keep what's yours, throw away the rest:\n\n" + poem(src, { raw: false, literary: false });
  }
  if (/darker|but not depressing|thoda dark/i.test(tl)) {
    return "Darker without depressing is a lighting change, not a mood change. Three levers:\n\n1. Keep the tender image, but move it to night. (\"her hands\" → \"her hands, in the light the fridge makes at 2am\")\n2. Cut one word of comfort from the ending. Just one.\n3. Let one object refuse to mean anything. Unexplained things read as shadow.\n\nPaste the piece and I'll show you which line to lower the lights on.";
  }
  if (/^(hi|hello|hey|namaste|namaskar|hii+|yo)\b/i.test(tl)) {
    return pick([
      "Hey. What's on the page — or what's refusing to get on it?",
      "Namaste. Bring me a line, a feeling, or a half-thought. Any of the three works.",
      "Hi. Some feelings arrive before language. Which stage are you at?",
    ], t);
  }
  if (t.length < 60) {
    return `"${t}" — there's more under that than it lets on.\n\nWant me to open it up as a poem, turn it into a prompt, or just talk it through? If you paste a piece of writing, I'll read it properly — as an editor, or as a first reader, whichever you need.`;
  }
  const e = emotionProfile(t); const im = imagesIn(t);
  return `I read it. What I'm getting is ${e.primary}${im.length ? `, and the image that's carrying it is ${im[0]}` : ""}.\n\nHere's what I can do from here:\n\n- Write it as a poem (I'll keep your words as the spine)\n- Deepen it — one level down, no fake profundity\n- Make it raw — minimal touch, keep the roughness\n- Read it back to you as a first reader\n\nOr just tell me what it's really about, and we'll start there.`;
}

/* ---------------- analysis ---------------- */
function analyze(text: string, brutal: boolean): string {
  if (!text) return "Paste the poem and I'll read it closely.";
  const e = emotionProfile(text); const im = imagesIn(text); const cl = clichesIn(text); const ai = aiPatternsIn(text);
  const strong = strongestLine(text); const weak = weakestLine(text); const rh = rhymeCheck(text); const ls = lines(text);
  const avg = ls.length ? Math.round(ls.reduce((n, l) => n + words(l).length, 0) / ls.length) : 0;
  const lang = detectLanguage(text);
  const lower = (text.match(/^[a-z\u0900-\u097F]/gm) || []).length / Math.max(1, ls.length);
  const theme = im.length >= 2 ? `${im[0]} and ${im[1]} are doing the thematic work — the poem is less about ${e.primary} as an idea and more about where it lives physically.` : im.length === 1 ? `The poem circles ${e.primary}, anchored by a single object: ${im[0]}. That anchor is what keeps it from floating into abstraction.` : `The poem stays mostly in feeling rather than object. That's a choice — but a reader holds onto things, not states. Consider giving ${e.primary} one physical place to sit.`;
  return [
    `Emotional Core\n${cap(e.primary)}${e.secondary ? `, complicated by ${e.secondary}` : ""}. It doesn't announce itself, which is good — ${e.primary} works best when the poem lets the reader arrive at it.`,
    `Central Theme\n${theme}`,
    `Strongest Image\n"${strong}" — ${imagesIn(strong).length ? "concrete, unforced, and it lets the reader do the feeling" : "it has the cleanest rhythm here, and the restraint makes it land"}.`,
    `Metaphor Map\n${im.length ? im.slice(0, 5).map((i) => `- ${i} → ${metaphorMeaning(i, e.primary)}`).join("\n") : "- No stable object-symbols yet; the metaphors are mostly stated emotions. One recurring physical image would give the poem a spine."}`,
    `Rhythm\n${rh.rhymed ? "There's an end-rhyme pattern. Watch the places where a word was chosen for sound over sense — those are usually where the rhythm feels forced." : "Free verse."} Lines average ${avg} words${avg > 12 ? " — long; a few short lines would give the reader air" : avg < 5 ? " — clipped, which creates pressure. Good if that's the intent" : ", which reads naturally"}. ${ls.length > 1 ? `The break after "${ls[Math.floor(ls.length / 2) - 1]}" is where the poem turns.` : ""}`,
    `Voice\n${lang === "hinglish" ? "Hinglish, conversational — the code-switching feels like speech, not decoration." : lang === "hindi" ? "Hindi, and the register is spoken rather than literary, which keeps it intimate." : lang === "bilingual" ? "Bilingual — the switches between scripts happen at emotional hinges, which is exactly where they should." : "English, plainspoken."} ${lower > 0.6 ? "Mostly lowercase — reads as murmured, not declared." : "Standard casing."} ${avg < 7 ? "Fragmentary, holds things back." : "Complete thoughts, more narrative."}`,
    `Originality\n${cl.length ? `${brutal ? "These are borrowed:" : "A few familiar constructions:"} ${cl.map((c) => `"${c}"`).join(", ")}. ${brutal ? "Cut them. Your own images are stronger and you don't need the rented ones." : "Your own images elsewhere are more alive than these."}` : ai.length ? `Some phrasing reads as generic (${ai.slice(0, 3).map((a) => `"${a}"`).join(", ")}). Swap for something only you would say.` : "No clichés I'd flag. The images are your own."}`,
    `Impact\n"${strong}" is the line a reader carries out of the room.${weak && weak !== strong ? ` The softest moment is "${weak}" — ${brutal ? "it's telling, not showing, and the poem already knows how to show." : "it explains what the previous lines already made us feel."}` : ""}`,
    `Suggestions\n1. ${weak && weak !== strong ? `Try cutting or halving "${weak}" and see if the poem gets stronger by losing it.` : "Read it aloud once; wherever you speed up, the line may be carrying an extra word."}\n2. ${im.length ? `Bring ${im[0]} back once near the end, changed. A returned image is how a poem remembers itself.` : "Give the feeling one object — something you could hold."}\n3. ${rh.rhymed ? "Keep the rhyme only where it's invisible. Where it shows, break it." : "The ending: land on an image, not a conclusion. The reader should feel it close, not hear you close it."}${brutal ? "\n4. The idea is strong. The execution leans on statement in the middle third. Trust the reader more." : ""}`,
    `~ ${readingTime(text)} min read · ${words(text).length} words`,
  ].join("\n\n");
}
function metaphorMeaning(img: string, emo: string) {
  const map: Record<string, string> = { rain: "arrival of memory, things that return without being asked", baarish: "arrival of memory, things that return without being asked", बारिश: "arrival of memory, things that return without being asked", moon: "the witness — distant, constant, unreachable", chaand: "the witness — distant, constant, unreachable", चाँद: "the witness — distant, constant, unreachable", window: "the boundary between inner and outer weather", khidki: "the boundary between inner and outer weather", door: "choice, threshold, what was left open", tea: "ritual, ordinary tenderness", chai: "ritual, ordinary tenderness", चाय: "ritual, ordinary tenderness", silence: "presence that has stopped speaking", mirror: "the self as stranger", aaina: "the self as stranger", night: "the hours when the mind is unguarded", raat: "the hours when the mind is unguarded", रात: "the hours when the mind is unguarded", letter: "what was said too late", khat: "what was said too late", hand: "touch, work, what holds and lets go", haath: "touch, work, what holds and lets go", river: "time that doesn't return", nadi: "time that doesn't return", sky: "scale — how small the speaker feels", aasman: "scale — how small the speaker feels", smoke: "what remains after the burning", dhuan: "what remains after the burning", city: "crowded loneliness", sheher: "crowded loneliness", train: "departure, the life that moves on schedule", street: "public passage through private feeling" };
  return map[img] || `a physical stand-in for ${emo}`;
}

function whyLine(line: string, forcedCheck = false): string {
  const l = line.trim().replace(/^["“]|["”]$/g, "");
  if (!l) return "Give me the line in quotes.";
  const ws = words(l); const im = imagesIn(l); const cl = clichesIn(l);
  const contrast = /\b(but|lekin|मगर|par|still|phir bhi|फिर भी|yet|and yet|only|sirf)\b/i.test(l);
  const sound = ws.length > 2 ? repeatedInitials(ws) : [];
  const short = ws.length <= 6;
  const out: string[] = [];
  if (forcedCheck) out.push(cl.length ? `Honestly? Yes, a little. "${cl[0]}" is a phrase the reader has already met, so the line arrives pre-felt. The force is coming from the borrowed part.` : ws.some((w) => /(ful|ous|ive|less)$/.test(w)) && ws.length > 8 ? `Slightly. It's the adjectives — they're telling the reader how to feel about the image before the image has finished arriving. Try it with one adjective removed.` : `No, it doesn't read as forced. Here's why:`);
  else out.push(`"${l}"\n\nHere's what's doing the work:`);
  const points: string[] = [];
  if (im.length) points.push(`Imagery — ${im.join(", ")} ${im.length > 1 ? "are" : "is"} concrete. The reader sees before they interpret, so the emotion arrives through the body, not the intellect.`);
  if (contrast) points.push(`Contrast — the line turns on a hinge ("${(l.match(/\b(but|lekin|मगर|par|still|phir bhi|फिर भी|yet|only|sirf)\b/i) || [""])[0]}"). Two truths pressed together create tension, and tension is what a reader feels as meaning.`);
  if (sound.length) points.push(`Sound — the repeated ${sound[0]} sound ties the words together under the surface. You hear a pattern before you know it's there.`);
  if (short) points.push(`Rhythm — it's short. After longer lines, a short line lands like a held breath. The pause after it is part of the line.`);
  if (/[…—]/.test(l)) points.push(`The dash/ellipsis — the unfinished shape leaves subtext. What's not said is the loudest thing here.`);
  if (/\b(i|main|मैं|mujhe|मुझे)\b/i.test(l) && im.length) points.push(`Word choice — a first-person speaker next to an ordinary object. That collision (self + thing) is where intimacy comes from.`);
  if (!points.length) points.push(`Word choice — nothing in it is decorative. Plain words carrying more than their size is the oldest trick in poetry and it still works.`, `Subtext — it states one thing and implies another. The reader gets to do the second half.`);
  out.push(points.map((p) => `- ${p}`).join("\n"));
  if (cl.length && !forcedCheck) out.push(`One caution: "${cl[0]}" is familiar. The line works despite it, not because of it.`);
  out.push(`The lesson to steal: ${im.length ? "put the feeling inside an object and let the object speak" : contrast ? "let two things be true at once and don't resolve them" : "say less, and trust the silence after the line"}.`);
  return out.join("\n\n");
}
function repeatedInitials(ws: string[]) {
  const c: Record<string, number> = {};
  for (const w of ws) { const k = w[0].toLowerCase(); c[k] = (c[k] || 0) + 1; }
  return Object.entries(c).filter(([k, n]) => n >= 3 && /[a-z]/.test(k)).map(([k]) => `"${k}"`);
}

function firstReader(text: string): string {
  if (!text) return "Paste the piece. I'll read it the way a stranger would.";
  const e = emotionProfile(text); const strong = strongestLine(text); const weak = weakestLine(text); const ls = lines(text); const im = imagesIn(text);
  const dropAt = weak && weak !== strong ? weak : ls[Math.floor(ls.length * 0.6)] || "";
  return [
    `What did I feel while reading this?\nSomething like ${e.primary} — but it crept up rather than announced itself. By the middle I'd slowed down without deciding to.`,
    `What stayed with me?\n"${strong}". I read it twice. ${im.length ? `And ${im[0]} — I can still see it.` : "It's the line that felt least written and most said."}`,
    `Where did my attention drop?\n${dropAt ? `Around "${dropAt}". I think because it told me something the earlier lines had already made me feel — so I skimmed.` : "It didn't, really. It's short enough to hold in one breath."}`,
    `What question did it leave me with?\n${e.primary === "longing" || e.primary === "nostalgia" ? "Who is the 'you' — and do they know this was written?" : e.primary === "grief" ? "What happened in the gap the poem doesn't describe?" : e.primary === "hope" ? "Is the speaker convincing me, or themselves?" : "What happened right before the first line?"}`,
    `What line would I remember tomorrow?\n"${strong}"${ls.length > 4 ? ` — and maybe the last one, "${ls[ls.length - 1]}", though more for how it closed than what it said.` : "."}`,
    `(That's a reader talking, not an editor. Nothing here needs fixing unless you want it to.)`,
  ].join("\n\n");
}

/* ---------------- editing ---------------- */
function edit(text: string, m: { raw: boolean; literary: boolean; humanize: boolean; brutal: boolean; head: string }): string {
  if (!text) return "Paste the piece you want me to work on.";
  const ls = lines(text);
  const suggestions: { orig: string; sug: string; why: string }[] = [];
  const notes: string[] = [];
  const revised: string[] = [];
  for (const l of ls) {
    let s = l;
    const whys: string[] = [];
    // 1. double spaces / spacing before punctuation
    const sp = s.replace(/\s+([,.!?;:।])/g, "$1").replace(/ {2,}/g, " ");
    if (sp !== s) { s = sp; whys.push("cleaned spacing"); }
    // 2. clichés
    for (const c of clichesIn(s)) {
      const rep = clicheSwap(c);
      if (rep && !m.raw) { s = s.replace(new RegExp(c, "i"), rep); whys.push(`"${c}" is familiar; this keeps the sense but makes it yours to finish`); }
      else if (m.raw) whys.push(`"${c}" is familiar — left it, because RAW; consider replacing it with something only you'd say`);
    }
    // 3. AI patterns / corporate words
    if (m.humanize || /humanize|simplify/i.test(m.head)) {
      const before = s;
      s = s.replace(/\b(delve into)\b/gi, "look at").replace(/\b(utilize)\b/gi, "use").replace(/\b(in conclusion|ultimately),?\s*/gi, "").replace(/\b(it is important to note that|it's worth noting that)\s*/gi, "").replace(/\b(a testament to)\b/gi, "proof of").replace(/\b(tapestry)\b/gi, "mess").replace(/\b(embark on)\b/gi, "start").replace(/\b(furthermore|moreover|additionally),?\s*/gi, "and ").replace(/\b(vibrant)\b/gi, "loud").replace(/\b(journey)\b/gi, "the way there").replace(/\b(in today's fast-paced world),?\s*/gi, "");
      if (s !== before) whys.push("removed machine-flavoured phrasing");
      s = s.charAt(0) === s.charAt(0) && /^[a-z]/.test(before) ? s : s.charAt(0).toUpperCase() + s.slice(1);
    }
    // 4. adjective stacks (skip in raw)
    if (!m.raw) {
      const stack = s.match(/\b(\w+ful|\w+ous|\w+less|beautiful|amazing|incredible|deep|dark|silent|gentle|soft) (\w+ful|\w+ous|\w+less|beautiful|amazing|incredible|deep|dark|silent|gentle|soft) (\w+)/i);
      if (stack) { s = s.replace(stack[0], `${stack[2]} ${stack[3]}`); whys.push(`two adjectives were fighting for the same noun; kept the sharper one`); }
    }
    // 5. redundant intensifiers
    if (!m.raw) {
      const before = s;
      s = s.replace(/\b(very|really|so|truly|bahut|बहुत) (\w+)/gi, (_, a, b) => (/^(much|many|that|far)$/i.test(b) ? `${a} ${b}` : b));
      if (s !== before) whys.push("cut the intensifier — the word underneath is stronger alone");
    }
    // 6. explaining endings
    if (!m.raw && /\b(and that's why|that is why|isliye|इसलिए|which means|this shows)\b/i.test(s) && ls.indexOf(l) === ls.length - 1) {
      whys.push("the last line explains what the poem already showed — consider ending one line earlier");
    }
    // literary: suggest image where abstract
    if (m.literary && !imagesIn(s).length && /\b(sad|happy|pain|dard|दर्द|love|pyaar|lonely|akela)\b/i.test(s)) {
      whys.push("this states the feeling directly; in LITERARY mode I'd trade the abstraction for one object that carries it (a cold cup, an unread message, a light left on)");
    }
    if (whys.length && (s !== l || !m.raw)) suggestions.push({ orig: l, sug: s, why: whys.join("; ") + (m.raw ? ". Everything else left exactly as you wrote it." : ". Your punctuation and line break are untouched.") });
    else if (whys.length) notes.push(`"${l}" — ${whys.join("; ")}.`);
    revised.push(s);
  }
  const header = m.raw ? "RAW mode — minimal touch. Changes only where expression genuinely improves.\n\n" : m.brutal ? "Direct notes, no cushioning.\n\n" : "";
  if (!suggestions.length && notes.length) {
    return header + `I read it twice and left it alone. That's the point of RAW.\n\nNotes, not changes:\n${notes.map((n) => `- ${n}`).join("\n")}\n\nRaw Refined:\n${revised.join("\n")}\n\n(Identical to your original — on purpose.)`;
  }
  if (!suggestions.length) {
    return header + `I read it twice looking for something to fix and mostly didn't want to.\n\nThe line breaks are doing their job, the images are yours, and nothing reads borrowed.\n\nIf you want a genuine edit: read it aloud, and wherever you speed up, that's a word too many. Otherwise — keep the imperfection. That's where the voice lives.`;
  }
  const body = suggestions.slice(0, 6).map((s) => `Original:\n${s.orig}\n\nSuggestion:\n${s.sug}\n\nWhy:\n${cap(s.why)}`).join("\n\n———\n\n");
  const full = /rewrite|refine|humanize|simplify/i.test(m.head) ? `\n\n———\n\n${m.raw ? "Raw Refined" : "Revised"}:\n${revised.join("\n")}` : "";
  const noteBlock = notes.length ? `\n\n———\n\nLeft untouched (RAW), but worth knowing:\n${notes.map((n) => `- ${n}`).join("\n")}` : "";
  const brutalNote = m.brutal ? `\n\n———\n\nThe honest version: the idea is strong; the middle leans on telling. ${suggestions[0] ? `"${suggestions[0].orig}" is the softest line. ` : ""}Your best image is "${strongestLine(text)}" — build toward that instead of around it.` : "";
  return header + body + full + noteBlock + brutalNote;
}
function clicheSwap(c: string) {
  const map: Record<string, string> = { "broken heart": "a heart that stopped mid-sentence", "tears fell like rain": "the crying came without weather", "time heals": "time doesn't heal, it just changes the subject", "at the end of the day": "when the lights are off", "light at the end of the tunnel": "a lamp someone forgot to switch off", "shattered into a million pieces": "cracked once, quietly", "ocean of tears": "salt on the pillow", "whispers of the wind": "the wind not saying it", "echoes of the past": "an old ringtone", "beacon of hope": "a kitchen light left on", "the depths of my soul": "somewhere under the ribs", "dil ke tukde": "dil, jo ab poora nahi lagta", "aankhon mein aansu": "aankhen, jo bina wajah bhari hain", "zindagi ek safar": "zindagi — ek platform, jahan train roz late hai", "toota hua dil": "dil jo chup ho gaya" };
  return map[c] || null;
}

/* ---------------- poetry ---------------- */
function poem(seed: string, m: { raw: boolean; literary: boolean }): string {
  const src = seed.trim();
  if (!src) return "Give me a sentence, a memory, or even one word — I'll find the poem in it.";
  const lang = detectLanguage(src);
  const e = emotionProfile(src);
  const ims = imagesIn(src);
  const img = ims[0] || (lang === "hindi" ? "खिड़की" : lang === "hinglish" ? "khidki" : "the window");
  const firstSentence = sentences(src)[0] || src;
  const seedKey = src.slice(0, 40);
  if (lang === "hindi") {
    const tmpl = [
      `${firstSentence}\n\nमैंने कुछ नहीं कहा —\n${img} ने भी नहीं।\n\nबस कमरे में\nएक पुरानी ख़ामोशी\nअपनी जगह ढूँढती रही,\n\nजैसे उसे पता हो\nकि आज\nकोई लौटने वाला नहीं।`,
      `${firstSentence}\n\nऔर मैं वहीं बैठा रहा\nजहाँ ${img} थी,\nजहाँ हम थे कभी।\n\nयादें दरवाज़ा नहीं खटखटातीं —\nवो चाभी रखती हैं।\n\nआज उन्होंने\nबिना बताए\nघर खोल लिया।`,
    ];
    return pick(tmpl, seedKey) + (m.raw ? "" : "\n\n~ (yours to break and rebuild)");
  }
  if (lang === "hinglish") {
    const tmpl = [
      `${firstSentence}\n\naur main kuch nahi bola —\n${img} bhi chup thi.\n\nbas kamre mein\nek purani khamoshi\napni jagah dhoondhti rahi,\n\njaise use pata ho\nki aaj\nkoi lautne wala nahi.`,
      `${firstSentence}\n\nyaadein knock nahi karti,\nunke paas chaabi hoti hai.\n\naaj unhone\nbina bataye\nghar khol liya —\n\naur main\n${img} ke paas\nkhada reh gaya,\nmehmaan ki tarah.`,
    ];
    return pick(tmpl, seedKey) + (m.raw ? "" : "\n\n~ (yours to break and rebuild)");
  }
  const openers: Record<string, string[]> = {
    longing: [`${firstSentence}\n\nNot the loud kind of remembering.\nThe kind where ${img} looks the same\nand that's the problem.\n\nI kept the room how it was.\nI didn't keep the room how it was.\nBoth are true depending on the hour.\n\nSomewhere you're a person\ndoing ordinary things.\nHere, you're weather.`],
    grief: [`${firstSentence}\n\nThere's a version of this\nwhere I say the right thing.\n\nInstead: ${img},\nand the sound it makes\nwhen no one's there to hear it.\n\nI'm learning the difference\nbetween quiet\nand gone.\n\nSlowly. Badly.\nThe way anyone does.`],
    love: [`${firstSentence}\n\nI don't have a better word for it,\nso here is ${img},\nand here is how long I looked.\n\nYou'd call it nothing.\nYou'd be wrong,\nbut gently.`],
    nostalgia: [`${firstSentence}\n\nThe past doesn't knock.\nIt has a key.\n\nToday it let itself in —\nsat by ${img},\nasked nothing,\nand I made tea for two\nbefore I noticed.`],
    loneliness: [`${firstSentence}\n\nThe room has learned my shape.\n${cap(img)} doesn't ask.\n\nI say the day out loud\nto hear a voice in it.\n\nIt's mine.\nIt'll do.`],
    hope: [`${firstSentence}\n\nNothing dramatic.\nJust ${img}\nand the light behaving differently,\n\nlike a door\ndeciding, for once,\nnot to be a wall.`],
  };
  const fallback = [`${firstSentence}\n\nI wrote it down\nso it would stop following me.\n\nIt didn't work.\n${cap(img)} is still here,\nand so is the reason.\n\nBut at least now\nit has a shape.\nAt least now\nI can put it down.`];
  const p = pick(openers[e.primary] || fallback, seedKey);
  return p + (m.raw ? "" : m.literary ? "\n\n~ (a first draft — the third stanza is where I'd push for one more concrete image)" : "\n\n~ (a draft, not a verdict — keep what's yours)");
}

function lab(seed: string): string {
  const s = seed.trim() || "rain";
  const img = imagesIn(s)[0] || words(s).slice(-1)[0] || "it";
  const dirs = [
    ["Memory", `${cap(img)} doesn't fall. It returns. / Same sound, different year.`],
    ["Loss", `I stopped counting the days. / ${cap(img)} didn't.`],
    ["Reunion", `If you came back today, / ${img} would be the only one not surprised.`],
    ["Childhood", `Back then ${img} was a game. / Now it's a message I keep rereading.`],
    ["Silence", `We didn't talk about it. / ${cap(img)} did the talking for us.`],
    ["Hope", `Even ${img} has to stop eventually. / That's not sad. That's a window.`],
    ["Regret", `I should have stood in it longer. / The ${img}. The moment. Both.`],
  ];
  return `Seed: "${s}"\n\nSeven emotional directions — each is a door, not a destination:\n\n${dirs.map(([d, l]) => `${d}\n${l}`).join("\n\n")}\n\nPick one and I'll write into it with you. Or tell me which two you can't choose between — the poem is usually in the tension.`;
}

function continueText(text: string): string {
  const t = text.trim();
  if (!t) return "Paste what you have and I'll keep going in your voice.";
  const ls = lines(t); const last = ls[ls.length - 1] || t;
  const avg = Math.round(ls.reduce((n, l) => n + words(l).length, 0) / Math.max(1, ls.length));
  const lower = /^[a-z]/.test(last);
  const lang = detectLanguage(t); const img = imagesIn(t)[0]; const e = emotionProfile(t);
  const short = avg <= 6;
  let cont: string[];
  if (lang === "hindi") cont = [`…और फिर वही हुआ जो हमेशा होता है —`, `${img ? img : "कमरा"} चुप रहा,`, `मैं भी।`, ``, `कुछ बातें`, `कहने से नहीं,`, `रुक जाने से पूरी होती हैं।`];
  else if (lang === "hinglish") cont = [`…aur phir wahi hua jo hamesha hota hai —`, `${img || "kamra"} chup raha,`, `main bhi.`, ``, `kuch baatein`, `kehne se nahi,`, `ruk jaane se poori hoti hain.`];
  else cont = short
    ? [`…and then the usual thing.`, `${img ? cap(img) : "The room"} stayed.`, `So did I.`, ``, `Some sentences`, `don't end.`, `They just stop being said.`]
    : [`…and I kept telling myself it was the ${img || "light"}, the hour, anything but the obvious — because the obvious would have meant admitting ${e.primary === "longing" ? "I'd been waiting" : e.primary === "grief" ? "it was already over" : "I already knew"}.`, ``, `So I did what anyone does. I made the tea. I let it go cold. I called that a decision.`];
  if (lower) cont = cont.map((l) => l.charAt(0).toLowerCase() + l.slice(1));
  return cont.join("\n") + `\n\n(Continuation only — matched your line length${lower ? ", lowercase" : ""} and ${lang}. Take what fits; cut the rest.)`;
}

/* ---------------- writing helpers ---------------- */
function writeFrom(seed: string): string {
  const s = seed.trim();
  return poem(s, { raw: false, literary: false });
}
function deepen(text: string): string {
  const im = imagesIn(text); const e = emotionProfile(text); const strong = strongestLine(text);
  return `Deepening is mostly subtraction plus one honest question.\n\nThe question under your piece: ${e.primary === "longing" ? "what would you do if they actually came back?" : e.primary === "grief" ? "what part of this are you still pretending is temporary?" : e.primary === "love" ? "what are you afraid it will cost?" : e.primary === "nostalgia" ? "what were you avoiding, back then, that you've now forgotten?" : "what are you not saying because it sounds too simple?"}\n\nThree moves, no added complexity:\n\n1. Go one layer under "${strong}". Don't explain it — write the line that comes right after it in real life.\n2. ${im.length ? `Let ${im[0]} change by the end. Same object, different weather.` : "Give the feeling one object. Depth lives in things, not adjectives."}\n3. Cut the line that's doing the most work to sound deep. The poem gets deeper by losing it.\n\nOriginal:\n${strong}\n\nDeepened (one option):\n${strong}\n${im.length ? `${cap(im[0])} doesn't know that yet.` : "I haven't told anyone that yet."}\n\nWhy:\nIt adds a second speaker — the object, or time — without adding a single abstract word.`;
}
function titles(text: string): string {
  const im = imagesIn(text); const e = emotionProfile(text); const strong = strongestLine(text); const lang = detectLanguage(text);
  const w = words(strong);
  const frag = w.slice(-3).join(" ");
  const list = lang === "hindi"
    ? [`${im[0] || "एक"} के बाद`, `जो नहीं कहा`, `${frag}`, `इस बार`, `आधा ख़त`]
    : lang === "hinglish"
    ? [`${im[0] || "Uske"} ke baad`, `Jo nahi kaha`, `${frag}`, `Is baar`, `Aadha khat`]
    : [`After ${im[0] || "the Rain"}`, `What I Didn't Say`, `${cap(frag)}`, `${cap(e.primary)}, Minor Key`, `${cap(im[1] || im[0] || "Room")}, Later`, `A Small Weather`, `Still`];
  return `Titles — from quiet to pointed:\n\n${list.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nMy honest pick: #3 — it's lifted from your own strongest line, so the title already sounds like you. Titles that quote the poem trust the reader; titles that summarise it don't.`;
}
function captions(text: string): string {
  const strong = strongestLine(text); const im = imagesIn(text); const e = emotionProfile(text);
  return `Short:\n${strong}\n\nMedium:\n${strong}\n\nwrote this on a night when ${im[0] ? `the ${im[0]} wouldn't stop` : "the words wouldn't stop"}. not fixing it. some things are supposed to stay a little uneven.\n\nOne-line:\n${e.primary}, in ${words(text).length} words.\n\nTags (optional, ≤5): #likhakriti #poetry #${e.primary} ${detectLanguage(text) === "english" ? "#writersofinstagram" : "#hindipoetry"}\n\nTip: the caption should be lower-temperature than the poem. Let the poem be the loud one.`;
}
function prompts(head: string): string {
  const topic = (head.match(/around: (.+)\./) || [])[1];
  const base = topic ? [
    `Write about ${topic} without ever naming it.`,
    `${cap(topic)}, but from the point of view of an object in the room.`,
    `A letter about ${topic} that you'd never send. Include one lie.`,
    `Describe ${topic} using only things you can touch.`,
    `The moment before ${topic} became a big deal. Stay there.`,
  ] : [
    `Describe the last object someone left at your place. Don't mention the person.`,
    `Write the text message you typed and deleted. Then the one you sent. Then what you meant.`,
    `A poem where the weather is doing all the feeling and you refuse to.`,
    `Bachpan ka ek kamra. Sirf awaazein likho — koi cheez nahi.`,
    `Write about hope like it's someone who owes you money.`,
    `A conversation with the version of you from exactly one year ago. They only get three sentences.`,
    `Ek line jo tumne kabhi kisi se nahi kahi — usse poem ki aakhri line banao, aur wahan se peeche likho.`,
  ];
  return `Prompts — pick the one you flinch at:\n\n${base.map((p, i) => `${i + 1}. ${p}`).join("\n\n")}`;
}
function ideas(text: string): string {
  const s = text.trim(); const im = imagesIn(s); const e = emotionProfile(s);
  return `"${s}"\n\nFive directions this thought could grow in:\n\n1. Micro poem — three lines, ends on ${im[0] || "an object"}, no explanation.\n2. Prose piece — the ordinary hour around this thought: what you were doing with your hands when it arrived.\n3. Letter — addressed to whoever this is really about. You don't have to send it.\n4. Essay — why ${e.primary} shows up as ${im[0] || "this specific image"} for you and not something else.\n5. Spoken word — same thought, but repeated three times, each time with one word changed.\n\nThe one with the most heat is usually #2. Thoughts like this rarely arrive alone — they arrive while you're doing something else. That's the story.`;
}
function social(text: string): string {
  const strong = strongestLine(text); const ls = lines(text); const e = emotionProfile(text); const im = imagesIn(text);
  const slides = ls.length >= 4 ? [ls.slice(0, 2).join("\n"), ls.slice(2, 4).join("\n"), ls.slice(4).join("\n") || strong] : [strong, ls.join("\n"), "~"];
  return `Instagram caption\n${strong}\n\n(full piece in the image / carousel)\nwrote this ${im[0] ? `when the ${im[0]} wouldn't stop` : "late, and left it a little uneven on purpose"}.\n#likhakriti #poetry #${e.primary}\n\nInstagram carousel\nSlide 1: ${strong}\nSlide 2: ${slides[0]}\nSlide 3: ${slides[1]}\nSlide 4: ${slides[2]}\nSlide 5: ~ written on Likhakriti\n\nReel caption\n${strong} — read it slow.\n\nYouTube description\nA short poem about ${e.primary}. ${im[0] ? `It started with ${im[0]} and ended somewhere else.` : "It started as one sentence."}\n\nFull text:\n${text}\n\nWritten with Likhakriti — a place to turn what you feel into words that still sound like you.\n\nLinkedIn\nI don't usually post poems here. But this one is about ${e.primary}, and I think more of us carry that into work than we admit.\n\n${strong}\n\n(Full piece in the comments. No lesson attached.)\n\nFacebook\n${text}\n\n— wrote this recently. Sharing it as-is.\n\nShort quote\n"${strong}"\n\nX post\n${strong.length <= 200 ? strong : strong.slice(0, 197) + "…"}\n\n———\nEverything above keeps your lines verbatim; only the frame changes per platform.`;
}
function translate(text: string, target?: string): string {
  const lang = detectLanguage(text);
  const tgt = (target || (lang === "english" ? "hindi" : "english")).toLowerCase();
  return `Translation needs a live language model to preserve emotion properly — the offline engine won't fake it, because a bad translation of a poem is worse than none.\n\nWhat I can do right now:\n\nDetected source: ${lang}. Target: ${tgt}.\n\nCarry-over notes (so whoever translates keeps the feeling):\n- Keep the line breaks exactly — the pauses are part of the meaning.\n- Strongest line to protect: "${strongestLine(text)}". Translate for its weight, not its words.\n- ${imagesIn(text).length ? `Images to keep literal: ${imagesIn(text).join(", ")}.` : "There are no concrete images to anchor on — the translator will need to match tone instead."}\n- ${tgt.includes("hindi") ? "Prefer spoken Hindi over Sanskritized vocabulary unless the original is formal." : tgt.includes("hinglish") ? "Roman script the way people text; don't over-correct spellings." : "Plain English; resist adding articles that pad the rhythm."}\n\nConnect an AI provider (see .env.example) and this mode translates fully, with emotional-choice notes.`;
}
function seo(text: string): string {
  const ws = words(text.toLowerCase()).filter((w) => w.length > 4);
  const freq: Record<string, number> = {}; for (const w of ws) freq[w] = (freq[w] || 0) + 1;
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
  const kw = top[0] || "your topic";
  return `SEO Content Brief\n\nPrimary keyword\n${kw}\n\nSearch intent\nInformational — the reader wants to understand ${kw}, not buy something. Write like a person explaining, not a page ranking.\n\nSemantic keywords\n${top.slice(1, 8).map((w) => `- ${w}`).join("\n") || "- (add 5–8 related phrases)"}\n\nTitle options (≤60 chars)\n1. ${cap(kw)}: what nobody explains properly\n2. A plain guide to ${kw}\n3. ${cap(kw)} — the short version\n\nMeta description (≤155)\nA clear, human explanation of ${kw} — what it is, why it matters, and what to do next. No jargon.\n\nOutline\nH2 What ${kw} actually means\nH2 Why it matters right now\n  H3 The common misunderstanding\nH2 How to approach it (step-by-step)\nH2 Mistakes to avoid\nH2 FAQ\n\nReadability\nShort paragraphs, one idea each. Keep your voice in the intro — that's what makes people stay past the first fold.\n\nInternal links\nLink to: a related explainer, your about page, one deeper piece on ${top[1] || "a subtopic"}.\n\nFAQ\n- What is ${kw}?\n- Is ${kw} worth it for beginners?\n- How long does ${kw} take?\n- What's the biggest mistake with ${kw}?\n\nSchema\nArticle + FAQPage.\n\nNote: don't let keywords bend the sentences. If a line reads worse with the keyword in it, leave it out — Google reads like a human now.`;
}
function author(text: string, head: string): string {
  const t = text.trim();
  return `Author Mode\n\n${/foreword|dedication|author note/i.test(head) ? `Draft:\n\nFor whoever reads this at the wrong hour — it was written at one.\n\n(Short, specific, no thanks-to-everyone. A dedication is a line, not a list.)\n\n` : ""}Working structure for "${t.split("\n")[0].slice(0, 60) || "your book"}":\n\nWhat it's really about (beneath the plot)\nWrite one sentence here that has no character names in it. If you can't, that's the first thing to find.\n\nParts\n1. Before — the ordinary world, one crack visible\n2. During — the crack becomes a door; the character walks through against their better judgment\n3. After — same world, the character can't unsee it\n\nChapter template\n- What changes in this chapter (one line)\n- Recurring symbol appearance\n- Continuity: what the reader must remember from earlier\n- Summary (write it after drafting, not before)\n\nCharacter note format\nWant / Fear / Lie they believe / The object they always carry\n\nSymbols to track\nPick two. Not five. They should mean something different by the end.\n\nWhen you're ready, paste a chapter and I'll do continuity and summary. Or tell me the one sentence, and we'll build the spine from it.`;
}
