import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const fullSource=fs.readFileSync(new URL("../public/multi-quiz.js",import.meta.url),"utf8");const marker=fullSource.indexOf("/* QUIZES_SHELL_LOCALE_PATCH_V2 */");const source=fullSource.slice(marker,fullSource.indexOf("/*",marker+4));
test("locale switch preserves each node original for reversible EN and Hant shell copy",()=>{
  assert.match(source,/originals=new WeakMap\(\)/);
  assert.match(source,/originals\.get\(t\)/);
  assert.match(source,/window\.onhashchange\(\)/);
  assert.match(source,/localStorage\.getItem\(\x27quizzes\.locale\x27\)/);
  assert.doesNotMatch(source,/\bcopy\b/);
});
