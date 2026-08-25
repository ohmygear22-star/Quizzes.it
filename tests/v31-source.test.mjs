import test from "node:test";
import assert from "node:assert/strict";
import { quizzes } from "../v31/index.js";

test("V3.1 source exposes exactly the three authorised quizzes", () => {
  assert.deepEqual(quizzes.map((quiz) => quiz.id), ["REL01", "REL05", "REL02"]);
  assert.equal(quizzes.reduce((count, quiz) => count + quiz.questions.length, 0), 78);
  assert.equal(quizzes.reduce((count, quiz) => count + quiz.questions.reduce((total, question) => total + question.options.length, 0), 0), 312);
});
