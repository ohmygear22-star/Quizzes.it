import test from "node:test";
import assert from "node:assert/strict";
import { rankScores, rankingHistoryEntry } from "../v31/scoring.js";

test("rankScores produces a unique primary, secondary and lead margin", () => {
  assert.deepEqual(rankScores({ H1: 5, H2: 2, H3: 3, H4: 1 }), {
    ranked: ["H1", "H3", "H2", "H4"], primary: "H1", secondary: "H3", leadMargin: 2, uniqueLeader: "H1"
  });
});

test("rankScores is deterministic and preserves top ties as unresolved", () => {
  const scores = { H1: 5, H2: 2, H3: 5, H4: 1 };
  const result = rankScores(scores);
  assert.deepEqual(result, { ranked: ["H1", "H3", "H2", "H4"], primary: "H1", secondary: "H3", leadMargin: 0, uniqueLeader: null });
  assert.deepEqual(rankScores(scores), result);
  assert.deepEqual(rankingHistoryEntry("REL01-Q01", result), { afterQuestionId: "REL01-Q01", ranked: ["H1", "H3", "H2", "H4"], uniqueLeader: null });
});
