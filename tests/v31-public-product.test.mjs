import test from "node:test";
import assert from "node:assert/strict";
import { quizzes } from "../v31/index.js";
import { listPublicQuizzes } from "../v31/production-adapter.js";

test("public quiz cards carry authored V2 descriptions and approved durations", () => {
  const cards = listPublicQuizzes();
  assert.equal(cards.length, 3);
  assert.deepEqual(cards.slice(0, 3).map((quiz) => quiz.metadata.description), [
    "Separate emotional attachment from real-life compatibility.",
    "See which warning signs you are most likely to rationalize.",
    "Explore whether you want connection—or reassurance of your worth."
  ]);

});
