import { getQuizBySlug, listPublicQuizzes } from "../quizzes/index.js";

const failures = [];
for (const publicQuiz of listPublicQuizzes()) {
  const quiz = getQuizBySlug(publicQuiz.slug);
  for (const question of quiz.questions) {
    for (const option of question.options) {
      if (!option.text.includes(question.situation)) failures.push({ quiz: quiz.slug, question: question.id, reason: "Option does not address this question's own situation" });
      if (/\bWith \"|Before you know more|If this feeling stays with you/.test(option.text)) failures.push({ quiz: quiz.slug, question: question.id, reason: "Option uses retired contextual-tail copy" });
    }
  }
}
if (failures.length) {
  console.error(JSON.stringify({ status: "fail", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "pass", message: "Every option directly addresses its question's situation without shared tail copy." }));
