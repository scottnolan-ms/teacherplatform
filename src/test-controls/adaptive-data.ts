import type { Attempt } from './model';
export const adaptiveStages = ['Before due date', 'After due date', 'After expiry'] as const;
export type AdaptiveStage = typeof adaptiveStages[number];
export const masteryLevels = ['No activity', 'Exploring', 'Emerging', 'Familiar', 'Proficient', 'Mastered'] as const;
export const masteryDescriptions = [
 'hasn’t attempted any questions in this subtopic yet.',
 'has started practising this subtopic and is beginning to build their understanding.',
 'is making early progress, succeeding mainly on the easier questions in this subtopic.',
 'has made solid progress and can work through the core questions in this subtopic.',
 'has shown strong understanding of this subtopic, but hasn’t yet demonstrated mastery of its hardest questions.',
 'has demonstrated understanding across the full range of questions in this subtopic, including the hardest.',
];
export function masteryLevel(score: number | null) { return score === null ? 0 : score === 100 ? 5 : score >= 75 ? 4 : score >= 50 ? 3 : score >= 25 ? 2 : 1; }
export const adaptiveSkills = [
 {code:'AC9M8A01',name:'One-step equations',grade:8}, {code:'AC9M8A02',name:'Inverse operations',grade:8},
 {code:'AC9M7A03',name:'Two-step equations',grade:7}, {code:'AC9M7A04',name:'Brackets',grade:7},
 {code:'AC9M6A01',name:'Variables on both sides',grade:6}, {code:'AC9M6A02',name:'Fractional equations',grade:6},
];
export interface AdaptiveStudent extends Attempt { required: number; beforeDue: number; answered: number; mastery: number | null; baseline: number | null; taskMastery: number | null; priorQuestions: number; externalGain: number; skillStart: number[]; skillTask: number[]; skillCurrent: number[]; }
export const adaptiveDates = {start:'2026-09-21T08:00:00',due:'2026-09-25T21:00:00',expiry:'2026-09-29T21:00:00'};
export function adaptiveRows(stage:AdaptiveStage):AdaptiveStudent[] {
 const names=['Emma Johnson','Liam Martinez','Lily Chen','Sophia Okonkwo','Noah Okafor','Olivia Petrov','Davis Mason','Lucas Wilson'];
 const late=stage!=='Before due date';
 const early=[12,12,9,3,6,2,0,0],later=[12,12,11,6,8,4,0,0];
 const baseline=[75,52,62,30,25,8,82,null];
 const task=[100,64,62,late?78:56,late?43:35,late?22:14,82,null];
 return names.map((name,i)=>{
  const required=(late?later:early)[i]; const extra=i===1?3:i===2?3:i===4?1:0;const answered=required+extra;
  const externalGain=i===3?4:0;const mastery=task[i]===null?null:Math.min(100,task[i]!+externalGain);
  const skillStart=Array.from({length:6},(_,k)=>baseline[i]===null?0:Math.max(1,Math.min(5,masteryLevel(baseline[i])+(k%3===2?1:0))));
  const skillTask=skillStart.map((v,k)=>required===0?v:Math.min(5,v+(i===0||i===2&&k===2||i===3&&k<3?1:0)));
  const skillCurrent=skillTask.map((v,k)=>Math.min(5,v+(i===0&&k<2||i===1&&k===1||i===2&&k===3?1:0)));
  return {id:i+1,name,group:i<4?'Group 1':'Group 2',mode:'Untimed',status:stage==='After expiry'?'Closed':required===12?'Completed':'In progress',remaining:0,version:1,start:adaptiveDates.start,due:adaptiveDates.due,expires:adaptiveDates.expiry,
   // Response counts use the shared 15-question demo bank; required progress is independent.
   progress:answered?Math.min(100,answered/15*100+0.000001):0,markingProgress:answered?Math.min(100,answered/15*100+0.000001):0,reportMode:'custom',markingPending:false,
   accuracy:[10,8,6,7,3,1,0,0][i],timeSpent:answered?answered*2+i:0,required,beforeDue:early[i],answered,mastery,baseline:baseline[i],taskMastery:task[i],priorQuestions:baseline[i]===null?0:[32,18,24,12,9,4,36,0][i],externalGain,skillStart,skillTask,skillCurrent};
 });
}
export function masteryEvidence(s:AdaptiveStudent) {
 const first=s.name.split(' ')[0],level=masteryLevels[masteryLevel(s.mastery)],previous=masteryLevels[masteryLevel(s.baseline)];
 if(s.mastery===null)return `${first} hasn’t started this task and has no recorded activity in this subtopic.`;
 if(s.baseline===null)return `Current mastery reflects all of ${first}’s Mathspace activity in this subtopic; no reliable task-start snapshot is available.`;
 if(s.mastery>s.baseline)return `${first}’s mastery has increased from ${previous} (${s.baseline}) to ${level} (${s.mastery}) since the task began.${s.externalGain?' Activity outside this task also contributed.':' This growth comes from work in this task.'}`;
 return `${first} had already reached ${previous} (${s.baseline}) before this task, supported by ${s.priorQuestions} questions over the previous six months. ${s.required?'Their current level also reflects work in this task.':'They haven’t started this task yet.'}`;
}
export function masteryTone(score:number|null,stage:AdaptiveStage) {const level=masteryLevel(score);return `${level===0?'none':level>=4?'good':level===3?'mid':'low'} ${stage==='Before due date'&&level>0&&level<5?'ongoing':''} ${stage==='After expiry'||level===5?'final':'provisional'}`;}
