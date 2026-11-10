import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {StudentAvatar} from './StudentAvatar';
import {timeAway} from './report-flags';
import type {ReportActivity,ReportFlag} from './report-flags';
import './report-flags.css';
function Icon({name}:{name:string}) {return <i className={`rf-icon rf-icon-${name}`} aria-hidden="true" style={{maskImage:`url(/assets/report-flags/${name}.svg)`}}/>}
export function FlagChips({student,name,avatarUrl}:{student:ReportActivity;name:string;avatarUrl?:string}) {
 const [open,setOpen]=useState(false);
 const flags=student.flags??[],integrity=flags.filter(f=>f.kind==='integrity');
 if(!flags.length)return <span className="tc-muted" aria-label="No flags">—</span>;
 const multiple=new Set(integrity.map(f=>f.signal)).size>1;
 return <><div className="rf-chips">{integrity.length>0&&<button className={`rf-chip ${multiple?'rf-multiple':'rf-integrity'}`} aria-label={`${name}: ${integrity.length} activity flags`} onClick={()=>setOpen(true)}><Icon name={multiple?'multiple':'flag'}/>{multiple?'Multiple flags':'Flagged activity'} ({integrity.length})</button>}{(['edited','reassigned'] as const).map(kind=>{const count=flags.filter(f=>f.kind===kind).length;return count>0&&<button key={kind} className={`rf-chip rf-${kind}`} aria-label={`${name}: ${kind==='edited'?'Edited marks':'Reassigned'} (${count})`} onClick={()=>setOpen(true)}><Icon name={kind}/>{kind==='edited'?`Edited marks (${count})`:'Reassigned'}</button>})}</div>{open&&<FlagDetails student={student} name={name} avatarUrl={avatarUrl} onClose={()=>setOpen(false)}/>}</>;
}
function FlagDetails({student,name,avatarUrl,onClose}:{student:ReportActivity;name:string;avatarUrl?:string;onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement;ref.current?.showModal();return()=>{previous?.focus()}},[]);
 const flags=student.flags??[],signals=flags.filter(f=>f.kind==='integrity');
 const ordered=[...flags].sort((a,b)=>(a.at?Date.parse(a.at):0)-(b.at?Date.parse(b.at):0));
 const icon=(f:ReportFlag)=>f.kind==='integrity'?f.signal??'warning':f.kind;
 return createPortal(<dialog className="rf-dialog" ref={ref} aria-labelledby="rf-title" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}}><header><h2 id="rf-title">Activity signals</h2><button className="rf-close" aria-label="Close activity signals" onClick={onClose}>×</button></header><section className="rf-overview"><div className="rf-student"><StudentAvatar name={name} src={avatarUrl}/><div><strong>{name}</strong><small>{flags.length} {flags.length===1?'flag':'flags'} recorded</small></div></div>{signals.length>0&&<div className="rf-summary"><div><strong>{timeAway(student)}</strong><small>Time away</small></div><div><strong>{signals.filter(f=>f.signal==='exit').length}</strong><small>Tab / fullscreen exits</small></div><div><strong>{signals.filter(f=>f.signal==='paste').length}</strong><small>Paste attempts</small></div></div>}</section><ol className="rf-timeline">{ordered.map(f=><li key={f.id}><small>{f.at?new Date(f.at).toLocaleString('en-AU',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'Recorded event'}{f.question&&` | Question ${f.question}`}</small>{f.detail?<details className={`rf-event rf-${f.kind}`} open={f.signal==='paste'}><summary><Icon name={icon(f)}/>{f.label}</summary><p>{f.detail}</p></details>:<span className={`rf-event rf-${f.kind}`}><Icon name={icon(f)}/>{f.label}</span>}</li>)}</ol></dialog>,document.body);
}
