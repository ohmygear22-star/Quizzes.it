import { buildResultPersonalities } from "./result-personalities.js";

const phaseNames = {
  en: ["Headline Result", "We\'re With You", "The Deeper Pattern", "Professional / Real-World View", "Evidence From Your Answers", "Alternative Explanation & Confidence", "What This Looks Like in Real Life", "What to Watch / Try Next"],
  "zh-Hant": ["頭條結果", "我們明白你", "更深層模式", "專業／現實角度", "你的答案證據", "其他解釋與信心", "現實生活中的樣子", "接下來留意／嘗試"]
};

const locales = {
  en: {
    primary: "Primary EN", headline: "Headline EN", withYou: "We're With You EN",
    deeper: "Deeper Pattern EN", professional: "Professional View EN",
    evidenceGuidance: "Evidence Guidance EN", realLife: "Real-Life Examples EN",
    watchNext: "Watch / Try Next EN", clear: "Clear Wording EN",
    developing: "Developing Wording EN", mixed: "Mixed Wording EN",
    evidenceSelection: "Evidence Selection EN", safety: "Safety Boundary EN",
    secondary: (id) => "Secondary " + id + " EN",
  },
  "zh-Hant": {
    primary: "主要模式中文", headline: "Headline中文", withYou: "站在你這邊中文",
    deeper: "更深層模式中文", professional: "專業／現實角度中文",
    evidenceGuidance: "答案證據指引中文", realLife: "現實生活例子中文",
    watchNext: "接下來留意／嘗試中文", clear: "清晰結果措辭中文",
    developing: "發展中結果措辭中文", mixed: "混合結果措辭中文",
    evidenceSelection: "證據選取規則中文", safety: "安全措辭中文",
    secondary: (id) => "次要" + id + "中文",
  },
};

function fieldValue(row, field) {
  const direct = row[field];
  if (direct !== undefined) return direct;
  const normalized = field.replaceAll(" ", "");
  const key = Object.keys(row).find((item) => item.replaceAll(" ", "") === normalized);
  return row[key];
}

function blueprintFor(quiz, primary, locale) {
  if (!quiz || !quiz.id) throw new Error("Unknown quiz");
  if (!["H1", "H2", "H3", "H4"].includes(primary)) throw new Error("Unknown primary: " + primary);
  const row = quiz.resultBlueprints?.find((item) => item.Primary === primary);
  if (!row) throw new Error("Missing Result Blueprint: " + quiz.id + "/" + primary);
  const fields = locales[locale];
  if (!fields) throw new Error("Unsupported locale: " + locale);
  const content = Object.fromEntries(Object.entries(fields).filter(([key]) => key !== "secondary").map(([key, field]) => [key, fieldValue(row, field)]));
  const secondary = Object.fromEntries(["H1", "H2", "H3", "H4"].map((id) => [id, fieldValue(row, fields.secondary(id))]));
  if (Object.values(content).some((value) => !String(value || "").trim()) || Object.values(secondary).some((value) => !String(value || "").trim())) throw new Error("Incomplete Result Blueprint: " + quiz.id + "/" + primary);
  return { quizId: quiz.id, primary, locale, content, secondary, authored: row };
}

function hypothesisLabel(quiz, id, locale) {
  const row = quiz.resultBlueprints?.find((item) => item.Primary === id);
  if (!row) return "";
  return String(fieldValue(row, locale === "zh-Hant" ? "主要模式中文" : "Primary EN") || "").trim();
}

function answeredDetails(quiz, answers) {
  return answers.map((answer) => {
    const question = quiz.questions.find((item) => item.id === answer.questionId);
    if (!question) throw new Error("Unknown question: " + answer.questionId);
    const option = question.options.find((item) => item.id === answer.optionId);
    if (!option) throw new Error("Unknown option: " + answer.optionId);
    return { question, option };
  });
}

function evidenceQuote(value, locale) {
  const clean = String(value || "").trim().replace(/[.!?。！？]+/gu, locale === "zh-Hant" ? "，" : ",").replace(/[，,]+$/u, "");
  return clean;
}

function whyItMattered({ kind, optionText, primaryLabel, secondaryLabel, locale }) {
  const answer = evidenceQuote(optionText, locale);
  if (locale === "zh-Hant") {
    if (kind === "counter-evidence") return `「${answer}」這個反應削弱了「${primaryLabel}」的解讀，所以主要結果仍需保留餘地。`;
    if (kind === "secondary-evidence") return `「${answer}」這個反應較支持「${secondaryLabel}」，所以結果不能只從單一方向理解。`;
    return `「${answer}」這個反應較支持「${primaryLabel}」而不是「${secondaryLabel}」，所以它對結果特別有份量。`;
  }
  if (kind === "counter-evidence") return `That response — “${answer}” — pushes against ${primaryLabel.toLowerCase()}, so the main reading stays qualified rather than absolute.`;
  if (kind === "secondary-evidence") return `That response — “${answer}” — supports ${secondaryLabel.toLowerCase()} more strongly, so the result cannot be read in only one direction.`;
  return `That response — “${answer}” — supports ${primaryLabel.toLowerCase()} more strongly than ${secondaryLabel.toLowerCase()}, so it carries particular weight here.`;
}

function evidenceMoments(quiz, details, primary, secondary, locale) {
  const bounds = quiz.stopping.maxTotal === 18 ? { min: 4, max: 6 } : { min: 5, max: 7 };
  const primaryLabel = hypothesisLabel(quiz, primary, locale);
  const secondaryLabel = hypothesisLabel(quiz, secondary, locale);
  const candidates = details.filter(({ option }) => option.evidence[primary] !== 0 || option.evidence[secondary] !== 0)
    .map(({ question, option }) => {
      const primaryValue = option.evidence[primary];
      const secondaryValue = option.evidence[secondary];
      const kind = primaryValue < 0 ? "counter-evidence" : secondaryValue > primaryValue ? "secondary-evidence" : "primary-evidence";
      const optionText = locale === "zh-Hant" ? option.textZh : option.text;
      return {
        questionId: question.id,
        questionNumber: question.number,
        questionText: locale === "zh-Hant" ? question.textZh : question.text,
        optionId: option.id,
        optionText,
        scenarioDomain: question.scenarioDomain,
        evidence: { ...option.evidence },
        kind,
        whyItMattered: whyItMattered({ kind, optionText, primaryLabel, secondaryLabel, locale }),
        strength: Math.abs(primaryValue) * 10 + Math.abs(secondaryValue),
      };
    }).sort((left, right) => right.strength - left.strength || left.questionNumber - right.questionNumber);

  const selected = [];
  const domains = new Set();
  for (const item of candidates) {
    if (selected.length === bounds.max) break;
    if (item.evidence[primary] > 0 && !domains.has(item.scenarioDomain)) {
      selected.push(item);
      domains.add(item.scenarioDomain);
    }
  }
  for (const item of candidates) {
    if (selected.length === bounds.max) break;
    if (!selected.some((chosen) => chosen.questionId === item.questionId)) {
      selected.push(item);
      domains.add(item.scenarioDomain);
    }
  }
  const counter = candidates.find((item) => item.kind === "counter-evidence" && !selected.some((chosen) => chosen.questionId === item.questionId));
  if (counter) {
    if (selected.length === bounds.max) selected.pop();
    selected.push(counter);
  }
  return { moments: selected, candidates, target: bounds, insufficientQualifyingEvidence: selected.length < bounds.min };
}

function sentenceList(value, locale) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const sentences = [];
  let start = 0;
  let curlyQuote = false;
  let cornerQuote = 0;
  let straightQuote = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === "“") curlyQuote = true;
    else if (character === "”") curlyQuote = false;
    else if (character === "「" || character === "『") cornerQuote += 1;
    else if ((character === "」" || character === "』") && cornerQuote > 0) cornerQuote -= 1;
    else if (character === "\"") straightQuote = !straightQuote;
    const ending = locale === "zh-Hant" ? /[。！？]/u.test(character) : /[.!?]/u.test(character) && (index === text.length - 1 || /\s/u.test(text[index + 1]));
    if (ending && !curlyQuote && cornerQuote === 0 && !straightQuote) {
      sentences.push(text.slice(start, index + 1).trim());
      start = index + 1;
    }
  }
  if (start < text.length) sentences.push(text.slice(start).trim());
  return sentences.filter(Boolean);
}

function firstSentence(value, locale) {
  return sentenceList(value, locale)[0] || "";
}

function meaningSentence(value, locale, evidence) {
  const sentences = sentenceList(value, locale);
  const selectedAnswers = evidence.moments.map((moment) => moment.optionText).filter((option) => option.length >= 12);
  return sentences.find((sentence) => !selectedAnswers.some((option) => sentence.includes(option))) || sentences[0] || "";
}

function visibleEvidenceMoments(evidence) {
  const ranked = [...(evidence.candidates || evidence.moments)]
    .sort((left, right) => right.strength - left.strength || left.questionNumber - right.questionNumber);
  const selected = [];
  for (const moment of ranked) {
    if (!selected.some((item) => item.optionText === moment.optionText)) selected.push(moment);
    if (selected.length === 3) return selected;
  }
  for (const moment of ranked) {
    if (!selected.some((item) => item.questionId === moment.questionId)) selected.push(moment);
    if (selected.length === 3) break;
  }
  return selected;
}

function resultSummary({ confidenceState, primaryLabel, secondaryLabel, locale }) {
  if (locale === "zh-Hant") {
    if (confidenceState === "mixed") return `你的答案同時指向兩個有份量的方向，所以這份結果較適合視為一個組合，而不是定論。「${primaryLabel}」與「${secondaryLabel}」都值得留意。`;
    if (confidenceState === "developing") return `你的答案目前較傾向「${primaryLabel}」，但並非所有訊號都指向同一方向。「${secondaryLabel}」仍是理解整體情況的重要部分。`;
    return `你的答案最明顯指向「${primaryLabel}」。「${secondaryLabel}」仍然存在，但暫時屬於補充線索，未有改變整體結果。`;
  }
  if (confidenceState === "mixed") return `Your answers point in two meaningful directions, so this result is best read as a blend rather than a fixed conclusion. ${primaryLabel} and ${secondaryLabel.toLowerCase()} both matter.`;
  if (confidenceState === "developing") return `Your answers currently lean toward ${primaryLabel.toLowerCase()}, although not every signal points the same way. ${secondaryLabel} remains an important part of the overall picture.`;
  return `Your answers point most strongly to ${primaryLabel.toLowerCase()}. ${secondaryLabel} is still present, but it plays a supporting role rather than changing the overall result.`;
}

function resultValueFor({ blueprint, evidence, confidenceState, primaryLabel, secondaryLabel, locale }) {
  const meaningParagraphs = [
    meaningSentence(blueprint.content.deeper, locale, evidence),
    meaningSentence(blueprint.content.realLife, locale, evidence),
  ].filter((value, index, values) => value && values.indexOf(value) === index);

  const authoredNext = firstSentence(blueprint.content.watchNext, locale);
  const nextSteps = locale === "zh-Hant"
    ? [
        authoredNext,
        `在接下來幾次互動中，留意「${primaryLabel}」是否持續出現，而不是靠你推動才出現。`,
        `如果「${secondaryLabel}」逐漸成為更一致的模式，就按新證據調整解讀，不必勉強維持第一個結論。`,
      ]
    : [
        authoredNext,
        `Over the next few situations, watch whether ${primaryLabel.toLowerCase()} keeps showing up without you having to force the outcome.`,
        `If ${secondaryLabel.toLowerCase()} becomes the more consistent pattern, update your reading instead of protecting the first conclusion.`,
      ];

  const changeSignal = locale === "zh-Hant"
    ? `如果「${secondaryLabel}」開始持續出現，而不再只是零星訊號，這份解讀就需要調整。`
    : `This reading would become less convincing if ${secondaryLabel.toLowerCase()} starts showing up consistently rather than as an occasional signal.`;

  return {
    summary: resultSummary({ confidenceState, primaryLabel, secondaryLabel, locale }),
    evidenceMoments: visibleEvidenceMoments(evidence),
    meaningParagraphs,
    nextSteps,
    changeSignal,
  };
}

export function buildResult({ quiz, answers = [], scores, primary, secondary, leadMargin, mixedProfile = false, locale = "en", completion }) {
  if (!completion?.shouldStop) throw new Error("Result requires a completed session");
  if (!["H1", "H2", "H3", "H4"].includes(secondary)) throw new Error("Unknown secondary: " + secondary);
  const blueprint = blueprintFor(quiz, primary, locale);
  const details = answeredDetails(quiz, answers);
  const evidence = evidenceMoments(quiz, details, primary, secondary, locale);
  const confidenceState = mixedProfile ? "mixed" : leadMargin >= quiz.stopping.leadMarginToStop ? "clear" : "developing";
  const confidenceWording = blueprint.content[confidenceState];
  const primaryLabel = hypothesisLabel(quiz, primary, locale);
  const secondaryLabel = hypothesisLabel(quiz, secondary, locale);
  const customerSecondary = locale === "zh-Hant"
    ? `另一個值得留意的模式是「${secondaryLabel}」。它不會推翻主要解讀，而是指出兩個模式可能重疊或拉扯的地方。`
    : `A second pattern worth keeping in view is ${secondaryLabel.toLowerCase()}. It does not cancel the main reading; it shows where the two patterns may overlap or pull in different directions.`;
  const names = phaseNames[locale];
  const customerEvidenceIntro = locale === "zh-Hant"
    ? "以下答案最有份量，因為它們在具體情境中帶出這個模式。每一項都列出你選擇的答案，以及它為甚麼重要。"
    : "These answers carried the most weight because they show the pattern in specific moments. Each one includes what you chose and why it mattered.";
  const phase5 = { name: names[4], content: customerEvidenceIntro, evidenceGuidance: blueprint.content.evidenceGuidance, evidenceSelection: blueprint.content.evidenceSelection, moments: evidence.moments };
  const phase6 = { name: names[5], content: `${confidenceWording} ${customerSecondary}`, confidenceWording, customerSecondary, secondaryIntegration: blueprint.secondary[secondary], safetyBoundary: blueprint.content.safety };
  const phases = [
    { name: names[0], content: blueprint.content.headline },
    { name: names[1], content: blueprint.content.withYou },
    { name: names[2], content: blueprint.content.deeper },
    { name: names[3], content: blueprint.content.professional },
    phase5,
    phase6,
    { name: names[6], content: blueprint.content.realLife },
    { name: names[7], content: blueprint.content.watchNext },
  ];
  const confidence = { state: confidenceState, wording: confidenceWording };
  const truthPacket = {
    quizId: quiz.id,
    primary,
    secondary,
    primaryLabel,
    secondaryLabel,
    confidence,
    mixedProfile,
    actualEvidence: evidence.moments,
    counterEvidence: evidence.moments.filter((moment) => moment.kind === "counter-evidence"),
    realLifePattern: blueprint.content.realLife,
    nextObservation: blueprint.content.watchNext,
    resultHeadline: blueprint.content.headline
  };
  const resultValue = resultValueFor({ blueprint, evidence, confidenceState, primaryLabel, secondaryLabel, locale });
  const personalityResult = buildResultPersonalities({ packet: truthPacket, blueprint, locale });
  return {
    quizId: quiz.id,
    sourceVersion: quiz.version,
    locale,
    completion: { reason: completion.reason || "completed" },
    primary,
    secondary,
    scores: { ...scores },
    leadMargin,
    mixedProfile,
    answeredQuestions: details.map(({ question, option }) => ({ questionId: question.id, optionId: option.id })),
    evidenceMoments: evidence.moments,
    evidenceSelection: { target: evidence.target, insufficientQualifyingEvidence: evidence.insufficientQualifyingEvidence },
    confidence,
    blueprint,
    phases,
    truthPacket,
    resultValue,
    ...personalityResult
  };
}
