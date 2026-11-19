import {studentWorkState} from './model';
import type {Batch,StudentWorkUpdate} from './model';
export function StudentWorkProgress({student,batches,update,percent,earned,onScorecard,onStudent}:{student:string;batches:Batch[];update?:StudentWorkUpdate;percent:number;earned:number;onScorecard:()=>void;onStudent:(student:string)=>void}) {
  const state=studentWorkState(batches,student);
  if(!update&&!state.pending.length)return null;
  const cleared=!state.pages.length;
  const complete=state.ready||cleared;
  const pageLabel=(update?.pageCount??1)===1?'Page':`${update?.pageCount} pages`;
  const moved=update?.kind==='undo'?'Reassignment undone. ':update?.kind==='move-out'?`${pageLabel} moved to ${update.counterpart}. `:update?.kind==='move-in'?`${pageLabel} moved from ${update.counterpart}. `:'';
  const heading=cleared?'Results cleared':state.ready?'Results updated':state.stage==='Upload issue'?'Upload needs attention':state.stage==='Review matches'?'Page review needed':'Updating student results';
  return <section className={`pp-work-update ${complete?'pp-work-updated':''}`} aria-label="Student work update"><div className="pp-work-update-heading"><span aria-hidden="true">{complete?'✓':'↻'}</span><div><strong aria-live="polite">{heading}{state.ready?` · ${percent}% · ${earned} / 6 marks`:''}</strong><p>{moved}{cleared?`No pages remain for ${student}. Their previous result has been cleared.`:state.ready?update?.previousPercent===percent?'Recalculated from the current pages. The score is unchanged.':'The scorecard and task report now reflect the current pages.':update?.previousPercent!==null&&update?.previousPercent!==undefined?`Previous result: ${update.previousPercent}%. Waiting for the current work to finish processing.`:'Results will appear when all current pages have finished processing.'}</p></div>{state.ready&&<button onClick={onScorecard}>View updated scorecard</button>}</div>
    {state.pending.length>0&&<div className="pp-work-jobs">{state.pending.map(batch=><div key={batch.id}><span>{batch.sheets.filter(sheet=>sheet.student===student&&!sheet.excluded).length} {batch.sheets.filter(sheet=>sheet.student===student&&!sheet.excluded).length===1?'page':'pages'}</span><b>{batch.stage}</b>{['Uploading','Matching','Transcribing','Marking'].includes(batch.stage)&&<><progress aria-label={`${batch.label} ${batch.stage}`} value={batch.progress} max={100}/><small>{batch.progress}%</small></>}</div>)}</div>}
    {update?.counterpart&&<button className="pp-view-moved-student" onClick={()=>onStudent(update.counterpart!)}>View {update.counterpart}’s pages →</button>}
  </section>;
}
