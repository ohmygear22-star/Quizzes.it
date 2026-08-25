import { getQuizBySlug, listPublicQuizzes } from "../quizzes/index.js";
const failures=[];
for (const publicQuiz of listPublicQuizzes()) {
  const quiz=getQuizBySlug(publicQuiz.slug);
  for (const question of quiz.questions) {
    const tails=question.options.map(option=>option.text.split(". ").slice(1).join(". "));
    if (new Set(tails).size!==question.options.length) failures.push({quiz:quiz.slug,question:question.id,reason:"Options share the same contextual ending"});
  }
}
if(failures.length){console.error(JSON.stringify({status:"fail",failures},null,2));process.exit(1);}
console.log(JSON.stringify({status:"pass",message:"Every option has its own behavioural interpretation of the situation."}));