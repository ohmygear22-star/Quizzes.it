import test from "node:test";
import assert from "node:assert/strict";
import { quizzes } from "../v31/index.js";
import { buildResult } from "../v31/result-builder.js";

const hypothesisIds = ["H1", "H2", "H3", "H4"];
const answersFor = (quiz, primary) => quiz.questions.slice(0, quiz.stopping.minTotal).map((question) => {
  const option = [...question.options].sort((a, b) => b.evidence[primary] - a.evidence[primary] || a.id.localeCompare(b.id))[0];
  return { questionId: question.id, optionId: option.id };
});
const resultFor = (quiz, primary, locale) => {
  const secondary = hypothesisIds.find((id) => id !== primary);
  return buildResult({
    quiz,
    answers: answersFor(quiz, primary),
    scores: Object.fromEntries(hypothesisIds.map((id) => [id, id === primary ? 20 : id === secondary ? 14 : 3])),
    primary,
    secondary,
    leadMargin: 6,
    mixedProfile: false,
    locale,
    completion: { shouldStop: true, reason: "criteria-met" }
  });
};
const flatten = (voice) => Array.isArray(voice.paragraphs) ? voice.paragraphs.join(" ") : "";
const grams = (text) => {
  const clean = text.toLocaleLowerCase().replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
  if (/\p{Script=Han}/u.test(clean)) {
    const compact = clean.replace(/\s+/g, "");
    return new Set(Array.from({ length: Math.max(0, compact.length - 2) }, (_, index) => compact.slice(index, index + 3)));
  }
  const words = clean.split(" ").filter((word) => word.length > 2);
  return new Set(Array.from({ length: Math.max(0, words.length - 1) }, (_, index) => words.slice(index, index + 2).join(" ")));
};
const overlap = (a, b) => {
  const left = grams(a);
  const right = grams(b);
  const shared = [...left].filter((value) => right.has(value)).length;
  return shared / Math.max(1, Math.min(left.size, right.size));
};

const fingerprints = {
  en: {
    motivation: [/\bact\b|\baction\b|\bdecide\b|\bmove forward\b/i, /\bstandard\b|\baccountab/i, /\bstop\b|\brefuse\b|\bno more\b/i],
    therapist: [/\bboundar/i, /\bemotional safety\b|\bnervous system\b|\bregulat/i, /\battachment\b|\brelational dynamic/i],
    bestie: [/\bbestie\b|\bokay, listen\b|\bbe serious\b|\bside-eye/i, /\bwe(?:'|’)re not\b|\bi(?:'|’)m just saying\b/i, /\byou deserve\b|\bi love you\b|\bi(?:'|’)m on your side\b/i],
    darkTriad: [/\bleverage\b|\bpower balance\b/i, /\binvestment\b|\bresource allocation\b|\battention is a resource\b/i, /\bopportunity cost\b|\boptionality\b|\baccess\b/i],
  },
  "zh-Hant": {
    motivation: [/行動|立即做|馬上做|向前行/, /標準|承擔|主導權/, /停止|不要再|拒絕繼續/],
    therapist: [/界線/, /情緒安全|神經系統|調節/, /依附|關係動力|情緒勞動/],
    bestie: [/聽我說|老實說|拜託|我就直說|側目/, /我們不要|我們不會|別再/, /我站你這邊|你值得|我護著你/],
    darkTriad: [/籌碼|權力平衡/, /投入|資源分配|注意力是資源/, /機會成本|選項|接近你的資格/],
  }
};

test("all 44 primary outcomes produce four substantial identifiable voices in both locales", () => {
  let outcomes = 0;
  for (const quiz of quizzes) for (const primary of hypothesisIds) {
    outcomes += 1;
    for (const locale of ["en", "zh-Hant"]) {
      const result = resultFor(quiz, primary, locale);
      for (const [key, voice] of Object.entries(result.personalities)) {
        assert.ok(Array.isArray(voice.paragraphs), `${quiz.id}/${primary}/${locale}/${key} needs paragraph structure`);
        assert.equal(voice.paragraphs.length, 3, `${quiz.id}/${primary}/${locale}/${key} needs exactly three concise paragraphs`);
        const copy = flatten(voice);
        if (locale === "en") {
          const wordCount = copy.match(/[A-Za-z0-9’'-]+/g)?.length || 0;
          assert.ok(wordCount >= 55 && wordCount <= 100, `${quiz.id}/${primary}/${key} has ${wordCount} English words; expected 55-100`);
        } else {
          const hanCount = copy.match(/\p{Script=Han}/gu)?.length || 0;
          assert.ok(hanCount >= 90 && hanCount <= 180, `${quiz.id}/${primary}/${key} has ${hanCount} Han characters; expected an equivalent concise length`);
        }
        for (const paragraph of voice.paragraphs) {
          assert.ok(paragraph.trim().length >= (locale === "en" ? 35 : 20), `${quiz.id}/${primary}/${locale}/${key} paragraph is too slight`);
        }
        for (const marker of fingerprints[locale][key]) assert.match(flatten(voice), marker, `${quiz.id}/${primary}/${locale}/${key} is not recognizable without its heading`);
      }
    }
  }
  assert.equal(outcomes, 44);
});


test("each personality speaks directly to the customer in three to five sentences without report framing", () => {
  const forbiddenEn = /(?:the motivational perspective|the therapist (?:perspective|would)|the bestie (?:perspective|view)|the dark triad perspective|from (?:a |the )?(?:motivational|therapist|bestie|dark triad) perspective|this perspective (?:suggests|sees|focuses|interprets))/i;
  const forbiddenZh = /(?:行動動力角度認為|治療師(?:角度)?(?:會|認為|解讀)|好友(?:角度|看法)(?:會|認為)|暗黑視角(?:會|認為|著重)|從(?:行動動力|治療師|好友|暗黑)角度)/u;
  for (const quiz of quizzes) for (const primary of hypothesisIds) for (const locale of ["en", "zh-Hant"]) {
    const result = resultFor(quiz, primary, locale);
    for (const [key, voice] of Object.entries(result.personalities)) {
      const copy = flatten(voice);
      const sentenceCount = locale === "en"
        ? (copy.match(/[.!?](?=\s|$)/g)?.length || 0)
        : (copy.match(/[。！？]/g)?.length || 0);
      assert.ok(sentenceCount >= 3 && sentenceCount <= 5, `${quiz.id}/${primary}/${locale}/${key} has ${sentenceCount} sentences; expected 3-5`);
      if (locale === "en") {
        assert.ok((copy.match(/\b(?:you|your|you(?:'|’)re|you(?:'|’)ve)\b/gi)?.length || 0) >= 3, `${quiz.id}/${primary}/${key} does not speak directly to the customer`);
        assert.doesNotMatch(copy, forbiddenEn, `${quiz.id}/${primary}/${key} describes the personality instead of speaking as it`);
      } else {
        assert.ok((copy.match(/你/g)?.length || 0) >= 3, `${quiz.id}/${primary}/${key} does not speak directly to the customer`);
        assert.doesNotMatch(copy, forbiddenZh, `${quiz.id}/${primary}/${key} describes the personality instead of speaking as it`);
      }
    }
  }
});


test("zh-Hant direct feedback avoids technical report wording", () => {
  const unnatural = /高級權限/u;
  for (const quiz of quizzes) for (const primary of hypothesisIds) {
    const result = resultFor(quiz, primary, "zh-Hant");
    assert.doesNotMatch(Object.values(result.personalities).map(flatten).join(" "), unnatural, `${quiz.id}/${primary} uses technical report wording`);
  }
});

test("personality voices interpret rather than repeat the factual evidence section", () => {
  for (const quiz of quizzes) for (const primary of hypothesisIds) for (const locale of ["en", "zh-Hant"]) {
    const result = resultFor(quiz, primary, locale);
    const combined = Object.values(result.personalities).map(flatten);
    for (const moment of result.truthPacket.actualEvidence) {
      assert.equal(combined.some((copy) => copy.includes(moment.optionText)), false, `${quiz.id}/${primary}/${locale} repeats a selected answer`);
      assert.equal(combined.some((copy) => copy.includes(moment.whyItMattered)), false, `${quiz.id}/${primary}/${locale} repeats the evidence explanation`);
    }
    assert.equal(combined.filter((copy) => copy.includes(result.truthPacket.nextObservation)).length <= 1, true, `${quiz.id}/${primary}/${locale} repeats the same next step`);
  }
});

test("the four voices use distinct reasoning paths rather than synonym-swapped paragraphs", () => {
  for (const quiz of quizzes) for (const primary of hypothesisIds) for (const locale of ["en", "zh-Hant"]) {
    const voices = Object.entries(resultFor(quiz, primary, locale).personalities);
    for (let left = 0; left < voices.length; left += 1) for (let right = left + 1; right < voices.length; right += 1) {
      const score = overlap(flatten(voices[left][1]), flatten(voices[right][1]));
      assert.ok(score < 0.22, `${quiz.id}/${primary}/${locale} ${voices[left][0]} and ${voices[right][0]} overlap at ${score.toFixed(3)}`);
      assert.notDeepEqual(voices[left][1].paragraphs, voices[right][1].paragraphs);
    }
  }
});


test("consensus stays to one concise paragraph", () => {
  for (const quiz of quizzes) for (const primary of hypothesisIds) for (const locale of ["en", "zh-Hant"]) {
    const content = resultFor(quiz, primary, locale).consensus.content;
    assert.doesNotMatch(content, /\n\s*\n/);
    if (locale === "en") {
      const wordCount = content.match(/[A-Za-z0-9’'-]+/g)?.length || 0;
      assert.ok(wordCount >= 20 && wordCount <= 70, `${quiz.id}/${primary} consensus has ${wordCount} English words`);
    } else {
      const hanCount = content.match(/\p{Script=Han}/gu)?.length || 0;
      assert.ok(hanCount >= 25 && hanCount <= 120, `${quiz.id}/${primary} consensus has ${hanCount} Han characters`);
    }
  }
});

test("strong personality language remains non-diagnostic and does not encourage harm or manipulation", () => {
  const unsafe = /you should (?:retaliate|punish|manipulate)|use (?:coercion|deception)|take revenge against|blackmail them|應該報復|應該懲罰|操控對方|脅迫對方|欺騙對方|勒索對方|diagnos(?:e|is)|personality disorder|pathology/i;
  for (const quiz of quizzes) for (const primary of hypothesisIds) for (const locale of ["en", "zh-Hant"]) {
    const result = resultFor(quiz, primary, locale);
    assert.doesNotMatch(Object.values(result.personalities).map(flatten).join(" "), unsafe);
  }
});

test("consensus begins with the conclusion rather than describing four perspectives", () => {
  for (const quiz of quizzes) for (const primary of hypothesisIds) {
    const en = resultFor(quiz, primary, "en").consensus.content;
    const zh = resultFor(quiz, primary, "zh-Hant").consensus.content;
    assert.doesNotMatch(en, /^All four perspectives agree:/i);
    assert.doesNotMatch(zh, /^四個角度/u);
  }
});

test("Bestie speaks candidly without simulated affection", () => {
  const forbidden = /\bI love you\b|\bI care about you\b|我愛你|我很在乎你/iu;
  for (const quiz of quizzes) for (const primary of hypothesisIds) for (const locale of ["en", "zh-Hant"]) {
    const copy = flatten(resultFor(quiz, primary, locale).personalities.bestie);
    assert.doesNotMatch(copy, forbidden, `${quiz.id}/${primary}/${locale} uses fake-affection wording`);
  }
});
