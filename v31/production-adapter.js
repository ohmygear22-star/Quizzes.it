import { createHash } from "node:crypto";
import { quizzes, byId } from "./index.js";
import { startAssessment, answerQuestion, unlockAssessment, currentQuestion } from "./engine.js";
import { previewInsight } from "./locale.js";
import { buildResult } from "./result-builder.js";
const slug = (quiz) => quiz.id.toLowerCase();
const publicUrl = (quiz) => "https://quizzes.it.com/#preview/" + slug(quiz);
function publicQuiz(quiz) {
  const publication = quiz.publication;
  const title = { en: quiz.metadata?.title || quiz.title || quiz.id, "zh-Hant": quiz.metadata?.titleZh || null };
  const description = publication.description;
  const price = { amount: 2900, currency: "hkd" };
  return { id: quiz.id, slug: slug(quiz), version: quiz.version, status: publication.status, category: quiz.metadata?.category || null, title, description, price, publicUrl: publicUrl(quiz), metadata: { title: title.en, titleZh: title["zh-Hant"], description: description.en, descriptionZh: description["zh-Hant"], durationMinutes: quiz.stopping.maxTotal === 30 ? "6–9" : "5–7", questionRange: "Adaptive " + quiz.stopping.minTotal + "–" + quiz.stopping.maxTotal + " questions" }, offers: [{ id: "v31-paid", amount: price.amount, currency: price.currency, label: "Full private result" }], preview: { enabled: true } };
}
export function buildPublicCatalog(source = quizzes) {
  const products = source.filter((quiz) => quiz.publication?.status === "live").map(publicQuiz);
  const ids = new Set(products.map((product) => product.id));
  if (ids.size !== products.length) throw new Error("Duplicate public quiz ID");
  return products;
}
const products = buildPublicCatalog();
export const catalogVersion = "v31-" + createHash("sha256").update(JSON.stringify(products.map((product) => ({ id: product.id, version: product.version, status: product.status, category: product.category, title: product.title, description: product.description, price: product.price, publicUrl: product.publicUrl })))).digest("hex").slice(0, 16);
export const defaultQuiz = products[0];
export const listPublicQuizzes = () => products.map((p) => ({ ...p }));
export const getQuizBySlug = (value) => products.find((p) => p.slug === value) || null;
export const getPublicQuizBySlug = getQuizBySlug;
export const getQuizByIdAndVersion = (id, version) => { const product = products.find((p) => p.id === id); return product && product.version === version ? product : null; };
export const isAdaptiveQuiz = () => true;
function sourceQuiz(product) { const quiz = byId.get(product.id); if (!quiz) throw new Error("Unknown V3.1 quiz"); return quiz; }
function view(question, locale = "en") { const chinese = locale !== "en"; return { id: question.id, text: chinese && question.textZh ? question.textZh : question.text, options: question.options.map((o) => ({ id: o.id, text: chinese && o.textZh ? o.textZh : o.text })) }; }
export function previewQuestions(product, locale = "en") { return sourceQuiz(product).questions.filter((q) => q.stage === "preview").map((question) => view(question, locale)); }
function replay(product, answers, unlock = false) { let state = startAssessment(product.id); for (const answer of answers || []) { if (state.status === "payment-required") { if (!unlock) break; state = unlockAssessment(state); } if (state.status === "completed") break; state = answerQuestion(state, answer); } if (unlock && state.status === "payment-required") state = unlockAssessment(state); return state; }
export function evaluatePreview(product, answers, locale = "en") { const state = replay(product, answers, false); if (state.answers.length !== 5 || state.status !== "payment-required") throw new Error("Complete exactly five preview answers"); return previewInsight(state.scores, locale); }
export function nextAdaptiveQuestion(product, answers, locale = "en") { const state = replay(product, answers, true); const question = currentQuestion(state); return { question: question ? view(question, locale) : null, reason: state.completion?.reason || (state.status === "completed" ? "completed" : "next"), state }; }
export function isAssessmentComplete(product, answers) { return replay(product, answers, true).status === "completed"; }
export function evaluateQuiz(product, answers, locale = "en") { const state = replay(product, answers, true); if (state.status !== "completed") throw new Error("Assessment is not complete"); const completed = buildResult({ quiz: sourceQuiz(product), answers: state.answers, scores: state.scores, primary: state.completion.primary, secondary: state.completion.secondary, leadMargin: state.completion.leadMargin, mixedProfile: state.completion.mixedProfile, locale, completion: state.completion }); return { completed: { result: completed }, state }; }
