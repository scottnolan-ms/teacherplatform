import type {StudentTaskDetail,SkillsTabData,MasteryLevel,ReadinessLevel} from '../types';
// Curriculum-aligned practice skills, grouped under Australian Curriculum v9 outcomes.
export const prerequisiteSkills=[
 ['Solve one-step equations','AC9M7A02',7],['Apply the order of operations','AC9M6A03',6],['Form algebraic expressions','AC9M7A01',7],
 ['Solve two-step equations','AC9M7A02',7],['Check solutions by substitution','AC9M7A02',7],['Represent unknown values','AC9M7A01',7],
 ['Use brackets in number sentences','AC9M6A03',6],['Write equivalent number sentences','AC9M6A03',6],['Use inverse operations','AC9M7A02',7],
 ['Translate words into expressions','AC9M7A01',7],['Evaluate numerical expressions','AC9M6A03',6],['Model a situation with an equation','AC9M7A01',7],['Solve equations with natural-number solutions','AC9M7A02',7],
] as const;
export function applyReadinessEvidence(students:StudentTaskDetail[],data:SkillsTabData){
 data.skills=prerequisiteSkills.map(([skillName,skillCode,yearLevel],i)=>({skillId:`skill-${i+1}`,skillName,skillCode,yearLevel,skillType:'prerequisite',classAverageMastery:0,proficientCount:0,totalStudents:students.length}));
 students.forEach((s,i)=>{
  const row=data.students.find(r=>r.studentId===s.studentId)!;
  const priorCount=i===2?2:i===4||i===7||(!s.questionsAnswered&&!s.priorReadiness)?0:13;
  const values=data.skills.map((_,k):MasteryLevel=>i===0||i===3||i===6?4:i===1?(k%3===0?2:1):i===2?(k<4?0:4):i===4?0:i===5?(k<5?2:4):i===7?(k<11?1:4):((row.skillMasteriesAtDueDate?.[`skill-${k%10+1}`]??2) as MasteryLevel));
  const snapshot=Object.fromEntries(data.skills.map((k,n)=>[k.skillId,values[n]]));
  const latest=Object.fromEntries(data.skills.map((k,n)=>[k.skillId,(i===4?0:i===1?Math.min(5,values[n]+2):i===2?4:Math.min(5,values[n]+(n%3===0?1:0))) as MasteryLevel]));
  const proficient=values.filter(v=>v>=4).length;
  s.evidence={priorCount,priorProficient:i===0||i===6?13:i===5?7:Math.min(priorCount,proficient),total:13,snapshot,latest};
  if(s.questionsAnswered===s.totalQuestions) s.readiness=values.every(v=>v>=4)?'ready':proficient>=6?'partially-ready':'not-ready';
  s.latestReadiness=(i===4?undefined:Object.values(latest).every(v=>v>=4)?'ready':Object.values(latest).filter(v=>v>=4).length>=6?'partially-ready':'not-ready') as ReadinessLevel|undefined;
  row.skillMasteriesAtDueDate={...snapshot};row.skillMasteries={...latest};
  row.totalSkillsCount=13;row.proficientSkillsCount=Object.values(latest).filter(v=>v>=4).length;row.averageMastery=Object.values(latest).reduce<number>((a,b)=>a+b,0)/13;
  s.markTotal=s.questionsAnswered?s.questionsAnswered*2:30;s.markCorrect=Math.round(s.markTotal*s.resultPercentage/100);s.resultPercentage=s.questionsAnswered?Math.round(100*s.markCorrect/s.markTotal):0;
 });
}
export function evidenceExplanation(s:StudentTaskDetail,current=false){
 const e=s.evidence,first=s.firstName,total=e?.total??13,values=Object.values((current?e?.latest:e?.snapshot)??{}),limited=values.filter(v=>v===0).length,practice=values.filter(v=>v>0&&v<4).length,proficient=values.filter(v=>v>=4).length;
 const level=s.questionsAnswered>=s.totalQuestions?s.readiness:s.priorReadiness;
 const label=level==='ready'?'Ready':level==='partially-ready'?'Partially ready':level==='not-ready'?'Not ready':'Unchecked';
 const priorTitle=!e?.priorCount?'No prior evidence':e.priorCount<total?'Limited evidence':'Broad evidence';
 const prior=!e?.priorCount?`Before this check-in, Mathspace had no prior evidence for ${first}’s prerequisite skills.`:`Before this check-in, Mathspace had evidence for ${e.priorCount} of ${total} prerequisite skills. ${e.priorProficient} were Proficient or Mastered.`;
 const result=!s.questionsAnswered?`${first} hasn’t started this check-in, so it has contributed no new evidence yet.`:`${first} answered ${s.questionsAnswered} of ${s.totalQuestions} questions and earned ${s.resultPercentage}% (${s.markCorrect}/${s.markTotal} marks). The result measures marks in this task, not readiness on its own.`;
 const topic=!level?'More evidence is needed to assess readiness for this topic.':level==='ready'?`${s.questionsAnswered?'Combined':'Prior'} evidence supports ${first}’s readiness across the prerequisites.`:`${proficient} of ${total} prerequisites are established. ${limited?`${limited} need more evidence. `:''}${practice?`${practice} need further practice before progressing.`:''}`;
 const tooltip=`${first} is ${label}. ${!s.questionsAnswered?(level?'Previous Mathspace work establishes the prerequisites. ':'There is no prior Mathspace evidence. '):e?.priorCount?`${priorTitle} is available from previous Mathspace work. `:'There is no prior Mathspace evidence. '}${!s.questionsAnswered?result:`The check-in result is ${s.resultPercentage}%. ${topic}`}${current?' Latest evidence includes subsequent work; the task result is unchanged.':''}`;
 return {label,level,priorTitle,prior,result,topic,tooltip,limited,practice,proficient,total};
}
export function attentionRows(data:SkillsTabData){return data.skills.filter(s=>s.skillType!=='topic-standard').map(skill=>({...skill,practice:data.students.filter(r=>{const n=r.skillMasteries[skill.skillId]??0;return n>0&&n<4}).map(s=>s.studentId),limited:data.students.filter(r=>(r.skillMasteries[skill.skillId]??0)===0).map(s=>s.studentId)})).filter(s=>s.practice.length||s.limited.length);}
export function followupStudents(rows:ReturnType<typeof attentionRows>,ids:string[]){return [...new Set(rows.filter(r=>ids.includes(r.skillId)).flatMap(r=>[...r.practice,...r.limited]))];}
