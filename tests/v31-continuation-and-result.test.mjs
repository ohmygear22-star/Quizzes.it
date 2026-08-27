import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { defaultQuiz, previewQuestions, nextAdaptiveQuestion, isAssessmentComplete } from "../v31/production-adapter.js";

test("preview answers do not complete an adaptive assessment", () => {
  const previewAnswers = previewQuestions(defaultQuiz).map((question) => ({ questionId: question.id, optionId: question.options[0].id }));
  assert.equal(isAssessmentComplete(defaultQuiz, previewAnswers), false);
  assert.ok(nextAdaptiveQuestion(defaultQuiz, previewAnswers).question);
});

test("result endpoint guards against premature adaptive completion", () => {
  const server = fs.readFileSync(new URL("../app-secure.js", import.meta.url), "utf8");
  assert.match(server, /isAssessmentComplete\(product, answers\)/);
  assert.match(server, /Continue answering the adaptive questions/);
});

test("paid result uses customer-facing language", () => {
  const client = fs.readFileSync(new URL("../public/multi-quiz.js", import.meta.url), "utf8");
  assert.doesNotMatch(client, /PRIVATE V3\.1 RESULT|lead margin|Headline Result/);
  assert.match(client, /Questions that shaped your reflection/);
  assert.match(client, /Retake this quiz/);
  assert.equal(client.includes(String.fromCharCode(0xfffd)), false);
});

test("completed adaptive access renders the persisted result before resume validation", () => {
  const client = fs.readFileSync(new URL("../public/multi-quiz.js", import.meta.url), "utf8");
  const completedGuard = 'if (data.completed && mode !== "retake") return fullResult(data, token);';
  const adaptiveGuard = 'if (data.adaptive) return adaptiveAccess(token, data, mode);';
  assert.ok(client.indexOf(completedGuard) >= 0);
  assert.ok(client.indexOf(completedGuard) < client.indexOf(adaptiveGuard));
});
