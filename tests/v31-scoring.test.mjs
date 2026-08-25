import test from "node:test";
import assert from "node:assert/strict";
import { quizzes } from "../v31/index.js";
import { applyEvidence, scoreAnswers } from "../v31/scoring.js";

test("applyEvidence applies every authored vector component without mutation", () => {
  const before = { H1: 2, H2: 1, H3: 0, H4: -1 };
  const evidence = { H1: -1, H2: 2, H3: 0, H4: 1 };
  assert.deepEqual(applyEvidence(before, evidence), { H1: 1, H2: 3, H3: 0, H4: 0 });
  assert.deepEqual(before, { H1: 2, H2: 1, H3: 0, H4: -1 });
  assert.deepEqual(evidence, { H1: -1, H2: 2, H3: 0, H4: 1 });
});

test("scoreAnswers replays the exact source evidence and rejects invalid IDs", () => {
  const quiz = quizzes[0], question = quiz.questions[0], option = question.options.find((item) => item.id === "B");
  const answers = [{ questionId: question.id, optionId: "B" }];
  assert.deepEqual(scoreAnswers(quiz, answers), option.evidence);
  assert.deepEqual(scoreAnswers(quiz, answers), scoreAnswers(quiz, answers));
  assert.throws(() => scoreAnswers(quiz, [{ questionId: "missing", optionId: "A" }]), /Unknown question/);
  assert.throws(() => scoreAnswers(quiz, [{ questionId: question.id, optionId: "Z" }]), /Unknown option/);
});
