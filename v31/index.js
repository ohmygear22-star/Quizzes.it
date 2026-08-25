import rel01 from "./quizzes/rel01.js";
import rel05 from "./quizzes/rel05.js";
import rel02 from "./quizzes/rel02.js";
export const quizzes = [rel01, rel05, rel02];
export const byId = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
export { selectNextQuestion } from "./selector.js";
