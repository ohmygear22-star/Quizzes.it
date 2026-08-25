import { rankScores } from "./scoring.js";
export const informationBonus = (value) => ({ high: 2, medium: 1, low: 0 }[String(value).toLowerCase()] ?? 0);
export const dynamicInformationBonus = (value) => value >= 5 ? 2 : value >= 3 ? 1 : 0;
export const samePair = (left, right) => [...left].sort().join("|") === [...right].sort().join("|");
export function repetitionPenalty(question, askedQuestions) { return askedQuestions.slice(-2).some((item) => item.scenarioDomain === question.scenarioDomain) ? 2 : 0; }
export function dynamicPairSeparation(question, top, second) { const values = question.options.map((option) => option.evidence[top] - option.evidence[second]); return Math.max(...values) - Math.min(...values); }
export function selectNextQuestion(quiz, { scores, askedQuestionIds = [], askedQuestions = [] }) {
 const { primary, secondary } = rankScores(scores); const remaining = quiz.questions.filter((question) => question.stage === "paid" && !askedQuestionIds.includes(question.id));
 const pair = remaining.filter((question) => samePair(question.designedPair, [primary, secondary]));
 const fallback = pair.length === 0; const candidates = fallback ? remaining : pair;
 if (!candidates.length) return null;
 return candidates.map((question) => { const separation = fallback ? dynamicPairSeparation(question, primary, secondary) : question.pairSeparationScore; const bonus = fallback ? dynamicInformationBonus(separation) : informationBonus(question.informationValue); return { question, score: separation + bonus - repetitionPenalty(question, askedQuestions) }; }).sort((a,b) => b.score - a.score || a.question.number - b.question.number)[0].question;
}
