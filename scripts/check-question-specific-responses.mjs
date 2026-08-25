import { getQuizBySlug, listPublicQuizzes } from "../quizzes/index.js";
const failures=[];
for (const publicQuiz of listPublicQuizzes()) {
  const quiz=getQuizBySlug(publicQuiz.slug);
  const seen=new Map();
  for (const question of quiz.questions) {
    const signature=question.options.map(option=>option.text.trim().replace(/\s+/g," ")).join(" | ");
    const prior=seen.get(signature);
    if (prior) failures.push({quiz:quiz.slug,firstQuestion:prior,repeatedQuestion:question.id,reason:"Repeated complete answer set"});
    else seen.set(signature,question.id);
    if (!question.situation || question.options.some(option=>!option.text.includes(question.situation))) failures.push({quiz:quiz.slug,question:question.id,reason:"Answer choices do not each name the question situation"});
  }
}
if (failures.length) { console.error(JSON.stringify({status:"fail",failures},null,2)); process.exit(1); }
console.log(JSON.stringify({status:"pass",message:"Every public question has a distinct, situation-specific answer set."}));