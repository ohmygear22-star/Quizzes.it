import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(fs.readFileSync(path.join(here, "source/authoritative-source.json"), "utf8"));
const v2 = JSON.parse(fs.readFileSync(path.join(here, "source/rel06-rel13-v2.json"), "utf8"));
const values = (name) => raw[name]?.values || raw[name]?.structuredContent?.values || [];
const objects = (name) => { const [header, ...rows] = values(name); return rows.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] ?? ""]))); };
const number = (value) => Number(value || 0);
const catalog = objects("Quiz Catalog");
const bank = objects("Question Bank");
const correlations = objects("Answer Correlation Matrix");
const assessments = objects("Assessment Model");
const blueprints = objects("Result Blueprints");
const stopping = objects("Stopping & Calibration");
const qaSimulation = objects("QA Simulation");
function tableQuiz(id) {
  const catalogRow = catalog.find((row) => row["Quiz ID"] === id);
  if (!catalogRow) throw new Error("Unknown V3.1 quiz: " + id);
  const stoppingRow = stopping.find((row) => row["Quiz ID"] === id);
  if (!stoppingRow) throw new Error("Missing V3.1 stopping configuration: " + id);
  const optionsByQuestion = new Map();
  for (const row of correlations.filter((item) => item["Quiz ID"] === id)) {
    const key = String(row["Question #"]); const options = optionsByQuestion.get(key) || [];
    options.push({ id: row.Answer, text: row["Answer Text EN"], textZh: row["答案中文"], evidence: { H1: number(row["H1 Weight"]), H2: number(row["H2 Weight"]), H3: number(row["H3 Weight"]), H4: number(row["H4 Weight"]) } });
    optionsByQuestion.set(key, options);
  }
  return { id, version: "3.1", qaPersonas: qaSimulation.filter((row) => row["Quiz ID"] === id), stopping: { minTotal: number(stoppingRow["Min Total"]), maxTotal: number(stoppingRow["Max Total"]), leadMarginToStop: number(stoppingRow["Lead Margin To Stop"]), minStrongPrimaryAnswers: number(stoppingRow["Min Strong Primary Answers"]), minDistinctEvidenceDomains: number(stoppingRow["Min Distinct Evidence Domains"]), primaryStabilityWindow: number(stoppingRow["Primary Stability Window"]) }, metadata: { title: catalogRow["English Title"], titleZh: catalogRow["中文標題"], category: catalogRow.Category }, hypotheses: assessments.filter((row) => row["Quiz ID"] === id).map((row) => ({ id: row.Hypothesis, label: row["Assessment Dimension EN"] })), resultBlueprints: blueprints.filter((row) => row["Quiz ID"] === id), questions: bank.filter((row) => row["Quiz ID"] === id).map((row) => ({ id: id + "-Q" + String(row["Question #"]).padStart(2, "0"), number: number(row["Question #"]), stage: row.Stage === "FREE PREVIEW" ? "preview" : "paid", text: row["Question EN"], textZh: row["問題中文"], scenarioDomain: row["Scenario Domain"], designedPair: String(row["Designed Pair"]).split(" vs "), pairSeparationScore: number(row["Pair Separation Score"]), informationValue: String(row["Information Value"]).toLowerCase(), options: optionsByQuestion.get(String(row["Question #"])) || [] })).sort((a, b) => a.number - b.number) };
}
function v2Quiz(id) {
  const source = v2.quizzes?.[id]; if (!source) throw new Error("Unknown V3.1 quiz: " + id);
  return { id, version: "3.1", qaPersonas: source.qaPersonas, stopping: { minTotal: number(source.stopping["Min Total"]), maxTotal: number(source.stopping["Max Total"]), leadMarginToStop: number(source.stopping["Lead Margin To Stop"]), minStrongPrimaryAnswers: number(source.stopping["Min Strong Primary Answers"]), minDistinctEvidenceDomains: number(source.stopping["Min Distinct Evidence Domains"]), primaryStabilityWindow: number(source.stopping["Primary Stability Window"]) }, metadata: { title: source.metadata.title, titleZh: source.metadata.title_zh, description: source.metadata.description, descriptionZh: source.metadata.description_zh, category: source.metadata.category }, hypotheses: Object.entries(source.hypotheses).map(([hypothesisId, hypothesis]) => ({ id: hypothesisId, label: hypothesis.label })), resultBlueprints: source.resultBlueprints, questions: source.questions.map((question) => ({ id: question.id, number: question.number, stage: question.stage, text: question.text, textZh: question.textZh, scenarioDomain: question.scenarioDomain, designedPair: question.designedPair, pairSeparationScore: number(question.pairSeparationScore), informationValue: question.informationValue, options: question.options.map((option) => ({ id: option.id, text: option.text, textZh: option.textZh, evidence: option.evidence, evidenceRationale: option.evidenceRationale })) })).sort((a, b) => a.number - b.number) };
}
export function quizFromSource(id) { return v2.quizzes?.[id] ? v2Quiz(id) : tableQuiz(id); }
