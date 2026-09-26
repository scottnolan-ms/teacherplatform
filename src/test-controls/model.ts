export type Status = 'In progress' | 'Paused' | 'Scheduled' | 'Completed';
export type Action = 'Pause' | 'Resume' | 'Start now' | 'Restart' | 'Reschedule' | 'Reassign';
export type Mode = 'Scheduled' | 'Self-paced' | 'Untimed';
export interface Attempt { id: number; name: string; group: string; mode: Mode; status: Status; previous?: Status; remaining: number; progress: number; start: string; due: string; pausedAt?: number; version: number; expires?: string; closedAt?: string; accuracy?: number; timeSpent?: number; dueProgress?: number; markingProgress?: number; markingPending?: boolean; reportMode?: 'test' | 'custom' }
export const NOW = new Date('2026-09-25T10:20:00').getTime();
export const seed: Attempt[] = ['Emma Johnson','Liam Martinez','Sophia Okonkwo','Noah Okafor','Olivia Petrov','Davis Mason','Amelia Chen','Lucas Wilson','Isla Patel','Ethan Nguyen','Mia Thompson','Oliver Lee'].map((name,i) => ({id:i+1,name,group:i<6?'Group 1':'Group 2',mode:i<6?'Scheduled':i<9?'Self-paced':'Untimed',status:i===4?'Completed':i===2||i===9?'Paused':i>=6&&i<9?'Scheduled':'In progress',previous:'In progress',remaining: i===2?28*60:40*60-i*61,progress:i===4?100:i>=6&&i<9?0:Math.min(85,20+i*7),start:i>=6&&i<9?'2026-09-28T09:00':'2026-09-25T10:00',due:i===9?'2026-09-24T15:00':i<6?'2026-09-25T11:00':'2026-09-28T15:00',pausedAt:i===2||i===9?NOW-12*60000:undefined,version:1}));
export function eligible(s:Attempt,a:Action) { return a==='Pause'?s.status==='In progress'||s.status==='Scheduled':a==='Resume'?s.status==='Paused':a==='Start now'?s.status==='Scheduled':a==='Restart'?s.status!=='Completed':a==='Reschedule'?s.status!=='Completed':true }
export function clock(n:number) { return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}` }
export function date(v:string) {return new Date(v).toLocaleString('en-AU',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}
export interface Options { policy: string; due: string; start: string; fresh: boolean; minutes: number; group: string }
export function applyAction(rows:Attempt[],ids:number[],action:Action,opts:Options,now:number):Attempt[] {
 let nextId=Math.max(...rows.map(s=>s.id))+1;
 const extra:Attempt[]=[];
 const changed=rows.map(s=>{
 if(!ids.includes(s.id)||!eligible(s,action))return s;
 if(action==='Reassign'){extra.push({...s,id:nextId++,group:opts.group,status:'Scheduled',progress:opts.fresh?0:s.progress,dueProgress:opts.fresh?0:s.progress,version:s.version+(opts.fresh?1:0),remaining:opts.minutes*60,start:opts.start,due:opts.due,pausedAt:undefined,closedAt:undefined,expires:new Date(new Date(opts.due).getTime()+86400000).toISOString(),timeSpent:opts.fresh?0:s.timeSpent});return s;}
 if(action==='Pause')return {...s,status:'Paused' as Status,previous:s.status,pausedAt:now};
 if(action==='Resume'){
 const wasStarted=s.previous!=='Scheduled';
 const due=opts.policy==='custom'?opts.due:opts.policy==='automatic'&&s.mode==='Scheduled'&&wasStarted?new Date(new Date(s.due).getTime()+now-(s.pausedAt??now)).toISOString():s.due;
 return {...s,due,expires:due!==s.due?new Date(new Date(due).getTime()+86400000).toISOString():s.expires,closedAt:opts.policy==='close'?new Date(now).toISOString():undefined,status:opts.policy==='close'?'Completed' as Status:s.previous??'In progress',pausedAt:undefined};
 }
 if(action==='Start now')return {...s,status:'In progress' as Status,start:new Date(now).toISOString()};
 if(action==='Restart')return {...s,status:'In progress' as Status,start:new Date(now).toISOString(),due:opts.due,remaining:opts.minutes*60,progress:opts.fresh?0:s.progress,dueProgress:opts.fresh?0:s.progress,version:s.version+(opts.fresh?1:0),pausedAt:undefined,closedAt:undefined,expires:new Date(new Date(opts.due).getTime()+86400000).toISOString(),timeSpent:opts.fresh?0:s.timeSpent};
 return {...s,status:'Scheduled' as Status,start:opts.start,due:opts.due,pausedAt:undefined,closedAt:undefined,expires:new Date(new Date(opts.due).getTime()+86400000).toISOString()};
 });return [...changed,...extra];
}

export const demoScenarios = ['Mixed states','Before due date','After due date','After expiry','Closed'] as const;
export type DemoScenario = typeof demoScenarios[number];
export function demoRows(scenario:DemoScenario='Mixed states'):Attempt[] {
 const progress=[100,100,87,73,100,40,0,93,67,80,100,53];
 const accuracy=[10,9,8,7,5,2,10,9,6,4,10,3];
 return seed.map((s,i)=>{
  const state=scenario==='Mixed states'?(['Closed','Closed','Before due date','After due date','After expiry','After expiry','Before due date','Before due date','After due date','After due date','Closed','After expiry'] as const)[i]:scenario;
  const end=state==='Closed'||state==='After expiry';
  const done=state==='Closed'||(!end&&progress[i]===100);
  const iso=(hours:number)=>new Date(NOW+hours*3600000).toISOString();
  return {...s,progress:progress[i],dueProgress:Math.max(0,progress[i]-20),accuracy:accuracy[i],timeSpent:progress[i]?12+i*3:0,
   status:done||end?'Completed':i===6?'Scheduled':i===2||i===9?'Paused':'In progress',
   start:iso(i===6&&!end?1:-48),due:iso(state==='Before due date'?4:-24),expires:iso(state==='Before due date'?28:state==='After due date'?24:-2),
   closedAt:state==='Closed'||done?iso(-3):undefined,remaining:end||done?0:(45-i)*60,pausedAt:i===2||i===9?NOW-12*60000:undefined};
 });
}
export function attemptPhase(s:Attempt,now:number) {
 if(s.closedAt)return 'Closed';
 if(s.expires&&now>=new Date(s.expires).getTime())return 'Expired';
 if(s.status==='Completed')return 'Completed';
 return now>=new Date(s.due).getTime()?'After due date':'Before due date';
}
export function tickAttempts(rows:Attempt[],now:number):Attempt[] {
 return rows.map(s=>{
  if(s.status==='Completed'||s.status==='Paused')return s;
  if(s.expires&&now>=new Date(s.expires).getTime())return {...s,status:'Completed',remaining:0};
  if(s.status!=='In progress'||s.mode==='Untimed')return s;
  const remaining=Math.max(0,s.remaining-1);
  return {...s,remaining,status:remaining===0?'Completed':s.status,closedAt:remaining===0?new Date(now).toISOString():s.closedAt};
 });
}
