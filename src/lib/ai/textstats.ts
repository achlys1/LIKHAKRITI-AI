/** Language-aware text heuristics shared by the local engine, analyzer and voice memory. */

export const CLICHES = [
  "at the end of the day", "in a world where", "tapestry", "testament to", "delve", "journey", "unlock", "embark", "heart of gold",
  "time heals", "broken heart", "tears fell like rain", "shattered into a million pieces", "light at the end of the tunnel",
  "every cloud has a silver lining", "soulmate", "forever and always", "dance in the rain", "stars in your eyes", "ocean of tears",
  "whispers of the wind", "echoes of the past", "a symphony of", "beacon of hope", "the depths of my soul", "ethereal", "evoke",
  "dil ke tukde", "aankhon mein aansu", "zindagi ek safar", "toota hua dil", "pyaar ki kahani",
];
export const AI_PATTERNS = [
  /\b(delve|tapestry|testament|embark|unleash|elevate|navigate|realm|landscape|journey|vibrant|multifaceted|nuanced|pivotal|crucial|robust|seamless|foster|harness)\b/gi,
  /\bin (today's|this) (fast-paced|ever-changing|digital) world\b/gi,
  /\b(it is important to note|it's worth noting|in conclusion|ultimately,|in essence|furthermore|moreover|additionally)\b/gi,
  /\bnot only .* but also\b/gi,
  /\b(a reminder that|serves as a|stands as a)\b/gi,
];
const EMOTION_LEX: Record<string, string[]> = {
  longing: ["miss", "missing", "yaad", "याद", "wait", "intezaar", "इंतज़ार", "return", "lautna", "door", "दूर", "someone", "usne", "उसकी", "uski", "tum", "तुम"],
  grief: ["loss", "lost", "gone", "death", "died", "mourn", "grave", "kho", "खो", "maut", "मौत", "ruksat", "khamosh", "ख़ामोश", "tears", "aansu", "आँसू", "रोना"],
  love: ["love", "pyaar", "प्यार", "ishq", "इश्क़", "mohabbat", "मोहब्बत", "heart", "dil", "दिल", "kiss", "hold", "touch", "chhoo"],
  nostalgia: ["childhood", "bachpan", "बचपन", "old", "purana", "पुराना", "remember", "used to", "school", "ghar", "घर", "gali", "गली", "photograph", "album"],
  loneliness: ["alone", "akela", "अकेला", "tanha", "तन्हा", "empty", "khaali", "खाली", "silence", "sannata", "सन्नाटा", "room", "kamra", "nobody", "koi nahi", "कोई नहीं"],
  hope: ["hope", "umeed", "उम्मीद", "morning", "subah", "सुबह", "light", "roshni", "रोशनी", "again", "phir", "फिर", "begin", "shuru", "शुरू", "sun", "dhoop", "धूप"],
  anger: ["anger", "gussa", "ग़ुस्सा", "burn", "jal", "जल", "fire", "aag", "आग", "scream", "chilla", "hate", "nafrat", "नफ़रत"],
  peace: ["calm", "shaant", "शांत", "quiet", "still", "breath", "saans", "साँस", "sukoon", "सुकून", "slow", "sleep", "neend", "नींद"],
  fear: ["afraid", "fear", "dar", "डर", "scared", "dark", "andhera", "अंधेरा", "shadow", "saaya", "साया", "night", "raat", "रात"],
};
const IMAGE_LEX = ["rain", "baarish", "बारिश", "moon", "chaand", "चाँद", "window", "khidki", "खिड़की", "door", "darwaza", "दरवाज़ा", "river", "nadi", "नदी", "sea", "samundar", "समंदर", "tea", "chai", "चाय", "smoke", "dhuan", "धुआँ", "candle", "diya", "दीया", "street", "sadak", "सड़क", "lamp", "letter", "khat", "ख़त", "sky", "aasman", "आसमान", "star", "taara", "तारा", "mirror", "aaina", "आईना", "wall", "deewar", "दीवार", "train", "station", "phone", "photo", "shirt", "kurta", "dust", "mitti", "मिट्टी", "wind", "hawa", "हवा", "tree", "ped", "पेड़", "leaf", "patta", "पत्ता", "hand", "haath", "हाथ", "eyes", "aankhen", "आँखें", "voice", "awaaz", "आवाज़", "shadow", "saaya", "साया", "bed", "pillow", "takiya", "तकिया", "clock", "ghadi", "घड़ी", "bird", "parinda", "परिंदा", "winter", "sardi", "सर्दी", "summer", "garmi", "गर्मी", "evening", "shaam", "शाम", "morning", "subah", "सुबह", "night", "raat", "रात", "umbrella", "chhata", "छाता", "bus", "city", "sheher", "शहर", "silence", "khamoshi", "ख़ामोशी"];

export function detectLanguage(text: string): "hindi" | "english" | "hinglish" | "bilingual" | "unknown" {
  const dev = (text.match(/[\u0900-\u097F]/g) || []).length;
  const lat = (text.match(/[A-Za-z]/g) || []).length;
  if (!dev && !lat) return "unknown";
  if (dev && lat && dev / (dev + lat) > 0.2 && lat / (dev + lat) > 0.2) return "bilingual";
  if (dev > lat) return "hindi";
  const hinglishMarkers = /\b(hai|hain|nahi|nahin|mujhe|tum|tumhe|kya|kyun|kyu|mera|meri|tera|teri|dil|pyaar|yaad|raat|baarish|zindagi|kuch|bhi|aur|toh|woh|yeh|usne|uski|main|mein|hum|sab|abhi|kabhi|phir|se|ko|ka|ki|ke|par|jo|ho|tha|thi|the)\b/gi;
  const words = text.match(/[A-Za-z]+/g) || [];
  const hits = (text.match(hinglishMarkers) || []).length;
  if (words.length && hits / words.length > 0.12) return "hinglish";
  return "english";
}

export function lines(text: string) { return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean); }
export function sentences(text: string) { return text.split(/(?<=[.!?।])\s+|\n+/).map((s) => s.trim()).filter(Boolean); }
export function words(text: string) { return text.match(/[\p{L}\p{M}'’-]+/gu) || []; }

export function emotionProfile(text: string) {
  const t = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [emo, lex] of Object.entries(EMOTION_LEX)) {
    scores[emo] = lex.reduce((n, w) => n + (t.includes(w.toLowerCase()) ? 1 : 0), 0);
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return { primary: sorted[0][1] > 0 ? sorted[0][0] : "quiet observation", secondary: sorted[1][1] > 0 ? sorted[1][0] : null, scores };
}

export function imagesIn(text: string) {
  const t = text.toLowerCase();
  const found = IMAGE_LEX.filter((w) => new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu").test(t));
  return Array.from(new Set(found));
}
export function clichesIn(text: string) {
  const t = text.toLowerCase();
  return CLICHES.filter((c) => t.includes(c));
}
export function aiPatternsIn(text: string) {
  const hits: string[] = [];
  for (const re of AI_PATTERNS) { const m = text.match(re); if (m) hits.push(...m.map((x) => x.toLowerCase())); }
  return Array.from(new Set(hits));
}
export function strongestLine(text: string) {
  const ls = lines(text);
  if (!ls.length) return "";
  // prefer lines with a concrete image, moderate length, and a contrast/turn word
  const score = (l: string) => {
    let s = 0;
    const len = words(l).length;
    if (len >= 4 && len <= 12) s += 2;
    if (imagesIn(l).length) s += 3;
    if (/\b(but|lekin|मगर|par|still|phir bhi|फिर भी|yet|only|sirf|सिर्फ़)\b/i.test(l)) s += 2;
    if (/[?—…]/.test(l)) s += 1;
    if (clichesIn(l).length) s -= 3;
    return s;
  };
  return ls.slice().sort((a, b) => score(b) - score(a))[0];
}
export function weakestLine(text: string) {
  const ls = lines(text);
  if (ls.length < 2) return "";
  const score = (l: string) => {
    let s = 0;
    if (clichesIn(l).length) s += 3;
    if (aiPatternsIn(l).length) s += 2;
    const ws = words(l);
    const adj = ws.filter((w) => /(ful|less|ous|ive|able)$/.test(w)).length;
    if (adj >= 2) s += 1;
    if (ws.length > 18) s += 1;
    if (!imagesIn(l).length) s += 1;
    if (/\b(forever|always|never|everything|nothing|hamesha|हमेशा|kabhi nahi)\b/i.test(l)) s += 1;
    return s;
  };
  return ls.slice().sort((a, b) => score(b) - score(a))[0];
}
export function rhymeCheck(text: string) {
  const ls = lines(text);
  if (ls.length < 2) return { rhymed: false, ratio: 0 };
  const ends = ls.map((l) => (words(l).pop() || "").toLowerCase().slice(-2));
  let pairs = 0;
  for (let i = 1; i < ends.length; i++) if (ends[i] && ends[i] === ends[i - 1]) pairs++;
  for (let i = 2; i < ends.length; i++) if (ends[i] && ends[i] === ends[i - 2]) pairs++;
  const ratio = pairs / ends.length;
  return { rhymed: ratio > 0.3, ratio };
}
export function readingTime(text: string) { return Math.max(1, Math.round(words(text).length / 200)); }
