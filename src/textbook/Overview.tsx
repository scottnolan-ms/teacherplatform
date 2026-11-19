import {useState} from 'react';
import {OverviewStudents} from './OverviewStudents';
import type {ReactNode} from 'react';
import type {DashboardClass} from '../dashboard/model';
import {topics as bookTopics} from '../dashboard/model';
import {AverageMastery,Distribution,ProgressKey,TopicEyebrow} from './EvidenceUI';
import {averageLevel,averageLevelsByStudent,DEMO_DATE,masteryScore,pageRanges,paceStatus,shortDate,subtopicComplete} from './model';
import type {Learner,Plan,TopicPlan} from './model';

type Props={item:DashboardClass;plan:Plan;roster:Learner[];individual:boolean;values:(t:TopicPlan,index:number,people?:Learner[])=>number[];onTopic:(name:string)=>void;onStudent:(id:string,topic?:string)=>void;order:'sequence'|'textbook';hasSequence:boolean;pacingLayout:'inline'|'stacked';onBuild:(topic?:TopicPlan)=>void;recommendations:ReactNode;taskCount:(name:string)=>number};
const icon=(name:string)=><i className="rc-icon" aria-hidden="true" style={{maskImage:`url(/assets/${name}.svg)`}}/>;

// Overview: where the class is in the textbook, how that compares with the plan, and how learning looks along the way.
export function Overview({item,plan,roster,individual,values,onTopic,onStudent,order,hasSequence,pacingLayout,onBuild,recommendations,taskCount}:Props){
 const [open,setOpen]=useState(true);
 const [tab,setTab]=useState<'Topics'|'Students'>('Topics');
 const showStudents=!individual&&tab==='Students';
 const book=item.textbook?.topics??bookTopics;
 const chapter=(t:TopicPlan)=>{const i=book.indexOf(t.name);return i<0?plan.topics.length:i+1};
 const pages=pageRanges(plan.topics,book);
 const ordered=order==='sequence'?plan.topics:[...plan.topics].sort((a,b)=>chapter(a)-chapter(b));
 // Learning is read from introduced subtopics; a topic not yet started falls back to any evidence it has.
 const scope=(t:TopicPlan)=>t.subtopics.map((_,j)=>j).filter(j=>!t.introduced||j<t.introduced);
 const total=plan.topics.reduce((n,t)=>n+t.subtopics.length,0);
 const completed=plan.topics.reduce((n,t)=>n+t.subtopics.filter((_,i)=>subtopicComplete(values(t,i))).length,0);
 const taught=plan.topics.filter(t=>t.introduced>0);
 const learning=taught.flatMap(t=>scope(t).flatMap(j=>values(t,j)));
 const focus=plan.topics.find(t=>t.name===plan.focus);
 // Support is counted in the topic focus, where a whole-book average would hide current difficulty.
 const support=roster.filter(s=>{const m=averageLevel((focus?[focus]:taught).flatMap(t=>scope(t).map(j=>values(t,j,[s])[0])));return m>0&&m<3}).length;
 const paceLabel=(t:TopicPlan)=>{const p=paceStatus(t);return p.status==='Behind'?`Behind by ${-p.delta}`:p.status==='Ahead'?`Ahead by ${p.delta}`:p.status};
 return <>
  <section className="tp-dashboard tp-dashboard-wide" aria-label="Textbook dashboard">
   <div className={open?'tp-dashboard-heading':'tp-dashboard-heading closed'}><button className="tp-dashboard-toggle" aria-expanded={open} onClick={()=>setOpen(!open)}><span className={open?'tp-chevron open':'tp-chevron'} aria-hidden="true">›</span>Textbook dashboard</button><div>{!open&&<span className="tp-muted">{completed} / {total} subtopics completed</span>}<span className="tp-muted">As at {shortDate(DEMO_DATE)}</span></div></div>
   {open&&<div className="tp-dashboard-body">
    <div className="tp-overview-summary"><div><h3>Summary</h3><div className="tp-insight-values">
     <div><span>{individual?'Class topics taught':'Topics taught'}</span><strong>{icon('recommendations/progress')}{plan.topics.filter(t=>t.state==='Taught').length} / {plan.topics.length}</strong><small>{plan.topics.filter(t=>t.state==='Teaching').length} in progress</small></div>
     <div><span>Subtopics completed</span><strong>{icon('report-header/questions')}{completed} / {total}</strong><small>{individual?'Familiar or above':'A majority of students are Familiar or above'}</small></div>
     <div><span>{individual?'Mastery':'Class mastery'}</span><strong>{icon('report-header/skills')}{averageLevel(learning)?`${masteryScore(averageLevel(learning))} / 100`:'—'}</strong><small>Across introduced subtopics</small></div>
     {individual?<div><span>Proficient or mastered</span><strong>{icon('recommendations/results')}{learning.filter(v=>v>=4).length} / {learning.length}</strong><small>Introduced subtopics</small></div>:<div><span>May need support</span><strong>{icon('recommendations/students')}{support} / {roster.length}</strong><small>{focus?'Averaging below Familiar in the topic focus':'Students averaging below Familiar'}</small></div>}
    </div></div>{recommendations}</div>
   </div>}
  </section>
  <section className="tp-sequence">
   {!individual&&<div className="tc-report-tabs tp-detail-nav" role="tablist" aria-label="Textbook overview">
    {(['Topics','Students'] as const).map((view,index)=><button key={view} id={`tp-overview-${view}`} role="tab" aria-controls="tp-overview-panel" aria-selected={tab===view} className={tab===view?'active':undefined} tabIndex={tab===view?0:-1} onClick={()=>setTab(view)} onKeyDown={event=>{
     if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
     event.preventDefault();
     const next=event.key==='Home'?0:event.key==='End'?1:1-index;
     setTab(next?'Students':'Topics');
     event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus();
    }}><i className="tc-report-tab-icon" aria-hidden="true" style={{maskImage:`url(/assets/${view==='Topics'?'dashboard/lesson':'report-controls/students'}.svg)`}}/>{view==='Topics'?'Topic sequence':`Students (${roster.length})`}</button>)}
   </div>}
   <div id="tp-overview-panel" role={individual?undefined:'tabpanel'} aria-labelledby={individual?undefined:`tp-overview-${tab}`}>
   {showStudents?<OverviewStudents item={item} topics={ordered} roster={roster} number={(_,index)=>order==='sequence'?index+1:chapter(ordered[index])} onTopic={onTopic} onStudent={onStudent}/>:<><div className="tp-section-title"><div><h3>{order==='sequence'?'Class topic sequence':'Textbook order'}</h3><p>{order==='sequence'?'Your order of teaching, with pacing against your plan and learning so far.':'Topics in the order they appear in the textbook.'}</p></div><button className="tp-outline" onClick={()=>onBuild()}>Build a task</button></div>
   <div className="tp-key-toolbar"><ProgressKey scope="mastery"/></div>
   <div className="tp-table-wrap"><table className={`tp-table tp-overview-table tp-overview-pacing-${pacingLayout} ${individual?'tp-individual-overview':''}`}><colgroup><col className="tp-overview-topic"/><col className="tp-overview-teaching"/><col className="tp-overview-pacing"/>{!individual&&<col className="tp-overview-average"/>}<col/><col className="tp-overview-tasks"/><col className="tp-overview-actions"/></colgroup><thead><tr><th>Topic</th><th>Subtopics<small>Introduced</small></th><th>Pacing</th>{!individual&&<th>Average mastery<small>Introduced subtopics</small></th>}<th className={individual?undefined:'tp-class-mastery-cell'}>{individual?'Mastery':'Class mastery'}<small>{individual?'Average level':'Students by average level'} · introduced subtopics</small></th><th>Tasks</th><th>Actions</th></tr></thead><tbody>{ordered.map(t=>{
    const seq=plan.topics.indexOf(t)+1,ch=chapter(t),p=paceStatus(t),count=taskCount(t.name),averages=averageLevelsByStudent(scope(t).map(i=>values(t,i)),roster.length);
    return <tr key={t.name} className={t.name===plan.focus?'tp-topic-row tp-current-row':'tp-topic-row'}>
     <td><div className="tp-topic-cell">{hasSequence&&<span className="tp-number" title="Position in your scope and sequence" data-row-tooltip>{String(seq).padStart(2,'0')}</span>}<div><TopicEyebrow number={ch} pages={pages.get(t.name)} focus={t.name===plan.focus}/><strong className="tp-overview-topic-name">{t.name}</strong><button className="tp-topic-link" aria-label={`Open topic ${t.name}`} onClick={()=>onTopic(t.name)}/></div></div></td>
     <td>{t.introduced} of {t.subtopics.length}</td>
     <td><div className="tp-overview-pace"><span className={`tp-pace tp-pace-${p.status.toLowerCase().replace(' ','-')}`}>{paceLabel(t)}</span><small>{t.start&&t.end?`${shortDate(t.start)} – ${shortDate(t.end)}`:'No dates set'}</small></div></td>
     {!individual&&<td>{averages.some(v=>v>0)?<AverageMastery noun="topic" values={averages} small/>:<span className="tp-muted">—</span>}</td>}
     <td className={individual?undefined:'tp-class-mastery-cell'}>{individual?<AverageMastery noun="topic" values={scope(t).map(j=>values(t,j)[0])} individual small/>:<Distribution subject={t.name} values={averages.map(Math.floor)}/>}</td>
     <td>{count||'—'}</td>
     <td><button type="button" className="tp-overview-assign" aria-label={`Assign a task for ${t.name}`} onClick={()=>onBuild(t)}><i aria-hidden="true"/>Assign</button></td>
    </tr>})}</tbody></table></div>
   </>}
   </div>
  </section>
 </>;
}
