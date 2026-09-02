import { quizzes } from "../v31/index.js";
import { quizFromSource } from "../v31/source.js";

const expectedIds = ["REL01", "REL02", "REL05", "REL06", "REL07", "REL08", "REL09", "REL10", "REL11", "REL12", "REL13"];
const sourceQuizzes = quizzes.map(({ id }) => quizFromSource(id));
const fail = (message) => { throw new Error(message); };
const actualIds = sourceQuizzes.map(({ id }) => id).sort();
if (JSON.stringify(actualIds) !== JSON.stringify([...expectedIds].sort())) fail(`Unexpected quiz registry: ${actualIds.join(", ")}`);
if (new Set(actualIds).size !== actualIds.length) fail("Duplicate quiz registration detected");
for (const quiz of sourceQuizzes) {
  if (quiz.questions.filter((question) => question.stage === "preview").length !== 5) fail(`${quiz.id} must expose exactly five preview questions`);
  if (new Set(quiz.questions.map(({ id }) => id)).size !== quiz.questions.length) fail(`${quiz.id} has duplicate question IDs`);
  for (const question of quiz.questions) {
    if (question.options.length !== 4) fail(`${question.id} must expose exactly four options`);
    if (new Set(question.options.map(({ id }) => id)).size !== 4) fail(`${question.id} has duplicate option IDs`);
    for (const option of question.options) {
      if (!option.text || !option.textZh) fail(`${question.id}/${option.id} is missing bilingual presentation copy`);
      if (!["H1", "H2", "H3", "H4"].every((id) => Number.isFinite(option.evidence?.[id]))) fail(`${question.id}/${option.id} has incomplete evidence`);
    }
  }
}
const counts = {
  quizzes: sourceQuizzes.length,
  questions: sourceQuizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0),
  options: sourceQuizzes.reduce((sum, quiz) => sum + quiz.questions.reduce((n, question) => n + question.options.length, 0), 0),
  hypotheses: sourceQuizzes.reduce((sum, quiz) => sum + quiz.hypotheses.length, 0),
  resultBlueprints: sourceQuizzes.reduce((sum, quiz) => sum + quiz.resultBlueprints.length, 0),
  personas: sourceQuizzes.reduce((sum, quiz) => sum + quiz.qaPersonas.length, 0),
};
const expectedCounts = { quizzes: 11, questions: 270, options: 1080, hypotheses: 44, resultBlueprints: 44, personas: 55 };
if (JSON.stringify(counts) !== JSON.stringify(expectedCounts)) fail(`Unexpected V3.1 source counts: ${JSON.stringify(counts)}`);
console.log(JSON.stringify({ status: "pass", ids: actualIds, counts }));
