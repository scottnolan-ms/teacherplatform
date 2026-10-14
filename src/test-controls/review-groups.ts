import {clock,date} from './model';
import type {Action,Attempt,Options} from './model';
export function groupChanges(students:Attempt[],preview:Attempt[],action:Action,opts:Options){
 const groups=new Map<string,{title:string;description:string;members:{before:Attempt;after:Attempt}[]}>();
 students.forEach((before,i)=>{
  const after=preview[i];
  const title=action==='Reassign'?'New attempts will be scheduled':after.status==='Closed'?'Tests will close':action==='Pause'?(before.status==='Scheduled'?'Cannot begin until resumed':'Tests will pause'):after.status==='Scheduled'?'Wait until the scheduled start':action==='Restart'?(opts.fresh?'Tests will restart with fresh work':'Tests will restart with saved work'):before.status==='Scheduled'||before.previous==='Scheduled'?'Can begin now':before.mode==='Untimed'?'Resume an untimed test':'Resume with saved work';
  const delta=Math.round((Date.parse(after.due)-Date.parse(before.due))/60000);
  const due=after.due===before.due?'Due dates stay unchanged.':opts.policy==='custom'||action==='Reschedule'||action==='Restart'||action==='Reassign'?`Due ${date(after.due)}.`:action==='Resume'&&before.previous!=='Scheduled'?`Due dates move by ${delta} minutes.`:`Due ${date(after.due)}.`;
  const timer=after.status==='Closed'?'Access ends.':after.mode==='Untimed'?'No countdown.':action==='Pause'&&before.status==='Scheduled'?'Time allowance stays unchanged.':action==='Restart'||action==='Reassign'?`Timer resets to ${clock(after.remaining)}.`:action==='Pause'?'Remaining time freezes.':'Remaining time is preserved.';
  const start=after.status==='Scheduled'?`Start ${date(after.start)}. `:'';
  const work=(action==='Restart'||action==='Reassign')&&opts.fresh?' Progress resets for fresh work.':' Saved work is kept.';
  const description=start+due+' '+timer+work;
  const key=title+'|'+description+'|'+(action==='Resume'&&opts.policy==='automatic'&&before.previous!=='Scheduled'?Date.parse(after.due)-Date.parse(before.due):'');
  const group=groups.get(key)??{title,description,members:[]};group.members.push({before,after});groups.set(key,group);
 });
 return [...groups.values()];
}
