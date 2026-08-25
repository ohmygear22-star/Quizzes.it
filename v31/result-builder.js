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

function answeredDetails(quiz, answers) {
  return answers.map((answer) => {
    const question = quiz.questions.find((item) => item.id === answer.questionId);
    if (!question) throw new Error("Unknown question: " + answer.questionId);
    const option = question.options.find((item) => item.id === answer.optionId);
    if (!option) throw new Error("Unknown option: " + answer.optionId);
    return { question, option };
  });
}

function evidenceMoments(quiz, details, primary, secondary) {
  const bounds = quiz.stopping.maxTotal === 18 ? { min: 4, max: 6 } : { min: 5, max: 7 };
  const candidates = details.filter(({ option }) => option.evidence[primary] !== 0 || option.evidence[secondary] !== 0)
    .map(({ question, option }) => {
      const primaryValue = option.evidence[primary];
      const secondaryValue = option.evidence[secondary];
      return {
        questionId: question.id, questionNumber: question.number, questionText: question.text,
        optionId: option.id, optionText: option.text, scenarioDomain: question.scenarioDomain,
        evidence: { ...option.evidence },
        kind: primaryValue < 0 ? "counter-evidence" : secondaryValue > primaryValue ? "secondary-evidence" : "primary-evidence",
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
  return { moments: selected, target: bounds, insufficientQualifyingEvidence: selected.length < bounds.min };
}

export function buildResult({ quiz, answers = [], scores, primary, secondary, leadMargin, mixedProfile = false, locale = "en", completion }) {
  if (!completion?.shouldStop) throw new Error("Result requires a completed session");
  if (!["H1", "H2", "H3", "H4"].includes(secondary)) throw new Error("Unknown secondary: " + secondary);
  const blueprint = blueprintFor(quiz, primary, locale);
  const details = answeredDetails(quiz, answers);
  const evidence = evidenceMoments(quiz, details, primary, secondary);
  const confidenceState = mixedProfile ? "mixed" : leadMargin >= quiz.stopping.leadMarginToStop ? "clear" : "developing";
  const confidenceWording = blueprint.content[confidenceState];
  const phase5 = { name: "Evidence From Your Answers", content: blueprint.content.evidenceGuidance, evidenceGuidance: blueprint.content.evidenceGuidance, evidenceSelection: blueprint.content.evidenceSelection, moments: evidence.moments };
  const phase6 = { name: "Alternative Explanation & Confidence", content: confidenceWording, confidenceWording, secondaryIntegration: blueprint.secondary[secondary], safetyBoundary: blueprint.content.safety };
  return {
    quizId: quiz.id, sourceVersion: quiz.version, completion: { reason: completion.reason || "completed" },
    primary, secondary, scores: { ...scores }, leadMargin, mixedProfile,
    answeredQuestions: details.map(({ question, option }) => ({ questionId: question.id, optionId: option.id })),
    evidenceMoments: evidence.moments, evidenceSelection: { target: evidence.target, insufficientQualifyingEvidence: evidence.insufficientQualifyingEvidence },
    confidence: { state: confidenceState, wording: confidenceWording },
    blueprint,
    phases: [
      { name: "Headline Result", content: blueprint.content.headline },
      { name: "We're With You", content: blueprint.content.withYou },
      { name: "The Deeper Pattern", content: blueprint.content.deeper },
      { name: "Professional / Real-World View", content: blueprint.content.professional },
      phase5, phase6,
      { name: "What This Looks Like in Real Life", content: blueprint.content.realLife },
      { name: "What to Watch / Try Next", content: blueprint.content.watchNext },
    ],
  };
}
