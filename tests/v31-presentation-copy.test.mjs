import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { quizzes } from "../v31/index.js";
import { previewInsight } from "../v31/locale.js";

const frozen = JSON.parse(fs.readFileSync(new URL("./fixtures/v31-frozen-logic.json", import.meta.url), "utf8"));
const logicView = quizzes.map((quiz) => ({
  id: quiz.id,
  version: quiz.version,
  stopping: quiz.stopping,
  hypotheses: quiz.hypotheses,
  questions: quiz.questions.map((question) => ({
    id: question.id,
    number: question.number,
    stage: question.stage,
    scenarioDomain: question.scenarioDomain,
    designedPair: question.designedPair,
    pairSeparationScore: question.pairSeparationScore,
    informationValue: question.informationValue,
    options: question.options.map((option) => ({ id: option.id, evidence: option.evidence }))
  }))
}));

test("all 270 questions and 1080 options use direct bilingual presentation copy while frozen logic remains exact", () => {
  assert.deepEqual(logicView, frozen);
  const questions = quizzes.flatMap((quiz) => quiz.questions);
  const options = questions.flatMap((question) => question.options);
  assert.equal(questions.length, 270);
  assert.equal(options.length, 1080);
  for (const question of questions) {
    assert.equal(question.presentationRevision, "human-v2-direct");
    assert.ok(question.sourceText && question.sourceTextZh);
    assert.equal(question.text, question.sourceText);
    assert.equal(question.textZh, question.sourceTextZh);
    assert.ok(question.text.trim().endsWith("?"));
    assert.ok(/[？?]$/.test(question.textZh.trim()));
    for (const option of question.options) {
      assert.equal(option.presentationRevision, "human-v2-direct");
      assert.ok(option.sourceText && option.sourceTextZh);
      assert.equal(option.text, option.sourceText, `${question.id}/${option.id} English meaning drift`);
      assert.equal(option.textZh, option.sourceTextZh, `${question.id}/${option.id} zh-Hant meaning drift`);
    }
  }
});

test("preview teaser is deterministic, quiz-specific, localized and does not expose engine IDs", () => {
  for (const quiz of quizzes) {
    for (const locale of ["en", "zh-Hant"]) {
      const scores = { H1: 8, H2: 3, H3: 0, H4: -1 };
      const first = previewInsight(scores, locale, quiz);
      const second = previewInsight(scores, locale, quiz);
      assert.deepEqual(first, second);
      assert.equal(first.quizId, quiz.id);
      assert.ok(first.headline);
      assert.ok(first.observation);
      assert.ok(first.curiosity);
      assert.ok(first.next);
      const visible = { headline: first.headline, observation: first.observation, curiosity: first.curiosity, next: first.next };
      assert.doesNotMatch(JSON.stringify(visible), /\bH[1-4]\b|leadMargin|PairSeparation/i);
    }
  }
});

test("customer-facing copy has no known zh-Hant leakage or duplicated wording", () => {
  const customerCopy = JSON.stringify(quizzes.map((quiz) => ({ metadata: quiz.metadata, questions: quiz.questions, resultBlueprints: quiz.resultBlueprints })));
  assert.doesNotMatch(customerCopy, /一併一併/);
  assert.doesNotMatch(customerCopy, /簡體|为甚么|里面|这份|对方/);
});

test("presentation framing does not create self-referential option stutters", () => {
  const copy = quizzes.flatMap((quiz) => quiz.questions.flatMap((question) => question.options.map((option) => option.text))).join("\n");
  assert.doesNotMatch(copy, /:\s+for me,\s+/i);
  assert.doesNotMatch(copy, /:\s+(?:another honest possibility|closest to me|the more direct answer):/i);
});


test("questions and answers contain no artificial colon-prefix framing in either locale", () => {
  const enQuestionPrefix = /^(?:Picture the moment clearly|Go with your first reaction|Imagine(?: this| this happening for real)|Be honest(?: about your first instinct)?|Think about(?: this| how you would actually feel)|Consider this|Here's the situation|Before you overthink it):\s*/i;
  const zhQuestionPrefix = /^(?:把自己代入這個情境|憑第一反應回答|想像這件事真的發生|誠實想一想|想想你當下最真實的感受|先別分析太多)[:：]\s*/u;
  const enOptionPrefix = /^(?:Closest to me|Another honest possibility|I might also recognise this|The more direct answer|Most like me|If I'm honest|Probably this|The way I see it):\s*/i;
  const zhOptionPrefix = /^(?:比較貼近的描述|另一個真實的可能|也可能是這種情況|如果更直接一點)[:：]\s*/u;
  for (const quiz of quizzes) for (const question of quiz.questions) {
    assert.doesNotMatch(question.text, enQuestionPrefix, `${quiz.id}/${question.id} has an artificial English question prefix`);
    assert.doesNotMatch(question.textZh, zhQuestionPrefix, `${quiz.id}/${question.id} has an artificial zh-Hant question prefix`);
    for (const option of question.options) {
      assert.doesNotMatch(option.text, enOptionPrefix, `${quiz.id}/${question.id}/${option.id} has an artificial English answer prefix`);
      assert.doesNotMatch(option.textZh, zhOptionPrefix, `${quiz.id}/${question.id}/${option.id} has an artificial zh-Hant answer prefix`);
    }
  }
});
