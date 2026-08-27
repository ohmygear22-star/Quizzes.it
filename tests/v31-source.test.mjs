import test from "node:test";
import assert from "node:assert/strict";
import { quizzes } from "../v31/index.js";

const expectedIds = ["REL01", "REL05", "REL02", "REL06", "REL07", "REL08", "REL09", "REL10", "REL11", "REL12", "REL13"];
const newIds = new Set(expectedIds.slice(3));

test("V3.1 source exposes the eleven authorised quizzes", () => {
  assert.deepEqual(quizzes.map((quiz) => quiz.id), expectedIds);
  assert.equal(quizzes.reduce((count, quiz) => count + quiz.questions.length, 0), 270);
  assert.equal(quizzes.reduce((count, quiz) => count + quiz.questions.reduce((total, question) => total + question.options.length, 0), 0), 1080);
  assert.equal(quizzes.reduce((count, quiz) => count + quiz.hypotheses.length, 0), 44);
  assert.equal(quizzes.reduce((count, quiz) => count + quiz.resultBlueprints.length, 0), 44);
  assert.equal(quizzes.reduce((count, quiz) => count + quiz.qaPersonas.length, 0), 55);
});

test("REL06–REL13 retain the approved V2 source contract", () => {
  const added = quizzes.filter((quiz) => newIds.has(quiz.id));
  assert.equal(added.length, 8);
  for (const quiz of added) {
    assert.equal(quiz.questions.filter((question) => question.stage === "preview").length, 5, quiz.id);
    assert.equal(quiz.questions.length, quiz.stopping.maxTotal, quiz.id);
    assert.equal(quiz.questions.reduce((count, question) => count + question.options.length, 0), quiz.questions.length * 4, quiz.id);
    for (const question of quiz.questions) {
      assert.equal(question.options.length, 4, question.id);
      assert.deepEqual(question.designedPair.length, 2, question.id);
      for (const option of question.options) {
        assert.ok(option.text && option.textZh, question.id + "/" + option.id);
        assert.deepEqual(Object.keys(option.evidence).sort(), ["H1", "H2", "H3", "H4"]);
        assert.ok(Object.values(option.evidence).every((weight) => [-1, 0, 1, 2].includes(weight)), question.id + "/" + option.id);
      }
    }
  }
});
