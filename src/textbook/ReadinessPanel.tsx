import type {ReactNode} from 'react';
import type {Readiness} from './model';

const visual = {
 Ready:{icon:'chip-ready',art:'ready',tone:'ready'},
 'Partially ready':{icon:'chip-partial',art:'partial',tone:'partial'},
 'Not ready':{icon:'not-ready',art:'not-ready',tone:'not-ready'},
 Unchecked:{icon:'chip-unchecked',art:'unchecked',tone:'unchecked'},
} as const;

const readinessStates=Object.keys(visual) as Readiness[];

export function ReadinessChip({status}:{status:Readiness}){
 const {icon,tone}=visual[status];
 return <span className="tp-ready-chip" data-readiness={tone}>
  <i aria-hidden="true" style={{maskImage:`url(/assets/readiness/${icon}.svg)`}}/>{status}
 </span>;
}

export function ReadinessPictogram({status}:{status:Readiness}){
 return <img className="tp-readiness-art" src={`/assets/readiness/pictogram-${visual[status].art}.png`} alt="" width={40} height={40}/>;
}

type Props={
 introduced:boolean;
 statuses:Readiness[];
 individual?:Readiness;
 onFilter:(status:Readiness)=>void;
 children:ReactNode;
};

export function ReadinessPanel({introduced,statuses,individual,onFilter,children}:Props){
 return <details className="tp-readiness-details" open={!introduced}>
  <summary>Prerequisite readiness {individual&&<ReadinessChip status={individual}/>}</summary>
  <div className="tp-readiness-content">
   {individual?<div className="tp-readiness-individual"><ReadinessPictogram status={individual}/><p>Readiness for the prerequisite skills in this topic.</p></div>:
    <div className="tp-readiness-statuses">{readinessStates.map(status=>{
     const count=statuses.filter(result=>result===status).length;
     return <button key={status} type="button" className="tp-readiness-card" data-readiness={visual[status].tone} onClick={()=>onFilter(status)}>
      <span className="tp-readiness-card-label">{status}</span>
      <span className="tp-readiness-student-count"><ReadinessPictogram status={status}/><span><strong>{count}</strong> {count===1?'student':'students'}</span></span>
     </button>;
    })}</div>}
   {children}
  </div>
 </details>;
}
