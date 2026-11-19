import {useId} from 'react';
import type {ReactNode} from 'react';
import type {Readiness} from './model';
import {AverageMastery} from './EvidenceUI';

const visual = {
 Ready:{icon:'chip-ready',art:'ready',tone:'ready',filterTone:'green'},
 'Partially ready':{icon:'chip-partial',art:'partial',tone:'partial',filterTone:'orange'},
 'Not ready':{icon:'not-ready',art:'not-ready',tone:'not-ready',filterTone:'red'},
 Unchecked:{icon:'chip-unchecked',art:'unchecked',tone:'unchecked',filterTone:'neutral'},
} as const;

export const readinessStates=Object.keys(visual) as Readiness[];

export function readinessFilterAppearance(option:string){
 const {art,filterTone}=visual[option as Readiness]??visual.Unchecked;
 return {tone:filterTone,src:`/assets/textbook-summary/${art}.svg`};
}

export function ReadinessChip({status}:{status:Readiness}){
 const {icon,tone}=visual[status];
 return <span className="tp-ready-chip" data-readiness={tone}>
  <i aria-hidden="true" style={{maskImage:`url(/assets/readiness/${icon}.svg)`}}/>{status}
 </span>;
}

export function ReadinessPictogram({status}:{status:Readiness}){
 return <img className="tp-readiness-art" src={`/assets/readiness/pictogram-${visual[status].art}.png`} alt="" width={40} height={40}/>;
}

export function NeedsAttentionTile({value,onClick,disabled=false,controls}:{value:string;onClick:()=>void;disabled?:boolean;controls?:string}){
 return <button type="button" className="tp-readiness-card tp-readiness-gap" disabled={disabled} aria-controls={controls} onClick={onClick}>
  <span className="tp-readiness-card-label">Needs attention</span>
  <strong className="tp-readiness-card-stat"><i className="tp-summary-icon" aria-hidden="true" style={{maskImage:'url(/assets/readiness/gaps.svg)'}}/>{value}</strong>
 </button>;
}

type Props={
 statuses:Readiness[];
 individual?:{name:string;values:number[]}[];
 onFilter:(status:Readiness)=>void;
 selectedStatuses:string[];
 gapReview?:{count:number;open:()=>void};
 recommendation?:ReactNode;
 checkIn?:{remaining:number;assigned:boolean;onAssign?:()=>void;onView?:()=>void};
};

export function ReadinessPanel({statuses,individual,onFilter,selectedStatuses,gapReview,recommendation,checkIn}:Props){
 const headingId=useId();
 return <section className="tp-readiness-panel" aria-labelledby={headingId}>
  <h3 id={headingId}>Prerequisite readiness</h3>
  <div className="tp-readiness-content">
   {checkIn?.onAssign&&<div className="tp-readiness-banner">
    <ReadinessPictogram status="Ready"/>
    <div><strong>Check prerequisite readiness</strong><p>{individual?'A check-in can show what this student is ready to learn.':`${checkIn.remaining} of ${statuses.length} students have unchecked readiness.`}</p></div>
    <button className="tp-primary" onClick={checkIn.onAssign}>+ Assign check-in</button>
   </div>}
   {checkIn?.assigned&&<div className="tp-checkin-status">
    <span>{checkIn.remaining?'Readiness check-in already assigned':'Readiness check-in assigned'}</span>
    {checkIn.onView&&<button onClick={checkIn.onView}>View tasks</button>}
   </div>}
   <div className={`tp-readiness-evidence ${recommendation?'tp-readiness-with-recs':''}`}>
   {individual?<div className="tp-student-prerequisites"><ul>{individual.map(skill=><li key={skill.name}>
     <span>{skill.name}</span><AverageMastery values={skill.values} skill individual small/>
    </li>)}</ul></div>:
    <div className={`tp-readiness-statuses ${gapReview?'tp-readiness-with-gap':''}`}>
     {gapReview&&<NeedsAttentionTile value={`${gapReview.count} ${gapReview.count===1?'skill':'skills'}`} disabled={!gapReview.count} onClick={gapReview.open}/>}
     {readinessStates.map(status=>{
     const count=statuses.filter(result=>result===status).length;
     const {tone}=visual[status];
     const {src}=readinessFilterAppearance(status);
     return <button key={status} type="button" className="tp-readiness-card" data-readiness={tone} disabled={!count}
      aria-label={`${status}, ${count} ${count===1?'student':'students'}`} aria-pressed={selectedStatuses.includes(status)} onClick={()=>onFilter(status)}>
      <span className="tp-readiness-card-label">{status==='Partially ready'?'Partially':status}</span>
      <span className="tp-readiness-indicator" aria-hidden="true"/>
      <strong className="tp-readiness-card-stat"><i className="tp-summary-icon" aria-hidden="true" style={{maskImage:`url(${src})`}}/>{count}</strong>
     </button>;
    })}</div>}
   {recommendation}
   </div>
  </div>
 </section>;
}
