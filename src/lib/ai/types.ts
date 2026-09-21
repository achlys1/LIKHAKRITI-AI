export type Task =
  | "chat" | "write" | "continue" | "rewrite" | "refine" | "humanize" | "deepen" | "simplify"
  | "translate" | "analyze" | "title" | "caption" | "prompt" | "idea" | "why" | "lab"
  | "first_reader" | "seo" | "social" | "author" | "poem" | "creator";

export type Engine = "conversation" | "writing" | "poetry" | "editing" | "analysis" | "seo" | "translation" | "author" | "voice";

export type Mode = "default" | "raw" | "literary" | "humanize";

export interface AIOptions {
  mode?: Mode;
  brutal?: boolean;
  language?: "auto" | "hindi" | "english" | "hinglish" | "bilingual" | string;
  form?: string;          // free verse, rhyming, ghazal, nazm, haiku, prose poetry, micro, spoken word
  rhyme?: "auto" | "yes" | "no";
  tone?: string;          // romantic, melancholic, existential, ...
  keepImperfections?: boolean;
  targetLanguage?: string;
  direction?: string;     // Poetry Lab emotional direction
  platform?: string;      // social assistant
  keywords?: string;      // seo
  count?: number;
}

export interface ChatMessage { role: "user" | "assistant" | "system"; content: string; }

export interface AIRequest {
  task: Task;
  input: string;              // primary text (user's writing)
  instruction?: string;       // free-form user instruction
  options?: AIOptions;
  history?: ChatMessage[];
  voice?: { manual: Record<string, unknown>; learned: Record<string, unknown> | null } | null;
  documentTitle?: string;
  userId?: string | null;
}

export interface ProviderResult { text: string; tokensIn?: number; tokensOut?: number; }

export interface AIProvider {
  name: string;
  model: string;
  stream(messages: ChatMessage[], opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal }): AsyncIterable<string>;
}
