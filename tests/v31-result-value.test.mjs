import test from "node:test";
import assert from "node:assert/strict";
import { quizzes, byId } from "../v31/index.js";
import { buildResult } from "../v31/result-builder.js";
import { startAssessment, currentQuestion, answerQuestion, unlockAssessment } from "../v31/engine.js";

const chooseFor = (question, hypothesis) => [...question.options]
  .sort((left, right) => right.evidence[hypothesis] - left.evidence[hypothesis] || left.id.localeCompare(right.id))[0].id;

function run(quizId, hypothesis = "H1") {
  let state = startAssessment(quizId);
  while (state.status !== "payment-required") {
    const question = currentQuestion(state);
    state = answerQuestion(state, { questionId: question.id, optionId: chooseFor(question, hypothesis) });
  }
  state = unlockAssessment(state);
  while (!state.completion.shouldStop) {
    const question = currentQuestion(state);
    state = answerQuestion(state, { questionId: question.id, optionId: chooseFor(question, hypothesis) });
  }
  return state;
}

function resultFor(state, locale) {
  return buildResult({
    quiz: byId.get(state.quizId),
    answers: state.answers,
    scores: state.scores,
    primary: state.completion.primary,
    secondary: state.completion.secondary,
    leadMargin: state.completion.leadMargin,
    mixedProfile: state.completion.mixedProfile,
    locale,
    completion: state.completion,
  });
}

function sentenceCount(value, locale) {
  return locale === "zh-Hant"
    ? (String(value).match(/[。！？]/g)?.length || 0)
    : (String(value).match(/[.!?](?=\s|$)/g)?.length || 0);
}

function normalized(value) {
  return String(value).toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu, "");
}

for (const locale of ["en", "zh-Hant"]) {
  test(`all 11 quizzes build deterministic customer-value sections in ${locale}`, () => {
    assert.equal(quizzes.length, 11);
    for (const quiz of quizzes) {
      const state = run(quiz.id, "H1");
      const first = resultFor(state, locale);
      const again = resultFor(state, locale);
      assert.deepEqual(first.resultValue, again.resultValue, `${quiz.id}/${locale} result value must be deterministic`);

      const value = first.resultValue;
      assert.ok(value, `${quiz.id}/${locale} needs resultValue`);
      assert.ok(value.summary);
      assert.ok(sentenceCount(value.summary, locale) >= 1 && sentenceCount(value.summary, locale) <= 2);
      assert.notEqual(value.summary.trim().toLocaleLowerCase(), first.confidence.state);
      assert.doesNotMatch(value.summary, /\bH[1-4]\b|leadMargin|PairSeparation|Information Value|confidence state/i);

      assert.equal(value.evidenceMoments.length, 3, `${quiz.id}/${locale} needs three strongest moments`);
      assert.equal(new Set(value.evidenceMoments.map((moment) => moment.questionId)).size, 3);
      assert.equal(new Set(value.evidenceMoments.map((moment) => moment.optionText)).size, 3, `${quiz.id}/${locale} should prefer three distinct selected answers`);
      assert.equal(new Set(value.evidenceMoments.map((moment) => moment.whyItMattered)).size, 3, `${quiz.id}/${locale} should not repeat evidence explanations`);
      for (const moment of value.evidenceMoments) {
        assert.ok(first.answeredQuestions.some((answer) => answer.questionId === moment.questionId && answer.optionId === moment.optionId));
        assert.ok(normalized(moment.whyItMattered).includes(normalized(moment.optionText)), `${quiz.id}/${locale}/${moment.questionId} why must be selected-answer-specific`);
        assert.equal(sentenceCount(moment.whyItMattered, locale), 1);
        assert.doesNotMatch(moment.whyItMattered, /\bH[1-4]\b|leadMargin|PairSeparation|Information Value/i);
      }

      assert.ok(value.meaningParagraphs.length >= 2 && value.meaningParagraphs.length <= 3);
      assert.equal(new Set(value.meaningParagraphs).size, value.meaningParagraphs.length);
      for (const paragraph of value.meaningParagraphs) {
        assert.ok(paragraph.trim().length >= (locale === "en" ? 35 : 18));
        assert.ok(sentenceCount(paragraph, locale) >= 1 && sentenceCount(paragraph, locale) <= 2);
        assert.equal((paragraph.match(/[“「]/gu) || []).length, (paragraph.match(/[”」]/gu) || []).length, `${quiz.id}/${locale} meaning paragraph has an unclosed quotation`);
        const repeated = value.evidenceMoments.find((moment) => paragraph.includes(moment.optionText)); assert.equal(repeated, undefined, `${quiz.id}/${locale} meaning repeats selected answer: ${repeated?.optionText || ""}`);
      }

      assert.equal(value.nextSteps.length, 3);
      assert.equal(new Set(value.nextSteps).size, 3);
      assert.ok(normalized(value.nextSteps.join(" ")).includes(normalized(first.truthPacket.primaryLabel)));
      assert.ok(normalized(value.nextSteps.join(" ")).includes(normalized(first.truthPacket.secondaryLabel)));
      assert.doesNotMatch(value.nextSteps.join(" "), /manipulat|retaliat|punish|revenge|blackmail|操控|報復|懲罰|勒索/i);

      assert.ok(value.changeSignal);
      assert.equal(sentenceCount(value.changeSignal, locale), 1);
      assert.ok(normalized(value.changeSignal).includes(normalized(first.truthPacket.secondaryLabel)));
      assert.doesNotMatch(value.changeSignal, /definitely|always|never|一定|永遠|絕對/u);
    }
  });
}

test("visible result-value content does not duplicate personality paragraphs", () => {
  for (const quiz of quizzes) {
    for (const locale of ["en", "zh-Hant"]) {
      const result = resultFor(run(quiz.id, "H2"), locale);
      const factual = [
        result.resultValue.summary,
        ...result.resultValue.meaningParagraphs,
        ...result.resultValue.nextSteps,
        result.resultValue.changeSignal,
      ];
      const personalityParagraphs = Object.values(result.personalities).flatMap((voice) => voice.paragraphs);
      for (const paragraph of factual) assert.equal(personalityParagraphs.includes(paragraph), false);
    }
  }
});

test("all 44 authored primary outcomes produce complete bilingual result-value contracts", () => {
  const hypothesisIds = ["H1", "H2", "H3", "H4"];
  let outcomeCount = 0;
  for (const quiz of quizzes) for (const primary of hypothesisIds) {
    outcomeCount += 1;
    const secondary = hypothesisIds.find((id) => id !== primary);
    const answers = quiz.questions.slice(0, quiz.stopping.minTotal).map((question) => {
      const option = [...question.options].sort((left, right) => right.evidence[primary] - left.evidence[primary] || left.id.localeCompare(right.id))[0];
      return { questionId: question.id, optionId: option.id };
    });
    for (const locale of ["en", "zh-Hant"]) {
      const result = buildResult({
        quiz,
        answers,
        scores: Object.fromEntries(hypothesisIds.map((id) => [id, id === primary ? 20 : id === secondary ? 14 : 3])),
        primary,
        secondary,
        leadMargin: 6,
        mixedProfile: false,
        locale,
        completion: { shouldStop: true, reason: "criteria-met" },
      });
      assert.equal(result.resultValue.evidenceMoments.length, 3);
      assert.ok(result.resultValue.summary);
      assert.ok(result.resultValue.meaningParagraphs.length >= 2);
      assert.equal(result.resultValue.nextSteps.length, 3);
      assert.ok(result.resultValue.changeSignal);
    }
  }
  assert.equal(outcomeCount, 44);
});
