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
  en: ["An early pattern is taking shape.", "Continue for the fuller reflection."],
  "zh-Hant": ["你的最初回答，正呈現一個值得探索的早期模式。", "繼續完成更完整的個人反思。"]
};

export function previewInsight(scores, locale = "en") {
  const ids = ["H1", "H2", "H3", "H4"];
  const ranked = [...ids].sort((a, b) => Number(scores[b] || 0) - Number(scores[a] || 0));
  const lead = Number(scores[ranked[0]] || 0);
  const second = Number(scores[ranked[1]] || 0);
  const total = ids.reduce((sum, id) => sum + Math.abs(Number(scores[id] || 0)), 0);
  const id = total < 6 ? "low-confidence" : lead - second <= 1 ? "mixed-signal" : "primary-" + ranked[0].toLowerCase();
  const copy = messages[resolveLocale({ explicit: locale })];
  return { id, observation: copy[0], next: copy[1] };
}
