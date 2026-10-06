import type {DashboardClass} from './model';
export type ActivityPeriod = 'This week' | 'Last 7 days' | 'Last 30 days';
export type ActivityRow = {name:string;selfLed:number;completed:number;assigned:number;skills:number|null;questions:number;accuracy:number|null;points:number;minutes:number;lastDays:number|null;lastTaskId?:string;lastTitle:string;stickers:number};
const hash=(value:string)=>Array.from(value).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
// Stable daily demonstration events let every date range aggregate the same history.
export function classActivity(item:DashboardClass,period:ActivityPeriod,now=new Date()):ActivityRow[]{
 const days=period==='This week'?(now.getDay()+6)%7+1:period==='Last 7 days'?7:30;
 return item.students.map((name,index)=>{
  const seed=hash(item.id+name),hasHistory=item.history||item.tasks.some(t=>index<t.participation);
  let questions=0,correct=0,minutes=0,selfLed=0,skills=0,lastDays:number|null=null;
  for(let day=0;day<30;day++){
   const n=hash(`${seed}-${day}`);if(!hasHistory||n%7<2||seed%17===0)continue;
   if(lastDays===null)lastDays=day;
   if(day>=days)continue;
   const count=8+n%29;questions+=count;correct+=Math.round(count*(.52+(seed%44)/100));minutes+=Math.round(count*(1.1+(seed%9)/10));selfLed+=n%3===0?1:0;skills+=n%4;
  }
  const assigned=item.tasks.filter(t=>!t.startDate||new Date(t.startDate)<=now);
  const completed=questions?assigned.filter(t=>index<t.participation&&(t.completed||hash(name+t.id)%5===0)&&t.dueIn>=-days).length:0;
  const last=questions?assigned.filter(t=>index<t.participation)[seed%Math.max(1,assigned.filter(t=>index<t.participation).length)]:undefined;
  return {name,selfLed,completed,assigned:assigned.length,skills,questions,accuracy:questions?Math.round(correct/questions*100):null,points:correct*10+selfLed*25,minutes,lastDays,lastTaskId:last?.id,lastTitle:last?.title??(questions?['Fractions practice','Integer operations','Equivalent expressions','Revision: number skills'][seed%4]:'No activity yet'),stickers:hasHistory?seed%9:0};
 });
}
