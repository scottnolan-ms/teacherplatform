import {useId,useRef,useState,useEffect} from 'react';
import type {ReactNode,Ref} from 'react';
import {AnchoredTooltip} from '../test-controls/AnchoredTooltip';
import {AverageMastery,Distribution,TopicChip} from './EvidenceUI';
import {averageLevel,averageLevelsByStudent,masteryScore,paceStatus,shortDate,subtopicSkills} from './model';
import type {TopicPages,TopicPlan} from './model';
import {DEMO_DATE,snapshot} from './model';
import {useEvidenceOptions} from './distribution-options';
export function Help({label,children}:{label:string;children:ReactNode}){
 const id=useId(),[anchor,setAnchor]=useState<DOMRect|null>(null);
 useEffect(()=>{const hide=()=>setAnchor(null);window.addEventListener('scroll',hide,true);return()=>window.removeEventListener('scroll',hide,true)},[]);
 return <><button className="tp-info" aria-label={label} aria-describedby={anchor?id:undefined} onFocus={e=>setAnchor(e.currentTarget.getBoundingClientRect())} onMouseEnter={e=>setAnchor(e.currentTarget.getBoundingClientRect())} onBlur={()=>setAnchor(null)} onMouseLeave={()=>setAnchor(null)} onClick={e=>setAnchor(e.currentTarget.getBoundingClientRect())} onKeyDown={e=>{if(e.key==='Escape')setAnchor(null)}}>ⓘ</button>{anchor&&<AnchoredTooltip id={id} className="tp-mastery-tooltip" anchor={anchor}>{children}</AnchoredTooltip>}</>
}
export type ContextAction={kind:string;label:string;skills:string[];supportOnly?:boolean};
export function Actions({label,skills,onAction,taskOnly=false}:{taskOnly?:boolean;label:string;skills:string[];onAction:(a:ContextAction)=>void}){
 const ref=useRef<HTMLDetailsElement>(null);
 const groups:[string,string[]][]=taskOnly
  ?[['Practice',['Build a task']]]
  :[['Practice',['Build a task','Support students needing practice']],['Teaching',['Prepare a lesson','Prepare board questions']]];
 return <details className="tp-context-actions" ref={ref} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))e.currentTarget.open=false}} onKeyDown={e=>{if(e.key==='Escape'){if(ref.current)ref.current.open=false;ref.current?.querySelector('summary')?.focus()}}}><summary className="tp-more" aria-label={`More actions for ${label}`} title={`More actions for ${label}`}><i aria-hidden="true" style={{maskImage:'url(/assets/report-actions/more.svg)'}}/></summary><div className="tp-context-menu"><header><strong>{label}</strong></header>{groups.map(([group,kinds])=><div key={group}><h4>{group}</h4>{kinds.map(kind=><button key={kind} onClick={()=>{if(ref.current)ref.current.open=false;onAction({kind,label,skills,supportOnly:kind.startsWith('Support')})}}>{kind}</button>)}</div>)}</div></details>
}
export type SkillRow={code:string;name:string;kind:'Current grade'|'Prerequisite';subtopic:string;values:number[]};
export function TopicTable({topic,pages,values,skills,expanded,onExpand,onAction,legend,individual=false,taskOnly=false}:{taskOnly?:boolean;topic:TopicPlan;pages?:TopicPages;values:(i:number)=>number[];skills:SkillRow[];expanded:string[];onExpand:(next:string[])=>void;legend?:ReactNode;onAction:(a:ContextAction)=>void;individual?:boolean}){
 const {subtleExpanded}=useEvidenceOptions();
 const allOpen=topic.subtopics.every(x=>expanded.includes(x));
 const hasSkills=expanded.length>0;
 const progressLabel=hasSkills?'mastery / proficiency':'mastery';
 return <><div className="tp-table-tools">{legend}<button className="tp-expand-all" onClick={()=>onExpand(allOpen?[]:[...topic.subtopics])}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d={allOpen?'M5 13h6v6H9v-2.6l-3.3 3.3-1.4-1.4L7.6 15H5v-2zm8-8h2v2.6l3.3-3.3 1.4 1.4L16.4 9H19v2h-6V5z':'M5 19v-6h2v2.6l3.3-3.3 1.4 1.4L8.4 17H11v2H5zm8-8.7 3.3-3.3H13V5h6v6h-2V8.4l-3.3 3.3-1.4-1.4z'}/></svg>{allOpen?'Collapse all':'Expand all'}</button></div><div className="tp-table-wrap tp-learning-wrap"><table className={`tp-table tp-learning-table ${individual?'tp-individual-learning':''}`}><colgroup><col className="tp-col-label"/><col className="tp-col-code"/><col className="tp-col-coverage"/><col className="tp-col-average"/>{!individual&&<col className="tp-col-distribution"/>}<col className="tp-col-actions"/></colgroup><thead><tr><th>Subtopic / skill</th><th>Skills / code <Help label="About skill codes">Codes beginning DEMO are illustrative skill identifiers, not curriculum codes.</Help></th><th>Teaching coverage</th><th>{individual?(hasSkills?'Mastery / proficiency':'Mastery'):`Average ${progressLabel}`} {!individual&&<Help label="About average progress">The average uses the levels of students with available results. The chip shows the lower whole level and a score out of 100.</Help>}</th>{!individual&&<th className="tp-class-mastery-cell">Class {progressLabel}</th>}<th><span className="tp-sr-only">Actions</span></th></tr></thead>{topic.subtopics.map((s,i)=><tbody key={s}><tr className={subtleExpanded&&expanded.includes(s)?'tp-subtopic-muted':undefined}><td><div className="tp-sub-cell"><button className="tp-accordion" aria-expanded={expanded.includes(s)} aria-label={`${expanded.includes(s)?'Collapse':'Expand'} ${s}`} onClick={()=>onExpand(expanded.includes(s)?expanded.filter(x=>x!==s):[...expanded,s])}><i aria-hidden="true"/></button><div>{pages&&<span className="tp-topic-eyebrow tp-sub-eyebrow"><TopicChip label={`${pages.number}.${String(i+1).padStart(2,'0')}`} pages={pages.subs[i]}/></span>}<strong>{s}</strong></div></div></td><td>{subtopicSkills(s).length} skills</td><td><span className={`tp-tag ${i<topic.introduced?'tp-taught':''}`}>{i<topic.introduced?'Introduced':'Not introduced'}</span></td><td><AverageMastery values={values(i)} individual={individual}/></td>{!individual&&<td className="tp-class-mastery-cell"><Distribution subject={s} values={values(i)} muted={subtleExpanded&&expanded.includes(s)}/></td>}<td><div className="tp-row-actions"><Actions label={s} skills={subtopicSkills(s)} onAction={onAction} taskOnly={taskOnly}/></div></td></tr>{expanded.includes(s)&&skills.filter(k=>k.kind==='Current grade'&&k.subtopic===s).map(k=><tr className="tp-expanded-skill" key={k.code}><td><span>{k.name}</span></td><td><code>{k.code}</code></td><td><small>Topic skill</small></td><td><AverageMastery values={k.values} skill individual={individual}/></td>{!individual&&<td className="tp-class-mastery-cell"><Distribution subject={k.name} values={k.values} skill/></td>}<td><Actions label={k.name} skills={[k.name]} onAction={onAction} taskOnly={taskOnly}/></td></tr>)}</tbody>)}</table></div></>
}
export function SkillsTable({skills,onAction,individual=false}:{skills:SkillRow[];onAction:(a:ContextAction)=>void;individual?:boolean}){
 const [kind,setKind]=useState('All skills');
 const [attention,setAttention]=useState('all');
 const [search,setSearch]=useState('');
 const shown=skills.map(skill=>({
  ...skill,
  needsPractice:skill.values.filter(value=>value>0&&value<3).length,
  missing:skill.values.filter(value=>value===0).length,
 })).filter(skill=>
  (kind==='All skills'||skill.kind===kind)
  && `${skill.name} ${skill.code}`.toLowerCase().includes(search.toLowerCase())
  && (attention==='all'||(attention==='practice'?skill.needsPractice>0:skill.missing>0))
 );
 if(attention!=='all')shown.sort((a,b)=>attention==='practice'?b.needsPractice-a.needsPractice:b.missing-a.missing);
 return <>
  <div className="tp-filters">
   <label>Skills<select aria-label="Filter topic skill scope" value={kind} onChange={e=>setKind(e.target.value)}>
    {['All skills','Current grade','Prerequisite'].map(v=><option key={v}>{v}</option>)}
   </select></label>
   <label>Attention<select value={attention} onChange={e=>setAttention(e.target.value)}>
    <option value="all">All skills</option><option value="practice">Needs practice</option><option value="missing">Missing evidence</option>
   </select></label>
   <input aria-label="Search topic skills" placeholder="Search skills or codes" value={search} onChange={e=>setSearch(e.target.value)}/>
  </div>
  <p className="tp-footnote">{shown.length} {shown.length===1?'skill':'skills'}</p>
  <div className="tp-table-wrap"><table className="tp-table tp-all-skills">
   <thead><tr><th>Skill</th><th>Code</th><th>Scope</th>
    <th>Attention <Help label="About skill attention">Needs practice counts Exploring and Emerging results. Missing evidence counts students with no result for this skill.</Help></th>
    <th>{individual?'Proficiency':'Average proficiency'}</th>{!individual&&<th>Class proficiency</th>}<th>Actions</th>
   </tr></thead>
   <tbody>{shown.map(skill=><tr key={skill.code}>
    <td><strong>{skill.name}</strong></td><td><code>{skill.code}</code></td><td>{skill.kind}</td>
    <td><div className="tp-skill-attention">
     {skill.needsPractice>0&&<span className="tp-attention-practice">{individual?'Needs practice':`${skill.needsPractice} need practice`}</span>}
     {skill.missing>0&&<span className="tp-attention-missing">{individual?'Missing evidence':`${skill.missing} missing evidence`}</span>}
     {!skill.needsPractice&&!skill.missing&&<span className="tp-muted" aria-label="No follow-up flagged">—</span>}
    </div></td>
    <td><AverageMastery values={skill.values} skill individual={individual}/></td>
    {!individual&&<td><Distribution subject={skill.name} values={skill.values} skill/></td>}
    <td><Actions label={skill.name} skills={[skill.name]} onAction={onAction}/></td>
   </tr>)}</tbody>
  </table>{!shown.length&&<p className="tp-footnote">No skills match these filters.</p>}</div>
 </>;
}
type TopicSummaryProps={
 topic:TopicPlan;
 rows:number[][];
 skills:SkillRow[];
 studentIds:string[];
 individual:boolean;
 summaryRef:Ref<HTMLElement>;
 onAction:(action:ContextAction)=>void;
 recommendations:ReactNode;
};

export function TopicSummary({topic,rows,skills,studentIds,individual,summaryRef,onAction,recommendations}:TopicSummaryProps){
 const [scope,setScope]=useState(topic.introduced?'Introduced subtopics':'All subtopics');
 const [open,setOpen]=useState(true);
 const allSubtopics=scope==='All subtopics';
 const scoped=allSubtopics?rows:rows.slice(0,topic.introduced);
 const names=new Set(topic.subtopics.slice(0,scoped.length));
 const proficiency=averageLevel(skills.filter(skill=>skill.kind==='Current grade'&&names.has(skill.subtopic)).flatMap(skill=>skill.values));
 const levels=averageLevelsByStudent(scoped,studentIds.length);
 const baseline=topic.start&&topic.start>'2026-10-09'&&topic.start<=DEMO_DATE?topic.start:'2026-10-09';
 const pairs=scoped.flatMap((row,j)=>row.map((value,i)=>({value,before:snapshot(value,`${studentIds[i]}:${j}`,baseline)}))).filter(pair=>pair.value>0&&pair.before>0);
 const improved=pairs.filter(pair=>pair.value>pair.before).length;
 const pace=paceStatus(topic);
 const paceLabel=pace.status==='Behind'?`Behind by ${-pace.delta}`:pace.status==='Ahead'?`Ahead by ${pace.delta}`:pace.status;
 const icon=(name:string)=><i className="rc-icon" aria-hidden="true" style={{maskImage:`url(/assets/${name}.svg)`}}/>;
 return <section ref={summaryRef} className="tp-dashboard" aria-label="Topic summary">
  <div className={open?'tp-dashboard-heading':'tp-dashboard-heading closed'}>
   <button className="tp-dashboard-toggle" aria-expanded={open} onClick={()=>setOpen(!open)}><span className={open?'tp-chevron open':'tp-chevron'} aria-hidden="true">›</span>Topic summary</button>
   <div>
    {!open&&<span className="tp-muted">{topic.introduced} / {rows.length} subtopics introduced</span>}
    {open&&<label>Learning scope <select value={scope} onChange={e=>setScope(e.target.value)}><option>Introduced subtopics</option><option>All subtopics</option></select></label>}
    <button className="tp-outline" onClick={()=>onAction({kind:'Build a task',label:topic.name,skills:topic.subtopics.flatMap(subtopicSkills)})}>Build a task</button>
   </div>
  </div>
  {open&&<div className={`tp-dashboard-body tp-topic-summary ${recommendations?'':'tp-summary-full'}`}>
   <div className="tp-topic-summary-metrics">
    <div className="tp-insight-values">
     <div><span>Subtopics</span><strong>{icon('recommendations/progress')}{topic.introduced} / {rows.length} introduced</strong><small>{paceLabel}{topic.end?` · Target ${shortDate(topic.end)}`:''}</small></div>
     <div><span>Avg skill proficiency <Help label="About average skill proficiency">Mean proficiency across topic skills with available results in the selected learning scope.</Help></span><strong>{icon('report-header/skills')}{proficiency?`${masteryScore(proficiency)} / 100`:'—'}</strong><small>Topic skills</small></div>
     <div><span>Subtopic mastery growth <Help label="About subtopic mastery growth">Compares each student’s mastery level for the same subtopic at both dates. The count includes only pairs with results at both dates.</Help></span><strong>{icon('recommendations/time')}{pairs.length?`${improved} / ${pairs.length} improved`:'—'}</strong><small>{pairs.length?`Since ${shortDate(baseline)} · ${individual?'subtopics':'student–subtopic results'}`:`No comparable results since ${shortDate(baseline)}`}</small></div>
    </div>
   </div>
   {recommendations}
   <section className="tp-topic-distribution">
     <h3>{individual?'Average subtopic mastery':'Topic mastery distribution'} <Help label="About topic mastery distribution">{individual?'Average mastery across subtopics with available results.':'Groups students by their average mastery across subtopics in the selected scope. Students with no results are shown as No evidence.'}</Help></h3>
     {individual?<AverageMastery noun="topic" values={scoped.flat()} individual/>:<Distribution subject={topic.name} values={levels.map(Math.floor)}/>}
   </section>
  </div>}
 </section>;
}
