export type Status = 'In progress' | 'Paused' | 'Scheduled' | 'Completed' | 'Closed';
export type Action = 'Pause' | 'Resume' | 'Start now' | 'Restart' | 'Reschedule' | 'Reassign';
export type Mode = 'Scheduled' | 'Self-paced' | 'Untimed';
export interface Attempt { id: number; name: string; group: string; mode: Mode; status: Status; previous?: Status; remaining: number; progress: number; start: string; due: string; pausedAt?: number; version: number; expires?: string; closedAt?: string; accuracy?: number; timeSpent?: number; dueProgress?: number; markingProgress?: number; markingPending?: boolean; reportMode?: 'test' | 'custom'; durationMinutes?: number | null; calculator?: boolean; penalties?: boolean; attendanceNote?: string }
export const NOW = new Date('2026-09-25T10:20:00').getTime();
export const seed: Attempt[] = ['Emma Johnson','Liam Martinez','Sophia Okonkwo','Noah Okafor','Olivia Petrov','Davis Mason','Amelia Chen','Lucas Wilson','Isla Patel','Ethan Nguyen','Mia Thompson','Oliver Lee'].map((name,i) => ({id:i+1,name,group:i<6?'Group 1':'Group 2',mode:i<6?'Scheduled':i<9?'Self-paced':'Untimed',status:i===4?'Completed':i===2||i===9?'Paused':i>=6&&i<9?'Scheduled':'In progress',previous:'In progress',remaining: i===2?28*60:40*60-i*61,progress:i===4?100:i>=6&&i<9?0:Math.min(85,20+i*7),start:i>=6&&i<9?'2026-09-28T09:00':'2026-09-25T10:00',due:i===9?'2026-09-24T15:00':i<6?'2026-09-25T11:00':'2026-09-28T15:00',pausedAt:i===2||i===9?NOW-12*60000:undefined,version:1}));
export function effectiveStatus(s:Attempt,now:number):Status {
 if(s.expires&&now>=new Date(s.expires).getTime())return 'Closed';
 if(s.status==='Closed'||s.closedAt&&s.progress<100)return 'Closed';
 return s.status;
}
export function eligible(s:Attempt,a:Action) { return a==='Pause'?s.status==='In progress'||s.status==='Scheduled':a==='Resume'?s.status==='Paused':a==='Start now'?s.status==='Scheduled':a==='Restart'?s.status!=='Completed'&&s.status!=='Closed':a==='Reschedule'?s.status!=='Completed'&&s.status!=='Closed':true }
export function clock(n:number) { return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}` }
export function date(v:string) {return new Date(v).toLocaleString('en-AU',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}
export interface Options { policy: string; due: string; start: string; fresh: boolean; minutes: number; group: string }
export function applyAction(rows:Attempt[],ids:number[],action:Action,opts:Options,now:number):Attempt[] {
 let nextId=Math.max(...rows.map(s=>s.id))+1;
 const extra:Attempt[]=[];
 const changed=rows.map(original=>{
 const s={...original,status:effectiveStatus(original,now)};
 if(!ids.includes(s.id)||!eligible(s,action))return s;
 if(action==='Reassign'){extra.push({...s,id:nextId++,group:opts.group,...(s.durationMinutes!==undefined?{durationMinutes:opts.minutes,mode:'Scheduled' as Mode,calculator:rows.find(r=>ids.includes(r.id))?.calculator,penalties:rows.find(r=>ids.includes(r.id))?.penalties}:{}),status:'Scheduled',progress:opts.fresh?0:s.progress,dueProgress:opts.fresh?0:s.progress,version:s.version+(opts.fresh?1:0),remaining:opts.minutes*60,start:opts.start,due:opts.due,pausedAt:undefined,closedAt:undefined,expires:new Date(new Date(opts.due).getTime()+86400000).toISOString(),timeSpent:opts.fresh?0:s.timeSpent});return s;}
 if(action==='Pause')return {...s,status:'Paused' as Status,previous:s.status,pausedAt:now};
 if(action==='Resume'){
 const wasStarted=s.previous!=='Scheduled';
 const due=opts.policy==='custom'?opts.due:opts.policy==='automatic'&&s.mode==='Scheduled'&&wasStarted?new Date(new Date(s.due).getTime()+now-(s.pausedAt??now)).toISOString():s.due;
 return {...s,due,expires:due!==s.due?new Date(new Date(due).getTime()+86400000).toISOString():s.expires,closedAt:opts.policy==='close'?new Date(now).toISOString():undefined,status:opts.policy==='close'?'Closed' as Status:s.previous??'In progress',pausedAt:undefined};
 }
 if(action==='Start now'){const due=s.durationMinutes&&s.mode==='Scheduled'?new Date(now+s.remaining*1000).toISOString():s.due;return {...s,status:'In progress' as Status,start:new Date(now).toISOString(),due,expires:due!==s.due?new Date(Date.parse(due)+86400000).toISOString():s.expires};}
 if(action==='Restart')return {...s,status:'In progress' as Status,start:new Date(now).toISOString(),due:opts.due,remaining:s.durationMinutes===null?0:(s.durationMinutes??opts.minutes)*60,progress:opts.fresh?0:s.progress,dueProgress:opts.fresh?0:s.progress,version:s.version+(opts.fresh?1:0),pausedAt:undefined,closedAt:undefined,expires:new Date(new Date(opts.due).getTime()+86400000).toISOString(),timeSpent:opts.fresh?0:s.timeSpent};
 return {...s,status:'Scheduled' as Status,start:opts.start,due:opts.due,pausedAt:undefined,closedAt:undefined,expires:new Date(new Date(opts.due).getTime()+86400000).toISOString()};
 });return [...changed,...extra];
}

export const demoScenarios = ['Pending','Mixed states','Before due date','After due date','Closed'] as const;
export type DemoScenario = typeof demoScenarios[number];
export function demoRows(scenario:DemoScenario|'After expiry'='Mixed states'):Attempt[] {
 const progress=[100,100,87,73,100,40,0,93,67,80,100,53];
 const accuracy=[10,9,8,7,5,2,10,9,6,4,10,3];
 return seed.map((s,i)=>{
  const state=scenario==='After expiry'?'Closed':scenario==='Mixed states'?(['Closed','Closed','Before due date','After due date','Closed','Closed','Before due date','Before due date','After due date','After due date','Closed','Closed'] as const)[i]:scenario;
  const end=state==='Closed';
  const done=state==='Closed'||(!end&&progress[i]===100);
  const iso=(hours:number)=>new Date(NOW+hours*3600000).toISOString();
  return {...s,progress:progress[i],dueProgress:Math.max(0,progress[i]-20),accuracy:accuracy[i],timeSpent:progress[i]?12+i*3:0,
   status:end?'Closed':done?'Completed':i===6?'Scheduled':i===2||i===9?'Paused':'In progress',
   start:iso(i===6&&!end?2:i<6?-48:-72),due:iso(state==='Before due date'?(i<6?4:28):(i<6?-24:-12)),expires:iso(state==='Before due date'?(i<6?28:52):state==='After due date'?(i<6?24:36):(i<6?-2:-1)),
   closedAt:state==='Closed'||done?iso(-3):undefined,remaining:end||done?0:(45-i)*60,pausedAt:i===2||i===9?NOW-12*60000:undefined};
 });
}
export function attemptPhase(s:Attempt,now:number) {
 if(effectiveStatus(s,now)==='Closed')return 'Closed';
 if(s.status==='Completed')return 'Completed';
 return now>=new Date(s.due).getTime()?'After due date':'Before due date';
}
export function tickAttempts(rows:Attempt[],now:number):Attempt[] {
 return rows.map(original=>{
  const s=original.reportMode==='test'&&original.dueProgress===undefined&&now>=Date.parse(original.due)?{...original,dueProgress:original.progress}:original;
  if(s.durationMinutes!==undefined&&s.status==='Scheduled'&&now>=Date.parse(s.start)&&now<Date.parse(s.due))return {...s,status:'In progress',remaining:s.mode==='Untimed'?0:Math.min(s.remaining,Math.max(0,Math.ceil((Date.parse(s.due)-now)/1000)))};
  if(effectiveStatus(s,now)==='Closed')return {...s,status:'Closed',remaining:0};
  if(s.status==='Completed'||s.status==='Paused')return s;
  if(s.status!=='In progress'||s.mode==='Untimed')return s;
  const remaining=Math.max(0,s.remaining-1);
  return {...s,remaining,status:remaining===0?'Closed':s.status,closedAt:remaining===0?new Date(now).toISOString():s.closedAt};
 });
}

// Upgrade only untouched demo schedules; keep teacher rescheduling and reassigned groups.
export function migrateDemoSchedules(rows:Attempt[],scenario:DemoScenario):Attempt[]{
 const fresh=demoRows(scenario);const iso=(hours:number)=>new Date(NOW+hours*3600000).toISOString();
 return rows.map(s=>{const fixture=fresh.find(f=>f.id===s.id&&f.group===s.group);return fixture&&[iso(-48),iso(1)].includes(s.start)&&[iso(4),iso(-24)].includes(s.due)&&[iso(28),iso(24),iso(-2)].includes(s.expires||'')?{...s,start:fixture.start,due:fixture.due,expires:fixture.expires}:s});
}


export const TEST_DURATION_MINUTES = 40;
export function durationLabel(student: Attempt) {
 return student.mode === 'Untimed' ? 'Untimed' : student.durationMinutes !== undefined && student.durationMinutes !== null ? `${student.durationMinutes} min` : 'Timed';
}
export function timerStartLabel(student: Attempt) {
 return student.mode === 'Untimed' ? 'Not applicable' : student.mode === 'Self-paced' ? 'When student begins' : 'At start time';
}

// Group settings are shared; individual control actions may adjust a student's due date.
export function testDemoRows(scenario: DemoScenario = 'Before due date'): Attempt[] {
 const iso = (minutes: number) => new Date(NOW + minutes * 60000).toISOString();
 const beforeProgress = [100, 100, 80, 73, 0, 0, 0, 0, 53, 67, 100, 40];
 const finalProgress = [100, 100, 87, 80, 100, 73, 93, 67, 80, 87, 100, 60];
 const accuracy = [10, 9, 8, 7, 5, 2, 10, 9, 6, 4, 10, 3];
 return seed.map((student, index) => {
  const groupIndex = Math.floor(index / 4);
  const durationMinutes = [40, 45, null][groupIndex];
  const pending = scenario === 'Pending' || scenario === 'Before due date' && groupIndex === 1;
  const pastDue = scenario === 'After due date' || scenario === 'Closed' || scenario === 'Mixed states' && groupIndex === 1;
  const expired = scenario === 'Closed' || scenario === 'Mixed states' && groupIndex === 2;
  const progress = pending ? 0 : pastDue || expired ? finalProgress[index] : beforeProgress[index];
  const complete = progress === 100;
  const startOffset = scenario === 'Pending' ? [30, 24 * 60, 45][groupIndex] : pastDue || expired ? [-100, -24 * 60, -240][groupIndex] : [-30, 24 * 60, -20][groupIndex];
  const dueOffset = startOffset + (durationMinutes ?? 180);
  const due = iso(expired && groupIndex === 2 ? -60 : dueOffset);
  const paused = scenario === 'Mixed states' && index === 2;
  const timeSpent = pending ? 0 : complete ? [24, 28, 0, 0, 35, 0, 0, 0, 0, 0, 18, 0][index] : pastDue || expired ? durationMinutes ?? 75 : groupIndex === 0 ? paused ? 25 : 30 : 20;
  return {...student, group: `Group ${groupIndex + 1}`, durationMinutes,
   mode: durationMinutes === null ? 'Untimed' : 'Scheduled', calculator: groupIndex !== 0, penalties: false,
   status: expired ? 'Closed' : pending ? 'Scheduled' : complete ? 'Completed' : paused ? 'Paused' : pastDue && durationMinutes !== null ? 'Closed' : 'In progress',
   previous: paused ? 'In progress' : undefined, pausedAt: paused ? NOW - 5 * 60000 : undefined,
   start: iso(startOffset), due, expires: expired ? iso(-10 - groupIndex * 5) : new Date(Date.parse(due) + 86400000).toISOString(),
   remaining: expired || complete || pastDue ? 0 : durationMinutes === null ? 0 : pending ? durationMinutes * 60 : (paused ? 15 : 10) * 60,
   progress, dueProgress: pastDue || expired ? progress : undefined, timeSpent, accuracy: accuracy[index],
   closedAt: complete ? iso(startOffset + timeSpent) : expired || pastDue && durationMinutes !== null ? due : undefined,
   markingProgress: undefined, markingPending: undefined, reportMode: 'test',
  };
 }).map((student, index): Attempt => {
  // Move the closed snapshot back so the next-day make-up sitting has also expired.
  const shift = (value: string, minutes: number) => new Date(Date.parse(value) + minutes * 60000).toISOString();
  const row = scenario === 'Closed' ? {...student, start: shift(student.start, -2880), due: shift(student.due, -2880), expires: shift(student.expires!, -2880), closedAt: student.closedAt ? shift(student.closedAt, -2880) : undefined} : student;
  if (index !== 3 || scenario === 'Pending' || scenario === 'Mixed states') return row as Attempt;
  if (scenario === 'Closed') {
   const start = shift(row.start, 1440), due = shift(row.due, 1440);
   return {...row, start, due, expires: shift(due, 1440), closedAt: shift(start, 38), progress: 100, dueProgress: 100, timeSpent: 38, remaining: 0, attendanceNote: 'Make-up test · 1 day later'} as Attempt;
  }
  return {...row, status: 'Paused', previous: 'Scheduled', progress: 0, dueProgress: undefined, timeSpent: 0, remaining: 40 * 60, pausedAt: Date.parse(row.start), closedAt: undefined,
   ...(scenario === 'After due date' ? {start: shift(row.start, 1440), due: shift(row.due, 1440), expires: shift(row.due, 2880)} : {}),
   attendanceNote: scenario === 'After due date' ? 'Absent · make-up test tomorrow' : 'Absent · test not started'} as Attempt;
 });
}
