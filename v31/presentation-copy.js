const cleanZh = (value) => String(value || "")
  .replaceAll("一併一併", "一併")
  .replaceAll("什麼", "甚麼")
  .replaceAll("裡面", "當中")
  .replaceAll("掛住", "想念")
  .replaceAll("再深一點，可能是因為", "可能是因為")
  .replaceAll("再深一點，", "")
  .replaceAll("未來方向大致仍然方向仍然一致", "未來方向大致仍然一致")
  .replaceAll("對方真的喜歡我嗎?", "對方真的喜歡我嗎？");

export function applyPresentationCopy(quiz) {
  return {
    ...quiz,
    presentationRevision: "human-v2-direct",
    metadata: {
      ...quiz.metadata,
      titleZh: cleanZh(quiz.metadata?.titleZh),
      descriptionZh: cleanZh(quiz.metadata?.descriptionZh)
    },
    resultBlueprints: quiz.resultBlueprints.map((row) => Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, typeof value === "string" ? cleanZh(value) : value])
    )),
    questions: quiz.questions.map((question) => {
      const sourceText = String(question.text || "").trim();
      const sourceTextZh = cleanZh(question.textZh).trim();
      return {
        ...question,
        sourceText,
        sourceTextZh,
        presentationRevision: "human-v2-direct",
        text: sourceText,
        textZh: sourceTextZh,
        options: question.options.map((option) => {
          const optionSourceText = String(option.text || "").trim();
          const optionSourceTextZh = cleanZh(option.textZh).trim();
          return {
            ...option,
            sourceText: optionSourceText,
            sourceTextZh: optionSourceTextZh,
            presentationRevision: "human-v2-direct",
            text: optionSourceText,
            textZh: optionSourceTextZh
          };
        })
      };
    })
  };
}
