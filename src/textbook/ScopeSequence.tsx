import {useEffect,useRef,useState} from 'react';
import type {DashboardClass} from '../dashboard/model';
import {topics as bookTopics} from '../dashboard/model';
import {guideWeeks,paceStatus,schoolWeeks,shiftDate,shortDate} from './model';
import type {Plan,TopicPlan} from './model';

type Props={item:DashboardClass;plan:Plan;initialTopic?:string;onSave:(plan:Plan)=>void;onClose:()=>void};
const weeksLabel=(n:number)=>`${n} school week${n===1?'':'s'}`;
const names=(list:string[])=>list.length<=2?list.join(' and '):`${list[0]} and ${list.length-1} later topics`;

// The class plan as one list: order, dates and coverage for each topic, with the effect of a change stated before saving.
export default function ScopeSequenceSheet({item,plan,initialTopic,onSave,onClose}:Props){
 const dialog=useRef<HTMLDialogElement>(null);
 const [draft,setDraft]=useState(plan),[open,setOpen]=useState(initialTopic??plan.focus),[moveLater,setMoveLater]=useState(true);
 const [drag,setDrag]=useState<string|null>(null),[over,setOver]=useState<string|null>(null),[uploadNote,setUploadNote]=useState(false);
 useEffect(()=>{const previous=document.activeElement as HTMLElement;const el=dialog.current;el?.showModal();return()=>{el?.close();if(previous?.isConnected)previous.focus()}},[]);
 const book=item.textbook?.topics??bookTopics;
 const chapter=(name:string)=>{const i=book.indexOf(name);return i<0?null:i+1};
 const update=(name:string,change:Partial<TopicPlan>)=>setDraft(d=>({...d,topics:d.topics.map(t=>t.name===name?{...t,...change}:t)}));
 const allDated=draft.topics.every(t=>t.start&&t.end);
 // Reordering keeps each topic's length and lays the dates end to end again from the first start date.
 const reorder=(topics:TopicPlan[])=>{
  if(!allDated){setDraft(d=>({...d,topics}));return}
  let cursor=[...draft.topics.map(t=>t.start)].sort()[0];
  const dated=topics.map(t=>{const length=Math.round((Date.parse(t.end)-Date.parse(t.start))/86400000);const start=cursor,end=shiftDate(start,length);cursor=shiftDate(end,1);return {...t,start,end}});
  setDraft(d=>({...d,topics:dated}));
 };
 const move=(name:string,to:number)=>{const topics=[...draft.topics],from=topics.findIndex(t=>t.name===name);if(from<0||to<0||to>=topics.length||from===to)return;const [t]=topics.splice(from,1);topics.splice(to,0,t);reorder(topics)};
 const setEnd=(t:TopicPlan,end:string)=>{
  const days=t.end&&end?Math.round((Date.parse(end)-Date.parse(t.end))/86400000):0,index=draft.topics.indexOf(t);
  setDraft(d=>({...d,topics:d.topics.map((p,i)=>p.name===t.name?{...p,end}:moveLater&&days&&i>index&&p.start&&p.end?{...p,start:shiftDate(p.start,days),end:shiftDate(p.end,days)}:p)}));
 };
 const setIntroduced=(t:TopicPlan,introduced:number)=>update(t.name,{introduced,state:introduced>=t.subtopics.length?'Taught':introduced>0||t.name===draft.focus?'Teaching':'Planned'});
 const invalid=draft.topics.filter(t=>t.start&&t.end&&t.start>t.end);
 const overlaps=(t:TopicPlan,i:number)=>{const previous=draft.topics[i-1];return !!(previous?.end&&t.start&&t.start<=previous.end)};
 // What saving would change, in the teacher's terms.
 const before=new Map(plan.topics.map(t=>[t.name,t]));
 const dateChanges=draft.topics.filter(t=>{const b=before.get(t.name);return b&&(b.start!==t.start||b.end!==t.end)}).map(t=>t.name);
 const coverageChanges=draft.topics.filter(t=>{const b=before.get(t.name);return b&&(b.introduced!==t.introduced||b.state!==t.state)}).map(t=>t.name);
 const orderChanged=draft.topics.some((t,i)=>plan.topics[i]?.name!==t.name);
 const lastEnd=(p:Plan)=>[...p.topics.map(t=>t.end).filter(Boolean)].sort().at(-1)??'';
 const changes=[
  ...(draft.focus!==plan.focus?[draft.focus?`${draft.focus} becomes the topic focus.`:'The class has no topic focus.']:[]),
  ...(orderChanged?[`Topics are taught in a new order${allDated?', and dates follow that order':''}.`]:[]),
  ...(dateChanges.length&&!orderChanged?[`Dates change for ${names(dateChanges)}.`]:[]),
  ...(lastEnd(draft)!==lastEnd(plan)&&lastEnd(draft)?[`The plan now ends ${shortDate(lastEnd(draft),true)}${lastEnd(plan)?`, not ${shortDate(lastEnd(plan),true)}`:''}.`]:[]),
  ...(coverageChanges.length?[`Teaching coverage changes for ${names(coverageChanges)}.`]:[]),
 ];
 return <dialog className="tp-student-sheet tp-ss" ref={dialog} aria-label={`Scope and sequence for ${item.name}`} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <header className="tp-sheet-header"><div/><div><span className="tp-eyebrow">{item.name} only</span><h2>Scope &amp; sequence</h2></div><button aria-label="Close scope and sequence" onClick={onClose}>×</button></header>
  <div className="tp-sheet-body">
   <section className="tp-ss-source"><div><strong>Have a scope and sequence document?</strong><p>Upload it to set the whole year in one go, then adjust it here. This plan was set by hand for {item.name}.</p>{uploadNote&&<p role="status">Importing is explored in the Scope &amp; Sequence Import prototype and is not connected here.</p>}</div><button className="tp-outline" onClick={()=>setUploadNote(true)}>Upload scope and sequence</button></section>
   <div className="tp-ss-heading"><div><h3>Your teaching order</h3><p>Drag a topic or use the arrows to reorder. Select a topic to set its dates and coverage.</p></div><button disabled={!draft.topics.some((t,i)=>chapter(t.name)!==null&&chapter(t.name)!==i+1)} onClick={()=>reorder([...draft.topics].sort((a,b)=>(chapter(a.name)??99)-(chapter(b.name)??99)))}>Reset to textbook order</button></div>
   <ol className="tp-ss-list">{draft.topics.map((t,i)=>{
    const isOpen=open===t.name,pace=paceStatus(t),ch=chapter(t.name),weeks=t.start&&t.end&&t.start<=t.end?schoolWeeks(t.start,t.end):null,guide=guideWeeks(t.subtopics.length),later=draft.topics.slice(i+1).filter(p=>p.start&&p.end).map(p=>p.name);
    return <li key={t.name} className={`${isOpen?'open':''} ${drag===t.name?'dragging':''} ${over===t.name&&drag!==t.name?'drop':''}`} draggable onDragStart={e=>{if((e.target as HTMLElement).closest('input,select,.tp-ss-editor')){e.preventDefault();return}e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',t.name);setDrag(t.name)}} onDragEnd={()=>{setDrag(null);setOver(null)}} onDragOver={e=>{if(drag){e.preventDefault();setOver(t.name)}}} onDrop={e=>{e.preventDefault();if(drag)move(drag,i);setDrag(null);setOver(null)}}>
     <div className="tp-ss-row">
      <span className="tp-ss-handle" aria-hidden="true">⠿</span>
      <button className="tp-ss-topic" aria-expanded={isOpen} onClick={()=>setOpen(isOpen?'':t.name)}><span className="tp-number">{String(i+1).padStart(2,'0')}</span><span><strong>{t.name}</strong><small>{t.introduced} / {t.subtopics.length} introduced{ch&&ch!==i+1?` · Topic ${ch}`:''}{t.name===draft.focus?' · Topic focus':''}</small></span></button>
      <span className="tp-ss-dates">{t.start&&t.end?<>{shortDate(t.start)} – {shortDate(t.end)}<small>{weeks===null?'Check dates':weeksLabel(weeks)}</small></>:<small>No dates set</small>}</span>
      <span className={`tp-pace tp-pace-${pace.status.toLowerCase().replace(' ','-')}`}>{pace.status==='Behind'?`Behind by ${-pace.delta}`:pace.status==='Ahead'?`Ahead by ${pace.delta}`:pace.status}</span>
      <span className="tp-reorder"><button aria-label={`Move ${t.name} up`} disabled={i===0} onClick={()=>move(t.name,i-1)}>↑</button><button aria-label={`Move ${t.name} down`} disabled={i===draft.topics.length-1} onClick={()=>move(t.name,i+1)}>↓</button></span>
     </div>
     {isOpen&&<div className="tp-ss-editor">
      <div className="tp-ss-fields">
       <label>Topic start date<input type="date" max={t.end||undefined} value={t.start} onChange={e=>update(t.name,{start:e.target.value})}/></label>
       <label>Topic end date<input type="date" min={t.start||undefined} value={t.end} onChange={e=>setEnd(t,e.target.value)}/></label>
       <label>Subtopics introduced<select value={t.introduced} onChange={e=>setIntroduced(t,Number(e.target.value))}>{Array.from({length:t.subtopics.length+1},(_,n)=><option key={n} value={n}>{n} of {t.subtopics.length}</option>)}</select></label>
       <label>Teaching state<select value={t.state} onChange={e=>update(t.name,{state:e.target.value as TopicPlan['state']})}>{['Planned','Teaching','Taught'].map(s=><option key={s}>{s}</option>)}</select></label>
      </div>
      <p className="tp-ss-guide">Mathspace guide: {guide} weeks{weeks!==null?` · You've set ${weeksLabel(weeks)}`:''}</p>
      {t.start&&t.end&&t.start>t.end&&<p role="alert">The end date must be on or after the start date.</p>}
      {overlaps(t,i)&&<p className="tp-ss-warning">Starts before {draft.topics[i-1].name} ends on {shortDate(draft.topics[i-1].end)}.</p>}
      {later.length>0&&<label className="tp-check"><input type="checkbox" checked={moveLater} onChange={e=>setMoveLater(e.target.checked)}/>When the end date changes, move {names(later)} by the same number of days</label>}
      <div className="tp-ss-actions">{t.name===draft.focus?<span className="tp-tag tp-focus-tag">Topic focus</span>:<button className="tp-outline" onClick={()=>setDraft(d=>({...d,focus:t.name,topics:d.topics.map(p=>p.name===t.name&&p.state==='Planned'?{...p,state:'Teaching'}:p)}))}>Set as topic focus</button>}{t.name===draft.focus&&<button onClick={()=>setDraft(d=>({...d,focus:''}))}>Clear focus</button>}</div>
     </div>}
    </li>})}</ol>
   <p className="tp-footnote">School weeks count weekdays only; term holidays are not modelled in this prototype. Guide lengths are illustrative.</p>
  </div>
  <footer className="tp-ss-footer"><div>{changes.length?<><strong>This changes your plan:</strong><ul>{changes.map(c=><li key={c}>{c}</li>)}</ul></>:<span className="tp-muted">No changes yet. Changes do not affect learning evidence.</span>}</div><button onClick={onClose}>Cancel</button><button className="tp-primary" disabled={!changes.length||invalid.length>0} onClick={()=>onSave(draft)}>Save class plan</button></footer>
 </dialog>;
}
