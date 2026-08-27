import test from "node:test";
import assert from "node:assert/strict";
import { quizzes } from "../v31/index.js";
import { evaluateCompletion } from "../v31/stopping.js";

const scores = (primary = "H1", margin = 4) => {
  const state = { H1: 0, H2: 0, H3: 0, H4: 0 };
  state[primary] = 10;
  state[primary === "H1" ? "H2" : "H1"] = 10 - margin;
  return state;
};
const leaders = (leader = "H1") => ["a", "b", "c"].map((afterQuestionId) => ({ afterQuestionId, ranked: [leader], uniqueLeader: leader }));
const question = (number, domain, evidence) => ({ id: "Q" + number, number, scenarioDomain: domain, options: [{ id: "A", evidence }] });
const controlledQuiz = ({ id = "REL01", stopping = { minTotal: 20, maxTotal: 30, leadMarginToStop: 4, minStrongPrimaryAnswers: 5, minDistinctEvidenceDomains: 5, primaryStabilityWindow: 3 }, evidenceFor = () => ({ H1: 2, H2: 0, H3: 0, H4: 0 }), domains = 5 } = {}) => ({
  id, stopping, questions: Array.from({ length: stopping.maxTotal }, (_, index) => question(index + 1, "domain-" + (index % domains), evidenceFor(index))),
});
const answers = (quiz, count) => quiz.questions.slice(0, count).map((item) => ({ questionId: item.id, optionId: "A" }));
const evaluate = (quiz, count, currentScores = scores(), rankingHistory = leaders()) => evaluateCompletion(quiz, { answers: answers(quiz, count), scores: currentScores, rankingHistory });

test("each real quiz consumes its authoritative stopping configuration", () => {
  assert.deepEqual(quizzes.map(({ id, stopping }) => [id, stopping.minTotal, stopping.maxTotal, stopping.minStrongPrimaryAnswers, stopping.minDistinctEvidenceDomains, stopping.primaryStabilityWindow]), [
    ["REL01", 20, 30, 5, 5, 3],
    ["REL05", 15, 18, 4, 4, 3],
    ["REL02", 20, 30, 5, 5, 3],
    ["REL06", 20, 30, 5, 5, 3],
    ["REL07", 20, 30, 5, 5, 3],
    ["REL08", 20, 30, 5, 5, 3],
    ["REL09", 20, 30, 5, 5, 3],
    ["REL10", 15, 18, 4, 4, 3],
    ["REL11", 15, 18, 4, 4, 3],
    ["REL12", 15, 18, 4, 4, 3],
    ["REL13", 15, 18, 4, 4, 3],
  ]);
});

test("REL01 counts five preview answers within its 20-answer minimum", () => {
  const quiz = controlledQuiz();
  const result = evaluate(quiz, 19);
  assert.equal(result.answeredCount, 19);
  assert.equal(result.shouldStop, false);
  assert.equal(result.reason, "below-minimum");
  assert.equal(evaluate(quiz, 20).shouldStop, true);
  assert.equal(evaluate(quiz, 20).reason, "criteria-met");
});

test("lead margin gate has exact boundaries and rejects an exact tie", () => {
  const quiz = controlledQuiz();
  assert.equal(evaluate(quiz, 20, scores("H1", 3)).gates.leadMargin, false);
  assert.equal(evaluate(quiz, 20, scores("H1", 4)).gates.leadMargin, true);
  assert.equal(evaluate(quiz, 20, scores("H1", 6)).gates.leadMargin, true);
  const tied = evaluate(quiz, 20, { H1: 10, H2: 10, H3: 0, H4: 0 }, leaders(null));
  assert.equal(tied.leadMargin, 0);
  assert.equal(tied.primary, "H1");
  assert.equal(tied.shouldStop, false);
});

test("early stop fails when the lead-margin gate alone fails", () => {
  const result = evaluate(controlledQuiz(), 20, scores("H1", 3));
  assert.equal(result.gates.strongPrimary, true);
  assert.equal(result.gates.positiveDomains, true);
  assert.equal(result.gates.stablePrimary, true);
  assert.equal(result.shouldStop, false);
});

test("early stop fails when the strong-primary gate alone fails", () => {
  const quiz = controlledQuiz({ evidenceFor: () => ({ H1: 1, H2: 0, H3: 0, H4: 0 }) });
  const result = evaluate(quiz, 20);
  assert.equal(result.gates.leadMargin, true);
  assert.equal(result.gates.strongPrimary, false);
  assert.equal(result.gates.positiveDomains, true);
  assert.equal(result.gates.stablePrimary, true);
  assert.equal(result.shouldStop, false);
});

test("early stop fails when the distinct-domain gate alone fails", () => {
  const quiz = controlledQuiz({ domains: 1 });
  const result = evaluate(quiz, 20);
  assert.equal(result.gates.leadMargin, true);
  assert.equal(result.gates.strongPrimary, true);
  assert.equal(result.gates.positiveDomains, false);
  assert.equal(result.gates.stablePrimary, true);
  assert.equal(result.shouldStop, false);
});

test("early stop fails when the stability gate alone fails", () => {
  const result = evaluate(controlledQuiz(), 20, scores(), leaders("H1").map((entry, index) => ({ ...entry, uniqueLeader: ["H1", "H2", "H1"][index] })));
  assert.equal(result.gates.leadMargin, true);
  assert.equal(result.gates.strongPrimary, true);
  assert.equal(result.gates.positiveDomains, true);
  assert.equal(result.gates.stablePrimary, false);
  assert.equal(result.shouldStop, false);
});

test("stability requires three identical non-null current leaders", () => {
  const quiz = controlledQuiz();
  assert.equal(evaluate(quiz, 20, scores(), leaders().slice(0, 2)).gates.stablePrimary, false);
  assert.equal(evaluate(quiz, 20, scores(), leaders("H1").map((entry, index) => ({ ...entry, uniqueLeader: ["H1", null, "H1"][index] }))).gates.stablePrimary, false);
  assert.equal(evaluate(quiz, 20, scores(), leaders("H1")).gates.stablePrimary, true);
});

test("strong and domain counts are recomputed for the current primary across answer history", () => {
  const quiz = controlledQuiz({ evidenceFor: (index) => index < 10 ? { H1: 2, H2: 0, H3: 0, H4: 0 } : { H1: 0, H2: 0, H3: 0, H4: 2 } });
  const result = evaluate(quiz, 20, scores("H4", 4), leaders("H4"));
  assert.equal(result.primary, "H4");
  assert.equal(result.strongPrimaryCount, 10);
  assert.equal(result.positiveDomainCount, 5);
  assert.equal(result.shouldStop, true);
});

test("positive domains are unique and a counter-evidence answer does not erase a positive domain", () => {
  const quiz = controlledQuiz({ evidenceFor: (index) => index % 2 === 0 ? { H1: 2, H2: 0, H3: 0, H4: 0 } : { H1: -2, H2: 0, H3: 0, H4: 0 } });
  const result = evaluate(quiz, 20);
  assert.equal(result.strongPrimaryCount, 10);
  assert.equal(result.positiveDomainCount, 5);
  assert.equal(result.shouldStop, true);
});

test("real maximums stop regardless of gates and classify mixed profiles from margin", () => {
  const expected = [["REL01", 30], ["REL05", 18], ["REL02", 30], ["REL06", 30], ["REL07", 30], ["REL08", 30], ["REL09", 30], ["REL10", 18], ["REL11", 18], ["REL12", 18], ["REL13", 18]];
  for (const [id, maximum] of expected) {
    const quiz = quizzes.find((item) => item.id === id);
    const result = evaluateCompletion(quiz, { answers: answers(quiz, maximum), scores: { H1: 20, H2: 20, H3: 0, H4: 0 }, rankingHistory: [] });
    assert.equal(result.shouldStop, true);
    assert.equal(result.reason, "maximum-reached");
    assert.equal(result.mixedProfile, true);
  }
});

test("maximum margin of four is non-mixed and completion exposes controlled state", () => {
  const result = evaluate(controlledQuiz(), 30, { H1: 20, H2: 16, H3: 0, H4: 0 }, []);
  assert.deepEqual(result, {
    shouldStop: true, reason: "maximum-reached", answeredCount: 30,
    primary: "H1", secondary: "H2", leadMargin: 4,
    strongPrimaryCount: 30, positiveDomainCount: 5,
    stablePrimary: false, mixedProfile: false,
    gates: { leadMargin: true, strongPrimary: true, positiveDomains: true, stablePrimary: false },
  });
});

