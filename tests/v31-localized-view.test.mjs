import test from "node:test";
import assert from "node:assert/strict";
import { getQuizBySlug, previewQuestions } from "../v31/production-adapter.js";

test("returns Traditional Chinese preview questions without changing IDs", () => {
  const product = getQuizBySlug("rel01");
  const english = previewQuestions(product, "en");
  const traditional = previewQuestions(product, "zh-Hant");
  assert.deepEqual(traditional.map((question) => question.id), english.map((question) => question.id));
  assert.notEqual(traditional[0].text, english[0].text);
  assert.notEqual(traditional[0].options[0].text, english[0].options[0].text);
});
