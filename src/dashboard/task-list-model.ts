import type { Bucket, DashboardClass, DemoTask } from './model';
export type TaskStatus = 'Active' | 'In extension' | 'Closed';
export type TaskFilters = {preset:Bucket|null;date:string;from:string;to:string;statuses:TaskStatus[];types:string[];assigned:string;query:string};
export const taskStatus=(task:DemoTask):TaskStatus=>task.completed?'Closed':task.dueIn<0?'In extension':'Active';
export function presetFilters(preset:Bucket='All'):TaskFilters {
 return {preset,date:preset==='Recent'?'Last 7 days':preset==='Due soon'?'Next 2 days':'All dates',...dateRange(preset==='Recent'?'Last 7 days':preset==='Due soon'?'Next 2 days':'All dates'),statuses:preset==='Recent'?['In extension','Closed']:preset==='Active'?['Active','In extension']:preset==='Due soon'?['Active']:[],types:[],assigned:'',query:''};
}
export function relativeDate(days:number){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function matchesTask(t:DemoTask,f:TaskFilters){
 if(f.query&&!t.title.toLowerCase().includes(f.query.toLowerCase()))return false;
 if(f.statuses.length&&!f.statuses.includes(taskStatus(t)))return false;
 if(f.types.length&&!f.types.includes(t.type))return false;
 if(f.assigned&&(t.assignedTo??'Whole class')!==f.assigned)return false;
 const day=t.dueIn;
 if(f.date==='Last 7 days'&&!(day>=-7&&day<0))return false;
 if(f.date==='Last 14 days'&&!(day>=-14&&day<0))return false;
 if(f.date==='Last 30 days'&&!(day>=-30&&day<0))return false;
 if(f.date==='Next 2 days'&&!(day>=0&&day<=2))return false;
 if(f.date==='This week'){const weekday=(new Date().getDay()+6)%7;if(day< -weekday||day>6-weekday)return false;}
 if(f.date==='Custom'){const date=t.dueDate??relativeDate(day);if(f.from&&date<f.from||f.to&&date>f.to)return false;}
 return true;
}
export function demoTaskDetails(t:DemoTask,c:DashboardClass){return {progress:t.progress??(t.completed?100:Math.round(t.participation/Math.max(1,c.students.length)*100)),start:t.startDate??relativeDate(Math.min(-7,t.dueIn-7)),due:t.dueDate??relativeDate(t.dueIn),expiry:t.expiryDate??relativeDate(t.dueIn+3),minutes:t.minutes??null};}

export function parseTaskFilters(raw:string|null):TaskFilters|undefined {try{const f=JSON.parse(raw??'null');if(!f||!['All dates','Last 7 days','Last 14 days','Last 30 days','Next 2 days','This week','Custom'].includes(f.date)||!Array.isArray(f.statuses)||!f.statuses.every((s:unknown)=>['Active','In extension','Closed'].includes(String(s)))||!Array.isArray(f.types)||!f.types.every((s:unknown)=>typeof s==='string')||!['from','to','assigned','query'].every(k=>typeof f[k]==='string'))return undefined;return {...f,preset:['All','Recent','Due soon','Active'].includes(f.preset)?f.preset:null}}catch{return undefined}}

export function dateRange(label:string){const length=label==='Last 7 days'?7:label==='Last 14 days'?14:label==='Last 30 days'?30:0;if(length)return {from:relativeDate(-length),to:relativeDate(-1)};if(label==='Next 2 days')return {from:relativeDate(0),to:relativeDate(2)};if(label==='This week'){const weekday=(new Date().getDay()+6)%7;return {from:relativeDate(-weekday),to:relativeDate(6-weekday)}}return {from:'',to:''}}
