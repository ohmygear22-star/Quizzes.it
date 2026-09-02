import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

for (const script of ["scripts/validate-quizzes.mjs", "scripts/check-meaningful-response-variation.mjs"]) {
  test(`${script} validates the active V3.1 source without legacy imports`, () => {
    const source = fs.readFileSync(script, "utf8");
    assert.match(source, /\.\.\/v31\//);
    assert.doesNotMatch(source, /\.\.\/quizzes\/index\.js/);
    const run = spawnSync(process.execPath, [script], { encoding: "utf8" });
    assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  });
}
