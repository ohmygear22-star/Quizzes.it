import test from "node:test";
import assert from "node:assert/strict";
import { previewInsight } from "../v31/locale.js";

test("preview insight selects semantic IDs without changing quiz scoring", () => {
  assert.equal(previewInsight({ H1: 10, H2: 2, H3: 1, H4: 0 }).id, "primary-h1");
  assert.equal(previewInsight({ H1: 7, H2: 7, H3: 1, H4: 0 }).id, "mixed-signal");
  assert.equal(previewInsight({ H1: 2, H2: 1, H3: 1, H4: 0 }).id, "low-confidence");
});
