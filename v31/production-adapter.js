import { quizzes, byId } from "./index.js";
import { startAssessment, answerQuestion, unlockAssessment, currentQuestion } from "./engine.js";
const slug = (quiz) => quiz.id.toLowerCase();
const title = (quiz) => quiz.metadata?.title || quiz.title || quiz.id;
const presentation = {
  REL01: { description: "Separate emotional attachment from real-life compatibility.", durationMinutes: "6–9" },
  REL05: { description: "See which warning signs you are most likely to rationalize.", durationMinutes: "5–7" },
  REL02: { description: "Explore whether you want connection—or reassurance of your worth.", durationMinutes: "6–9" }
};
function publicQuiz(quiz) {
  const copy = presentation[quiz.id] || { description: "A private, evidence-led relationship reflection.", durationMinutes: "6–9" };
  return {
    id: quiz.id,
    slug: slug(quiz),
    version: quiz.version,
    status: "live",
    metadata: {
      title: title(quiz),
      description: copy.description,
      durationMinutes: copy.durationMinutes,
      questionRange: "Adaptive " + quiz.stopping.minTotal + "-" + quiz.stopping.maxTotal + " questions"
    },
    offers: [{ id: "v31-paid", amount: 2900, currency: "hkd", label: "Full private result" }],
    preview: { enabled: true }
  };
}
const products = quizzes.map(publicQuiz);
export const defaultQuiz = products[0];
export const listPublicQuizzes = () => products.map((p) => ({ ...p }));
export const getQuizBySlug = (value) => products.find((p) => p.slug === value) || null;
export const getPublicQuizBySlug = getQuizBySlug;
export const getQuizByIdAndVersion = (id, version) => { const product = products.find((p) => p.id === id); return product && product.version === version ? product : null; };
export const isAdaptiveQuiz = () => true;
function sourceQuiz(product) { const quiz = byId.get(product.id); if (!quiz) throw new Error("Unknown V3.1 quiz"); return quiz; }
function view(question) { return { id: question.id, text: question.text, options: question.options.map((o) => ({ id: o.id, text: o.text })) }; }
export function previewQuestions(product) { return sourceQuiz(product).questions.filter((q) => q.stage === "preview").map(view); }
function replay(product, answers, unlock = false) { let state = startAssessment(product.id); for (const answer of answers || []) { if (state.status === "payment-required") { if (!unlock) break; state = unlockAssessment(state); } if (state.status === "completed") break; state = answerQuestion(state, answer); } if (unlock && state.status === "payment-required") state = unlockAssessment(state); return state; }
export function evaluatePreview(product, answers) { const state = replay(product, answers, false); if (state.answers.length !== 5 || state.status !== "payment-required") throw new Error("Complete exactly five preview answers"); return { observation: "Your first five answers are creating a pattern.", next: "Continue after payment for your adaptive, private eight-phase result." }; }
export function nextAdaptiveQuestion(product, answers) { const state = replay(product, answers, true); const question = currentQuestion(state); return { question: question ? view(question) : null, reason: state.completion?.reason || (state.status === "completed" ? "completed" : "next"), state }; }
export function isAssessmentComplete(product, answers) { return replay(product, answers, true).status === "completed"; }
export function evaluateQuiz(product, answers) { const state = replay(product, answers, true); if (state.status !== "completed") throw new Error("Assessment is not complete"); return { completed: { result: state.result }, state }; }
