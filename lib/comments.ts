// Not real moderation — no backend reviewer, just a keyword heuristic
// standing in for one, ported as-is from the old client-side data.js.
const NEGATIVE_COMMENT_WORDS = [
  "bad", "rude", "late", "unprepared", "mean", "awful", "terrible", "worst",
  "unhelpful", "disrespectful", "cancel", "no show", "noshow", "yell",
  "angry", "hate", "horrible", "waste", "annoying", "condescending",
  "never showed", "didn't show", "didn't help", "confusing", "useless",
];

export function classifyComment(text: string): "warm" | "cold" {
  const lower = text.toLowerCase();
  return NEGATIVE_COMMENT_WORDS.some((w) => lower.includes(w)) ? "cold" : "warm";
}
