import type {Action,Attempt,Options} from './model';
import {date} from './model';

/** Teacher-facing consequences, scoped to the actual selection and chosen option. */
export function ActionExpectations({action,affected,excluded,opts,now}:{action:Action;affected:Attempt[];excluded:Attempt[];opts:Options;now:number}) {
 const count=(n:number)=>`${n} student${n===1?'':'s'}`;
 const waiting=affected.filter(s=>s.previous==='Scheduled').length;
 const opening=affected.filter(s=>s.previous==='Scheduled'&&(opts.waitingAction==='now'||Date.parse(s.start)<=now)).length;
 const later=waiting-opening;
 const moving=affected.filter(s=>s.previous!=='Scheduled'&&s.mode==='Scheduled').length;
 const selfPaced=affected.filter(s=>s.previous!=='Scheduled'&&s.mode==='Self-paced').length;
 const untimed=affected.filter(s=>s.previous!=='Scheduled'&&s.mode==='Untimed').length;
 const validDate=(value:string)=>Number.isFinite(Date.parse(value))?date(value):'the date you choose';
 const lines:string[]=[];
 if(action==='Resume'){
  if(opts.policy==='close')lines.push(`${count(affected.length)} will be Closed and cannot continue. Saved answers stay in the report. This does not release results.`);
  else {
   if(affected.length-waiting)lines.push(`${count(affected.length-waiting)} who already started will return to In progress with saved answers and remaining time.`);
   if(later)lines.push(`${count(later)} who ${later===1?'has':'have'} not started will return to Scheduled with their existing start date. They wait until that time.`);
   if(opening)lines.push(`${count(opening)} who ${opening===1?'has':'have'} not started can begin now. Their start time changes to ${date(new Date(now).toISOString())}.`);
   if(opts.policy==='custom')lines.push(`All ${count(affected.length)} affected will have the new due date: ${validDate(opts.due)}. Their remaining time is not reset.`);
   else if(!opts.policy&&affected.some(s=>Date.parse(s.due)<=now)){lines.push('A due date has passed. Choose a new due date to restore access, or close the affected attempts.');}
   else {
    if(!opts.policy)lines.push('If you choose the existing timing rules below:');
    if(moving)lines.push(`${count(moving)} with started, scheduled tests: each due date moves by that student’s own paused duration.`);
    if(selfPaced)lines.push(`${count(selfPaced)} with self-paced tests: keep their due dates and remaining time.`);
    if(untimed)lines.push(`${count(untimed)} with untimed tests: keep their due dates, with no countdown.`);
    if(later)lines.push(`${count(later)} who ${later===1?'has':'have'} not started: keep their due dates.`);
    if(opening)lines.push('For students starting now, timed tests use the remaining allowance from now; untimed tests keep their due dates.');
   }
  }
 } else if(action==='Reschedule'){
  lines.push(`All ${count(affected.length)} affected will become Scheduled and wait until ${validDate(opts.start)}. Students currently working or paused will not be able to continue before then.`);
  lines.push(`Saved answers, progress and remaining time are kept. All affected students receive the due date ${validDate(opts.due)}.`);
 } else if(action==='Restart'){
  lines.push(`All ${count(affected.length)} affected will become In progress and can begin immediately, including students who were paused or scheduled for later.`);
  lines.push(opts.fresh?'Their progress is reset for a fresh question variant.':'Their saved answers and progress are kept.');
  lines.push('Timed attempts restart with their full assigned time allowance. Untimed tests stay untimed.');
  lines.push(`All affected students receive the due date ${validDate(opts.due)}.`);
 }
 const statuses=[...new Set(excluded.map(s=>s.status))];
 return <section className="ac-expectations" aria-label="What will happen"><h3>What will happen</h3><ul>{lines.map(line=><li key={line}>{line}</li>)}</ul>{excluded.length>0&&<p className="ac-excluded"><strong>Not changed:</strong> {statuses.map(status=>`${count(excluded.filter(s=>s.status===status).length)} ${status.toLowerCase()}`).join('; ')}. {action==='Resume'?'Only paused attempts can be resumed.':'Completed and closed attempts are excluded.'}</p>}</section>;
}
