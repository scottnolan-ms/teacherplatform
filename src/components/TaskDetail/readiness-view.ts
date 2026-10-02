import type {TaskDetailData} from '../../types';
import {calculateInsights} from '../../data/readiness-report';
export const readinessLabels={ready:'Ready','partially-ready':'Partially','not-ready':'Not ready'};
export function readinessLevel(student:TaskDetailData['students'][number]) {return student.questionsAnswered>=student.totalQuestions?student.readiness:student.priorReadiness;}
export function readinessView(data:TaskDetailData,current:boolean,types:string[]) {
 const skills=data.skillsData.skills.filter(s=>!types.length||types.includes(s.skillType==='topic-standard'?'Topic standards':'Prerequisite'));
 const students=data.students.map(s=>!current?s:{...s,readiness:s.latestReadiness??s.readiness,priorReadiness:s.priorReadiness?s.latestReadiness??s.priorReadiness:undefined});
 const rows=data.skillsData.students.map(r=>{const values=current?r.skillMasteries:r.skillMasteriesAtDueDate??r.skillMasteries;const nums=skills.map(s=>values[s.skillId]??0);return {...r,readiness:students.find(s=>s.studentId===r.studentId)!.readiness,skillMasteries:values,averageMastery:nums.reduce<number>((a,b)=>a+b,0)/(nums.length||1),proficientSkillsCount:nums.filter(n=>n>=4).length,totalSkillsCount:skills.length};});
 const averages=Object.fromEntries(skills.map(s=>[s.skillId,rows.reduce((n,r)=>n+(r.skillMasteries[s.skillId]??0),0)/(rows.length||1)]));
 const skillsData={...data.skillsData,students:rows,skills:skills.map(s=>({...s,classAverageMastery:averages[s.skillId],proficientCount:rows.filter(r=>(r.skillMasteries[s.skillId]??0)>=4).length})),classAverage:{...data.skillsData.classAverage,skillMasteries:averages}};
 const refs=skills.map(s=>({id:s.skillId,name:s.skillName,code:s.skillCode}));
 const insights=calculateInsights(students,refs,skillsData);
 insights.readinessBreakdown={total:students.length,ready:students.filter(s=>readinessLevel(s)==='ready').length,partiallyReady:students.filter(s=>readinessLevel(s)==='partially-ready').length,notReady:students.filter(s=>readinessLevel(s)==='not-ready').length};
 return {...data,students,skillsData,insights};
}
