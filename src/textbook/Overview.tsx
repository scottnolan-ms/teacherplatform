import {useState} from 'react';
import {OverviewStudents} from './OverviewStudents';
import type {ReactNode} from 'react';
import type {DashboardClass} from '../dashboard/model';
import {topics as bookTopics} from '../dashboard/model';
import {AverageMastery,Distribution,ProgressKey,SubtopicFlag,TopicEyebrow} from './EvidenceUI';
import {averageLevel,averageLevelsByStudent,DEMO_DATE,pageRanges,paceStatus,shortDate,subtopicComplete} from './model';
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
 const results=new Map(plan.topics.map(topic=>{
  const subtopics=topic.subtopics.map((_,index)=>values(topic,index));
  return [topic.name,{subtopics,averages:averageLevelsByStudent(subtopics,roster.length)}];
 }));
 const total=plan.topics.reduce((sum,topic)=>sum+topic.subtopics.length,0);
 const allSubtopics=[...results.values()].flatMap(result=>result.subtopics);
 const completed=allSubtopics.filter(subtopicComplete).length;
 const learning=averageLevelsByStudent(allSubtopics,roster.length);
 const familiar=[...results.values()].filter(result=>averageLevel(result.averages)>=3).length;
 const focus=plan.topics.find(topic=>topic.name===plan.focus);
 const focusResults=focus?results.get(focus.name)?.averages??[]:learning;
 const support=focusResults.filter(level=>level>0&&level<3).length;
 const paceLabel=(t:TopicPlan)=>{const p=paceStatus(t);return p.status==='Behind'?`Behind by ${-p.delta}`:p.status==='Ahead'?`Ahead by ${p.delta}`:p.status};
 return <>
  <section className="tp-dashboard tp-dashboard-wide" aria-label="Textbook dashboard">
   <div className={open?'tp-dashboard-heading':'tp-dashboard-heading closed'}><button className="tp-dashboard-toggle" aria-expanded={open} onClick={()=>setOpen(!open)}><span className="tp-disclosure-icon" aria-hidden="true"/>Textbook summary</button><div>{!open&&<span className="tp-muted">{completed} of {total} subtopics completed</span>}<span className="tp-muted">Teaching plan · {shortDate(DEMO_DATE)}</span></div></div>
   {open&&<div className="tp-dashboard-body">
    <div className="tp-overview-summary"><div><h3>Summary</h3><div className="tp-insight-values">
     <div><span>{individual?'Mastery':'Class mastery'}</span><AverageMastery values={learning} individual={individual} noun="textbook" small/><small>Across the textbook</small></div>
     <div><span>Topics at Familiar or above</span><strong>{icon('recommendations/progress')}{familiar} of {plan.topics.length}</strong></div>
     <div><span>Subtopics completed</span><strong><SubtopicFlag/>{completed} of {total}</strong><small>{individual?'Familiar or above':'A majority of students are Familiar or above'}</small></div>
     {!individual&&<div><span>May need support</span><strong>{icon('recommendations/students')}{support} of {roster.length}</strong><small>{focus?`Below Familiar in ${focus.name}`:'Below Familiar across the textbook'}</small></div>}
    </div></div>{recommendations}</div>
   </div>}
  </section>
  <section className="tp-sequence">
   <div className="tp-overview-toolbar">
   {!individual&&<div className="tc-report-tabs tp-detail-nav" role="tablist" aria-label="Textbook overview">
    {(['Topics','Students'] as const).map((view,index)=><button key={view} id={`tp-overview-${view}`} role="tab" aria-controls="tp-overview-panel" aria-selected={tab===view} className={tab===view?'active':undefined} tabIndex={tab===view?0:-1} onClick={()=>setTab(view)} onKeyDown={event=>{
     if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
     event.preventDefault();
     const next=event.key==='Home'?0:event.key==='End'?1:1-index;
     setTab(next?'Students':'Topics');
     event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus();
    }}><i className="tc-report-tab-icon" aria-hidden="true" style={{maskImage:`url(/assets/${view==='Topics'?'dashboard/lesson':'report-controls/students'}.svg)`}}/>{view==='Topics'?'Topic sequence':`Students (${roster.length})`}</button>)}
   </div>}
    <div className="tp-overview-tools">
     <ProgressKey scope="mastery"/>
     <button className="tp-primary tp-assign-button" type="button" onClick={()=>onBuild()}><span aria-hidden="true">+</span> Assign</button>
    </div>
   </div>
   <div id="tp-overview-panel" role={individual?undefined:'tabpanel'} aria-labelledby={individual?undefined:`tp-overview-${tab}`}>
   {showStudents?<OverviewStudents item={item} topics={ordered} roster={roster} number={(_,index)=>order==='sequence'?index+1:chapter(ordered[index])} onTopic={onTopic} onStudent={onStudent}/>:<>
   <div className="tp-table-wrap"><table className={`tp-table tp-overview-table tp-overview-pacing-${pacingLayout} ${individual?'tp-individual-overview':''}`}><colgroup><col className="tp-overview-topic"/><col className="tp-overview-teaching"/><col className="tp-overview-pacing"/>{!individual&&<col className="tp-overview-average"/>}<col/><col className="tp-overview-tasks"/><col className="tp-overview-actions"/></colgroup><thead><tr><th>Topic</th><th aria-label="Subtopics introduced"><span className="tp-subtopic-count"><SubtopicFlag/>Subtopics</span></th><th>Pacing</th>{!individual&&<th>Average mastery</th>}<th className={individual?undefined:'tp-class-mastery-cell'}>{individual?'Mastery':'Class mastery'}</th><th>Tasks</th><th>Actions</th></tr></thead><tbody>{ordered.map(t=>{
    const seq=plan.topics.indexOf(t)+1,ch=chapter(t),p=paceStatus(t),count=taskCount(t.name),averages=results.get(t.name)?.averages??[];
    return <tr key={t.name} className={t.name===plan.focus?'tp-topic-row tp-current-row':'tp-topic-row'}>
     <td><div className="tp-topic-cell">{hasSequence&&<span className="tp-number" title="Position in your scope and sequence" data-row-tooltip>{String(seq).padStart(2,'0')}</span>}<div><TopicEyebrow number={ch} pages={pages.get(t.name)} focus={t.name===plan.focus}/><strong className="tp-overview-topic-name">{t.name}</strong><button className="tp-topic-link" aria-label={`Open topic ${t.name}`} onClick={()=>onTopic(t.name)}/></div></div></td>
     <td>{t.introduced} of {t.subtopics.length}</td>
     <td><div className="tp-overview-pace"><span className={`tp-pace tp-pace-${p.status.toLowerCase().replace(' ','-')}`}>{paceLabel(t)}</span><small>{t.start&&t.end?`${shortDate(t.start)} – ${shortDate(t.end)}`:'No dates set'}</small></div></td>
     {!individual&&<td><AverageMastery noun="topic" values={averages} small/></td>}
     <td className={individual?undefined:'tp-class-mastery-cell'}>{individual?<AverageMastery noun="topic" values={averages} individual small/>:<>{averages.some(Boolean)?<Distribution subject={t.name} values={averages.map(Math.floor)}/>:<span className="tp-muted" aria-label="No class distribution">—</span>}</>}</td>
     <td>{count||'—'}</td>
     <td><button type="button" className="tp-overview-assign" aria-label={`Assign a task for ${t.name}`} onClick={()=>onBuild(t)}><i aria-hidden="true"/>Assign</button></td>
    </tr>})}</tbody></table></div>
   </>}
   </div>
  </section>
 </>;
}
