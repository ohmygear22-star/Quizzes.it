import test from "node:test";
import assert from "node:assert/strict";
import { quizzes } from "../v31/index.js";
import { startAssessment, currentQuestion, answerQuestion, unlockAssessment } from "../v31/engine.js";

const chooseFor = (question, hypothesis) => [...question.options].sort((a, b) => b.evidence[hypothesis] - a.evidence[hypothesis] || a.id.localeCompare(b.id))[0].id;
const run = (quizId, hypothesis = "H1") => {
  let state = startAssessment(quizId);
  while (state.status !== "payment-required") state = answerQuestion(state, { questionId: currentQuestion(state).id, optionId: chooseFor(currentQuestion(state), hypothesis) });
  state = unlockAssessment(state);
  while (!state.completion.shouldStop) state = answerQuestion(state, { questionId: currentQuestion(state).id, optionId: chooseFor(currentQuestion(state), hypothesis) });
  return state;
};

test("every V3.1 quiz starts at Q1 and keeps Q1-Q5 fixed before payment", () => {
  for (const quiz of quizzes) {
    let state = startAssessment(quiz.id);
    for (let number = 1; number <= 5; number++) {
      assert.equal(currentQuestion(state).id, quiz.id + "-Q" + String(number).padStart(2, "0"));
      state = answerQuestion(state, { questionId: currentQuestion(state).id, optionId: "A" });
    }
    assert.equal(state.status, "payment-required");
    assert.equal(currentQuestion(state), null);
    assert.equal(state.answers.length, 5);
  }
});

test("unlock preserves preview evidence and resumes with one deterministic paid question", () => {
  const quiz = quizzes[0];
  let state = startAssessment(quiz.id);
  for (let number = 0; number < 5; number++) state = answerQuestion(state, { questionId: currentQuestion(state).id, optionId: "A" });
  const before = { answers: state.answers, scores: state.scores, rankingHistory: state.rankingHistory };
  const unlocked = unlockAssessment(state);
  assert.deepEqual(unlocked.answers, before.answers);
  assert.deepEqual(unlocked.scores, before.scores);
  assert.deepEqual(unlocked.rankingHistory, before.rankingHistory);
  assert.equal(currentQuestion(unlocked).stage, "paid");
  assert.throws(() => answerQuestion(unlocked, { questionId: "REL01-Q01", optionId: "A" }), /Expected question/);
  assert.throws(() => answerQuestion(unlocked, { questionId: currentQuestion(unlocked).id, optionId: "Z" }), /Unknown option/);
});

test("engine completes without duplicate or adaptive preview questions and preserves result evidence", () => {
  const state = run("REL01");
  assert.equal(state.completion.shouldStop, true);
  assert.ok(state.answers.length <= 30);
  assert.equal(new Set(state.askedQuestionIds).size, state.askedQuestionIds.length);
  assert.equal(state.answers.slice(5).every((answer) => quizzes[0].questions.find((q) => q.id === answer.questionId).stage === "paid"), true);
  assert.equal(currentQuestion(state), null);
  for (const moment of state.result.evidenceMoments) assert.ok(state.answers.some((answer) => answer.questionId === moment.questionId && answer.optionId === moment.optionId));
});

test("same evidence decisions replay identically and different evidence changes the adaptive state", () => {
  const a = run("REL02", "H1"), again = run("REL02", "H1"), b = run("REL02", "H4");
  assert.deepEqual(a.askedQuestionIds, again.askedQuestionIds);
  assert.deepEqual(a.scores, again.scores);
  assert.deepEqual(a.result, again.result);
  assert.notDeepEqual(a.scores, b.scores);
  assert.notDeepEqual(a.askedQuestionIds.slice(5), b.askedQuestionIds.slice(5));
});

