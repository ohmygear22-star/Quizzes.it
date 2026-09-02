import test from "node:test";
import assert from "node:assert/strict";
import { quizzes, byId } from "../v31/index.js";
import { buildResult } from "../v31/result-builder.js";
import { startAssessment, currentQuestion, answerQuestion, unlockAssessment } from "../v31/engine.js";

const chooseFor = (question, hypothesis) => [...question.options].sort((a, b) => b.evidence[hypothesis] - a.evidence[hypothesis] || a.id.localeCompare(b.id))[0].id;
function run(quizId, hypothesis = "H1") {
  let state = startAssessment(quizId);
  while (state.status !== "payment-required") state = answerQuestion(state, { questionId: currentQuestion(state).id, optionId: chooseFor(currentQuestion(state), hypothesis) });
  state = unlockAssessment(state);
  while (!state.completion.shouldStop) state = answerQuestion(state, { questionId: currentQuestion(state).id, optionId: chooseFor(currentQuestion(state), hypothesis) });
  return state;
}
function resultFor(state, locale) {
  return buildResult({ quiz: byId.get(state.quizId), answers: state.answers, scores: state.scores, primary: state.completion.primary, secondary: state.completion.secondary, leadMargin: state.completion.leadMargin, mixedProfile: state.completion.mixedProfile, locale, completion: state.completion });
}

for (const locale of ["en", "zh-Hant"]) {
  test(`all quizzes build one deterministic ${locale} Truth Packet and four voices`, () => {
    for (const quiz of quizzes) {
      const first = resultFor(run(quiz.id, "H1"), locale);
      const again = resultFor(run(quiz.id, "H1"), locale);
      assert.deepEqual(first, again);
      assert.equal(first.truthPacket.quizId, quiz.id);
      assert.equal(first.truthPacket.primary, first.primary);
      assert.equal(first.truthPacket.secondary, first.secondary);
      assert.equal(first.truthPacket.confidence.state, first.confidence.state);
      assert.equal(first.truthPacket.resultHeadline, first.phases[0].content);
      assert.ok(first.truthPacket.actualEvidence.length >= 1);
      assert.ok(first.truthPacket.realLifePattern);
      assert.ok(first.truthPacket.nextObservation);
      assert.deepEqual(Object.keys(first.personalities), ["motivation", "therapist", "bestie", "darkTriad"]);
      for (const voice of Object.values(first.personalities)) {
        assert.ok(voice.title);
        assert.ok(Array.isArray(voice.paragraphs));
        assert.equal(voice.paragraphs.length, 3);
        assert.doesNotMatch(voice.title + voice.paragraphs.join(" "), /\bH[1-4]\b|leadMargin|PairSeparation|Information Value/i);
      }
      assert.ok(first.consensus.title);
      assert.ok(first.consensus.content);
    }
  });
}

test("selected-answer evidence carries question, selected answer, why it mattered and counter-evidence", () => {
  for (const quiz of quizzes) {
    const result = resultFor(run(quiz.id, "H2"), "en");
    for (const moment of result.truthPacket.actualEvidence) {
      assert.ok(moment.questionText);
      assert.ok(moment.optionText);
      assert.ok(moment.whyItMattered);
      assert.ok(result.answeredQuestions.some((answer) => answer.questionId === moment.questionId && answer.optionId === moment.optionId));
    }
    assert.ok(Array.isArray(result.truthPacket.counterEvidence));
    for (const moment of result.truthPacket.counterEvidence) assert.equal(moment.kind, "counter-evidence");
  }
});

test("personality copy has clean sentence spacing and keeps quoted questions intact", () => {
  for (const quiz of quizzes) {
    for (const locale of ["en", "zh-Hant"]) {
      const result = resultFor(run(quiz.id, "H1"), locale);
      const copy = JSON.stringify({ personalities: result.personalities, consensus: result.consensus });
      assert.doesNotMatch(copy, /  +/);
      assert.doesNotMatch(copy, /[?？]\s+[”"]/);
    }
  }
});

test("all rendered result copy stays customer-facing in both locales", () => {
  for (const quiz of quizzes) {
    for (const locale of ["en", "zh-Hant"]) {
      const result = resultFor(run(quiz.id, "H1"), locale);
      const visible = JSON.stringify({
        phases: result.phases.map(({ name, content }) => ({ name, content })),
        evidence: result.truthPacket.actualEvidence.map(({ questionText, optionText, whyItMattered }) => ({ questionText, optionText, whyItMattered })),
        personalities: result.personalities,
        consensus: result.consensus,
      });
      assert.doesNotMatch(visible, /\bH[1-4]\b|leadMargin|PairSeparation|Information Value/i);
      assert.doesNotMatch(visible, /\bcustomer\b|\bframe\b|emphasi[sz]e|interpretive self-reflection framework/i);
    }
  }
});
