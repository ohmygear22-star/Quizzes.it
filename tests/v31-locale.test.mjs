import test from "node:test";
import assert from "node:assert/strict";
import { resolveLocale, supportedLocales } from "../v31/locale.js";

test("locale resolution prioritises an explicit supported selection", () => {
  assert.equal(resolveLocale({ explicit: "zh-Hant", saved: "en", browser: "en-US" }), "zh-Hant");
  assert.equal(resolveLocale({ explicit: "fr", saved: "en", browser: "en-US" }), "en");
});

test("locale resolution maps Traditional Chinese browser variants", () => {
  assert.equal(resolveLocale({ browser: "zh-HK" }), "zh-Hant");
  assert.equal(resolveLocale({ browser: "zh-TW" }), "zh-Hant");
  assert.equal(resolveLocale({ browser: "zh" }), "zh-Hant");
  assert.equal(resolveLocale({ browser: "zh-SG" }), "en");
});

test("only English and Traditional Chinese are supported", () => {
  assert.deepEqual(supportedLocales, ["en", "zh-Hant"]);
});
