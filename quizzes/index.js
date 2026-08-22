import recognitionPattern from "./recognition-pattern.js";
import creativeReturn from "./creative-return.js";
import decisionProtection from "./decision-protection.js";
import { assertValidQuiz, publicQuiz } from "../quiz-engine.js";

const quizzes = [recognitionPattern, creativeReturn, decisionProtection].map(assertValidQuiz);
const byIdVersion = new Map(quizzes.map((quiz) => [quiz.id + "@" + quiz.version, quiz]));
const latestById = new Map();

for (const quiz of quizzes) {
  const current = latestById.get(quiz.id);
  if (!current || quiz.version > current.version) latestById.set(quiz.id, quiz);
}

const bySlug = new Map([...latestById.values()].map((quiz) => [quiz.slug, quiz]));
if (byIdVersion.size !== quizzes.length || bySlug.size !== latestById.size) throw new Error("Quiz ID/version pairs and current slugs must be unique");

export const defaultQuiz = recognitionPattern;
export const getQuizById = (id) => latestById.get(id) || null;
export const getQuizByIdAndVersion = (id, version) => byIdVersion.get(id + "@" + version) || null;
export const getQuizBySlug = (slug) => bySlug.get(slug) || null;
export const listPublicQuizzes = () => [...latestById.values()].filter((quiz) => quiz.status === "live").map(publicQuiz);
export const getPublicQuizBySlug = (slug) => {
  const quiz = getQuizBySlug(slug);
  return quiz?.status === "live" ? publicQuiz(quiz) : null;
};
export { quizzes };
