import type { Attempt } from './model';
export const adaptiveStages = ['Before due date', 'After due date', 'After expiry'] as const;
export type AdaptiveStage = typeof adaptiveStages[number];
export const masteryLevels = ['No level', 'Exploring', 'Emerging', 'Familiar', 'Proficient', 'Mastered'] as const;
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
export interface AdaptiveStudent extends Attempt { started: boolean; adaptiveStarted: boolean; adaptiveAnswered: number; revisionAnswered: number; revisionAssigned: number; diamondTarget: number; targetMastery: number; otherQuestions: number | null; baselineStatus: 'reliable' | 'limited' | 'none' | 'unavailable'; required: number; beforeDue: number; answered: number; mastery: number | null; baseline: number | null; taskMastery: number | null; priorQuestions: number; externalGain: number; skillStart: number[]; skillTask: number[]; skillCurrent: number[]; }
export const adaptiveDates = {start:'2026-09-21T08:00:00',due:'2026-09-25T21:00:00',expiry:'2026-09-29T21:00:00'};
export const adaptiveDetailScenarios = ['Class overview', 'Progress edge cases', 'Evidence edge cases', 'No revision', 'Empty cohort'] as const;
export type AdaptiveDetailScenario = typeof adaptiveDetailScenarios[number];
export function adaptiveRows(stage:AdaptiveStage, scenario:AdaptiveDetailScenario='Class overview'):AdaptiveStudent[] {
 const names=['Emma Johnson','Liam Martinez','Lily Chen','Sophia Okonkwo','Noah Okafor','Olivia Petrov','Davis Mason','Lucas Wilson'];
 const late=stage!=='Before due date';
 const early=[12,12,9,3,6,2,0,0],later=[12,12,11,6,8,4,0,0];
 const baseline=[75,52,85,30,25,8,82,null];
 const task=[100,64,62,late?78:56,late?43:35,late?22:14,82,null];
 if(scenario==='Empty cohort')return [];
 return names.map((name,i)=>{
  let required=(late?later:early)[i]; let revisionAnswered=i===1?3:i===2?3:i===4?1:0;let adaptiveAnswered=required;let started=required>0;let adaptiveStarted=started;let baselineStatus:AdaptiveStudent['baselineStatus']=baseline[i]===null?'none':'reliable';let otherQuestions:number|null=baseline[i]===null?0:[32,18,24,12,9,4,36,0][i];
  if(scenario==='Progress edge cases'){required=[0,0,0,0,3,12,12,6][i];adaptiveAnswered=[0,0,2,0,5,12,12,8][i];revisionAnswered=[0,0,0,3,2,3,3,0][i];started=i!==0;adaptiveStarted=started&&i!==3;task[i]=[null,null,35,25,62,64,100,43][i];baseline[i]=[null,null,25,25,52,52,75,25][i];}
  if(scenario==='Evidence edge cases'){required=[2,3,0,5,4,2,0,4][i];adaptiveAnswered=required;revisionAnswered=0;started=required>0;adaptiveStarted=started;task[i]=[100,38,82,62,25,14,null,62][i];baseline[i]=[100,38,82,52,null,null,null,62][i];otherQuestions=[18,25,10,3,2,0,0,null][i];baselineStatus=(['reliable','reliable','reliable','reliable','limited','none','none','unavailable'] as const)[i];}
  if(scenario==='Class overview'&&(i===0||i===1)){required=i===0?14:15;adaptiveAnswered=required;revisionAnswered=0;}
  if(scenario==='No revision')revisionAnswered=0;
  const answered=adaptiveAnswered+revisionAnswered;
  const externalGain=scenario==='Class overview'&&i===3?4:0;const mastery=task[i]===null?null:Math.min(100,task[i]!+externalGain);
  const skillStart=Array.from({length:6},(_,k)=>baseline[i]===null?0:Math.max(1,Math.min(5,masteryLevel(baseline[i])+(k%3===2?1:0))));
  const skillTask=skillStart.map((v,k)=>required===0?v:Math.min(5,v+(i===0||i===2&&k===2||i===3&&k<3?1:0)));
  const skillCurrent=skillTask.map((v,k)=>Math.min(5,v+(i===0&&k<2||i===1&&k===1||i===2&&k===3?1:0)));
  return {id:i+1,name,group:i<4?'Group 1':'Group 2',mode:'Untimed',status:stage==='After expiry'?'Closed':required>=12&&(mastery??0)>=75?'Completed':started?'In progress':'Scheduled',closedAt:required>=12&&(mastery??0)>=75?'2026-09-24T15:00:00':undefined,remaining:0,version:1,start:adaptiveDates.start,due:adaptiveDates.due,expires:adaptiveDates.expiry,
   // Response counts use the shared 15-question demo bank; required progress is independent.
   progress:answered?Math.min(100,answered/15*100+0.000001):started?0.01:0,markingProgress:answered?Math.min(100,answered/15*100+0.000001):0,reportMode:'custom',markingPending:false,
   accuracy:[10,8,6,7,3,1,0,0][i],timeSpent:answered?answered*2+i:0,started,adaptiveStarted,adaptiveAnswered,revisionAnswered,revisionAssigned:scenario==='No revision'?0:revisionAnswered>0||required===0?3:0,diamondTarget:12,targetMastery:75,otherQuestions,baselineStatus,required,beforeDue:late?Math.min(required,scenario==='Class overview'?early[i]:Math.floor(required/2)):required,answered,mastery,baseline:baseline[i],taskMastery:task[i],priorQuestions:baseline[i]===null?0:otherQuestions??0,externalGain,skillStart,skillTask,skillCurrent};
 });
}
// The PO's proposed attribution threshold is a demo rule, not a production policy.
export function masterySource(s:AdaptiveStudent):'none'|'only'|'mostly'|'task' {
 if(s.mastery===null)return 'none';
 if(!s.adaptiveStarted)return 'only';
 const inTask=Math.max(1,s.adaptiveAnswered);
 return s.otherQuestions!==null&&s.otherQuestions>=5&&s.otherQuestions>=2*inTask?'mostly':'task';
}
export function masteryTitle(s:AdaptiveStudent) {
 const first=s.name.split(' ')[0],level=masteryLevels[masteryLevel(s.mastery)],source=masterySource(s);
 return source==='none'?`${first} has no recorded mastery level.`:source==='only'||source==='mostly'?`${first}’s ${level} level comes ${source==='only'?'only':'mostly'} from other work.`:`${first} is ${level.toLowerCase()} in this subtopic.`;
}
export const shortMasteryDescriptions=['There is not enough recorded evidence to show a level.','Beginning to build understanding.','Succeeding mainly on easier questions.','Working through the core questions.','Strong understanding, not yet succeeding on the hardest questions.','Succeeding consistently, including on the hardest questions.'];
export function priorEvidenceTitle(s:AdaptiveStudent) {
 if(s.baselineStatus==='unavailable')return 'No reliable starting snapshot';
 if(s.baselineStatus==='limited')return 'Limited prior evidence';
 if(s.baselineStatus==='none')return 'No prior evidence';
 return `${masteryLevels[masteryLevel(s.baseline)]} before task`;
}
export function masteryEvidence(s:AdaptiveStudent) {
 const first=s.name.split(' ')[0],level=masteryLevels[masteryLevel(s.mastery)],previous=masteryLevels[masteryLevel(s.baseline)];
 if(s.mastery===null)return `${first} has no recorded mastery level in this subtopic.${s.started?' They have started this task.':' They haven’t started this task.'}`;
 if(s.baselineStatus==='unavailable')return `Current mastery reflects all of ${first}’s work in this subtopic; no reliable task-start snapshot is available.`;
 if(s.baselineStatus==='limited')return `${first} had some prior activity, but not enough to establish a reliable starting level.`;
 if(s.baseline===null)return `${first} had no prior evidence. Their current mastery reflects activity since this task began.`;
 if(s.mastery<s.baseline)return `${first}’s mastery decreased from ${previous} (${s.baseline}) to ${level} (${s.mastery}) since the task began. Review their answers and mastery activity for context.`;
 if(s.mastery>s.baseline)return `${first}’s mastery increased from ${previous} (${s.baseline}) to ${level} (${s.mastery}) since the task began.${s.externalGain?' Work outside this task also contributed.':' Review mastery activity to see the contributing work.'}`;
 return `${first} had reached ${previous} (${s.baseline}) before this task.${s.adaptiveStarted?' Their current level also reflects work in this task.':' They haven’t started the adaptive questions in this task.'}`;
}
export function masteryTone(score:number|null,stage:AdaptiveStage,completed=false) {const level=masteryLevel(score);return `${level===0?'none':level>=4?'good':level===3?'mid':'low'} ${stage==='Before due date'&&!completed&&level>0&&level<5?'ongoing':''} ${stage==='After expiry'||completed?'final':'provisional'}`;}
export function adaptiveProgressState(s:AdaptiveStudent) {
 if(s.closedAt)return 'complete';
 if(s.status==='Closed')return 'expired';
 if(!s.started)return 'not-started';
 if(!s.answered)return 'started';
 if(!s.required)return s.revisionAnswered&&!s.adaptiveAnswered?'revision-only':'no-diamonds';
 return s.required>=s.diamondTarget?'bonus':'progress';
}
export function adaptiveProgressCopy(s:AdaptiveStudent) {
 const name=s.name.split(' ')[0],state=adaptiveProgressState(s);
 const count=`${s.required} of ${s.diamondTarget} diamonds`;
 switch(state){
 case 'not-started':return {label:'Not started',title:`${name} hasn’t started this task.`,detail:'No questions opened yet.'};
 case 'started':return {label:`0 of ${s.diamondTarget}`,title:`${name} has started, but no questions are finished yet.`,detail:'Questions count once they’re finished.'};
 case 'revision-only':return {label:`0 of ${s.diamondTarget}`,title:`${name} has answered ${s.revisionAnswered} revision questions so far.`,detail:'Revision questions don’t earn diamonds.'};
 case 'no-diamonds':return {label:`0 of ${s.diamondTarget}`,title:`${name} has answered ${s.adaptiveAnswered} adaptive questions, with no diamonds yet.`,detail:'Questions with a skipped step or revealed solution earn no diamond.'};
 case 'bonus':return {label:`${s.required}/${s.diamondTarget}`,title:`${name} has earned ${count}.`,detail:`${s.required>s.diamondTarget?`${s.required-s.diamondTarget} extra diamonds earned. `:''}The question target is met; work continues toward mastery ${s.targetMastery} and any remaining revision.`};
 case 'complete':return {label:'Completed',title:`${name} completed this task.`,detail:s.required>s.diamondTarget?`${s.required-s.diamondTarget} extra diamonds earned beyond the target. Students may choose to continue practising after meeting their goals.`:`All ${s.diamondTarget} diamonds earned.`};
 case 'expired':return {label:s.started?`${s.required} of ${s.diamondTarget}`:'Not attempted',title:`${name}’s task has closed with ${count}.`,detail:'No more work can be completed in this attempt.'};
 default:return {label:`${s.required} of ${s.diamondTarget}`,title:`${name} has earned ${count}.`,detail:'Questions with a skipped step or revealed solution earn no diamond.'};
 }
}

export function masteryDrop(s:Pick<AdaptiveStudent,'baseline'|'mastery'|'baselineStatus'>){
 return s.baselineStatus==='reliable'&&s.baseline!==null&&s.mastery!==null?Math.max(0,s.baseline-s.mastery):0;
}
export function needsAttention(s:Pick<AdaptiveStudent,'baseline'|'mastery'|'baselineStatus'>){return masteryDrop(s)>=20}
export function attentionMessage(s:AdaptiveStudent){return `${s.name.split(' ')[0]}’s mastery score has dropped ${masteryDrop(s)} points from ${s.baseline} to ${s.mastery} since the task began. Review their answers and working to identify where support may help.`}

export function progressSegments(s:Pick<AdaptiveStudent,'required'|'diamondTarget'|'beforeDue'>,late:boolean){
 const scale=Math.max(s.diamondTarget,s.required),base=Math.min(s.required,s.diamondTarget),early=late?Math.min(s.beforeDue,base):base;
 return {early:early/scale*100,late:(base-early)/scale*100,extra:Math.max(0,s.required-s.diamondTarget)/scale*100,target:s.diamondTarget/scale*100};
}
