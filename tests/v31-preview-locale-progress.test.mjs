import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source=fs.readFileSync(new URL("../public/multi-quiz.js",import.meta.url),"utf8");
const start=source.indexOf("const previewSessions = new Map()");
const preview=source.slice(start,source.indexOf("async function teaser",start));
test("locale rerender preserves preview answers and completed preview state",()=>{
 assert.match(preview,/const previewSessions = new Map\(\)/);
 assert.match(preview,/const persisted = previewSessions\.get\(slug\)/);
 assert.match(preview,/if \(persisted\?\.completed\) return teaser\(slug, persisted\.teaser\)/);
 assert.match(preview,/const answers = state\.answers/);
 assert.match(preview,/state\.completed = true/);
});

test("localized preview GET includes the active locale before the first route render",()=>{assert.match(source,/const previewGet = typeof path === "string"/);assert.match(source,/encodeURIComponent\(activeLocale\(\)\)/);});
