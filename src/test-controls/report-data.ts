import type { Attempt } from './model';
export type Outcome = 'Correct' | 'Partial' | 'Incorrect' | 'In progress' | 'Not started';
export const difficulties = ['Refresher', 'Easy', 'Medium', 'Hard'];
const equations = [
 ['x + 5 = 12',7,'Subtract 5 from both sides.','Refresher'],
 ['3x = 18',6,'Divide both sides by 3.','Refresher'],
 ['x − 4 = 9',13,'Add 4 to both sides.','Easy'],
 ['2x + 3 = 11',4,'Subtract 3, then divide by 2.','Easy'],
 ['5x − 7 = 18',5,'Add 7, then divide by 5.','Easy'],
 ['x ÷ 4 + 2 = 5',12,'Subtract 2, then multiply by 4.','Easy'],
 ['3(x + 2) = 21',5,'Divide by 3, then subtract 2.','Medium'],
 ['4x + 5 = 2x + 17',6,'Subtract 2x and 5, then divide by 2.','Medium'],
 ['5(x − 2) = 3x + 4',7,'Expand, subtract 3x, then add 10 and divide by 2.','Medium'],
 ['7 − 2x = 15',-4,'Subtract 7, then divide by −2.','Medium'],
 ['(x + 3) ÷ 2 = 8',13,'Multiply by 2, then subtract 3.','Medium'],
 ['2(3x − 4) = 4x + 10',9,'Expand, subtract 4x, then add 8 and divide by 2.','Hard'],
 ['(2x − 1) ÷ 3 = 5',8,'Multiply by 3, add 1, then divide by 2.','Hard'],
 ['0.5x + 1.5 = 4',5,'Subtract 1.5, then divide by 0.5.','Hard'],
 ['3(x + 4) − 2(x − 1) = 20',6,'Expand and collect terms to get x + 14 = 20.','Hard'],
] as const;
export const questions = equations.map(([equation,answer,solution,difficulty],i)=>({id:i+1,equation,answer,solution,difficulty,marks:i<6?1:2,skill:['One-step equations','Inverse operations','Two-step equations','Brackets','Variables on both sides','Fractional equations'][Math.floor(i*6/15)]}));
export type Question = typeof questions[number];
// Deterministic demo responses are derived from existing attempt progress, never stored over it.
export function response(student:Attempt,q:Question) {
 const answered=Math.floor(student.progress/100*questions.length);
 const inProgress=q.id===answered+1 && student.progress>0 && student.status!=='Completed';
 const n=(student.id*3+q.id*7+student.version)%10;
 const accuracy=student.accuracy??[10,8,6,4,2,0][(student.id-1)%6];
 const outcome:Outcome=q.id>answered?(inProgress?'In progress':'Not started'):n<accuracy?'Correct':n<accuracy+2&&q.marks>1?'Partial':'Incorrect';
 const earned=outcome==='Correct'?q.marks:outcome==='Partial'?1:0;
 return {outcome,earned,answer:outcome==='Not started'||outcome==='In progress'?null:outcome==='Correct'?q.answer:q.answer+(student.id%3+1)};
}
export function studentResult(s:Attempt) {
 const attempted=questions.filter(q=>['Correct','Partial','Incorrect'].includes(response(s,q).outcome));
 const earned=attempted.reduce((n,q)=>n+response(s,q).earned,0);
 const available=attempted.reduce((n,q)=>n+q.marks,0);
 return {earned,available,answered:attempted.length,percent:available?Math.round(100*earned/available):null};
}
export function questionResult(rows:Attempt[],q:Question) {
 const responses=rows.map(s=>response(s,q));
 const marked=responses.filter(r=>['Correct','Partial','Incorrect'].includes(r.outcome));
 return {percent:marked.length?Math.round(100*marked.reduce((n,r)=>n+r.earned,0)/(marked.length*q.marks)):null,participation:responses.filter(r=>r.outcome!=='Not started').length,counts:Object.fromEntries(['Correct','Partial','Incorrect','In progress','Not started'].map(o=>[o,responses.filter(r=>r.outcome===o).length])) as Record<Outcome,number>};
}
export const resultTiers=['100%','80–99%','50–79%','25–49%','0–24%','Not started'];
export const questionTiers=['80–100%','50–79%','25–49%','0–24%','Not started'];
export function tierMatches(percent:number|null,tier:string) {
 if(percent===null)return tier==='Not started';
 if(tier==='100%')return percent===100;
 const bounds=tier.match(/(\d+)–(\d+)/);return !!bounds&&percent>=Number(bounds[1])&&percent<=Number(bounds[2]);
}
export type ProgressFilter={condition:string;amount:number}|null;
export function matchesProgress(value:number,filter:ProgressFilter) {
 if(!filter)return true;
 switch(filter.condition){case 'Less than':return value<filter.amount;case 'At most':return value<=filter.amount;case 'Exactly':return value===filter.amount;case 'At least':return value>=filter.amount;case 'More than':return value>filter.amount;default:return true;}
}

export type ScoreStage = 'Before due date' | 'After due date' | 'Closed';
export type ScorePreview = 'Current attempt' | ScoreStage;
export function scorecardResult(s:Attempt, now:number, preview:ScorePreview='Current attempt') {
 const result=studentResult(s);
 const stage:ScoreStage=preview!=='Current attempt'?preview:(s.status==='Completed'||!!s.closedAt||!!s.expires&&now>=new Date(s.expires).getTime())?'Closed':now>=new Date(s.due).getTime()?'After due date':'Before due date';
 const available=stage==='Before due date'?result.available:questions.reduce((n,q)=>n+q.marks,0);
 const percent=available?Math.round(100*result.earned/available):null;
 return {...result, available, percent, stage, unattempted:questions.length-result.answered,
  tier:percent===null?'none':percent===100?'perfect':percent>=80?'good':percent>=50?'mid':percent>=25?'low':'poor'};
}
