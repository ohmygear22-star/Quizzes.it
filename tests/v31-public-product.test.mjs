import test from "node:test";
import assert from "node:assert/strict";
import { listPublicQuizzes } from "../v31/production-adapter.js";

test("public catalog exposes all eleven approved V3.1 quizzes with authored descriptions", () => {
  const cards = listPublicQuizzes();
  assert.deepEqual(cards.map((quiz) => quiz.id), ["REL01", "REL05", "REL02", "REL06", "REL07", "REL08", "REL09", "REL10", "REL11", "REL12", "REL13"]);
  assert.deepEqual(cards.slice(0, 3).map((quiz) => quiz.metadata.description), [
    "Separate emotional attachment from real-life compatibility.",
    "See which warning signs you are most likely to rationalize.",
    "Explore whether you want connection—or reassurance of your worth."
  ]);
  const rel06 = cards.find((quiz) => quiz.id === "REL06");
  assert.deepEqual(rel06.description, {
    en: "Read the pattern behind mixed signals, quiet interest, inconsistent effort, and the uncertainty that makes every small cue feel important.",
    "zh-Hant": "看清曖昧訊號、安靜的在乎、忽冷忽熱的投入，以及為甚麼一個小細節都會令你開始猜。"
  });
});