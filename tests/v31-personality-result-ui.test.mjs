import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const js = fs.readFileSync(new URL("../public/multi-quiz.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const resultRenderer = js.slice(js.indexOf("function fullResult"), js.indexOf("function route", js.indexOf("function fullResult")));

test("result renderer consumes Truth Packet, selected answers, four personalities and consensus without adapting to legacy fields", () => {
  assert.match(resultRenderer, /truthPacket/);
  assert.match(resultRenderer, /optionText/);
  assert.match(resultRenderer, /whyItMattered/);
  assert.match(resultRenderer, /personalities/);
  assert.match(resultRenderer, /motivation/);
  assert.match(resultRenderer, /therapist/);
  assert.match(resultRenderer, /bestie/);
  assert.match(resultRenderer, /darkTriad/);
  assert.match(resultRenderer, /consensus/);
  assert.doesNotMatch(resultRenderer, /customerPerspective|analyticalPerspective/);
});

test("result layout uses a stable desktop grid and mobile personality accordions", () => {
  assert.match(html, /result-phase-grid/);
  assert.match(html, /personality-grid/);
  assert.match(html, /personality-accordion/);
  assert.match(html, /@media\(max-width:760px\)[\s\S]*personality-accordion/);
  assert.match(html, /details\[open\]/);
  assert.match(html, /personality-paragraph\+\.personality-paragraph/);
});

test("legacy eight-phase results retain the existing fallback path", () => {
  assert.match(resultRenderer, /Array\.isArray\(result\.phases\)/);
  assert.match(resultRenderer, /legacy/);
});

test("persisted result locale controls the private result document and shell", () => {
  assert.match(resultRenderer, /quizLocaleApply\(result\.locale, false\)/);
});

test("enhanced results keep counter-evidence internal and omit the separate not-fully-fit section", () => {
  assert.doesNotMatch(resultRenderer, /WHAT DOESN'T FULLY FIT|哪些地方未完全吻合/);
});

test("enhanced results use the owner-approved personality-first hierarchy in both locales", () => {
  for (const label of [
    "YOUR RESULT", "你的結果",
    "WHY YOU GOT THIS RESULT", "你為甚麼得到這個結果",
    "FOUR WAYS TO READ YOUR RESULT", "從四個角度看你的結果",
    "QUESTION", "問題",
    "THE SELECTED ANSWER", "你選擇的答案",
    "WHY IT MATTERED", "為甚麼這個答案重要",
  ]) assert.match(resultRenderer, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(resultRenderer, /if \(enhanced\)/);
  assert.match(resultRenderer, /Array\.isArray\(voice\.paragraphs\)/);
  assert.match(resultRenderer, /legacy-result-note/);
});

test("enhanced results render the owner-approved value hierarchy while legacy results keep their fallback", () => {
  for (const label of [
    "WHAT THIS MEANS FOR YOU", "這對你意味著甚麼",
    "WHAT TO DO NEXT", "接下來可以做甚麼",
    "ONE THING THAT COULD CHANGE THIS RESULT", "一件可能改變這份結果的事",
  ]) assert.match(resultRenderer, new RegExp(label));
  assert.match(resultRenderer, /resultValue/);
  assert.match(resultRenderer, /evidenceMoments/);
  assert.match(resultRenderer, /meaningParagraphs/);
  assert.match(resultRenderer, /nextSteps/);
  assert.match(resultRenderer, /changeSignal/);
  assert.match(resultRenderer, /YOUR RESULT[\s\S]*WHY YOU GOT THIS RESULT[\s\S]*meaningSection[\s\S]*FOUR WAYS TO READ YOUR RESULT[\s\S]*WHAT ALL FOUR AGREE ON[\s\S]*actionSection \+ changeSection/);
});

test("new result-value sections have responsive readable styling", () => {
  assert.match(html, /v31-result-value-v6/);
  assert.match(html, /result-copy-stack/);
  assert.match(html, /result-steps/);
  assert.match(html, /result-change/);
  assert.match(html, /@media\(max-width:760px\)[\s\S]*result-steps/);
});
