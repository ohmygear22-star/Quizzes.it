import test from "node:test";
import assert from "node:assert/strict";
import { quizzes, selectNextQuestion } from "../v31/index.js";
import { dynamicPairSeparation } from "../v31/selector.js";

const option = (id, evidence) => ({ id, evidence });
const question = (number, pair, domain, separation, value, options = [
  option("A", { H1: 0, H2: 0, H3: 0, H4: 0 }),
  option("B", { H1: 2, H2: 0, H3: 0, H4: 0 }),
  option("C", { H1: 0, H2: 2, H3: 0, H4: 0 }),
  option("D", { H1: 0, H2: 0, H3: 2, H4: 0 }),
]) => ({ id: "Q" + number, number, stage: "paid", designedPair: pair, scenarioDomain: domain, pairSeparationScore: separation, informationValue: value, options });
const fixture = (questions) => ({ questions });
const state = (scores, askedQuestionIds = [], askedQuestions = []) => ({ scores, askedQuestionIds, askedQuestions });

test("pair-specific selection is unordered, paid-only, unanswered and deterministic", () => {
  const quiz = fixture([
    { ...question(1, ["H1", "H4"], "preview", 9, "high"), stage: "preview" },
    question(7, ["H4", "H1"], "asked", 3, "medium"),
    question(8, ["H1", "H4"], "other", 3, "medium"),
    question(9, ["H1", "H4"], "winner", 5, "high"),
  ]);
  const selected = selectNextQuestion(quiz, state({ H1: 8, H2: 0, H3: 0, H4: 3 }, ["Q7"]));
  assert.equal(selected.id, "Q9");
  assert.equal(selectNextQuestion(quiz, state({ H1: 8, H2: 0, H3: 0, H4: 3 }, ["Q7"])).id, "Q9");
});

test("primary selector ignores a future option choice", () => {
  const quiz = fixture([question(6, ["H1", "H2"], "one", 4, "low"), question(7, ["H1", "H2"], "two", 3, "high")]);
  const before = selectNextQuestion(quiz, state({ H1: 5, H2: 4, H3: 0, H4: 0 })).id;
  quiz.questions[1].options = quiz.questions[1].options.map((item) => ({ ...item, evidence: { H1: 99, H2: -99, H3: 0, H4: 0 } }));
  assert.equal(before, "Q7");
  assert.equal(selectNextQuestion(quiz, state({ H1: 5, H2: 4, H3: 0, H4: 0 })).id, "Q7");
});

test("repetition penalty applies to either recent domain but not three questions ago", () => {
  const quiz = fixture([question(6, ["H1", "H2"], "same", 5, "high"), question(7, ["H1", "H2"], "fresh", 5, "high")]);
  const scores = { H1: 5, H2: 4, H3: 0, H4: 0 };
  assert.equal(selectNextQuestion(quiz, state(scores, [], [{ scenarioDomain: "same" }])).id, "Q7");
  assert.equal(selectNextQuestion(quiz, state(scores, [], [{ scenarioDomain: "same" }, { scenarioDomain: "other" }])).id, "Q7");
  assert.equal(selectNextQuestion(quiz, state(scores, [], [{ scenarioDomain: "same" }, { scenarioDomain: "other" }, { scenarioDomain: "third" }])).id, "Q6");
  assert.equal(selectNextQuestion(quiz, state(scores)).id, "Q6");
});

test("a pair-specific candidate prevents fallback, and exhaustion activates it", () => {
  const pairQuestion = question(6, ["H1", "H3"], "pair", 1, "low");
  const fallbackQuestion = question(7, ["H1", "H2"], "fallback", 1, "low", [
    option("A", { H1: 4, H2: 0, H3: -2, H4: 0 }), option("B", { H1: -2, H2: 0, H3: 4, H4: 0 }),
    option("C", { H1: 0, H2: 0, H3: 0, H4: 0 }), option("D", { H1: 2, H2: 0, H3: -1, H4: 0 }),
  ]);
  const quiz = fixture([pairQuestion, fallbackQuestion]);
  const scores = { H1: 6, H2: 0, H3: 5, H4: 0 };
  assert.equal(selectNextQuestion(quiz, state(scores)).id, "Q6");
  assert.equal(selectNextQuestion(quiz, state(scores, ["Q6"])).id, "Q7");
});

test("dynamic fallback calculates all option differences and responds to the current top two", () => {
  const sourceQuestion = question(6, ["H1", "H2"], "a", 0, "low", [
    option("A", { H1: 3, H2: -2, H3: 1, H4: 0 }), option("B", { H1: -1, H2: 2, H3: -2, H4: 1 }),
    option("C", { H1: 0, H2: 0, H3: 3, H4: -2 }), option("D", { H1: 1, H2: -1, H3: 0, H4: 1 }),
  ]);
  assert.equal(dynamicPairSeparation(sourceQuestion, "H1", "H2"), 8);
  assert.equal(dynamicPairSeparation(sourceQuestion, "H3", "H4"), 8);
  assert.notEqual(dynamicPairSeparation(sourceQuestion, "H1", "H3"), dynamicPairSeparation(sourceQuestion, "H1", "H2"));

  const h1h3Winner = question(7, ["H1", "H2"], "b", 0, "low", [
    option("A", { H1: 4, H2: 0, H3: -2, H4: 0 }), option("B", { H1: -2, H2: 0, H3: 4, H4: 0 }),
    option("C", { H1: 0, H2: 0, H3: 0, H4: 0 }), option("D", { H1: 2, H2: 0, H3: -1, H4: 0 }),
  ]);
  const h2h4Winner = question(8, ["H1", "H2"], "c", 0, "low", [
    option("A", { H1: 0, H2: 4, H3: 0, H4: -2 }), option("B", { H1: 0, H2: -2, H3: 0, H4: 4 }),
    option("C", { H1: 0, H2: 0, H3: 0, H4: 0 }), option("D", { H1: 0, H2: 2, H3: 0, H4: -1 }),
  ]);
  const quiz = fixture([h1h3Winner, h2h4Winner]);
  assert.equal(selectNextQuestion(quiz, state({ H1: 6, H2: 0, H3: 5, H4: 0 })).id, "Q7");
  assert.equal(selectNextQuestion(quiz, state({ H1: 0, H2: 6, H3: 0, H4: 5 })).id, "Q8");
});

test("fallback scores every paid candidate with repetition and resolves ties by number", () => {
  const q6 = question(6, ["H1", "H2"], "same", 0, "low", [
    option("A", { H1: 2, H2: 0, H3: -1, H4: 0 }), option("B", { H1: -1, H2: 0, H3: 2, H4: 0 }),
    option("C", { H1: 0, H2: 0, H3: 0, H4: 0 }), option("D", { H1: 1, H2: 0, H3: -1, H4: 0 }),
  ]);
  const q7 = { ...q6, id: "Q7", number: 7, scenarioDomain: "fresh" };
  const quiz = fixture([q6, q7]);
  const scores = { H1: 6, H2: 0, H3: 5, H4: 0 };
  assert.equal(selectNextQuestion(quiz, state(scores)).id, "Q6");
  assert.equal(selectNextQuestion(quiz, state(scores, [], [{ scenarioDomain: "same" }])).id, "Q7");
  assert.equal(selectNextQuestion(quiz, state(scores, ["Q6", "Q7"])), null);
});

test("real REL01 selection excludes its fixed preview and asked paid question", () => {
  const quiz = quizzes[0];
  const selected = selectNextQuestion(quiz, state({ H1: 9, H2: 1, H3: 0, H4: 3 }, ["REL01-Q06"], [{ scenarioDomain: "future planning" }, { scenarioDomain: "autonomy" }]));
  assert.equal(selected.id, "REL01-Q08");
  assert.equal(selected.stage, "paid");
  assert.notEqual(selected.id, "REL01-Q06");
  assert.notDeepEqual(selected.designedPair, ["H1", "H4"]);
});

