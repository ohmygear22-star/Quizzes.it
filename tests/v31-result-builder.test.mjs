import test from "node:test";
import assert from "node:assert/strict";
import { quizzes } from "../v31/index.js";
import { buildResult } from "../v31/result-builder.js";

const byId = (id) => quizzes.find((quiz) => quiz.id === id);
const fieldValue = (blueprint, field) => blueprint[field] ?? blueprint[Object.keys(blueprint).find((key) => key.replaceAll(" ", "") === field.replaceAll(" ", ""))];
const selected = (quiz, count, optionId = "A") => quiz.questions.slice(0, count).map((question) => ({ questionId: question.id, optionId }));
const completed = (quiz, { primary = "H1", secondary = "H2", margin = 4, mixedProfile = false, locale = "en", answers = selected(quiz, quiz.stopping.minTotal) } = {}) => {
  const scores = { H1: 0, H2: 0, H3: 0, H4: 0 };
  scores[primary] = 20;
  scores[secondary] = 20 - margin;
  return buildResult({ quiz, answers, scores, primary, secondary, leadMargin: margin, mixedProfile, locale, completion: { shouldStop: true, reason: "criteria-met" } });
};

test("the fixed source exposes exactly 44 complete bilingual primary blueprints", () => {
  const required = ["Primary", "Headline EN", "Headline中文", "We're With You EN", "站在你這邊中文", "Deeper Pattern EN", "更深層模式中文", "Professional View EN", "專業／現實角度中文", "Evidence Guidance EN", "答案證據指引中文", "Real-Life Examples EN", "現實生活例子中文", "Watch / Try Next EN", "接下來留意／嘗試中文", "Clear Wording EN", "清晰結果措辭中文", "Developing Wording EN", "發展中結果措辭中文", "Mixed Wording EN", "混合結果措辭中文", "Evidence Selection EN", "證據選取規則中文", "Safety Boundary EN", "安全措辭中文", "Secondary H1 EN", "次要H1中文", "Secondary H2 EN", "次要H2中文", "Secondary H3 EN", "次要H3中文", "Secondary H4 EN", "次要H4中文"];
  assert.equal(quizzes.reduce((total, quiz) => total + quiz.resultBlueprints.length, 0), 44);
  for (const quiz of quizzes) for (const blueprint of quiz.resultBlueprints) {
    assert.ok(["H1", "H2", "H3", "H4"].includes(blueprint.Primary));
    for (const field of required) assert.notEqual(String(fieldValue(blueprint, field) ?? "").trim(), "", quiz.id + "/" + blueprint.Primary + " missing " + field);
  }
});

test("result uses the current primary blueprint and returns all eight ordered phases", () => {
  const result = completed(byId("REL01"), { primary: "H4", secondary: "H2" });
  assert.equal(result.blueprint.primary, "H4");
  assert.deepEqual(result.phases.map((phase) => phase.name), [
    "Headline Result", "We're With You", "The Deeper Pattern", "Professional / Real-World View",
    "Evidence From Your Answers", "Alternative Explanation & Confidence",
    "What This Looks Like in Real Life", "What to Watch / Try Next",
  ]);
  assert.equal(result.phases[0].content, result.blueprint.content.headline);
  assert.equal(result.phases[3].content, result.blueprint.content.professional);
  assert.equal(completed(byId("REL05"), { primary: "H2" }).blueprint.primary, "H2");
  assert.equal(completed(byId("REL02"), { primary: "H1" }).blueprint.primary, "H1");
});

test("secondary guidance belongs to the winning primary and changes with the actual secondary", () => {
  const h2 = completed(byId("REL01"), { primary: "H1", secondary: "H2" });
  const h4 = completed(byId("REL01"), { primary: "H1", secondary: "H4" });
  assert.equal(h2.blueprint.primary, "H1");
  assert.notEqual(h2.phases[5].secondaryIntegration, h4.phases[5].secondaryIntegration);
  assert.equal(h2.phases[5].secondaryIntegration, h2.blueprint.secondary.H2);
  assert.notEqual(h4.blueprint.primary, "H4");
});

test("confidence wording changes for developing and mixed outcomes without clinical claims", () => {
  const clear = completed(byId("REL01"), { margin: 4, mixedProfile: false });
  const developing = completed(byId("REL01"), { margin: 3, mixedProfile: false });
  const mixed = completed(byId("REL01"), { margin: 3, mixedProfile: true });
  assert.equal(clear.confidence.state, "clear");
  assert.equal(developing.confidence.state, "developing");
  assert.equal(mixed.confidence.state, "mixed");
  assert.notEqual(clear.phases[5].confidenceWording, developing.phases[5].confidenceWording);
  assert.notEqual(developing.phases[5].confidenceWording, mixed.phases[5].confidenceWording);
  assert.match(mixed.phases[5].confidenceWording, /combination|both|mixed/i);
  assert.doesNotMatch(mixed.phases.map((phase) => phase.content).join(" "), /diagnos|clinical probability|\b\d{2}%/i);
});

test("evidence moments contain only actual selected answers and retain their source details", () => {
  const quiz = byId("REL01");
  const answers = selected(quiz, 20);
  const result = completed(quiz, { answers });
  assert.ok(result.evidenceMoments.length >= 5 && result.evidenceMoments.length <= 7);
  for (const moment of result.evidenceMoments) {
    const input = answers.find((answer) => answer.questionId === moment.questionId && answer.optionId === moment.optionId);
    const question = quiz.questions.find((item) => item.id === moment.questionId);
    assert.ok(input);
    assert.equal(moment.questionText, question.text);
    assert.equal(moment.optionText, question.options.find((item) => item.id === moment.optionId).text);
    assert.deepEqual(moment.evidence, question.options.find((item) => item.id === moment.optionId).evidence);
  }
});

test("same primary with different answer histories produces different evidence and remains deterministic", () => {
  const quiz = byId("REL01");
  const a = completed(quiz, { answers: selected(quiz, 20, "A") });
  const b = completed(quiz, { answers: selected(quiz, 20, "B") });
  assert.notDeepEqual(a.evidenceMoments, b.evidenceMoments);
  assert.deepEqual(a, completed(quiz, { answers: selected(quiz, 20, "A") }));
});

test("standard and deep evidence counts respect authored bounds without fabricating weak moments", () => {
  const deep = completed(byId("REL02"), { answers: selected(byId("REL02"), 20) });
  const standard = completed(byId("REL05"), { answers: selected(byId("REL05"), 15) });
  assert.ok(deep.evidenceMoments.length >= 5 && deep.evidenceMoments.length <= 7);
  assert.ok(standard.evidenceMoments.length >= 4 && standard.evidenceMoments.length <= 6);
});

test("the same blueprint resolves authored English and Traditional Chinese without translation", () => {
  const quiz = byId("REL01");
  const en = completed(quiz, { locale: "en" });
  const zh = completed(quiz, { locale: "zh-Hant" });
  assert.equal(en.blueprint.primary, zh.blueprint.primary);
  assert.notEqual(en.phases[0].content, zh.phases[0].content);
  assert.equal(zh.phases[0].content, zh.blueprint.content.headline);
});

test("invalid completion and source state fail in controlled ways", () => {
  const quiz = byId("REL01");
  assert.throws(() => buildResult({ quiz: null, answers: [], scores: { H1: 20, H2: 16, H3: 0, H4: 0 }, primary: "H1", secondary: "H2", completion: { shouldStop: true } }), /Unknown quiz/);
  assert.throws(() => buildResult({ quiz, answers: selected(quiz, 20), scores: { H1: 20, H2: 16, H3: 0, H4: 0 }, primary: "H9", secondary: "H2", completion: { shouldStop: true } }), /Unknown primary/);
  assert.throws(() => buildResult({ quiz, answers: [{ questionId: "missing", optionId: "A" }], scores: { H1: 20, H2: 16, H3: 0, H4: 0 }, primary: "H1", secondary: "H2", completion: { shouldStop: true } }), /Unknown question/);
  assert.throws(() => buildResult({ quiz, answers: [{ questionId: quiz.questions[0].id, optionId: "Z" }], scores: { H1: 20, H2: 16, H3: 0, H4: 0 }, primary: "H1", secondary: "H2", completion: { shouldStop: true } }), /Unknown option/);
  assert.throws(() => buildResult({ quiz, answers: selected(quiz, 20), scores: { H1: 20, H2: 16, H3: 0, H4: 0 }, primary: "H1", secondary: "H2", completion: { shouldStop: false } }), /completed session/);
  assert.throws(() => buildResult({ quiz: { ...quiz, resultBlueprints: [] }, answers: selected(quiz, 20), scores: { H1: 20, H2: 16, H3: 0, H4: 0 }, primary: "H1", secondary: "H2", completion: { shouldStop: true } }), /Missing Result Blueprint/);
});


test("authored counter-evidence guidance retains a selected counter-example when available", () => {
  const quiz = byId("REL01");
  const answers = selected(quiz, 20);
  answers[2] = { questionId: "REL01-Q03", optionId: "B" };
  const result = completed(quiz, { answers, primary: "H1", secondary: "H2" });
  assert.ok(result.evidenceMoments.some((moment) => moment.questionId === "REL01-Q03" && moment.optionId === "B" && moment.kind === "counter-evidence"));
});
