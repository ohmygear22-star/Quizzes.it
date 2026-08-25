const mk=(id,text,investigates,situation,options)=>({id,text,reason:"This situation helps distinguish the pattern behind the answer.",investigates,situation,options:options.map(([id,text,signal,evidence])=>({id,text,signals:{[signal]:3},evidence}))});
const lenses=[s=>"When "+s+", what do you do first?",s=>"After "+s+", what is most likely to stay with you?",s=>"In that moment, what would help you feel more settled?"];
const phases=["Before you know more", "If this feeling stays with you", "If the same uncertainty keeps returning", "If it has started to feel like a pattern"];
const contextualResponse=(answer,situation,lensIndex,round,choiceIndex)=>{
 const phase=phases[Math.min(round,phases.length-1)],quoted='"'+situation+'"';
 const endings=[
  [phase+", With "+quoted+", I would say I feel unsettled and ask what changed.",phase+", With "+quoted+", I would give myself space before deciding whether to say more.",phase+", With "+quoted+", I would look for a clear next step that makes things less uncertain."],
  [phase+", With "+quoted+", I would keep returning to whether it needs an honest conversation.",phase+", With "+quoted+", I would keep replaying it privately until I feel ready to say more.",phase+", With "+quoted+", I would keep noticing whether it is a one-off or part of a larger pattern."],
  [phase+", With "+quoted+", I would feel steadier if I could speak openly about it.",phase+", With "+quoted+", I would feel steadier if I could take time before I respond.",phase+", With "+quoted+", I would feel steadier if there were a practical agreement about what happens next."]
 ];
 return answer+" "+endings[lensIndex][choiceIndex];
};
export function buildAdaptiveQuiz(c){
 const sig=c.signals.map(x=>x.id),n=c.deep?55:20,sceneCount=c.scenes.length;
 const questions=Array.from({length:n},(_,i)=>{
  const situation=c.scenes[i%sceneCount],round=Math.floor(i/sceneCount),lensIndex=round%lenses.length,a=sig[i%sig.length],b=sig[(i+1)%sig.length];
  return mk(c.id+"-"+String(i+1).padStart(2,"0"),lenses[lensIndex](situation),[a,b],situation,c.signals.map((x,choiceIndex)=>["a"+x.id,contextualResponse(x.answer,situation,lensIndex,round,choiceIndex),x.id,x.evidence]));
 });
 const dimensions=Object.fromEntries(c.signals.map(x=>[x.id,{label:x.label,title:x.title,story:x.story,strength:x.strength,blindSpot:x.blindSpot,reflection:x.reflection,pattern:x.pattern,caveat:"This is a reflection on your answers, not a diagnosis or a fixed label.",uncomfortable:x.uncomfortable,alternative:x.alternative}]));
 return {id:c.id,slug:c.slug,version:c.version??4,status:"live",metadata:{title:c.title,description:c.description,category:c.category,targetCustomer:"Adults looking for a private self-reflection experience",durationMinutes:c.deep?12:5,questionRange:c.deep?"50–55 adaptive questions":"15–20 adaptive questions",accessDays:7},seo:{title:c.title+" | Quizzes it",description:c.description,canonicalPath:"/quiz/"+c.slug},offers:[{id:"full-result",label:"Full private analysis",currency:"hkd",amount:2900}],flow:{mode:"adaptive-investigation-v1",previewQuestionIds:questions.slice(0,5).map(q=>q.id),minQuestions:n,maxQuestions:n,confidenceMargin:999},questions,teaser:{heading:"Your answers point to something worth looking at.",observations:Object.fromEntries(c.signals.map(x=>[x.id,x.teaser])),uncertainty:"There is more than one possible reason for this pattern.",next:c.next},resultBlueprint:{dimensions,watchNext:Object.fromEntries(c.signals.map(x=>[x.id,x.watchNext]))}};
}