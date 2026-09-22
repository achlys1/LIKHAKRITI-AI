/** Voice memory: learn stylistic stats from the user's own documents (never from AI output). */
import { docs, voice, type VoiceLearned } from "./repo";
import { detectLanguage, imagesIn, lines, sentences, words } from "./ai/textstats";

const STOP = new Set("the a an and or but of to in on at for with is are was were be been it its this that i me my you your we our they them he she his her not no so as if then than from by about into over under out up down do did does have has had will would can could should just like very really main mein mera meri tum tumhara hai hain ho tha thi the ka ki ke ko se par aur bhi toh ye yeh woh wo kya kyun nahi nahin kuch sab ab jab tab yahan wahan है हैं था थी थे का की के को से पर और भी तो ये यह वो वह क्या क्यों नहीं कुछ सब अब जब तब यहाँ वहाँ मैं मेरा मेरी तुम तुम्हारा हम हमारा एक में ने".split(/\s+/));

export async function learnVoice(userId: string): Promise<VoiceLearned | null> {
  const all = (await docs.list(userId)).filter((d) => d.body.trim().length > 40).slice(0, 60);
  if (!all.length) return null;
  const text = all.map((d) => d.body).join("\n\n");
  const sents = sentences(text); const ls = lines(text); const ws = words(text);
  const punct: Record<string, number> = {};
  for (const ch of text) if ("—-…,.;:!?।\"'()".includes(ch)) punct[ch] = (punct[ch] || 0) + 1;
  const lowerLines = ls.filter((l) => /^[a-z]/.test(l)).length;
  const latinLines = ls.filter((l) => /^[A-Za-z]/i.test(l)).length;
  const freq: Record<string, number> = {};
  for (const w of ws) { const k = w.toLowerCase(); if (k.length > 2 && !STOP.has(k)) freq[k] = (freq[k] || 0) + 1; }
  const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([w]) => w);
  const languages: Record<string, number> = {};
  for (const d of all) { const l = detectLanguage(d.body); languages[l] = (languages[l] || 0) + 1; }
  const imgFreq: Record<string, number> = {};
  for (const d of all) for (const i of imagesIn(d.body)) imgFreq[i] = (imgFreq[i] || 0) + 1;
  const recurringImages = Object.entries(imgFreq).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
  const learned: VoiceLearned = {
    samples: all.length,
    avgSentenceLen: Math.round(ws.length / Math.max(1, sents.length)),
    avgLineLen: Math.round(ws.length / Math.max(1, ls.length)),
    lowercaseRatio: latinLines ? +(lowerLines / latinLines).toFixed(2) : 0,
    punctuation: Object.fromEntries(Object.entries(punct).sort((a, b) => b[1] - a[1]).slice(0, 6)),
    topWords,
    languages,
    recurringImages,
  };
  await voice.setLearned(userId, learned);
  return learned;
}
