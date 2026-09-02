export const supportedLocales = ["en", "zh-Hant"];
export const localeNames = { en: "English", "zh-Hant": "繁體中文" };

export function normaliseLocale(value) {
  const raw = String(value || "").replace(/_/g, "-");
  if (supportedLocales.includes(raw)) return raw;
  const lower = raw.toLowerCase();
  if (["zh-hk", "zh-tw", "zh-mo"].includes(lower)) return "zh-Hant";
  if (lower === "zh") return "zh-Hant";
  if (lower.startsWith("en")) return "en";
  return null;
}

export function resolveLocale({ explicit, saved, browser } = {}) {
  return normaliseLocale(explicit) || normaliseLocale(saved) || normaliseLocale(browser) || "en";
}

const messages = {
  en: {
    observation: "Your first five answers already point to a pattern worth looking at.",
    mixed: "Two explanations are still close, which is exactly where the adaptive questions become useful.",
    clear: "One explanation is beginning to stand out, but the rest of the quiz checks whether it holds across different situations.",
    next: "Continue for the full reflection and the evidence behind it."
  },
  "zh-Hant": {
    observation: "你的首五個答案已經帶出一個值得再看的模式。",
    mixed: "目前有兩個解釋仍然很接近，接下來的自適應問題正好可以分辨當中的差異。",
    clear: "其中一個解釋開始較為突出，但餘下問題會再看看它在不同情境中是否仍然成立。",
    next: "繼續完成測驗，看看完整解讀和背後的答案證據。"
  }
};

function field(row, name) {
  if (!row) return "";
  if (row[name] !== undefined) return row[name];
  const compact = name.replaceAll(" ", "");
  const key = Object.keys(row).find((item) => item.replaceAll(" ", "") === compact);
  return row[key] || "";
}

const firstSentence = (value) => (String(value || "").match(/^[^.!?。！？]+[.!?。！？]?/) || [String(value || "")])[0].trim();

export function previewInsight(scores, locale = "en", quiz = null) {
  const ids = ["H1", "H2", "H3", "H4"];
  const ranked = [...ids].sort((a, b) => Number(scores[b] || 0) - Number(scores[a] || 0) || a.localeCompare(b));
  const lead = Number(scores[ranked[0]] || 0);
  const second = Number(scores[ranked[1]] || 0);
  const total = ids.reduce((sum, id) => sum + Math.abs(Number(scores[id] || 0)), 0);
  const id = total < 6 ? "low-confidence" : lead - second <= 1 ? "mixed-signal" : "primary-" + ranked[0].toLowerCase();
  const resolved = resolveLocale({ explicit: locale });
  const copy = messages[resolved];
  const row = quiz?.resultBlueprints?.find((item) => item.Primary === ranked[0]);
  const primaryLabel = field(row, resolved === "zh-Hant" ? "主要模式中文" : "Primary EN");
  const headlineSource = field(row, resolved === "zh-Hant" ? "Headline中文" : "Headline EN");
  const withYou = field(row, resolved === "zh-Hant" ? "站在你這邊中文" : "We're With You EN");
  const headline = primaryLabel
    ? (resolved === "zh-Hant" ? `初步訊號：${primaryLabel}` : `Early signal: ${primaryLabel}`)
    : (resolved === "zh-Hant" ? "你的初步訊號" : "Your early signal");
  return {
    id,
    quizId: quiz?.id || null,
    headline,
    observation: firstSentence(withYou) || copy.observation,
    curiosity: id === "mixed-signal" || id === "low-confidence" ? copy.mixed : copy.clear,
    next: firstSentence(headlineSource) ? `${firstSentence(headlineSource)} ${copy.next}` : copy.next
  };
}
