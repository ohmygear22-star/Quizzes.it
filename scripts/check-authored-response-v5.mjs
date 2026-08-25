import q0 from "../quizzes/pull-away-closer-v5.js";
import q1 from "../quizzes/explaining-away-v5.js";
import q2 from "../quizzes/friendship-role-v5.js";
import q3 from "../quizzes/reassurance-proof-v5.js";
import q4 from "../quizzes/busy-avoiding-v5.js";
import q5 from "../quizzes/close-or-useful-v5.js";

for (const quiz of [q0, q1, q2, q3, q4, q5]) {
  if (quiz.version !== 5) throw new Error(quiz.slug + " is not version 5");
  if (quiz.questions.length !== 55) throw new Error(quiz.slug + " must contain 55 evidence questions");
  const optionSets = new Set();
  const optionTexts = new Set();
  for (const question of quiz.questions) {
    const choices = question.options.map((option) => option.text);
    if (choices.some((text) => /\bWith \"|Before you know more|If this feeling stays with you/.test(text))) throw new Error(question.id + " still uses a shared response tail");
    if (choices.some((text) => !/\b(I|My)\b/.test(text))) throw new Error(question.id + " does not speak as a specific first-person response");
    const key = choices.join("\n");
    if (optionSets.has(key)) throw new Error(question.id + " repeats an earlier answer set");
    optionSets.add(key);
    for (const text of choices) {
      if (optionTexts.has(text)) throw new Error(question.id + " repeats an earlier answer choice");
      optionTexts.add(text);
    }
  }
}
console.log("PASS v5 authored response contract");
