import {useId,useRef,useState,useEffect} from 'react';
import type {ReactNode,Ref} from 'react';
import {AnchoredTooltip} from '../test-controls/AnchoredTooltip';
import {AttentionChip,AverageMastery,Distribution,TopicChip} from './EvidenceUI';
import {averageLevel,averageLevelsByStudent,masteryScore,subtopicSkills} from './model';
import type {TopicPages,TopicPlan} from './model';
import {useEvidenceOptions} from './distribution-options';
import {MasteryAverageTile,StudentLearningTiles,SummaryTile} from './StudentLearningTiles';
export function Help({label,children}:{label:string;children:ReactNode}){
 const id=useId(),[anchor,setAnchor]=useState<DOMRect|null>(null);
 useEffect(()=>{const hide=()=>setAnchor(null);window.addEventListener('scroll',hide,true);return()=>window.removeEventListener('scroll',hide,true)},[]);
 return <><button className="tp-info" aria-label={label} aria-describedby={anchor?id:undefined} onFocus={e=>setAnchor(e.currentTarget.getBoundingClientRect())} onMouseEnter={e=>setAnchor(e.currentTarget.getBoundingClientRect())} onBlur={()=>setAnchor(null)} onMouseLeave={()=>setAnchor(null)} onClick={e=>setAnchor(e.currentTarget.getBoundingClientRect())} onKeyDown={e=>{if(e.key==='Escape')setAnchor(null)}}>ⓘ</button>{anchor&&<AnchoredTooltip id={id} className="tp-mastery-tooltip" anchor={anchor}>{children}</AnchoredTooltip>}</>
}
export type ContextAction={kind:string;label:string;skills:string[];supportOnly?:boolean};
export function ActionMenu({label,children}:{label:string;children:(dismiss:()=>void)=>ReactNode}){
 const id=useId(),trigger=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null);
 const [open,setOpen]=useState(false);
 const dismiss=()=>{
  menu.current?.hidePopover();
  trigger.current?.focus({preventScroll:true});
 };
 useEffect(()=>{
  if(!open)return;
  const dismiss=(event:Event)=>{
   const popup=menu.current;
   if(popup?.matches(':popover-open')&&event.target!==popup)popup.hidePopover();
  };
  window.addEventListener('scroll',dismiss,true);
  window.addEventListener('resize',dismiss);
  return ()=>{
   window.removeEventListener('scroll',dismiss,true);
   window.removeEventListener('resize',dismiss);
  };
 },[open]);
 return <div className="tp-context-actions">
  <button type="button" ref={trigger} className="tp-more" popoverTarget={id} aria-expanded={open} aria-label={`More actions for ${label}`}>
   <i aria-hidden="true" style={{maskImage:'url(/assets/report-actions/more.svg)'}}/>
  </button>
  <div ref={menu} id={id} className="tp-context-menu" popover="auto" onToggle={event=>{
   const popup=event.currentTarget;
   const shown=popup.matches(':popover-open');
   setOpen(shown);
   if(!shown||!trigger.current)return;
   const anchor=trigger.current.getBoundingClientRect(),width=popup.offsetWidth,height=popup.offsetHeight;
   const below=anchor.bottom+4;
   const top=below+height<=window.innerHeight-8?below:Math.max(8,anchor.top-height-4);
   popup.style.top=`${top}px`;
   popup.style.left=`${Math.max(8,Math.min(anchor.right-width,window.innerWidth-width-8))}px`;
  }}>
   <header><strong>{label}</strong></header>
   {children(dismiss)}
  </div>
 </div>;
}
export function Actions({label,skills,onAction,taskOnly=false}:{taskOnly?:boolean;label:string;skills:string[];onAction:(a:ContextAction)=>void}){
 const groups:[string,string[]][]=taskOnly
  ?[['Practice',['Build a task']]]
  :[['Practice',['Build a task','Support students needing practice']],['Teaching',['Prepare a lesson','Prepare board questions']]];
 return <ActionMenu label={label}>{dismiss=>groups.map(([group,kinds])=><div key={group}><h4>{group}</h4>{kinds.map(kind=><button key={kind} onClick={()=>{
  dismiss();
  onAction({kind,label,skills,supportOnly:kind.startsWith('Support')});
 }}>{kind}</button>)}</div>)}</ActionMenu>;
}

export type SkillRow={code:string;name:string;kind:'Current grade'|'Prerequisite';subtopic:string;values:number[]};
export function TopicTable({topic,pages,values,skills,expanded,onExpand,onAction,legend,individual=false,taskOnly=false,showPrerequisites=false}:{showPrerequisites?:boolean;taskOnly?:boolean;topic:TopicPlan;pages?:TopicPages;values:(i:number)=>number[];skills:SkillRow[];expanded:string[];onExpand:(next:string[])=>void;legend?:ReactNode;onAction:(a:ContextAction)=>void;individual?:boolean}){
 const {subtleExpanded}=useEvidenceOptions();
 const allOpen=topic.subtopics.every(x=>expanded.includes(x));
 const prerequisites=individual&&showPrerequisites?skills.filter(skill=>skill.kind==='Prerequisite'):[];
 const hasSkills=expanded.length>0||prerequisites.length>0;
 const toggle=(name:string)=>onExpand(expanded.includes(name)?expanded.filter(value=>value!==name):[...expanded,name]);
 const progressLabel=hasSkills?'mastery / proficiency':'mastery';
 return <>{legend&&<div className="tp-table-tools">{legend}</div>}<div className="tp-table-wrap tp-learning-wrap"><table className={`tp-table tp-learning-table ${individual?'tp-individual-learning':''}`}><colgroup><col className="tp-col-label"/><col className="tp-col-code"/><col className="tp-col-coverage"/><col className="tp-col-average"/>{!individual&&<col className="tp-col-distribution"/>}<col className="tp-col-actions"/></colgroup><thead><tr><th><div className="tp-sub-cell"><button type="button" className="tp-expand-all" aria-label={allOpen?'Collapse all subtopics':'Expand all subtopics'} title={allOpen?'Collapse all subtopics':'Expand all subtopics'} onClick={()=>onExpand(allOpen?[]:[...topic.subtopics])}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d={allOpen?'M5 13h6v6H9v-2.6l-3.3 3.3-1.4-1.4L7.6 15H5v-2zm8-8h2v2.6l3.3-3.3 1.4 1.4L16.4 9H19v2h-6V5z':'M5 19v-6h2v2.6l3.3-3.3 1.4 1.4L8.4 17H11v2H5zm8-8.7 3.3-3.3H13V5h6v6h-2V8.4l-3.3 3.3-1.4-1.4z'}/></svg></button><span>Subtopic / skill</span></div></th><th><span className="tp-learning-code-heading">Skills / code <Help label="About skill codes">Codes beginning DEMO are illustrative skill identifiers, not curriculum codes.</Help></span></th><th>Teaching coverage</th><th>{individual?(hasSkills?'Mastery / proficiency':'Mastery'):`Average ${progressLabel}`} {!individual&&<Help label="About average progress">The average uses the levels of students with available results. The chip shows the lower whole level and a score out of 100.</Help>}</th>{!individual&&<th className="tp-class-mastery-cell">Class {progressLabel}</th>}<th><span className="tp-sr-only">Actions</span></th></tr></thead>{topic.subtopics.map((s,i)=><tbody key={s}><tr className={`tp-subtopic-row ${subtleExpanded&&expanded.includes(s)?'tp-subtopic-muted':''}`} onClick={event=>{
  const control=(event.target as Element).closest('button,a,summary,[tabindex],.tp-tag');
  if((control&&event.currentTarget.contains(control))||window.getSelection()?.type==='Range')return;
  toggle(s);
 }}><td><div className="tp-sub-cell"><button className="tp-accordion" aria-expanded={expanded.includes(s)} aria-label={`${expanded.includes(s)?'Collapse':'Expand'} ${s}`} onClick={()=>toggle(s)}><i aria-hidden="true"/></button><div>{pages&&<span className="tp-topic-eyebrow tp-sub-eyebrow"><TopicChip label={`${pages.number}.${String(i+1).padStart(2,'0')}`} pages={pages.subs[i]}/></span>}<strong>{s}</strong></div></div></td><td>{subtopicSkills(s).length} skills</td><td><span className={`tp-tag ${i<topic.introduced?'tp-taught':''}`}>{i<topic.introduced?'Introduced':'Not introduced'}</span></td><td><AverageMastery values={values(i)} individual={individual} small/></td>{!individual&&<td className="tp-class-mastery-cell"><Distribution subject={s} values={values(i)} muted={subtleExpanded&&expanded.includes(s)}/></td>}<td><div className="tp-row-actions"><Actions label={s} skills={subtopicSkills(s)} onAction={onAction} taskOnly={taskOnly}/></div></td></tr>{expanded.includes(s)&&skills.filter(k=>k.kind==='Current grade'&&k.subtopic===s).map(k=><tr className="tp-expanded-skill" key={k.code}><td><span>{k.name}</span></td><td><code>{k.code}</code></td><td><small>Topic skill</small></td><td><AverageMastery values={k.values} skill individual={individual} small/></td>{!individual&&<td className="tp-class-mastery-cell"><Distribution subject={k.name} values={k.values} skill/></td>}<td><Actions label={k.name} skills={[k.name]} onAction={onAction} taskOnly={taskOnly}/></td></tr>)}</tbody>)}
  {prerequisites.length>0&&<tbody className="tp-prerequisite-rows">
   <tr><th scope="rowgroup" colSpan={5}>Prerequisite skills</th></tr>
   {prerequisites.map(skill=><tr key={skill.code}>
    <th scope="row">{skill.name}</th>
    <td><code>{skill.code}</code></td>
    <td/>
    <td><AverageMastery values={skill.values} individual skill small/></td>
    <td/>
   </tr>)}
  </tbody>}
 </table></div></>
}
export function SkillsTable({skills,introduced,onAction,individual=false}:{skills:SkillRow[];introduced:string[];onAction:(a:ContextAction)=>void;individual?:boolean}){
 const [kind,setKind]=useState('All skills');
 const [attention,setAttention]=useState('all');
 const [search,setSearch]=useState('');
 const introducedNames=new Set(introduced);
 const shown=skills.map(skill=>{
  const upcoming=skill.kind==='Current grade'&&!introducedNames.has(skill.subtopic);
  return {
   ...skill,upcoming,
   needsPractice:skill.values.filter(value=>value>0&&value<3).length,
   missing:upcoming?0:skill.values.filter(value=>value===0).length,
  };
 }).filter(skill=>
  (kind==='All skills'||skill.kind===kind)
  && `${skill.name} ${skill.code}`.toLowerCase().includes(search.toLowerCase())
  && (attention==='all'||(attention==='practice'?skill.needsPractice>0:skill.missing>0))
 );
 if(attention!=='all')shown.sort((a,b)=>attention==='practice'?b.needsPractice-a.needsPractice:b.missing-a.missing);
 return <>
  <div className="tp-filters tp-topic-filters">
   <label>Skills<select aria-label="Filter topic skill scope" value={kind} onChange={e=>setKind(e.target.value)}>
    {['All skills','Current grade','Prerequisite'].map(v=><option key={v}>{v}</option>)}
   </select></label>
   <label>Attention<select value={attention} onChange={e=>setAttention(e.target.value)}>
    <option value="all">All skills</option><option value="practice">Needs practice</option><option value="missing">Missing evidence</option>
   </select></label>
   <input type="search" className="tc-search" aria-label="Search topic skills" placeholder="Search skills or codes" value={search} onChange={e=>setSearch(e.target.value)}/>
  </div>
  <div className="tp-table-wrap"><table className={`tp-table tp-all-skills ${individual?'tp-all-skills-individual':''}`}>
   <colgroup><col className="tp-skill-name-col"/><col className="tp-skill-code-col"/><col className="tp-skill-scope-col"/>
    <col className="tp-skill-attention-col"/><col className="tp-skill-average-col"/>{!individual&&<col/>}<col className="tp-col-actions"/>
   </colgroup>
   <thead><tr><th>Skill</th><th>Code</th><th>Scope</th>
    <th>Attention <Help label="About skill attention">Needs practice counts Exploring and Emerging results. Missing evidence counts students without a result in introduced or prerequisite skills.</Help></th>
    <th>{individual?'Proficiency':'Average proficiency'}</th>{!individual&&<th>Class proficiency</th>}<th>Actions</th>
   </tr></thead>
   <tbody>{shown.map(skill=><tr key={skill.code}>
    <td><strong>{skill.name}</strong></td><td><code>{skill.code}</code></td><td className="tp-skill-scope">{skill.kind}</td>
    <td><div className="tp-skill-attention">
     {skill.needsPractice>0&&<AttentionChip kind="practice" label={individual?'Needs practice':`${skill.needsPractice} need practice`} description={individual?'This student is Exploring or Emerging in this skill.':`${skill.needsPractice} of ${skill.values.length} students are Exploring or Emerging in this skill.`}/>}
     {skill.missing>0&&<AttentionChip kind="missing" label={individual?'Missing evidence':`${skill.missing} missing evidence`} description={individual?'This student has no result for this skill yet.':`${skill.missing} of ${skill.values.length} students have no result for this skill yet.`}/>}
     {!skill.needsPractice&&!skill.missing&&<span className="tp-muted" aria-label={skill.upcoming?undefined:"No follow-up flagged"}>{skill.upcoming?"Not introduced":"—"}</span>}
    </div></td>
    <td><AverageMastery values={skill.values} skill individual={individual} small/></td>
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
 recommendations:ReactNode;
 readinessPanel?:ReactNode;
};

export function TopicSummary({topic,rows,skills,studentIds,individual,summaryRef,recommendations,readinessPanel}:TopicSummaryProps){
 const topicSkillValues=skills.filter(skill=>skill.kind==='Current grade').flatMap(skill=>skill.values);
 const proficiency=averageLevel(topicSkillValues);
 const levels=averageLevelsByStudent(rows,studentIds.length);
 const hasMastery=levels.some(Boolean);
 return <section ref={summaryRef} className="tp-dashboard" aria-label="Topic summary">
  <div className={`tp-dashboard-body tp-topic-summary ${individual?'tp-student-summary-body':''} ${recommendations?'':'tp-summary-full'}`}>
   <div className="tp-topic-summary-metrics">
    <h3>Topic summary</h3>
    {individual?<StudentLearningTiles levels={rows.flat()} collected={topicSkillValues.filter(level=>level>=4).length}
     skillCount={topicSkillValues.length} prerequisites={skills.filter(skill=>skill.kind==='Prerequisite').map(skill=>skill.values[0])}/>:<div className="tp-insight-values">
     <SummaryTile label={<><span className="tp-sr">Introduced </span>Subtopics</>} icon="subtopics" value={`${topic.introduced} of ${rows.length}`}/>
     <SummaryTile label={<>Avg skill proficiency <Help label="About average skill proficiency">Mean proficiency across topic skills with available results.</Help></>} icon="skills" value={proficiency?`${masteryScore(proficiency)} / 100`:'No evidence'}/>
     <MasteryAverageTile values={levels} label="Mastery average"/>
    </div>}
   </div>
   {recommendations}
   {(!individual&&hasMastery||readinessPanel)&&<div className="tp-topic-summary-evidence">
   {!individual&&hasMastery&&<section className="tp-topic-distribution">
     <div className="tp-topic-distribution-heading">
      <h3>Topic mastery <Help label="About topic mastery">Each student’s average uses subtopics with results. Students with no results are shown as No evidence.</Help></h3>
     </div>
     <Distribution subject={topic.name} values={levels.map(Math.floor)}/>
   </section>}
   {readinessPanel}
   </div>}
  </div>
 </section>;
}
