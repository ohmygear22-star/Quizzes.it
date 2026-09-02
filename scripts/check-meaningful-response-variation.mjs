import { quizzes } from "../v31/index.js";
import { quizFromSource } from "../v31/source.js";

const prefixes = {
  en: ["Closest to me: ", "Another honest possibility: ", "I might also recognise this: ", "The more direct answer: "],
  zh: ["比較貼近的描述：", "另一個真實的可能：", "也可能是這種情況：", "如果更直接一點："],
};
const strip = (value, candidates) => candidates.reduce((text, prefix) => text.startsWith(prefix) ? text.slice(prefix.length) : text, String(value || "")).trim();
const failures = [];
for (const { id } of quizzes) {
  const quiz = quizFromSource(id);
  for (const question of quiz.questions) {
    for (const [locale, field, candidates] of [["en", "text", prefixes.en], ["zh-Hant", "textZh", prefixes.zh]]) {
      const meanings = question.options.map((option) => strip(option[field], candidates).toLocaleLowerCase(locale));
      if (meanings.some((value) => value.length < 8)) failures.push({ quiz: quiz.id, question: question.id, locale, reason: "Option is too short to carry a behavioural interpretation" });
      if (new Set(meanings).size !== question.options.length) failures.push({ quiz: quiz.id, question: question.id, locale, reason: "Options share the same behavioural interpretation" });
    }
  }
}
if (failures.length) {
  console.error(JSON.stringify({ status: "fail", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "pass", message: "Every bilingual option keeps a distinct behavioural interpretation." }));
