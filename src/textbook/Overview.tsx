import {useState} from 'react';
import type {DashboardClass} from '../dashboard/model';
import {topics as bookTopics} from '../dashboard/model';
import {AverageMastery,Distribution,Level,MasteryKey,TopicEyebrow} from './EvidenceUI';
import {DEMO_DATE,masteryScore,pageRanges,paceStatus,plannedBy,shortDate,taskTopic} from './model';
import type {Learner,Plan,TopicPlan} from './model';

type Props={item:DashboardClass;plan:Plan;roster:Learner[];individual:boolean;values:(t:TopicPlan,index:number,people?:Learner[])=>number[];onTopic:(name:string)=>void;order:'sequence'|'textbook';hasSequence:boolean};
const DAY=86400000;
const mean=(v:number[])=>{const known=v.filter(n=>n>0);return known.length?known.reduce((a,b)=>a+b,0)/known.length:0};
const icon=(name:string)=><i className="rc-icon" aria-hidden="true" style={{maskImage:`url(/assets/${name}.svg)`}}/>;

// Overview: where the class is in the textbook, how that compares with the plan, and how learning looks along the way.
export function Overview({item,plan,roster,individual,values,onTopic,order,hasSequence}:Props){
 const [open,setOpen]=useState(true);
 const book=item.textbook?.topics??bookTopics;
 const chapter=(t:TopicPlan)=>{const i=book.indexOf(t.name);return i<0?plan.topics.length:i+1};
 const pages=pageRanges(plan.topics,book);
 const ordered=order==='sequence'?plan.topics:[...plan.topics].sort((a,b)=>chapter(a)-chapter(b));
 // Learning is read from introduced subtopics; a topic not yet started falls back to any evidence it has.
 const scope=(t:TopicPlan)=>t.subtopics.map((_,j)=>j).filter(j=>!t.introduced||j<t.introduced);
 const studentLevel=(t:TopicPlan,s:Learner)=>Math.floor(mean(scope(t).map(j=>values(t,j,[s])[0])));
 const introduced=plan.topics.reduce((n,t)=>n+t.introduced,0),total=plan.topics.reduce((n,t)=>n+t.subtopics.length,0);
 const dated=plan.topics.filter(t=>t.start&&t.end);
 const expected=plan.topics.reduce((n,t)=>n+plannedBy(t),0),delta=introduced-expected;
 const firstStart=dated.length?Math.min(...dated.map(t=>Date.parse(t.start))):NaN,plannedEnd=dated.length?[...dated.map(t=>t.end)].sort().at(-1)!:'';
 const elapsed=(Date.parse(DEMO_DATE)-firstStart)/DAY;
 const forecast=dated.length&&introduced>0&&elapsed>0?new Date(Date.parse(DEMO_DATE)+(total-introduced)/(introduced/elapsed)*DAY).toISOString().slice(0,10):'';
 const weeksLate=forecast&&plannedEnd?Math.round((Date.parse(forecast)-Date.parse(plannedEnd))/DAY/7):0;
 const taught=plan.topics.filter(t=>t.introduced>0);
 const learning=taught.flatMap(t=>scope(t).flatMap(j=>values(t,j)));
 const focus=plan.topics.find(t=>t.name===plan.focus);
 // Support is counted in the topic focus, where a whole-book average would hide current difficulty.
 const support=roster.filter(s=>{const m=mean((focus?[focus]:taught).flatMap(t=>scope(t).map(j=>values(t,j,[s])[0])));return m>0&&m<3}).length;
 const tasks=(t:TopicPlan)=>item.tasks.filter(k=>taskTopic(k.title,plan.topics)===t.name).length;
 const paceLabel=(t:TopicPlan)=>{const p=paceStatus(t);return p.status==='Behind'?`Behind by ${-p.delta}`:p.status==='Ahead'?`Ahead by ${p.delta}`:p.status};
 return <>
  <section className="tp-dashboard tp-dashboard-wide" aria-label="Textbook dashboard">
   <div className={open?'tp-dashboard-heading':'tp-dashboard-heading closed'}><button className="tp-dashboard-toggle" aria-expanded={open} onClick={()=>setOpen(!open)}><span className={open?'tp-chevron open':'tp-chevron'} aria-hidden="true">›</span>Textbook dashboard</button><div>{!open&&<span className="tp-muted">{introduced} / {total} subtopics introduced{dated.length?` · ${delta<0?`${-delta} behind plan`:delta>0?`${delta} ahead of plan`:'on track'}`:''}</span>}<span className="tp-muted">As at {shortDate(DEMO_DATE)}</span></div></div>
   {open&&<div className="tp-dashboard-body">
    <div><h3>Summary</h3><div className="tp-insight-values">
     <div><span>Topics taught</span><strong>{icon('recommendations/progress')}{plan.topics.filter(t=>t.state==='Taught').length} / {plan.topics.length}</strong><small>{plan.topics.filter(t=>t.state==='Teaching').length} in progress</small></div>
     <div><span>Subtopics introduced</span><strong>{icon('report-header/questions')}{introduced} / {total}</strong><small>{dated.length?`${expected} planned by ${shortDate(DEMO_DATE)}`:'Add plan dates to compare'}</small></div>
     <div><span>Pacing</span><strong>{icon('recommendations/time')}{!dated.length?'—':delta<0?`${-delta} behind`:delta>0?`${delta} ahead`:'On track'}</strong><small>{dated.length?'Subtopics against your plan':'Add plan dates to see pacing'}</small></div>
     <div><span>Forecast finish</span><strong>{icon('recommendations/time')}{forecast?shortDate(forecast,true):'—'}</strong><small>{!forecast?'Needs plan dates and coverage':`Planned ${shortDate(plannedEnd,true)}${weeksLate>0?` · ${weeksLate} wk later`:weeksLate<0?` · ${-weeksLate} wk earlier`:''}`}</small></div>
     <div><span>{individual?'Mastery':'Class mastery'}</span><strong>{icon('report-header/skills')}{mean(learning)?`${masteryScore(mean(learning))} / 100`:'—'}</strong><small>Across introduced subtopics</small></div>
     {individual?<div><span>Proficient or mastered</span><strong>{icon('recommendations/results')}{learning.filter(v=>v>=4).length} / {learning.length}</strong><small>Introduced subtopics</small></div>:<div><span>May need support</span><strong>{icon('recommendations/students')}{support} / {roster.length}</strong><small>{focus?'Averaging below Familiar in the topic focus':'Students averaging below Familiar'}</small></div>}
    </div></div>
    <div><h3>{order==='sequence'&&hasSequence?'Journey through your sequence':'Journey through the textbook'}</h3><div className="tp-journey">{ordered.map(t=>{const n=t.subtopics.length,label=order==='sequence'&&hasSequence?plan.topics.indexOf(t)+1:chapter(t);return <button key={t.name} className={t.name===plan.focus?'focus':''} style={{flex:n}} title={`${t.name} · ${t.introduced} of ${n} subtopics introduced`} aria-label={`${label}. ${t.name}: ${t.name===plan.focus?'topic focus, ':''}${t.introduced} of ${n} subtopics introduced`} onClick={()=>onTopic(t.name)}><span><i style={{width:`${n?t.introduced/n*100:0}%`}}/></span><small>{label}{order==='sequence'&&hasSequence&&<em>T{chapter(t)}</em>}</small></button>})}</div><p className="tp-journey-key">{order==='sequence'&&hasSequence?'Topics run in your teaching order; the smaller T number is the topic’s place in the textbook. ':''}Each segment is a topic, sized by its subtopics and filled as they are introduced. The ring marks the topic focus. Select a topic to open it.</p></div>
   </div>}
  </section>
  <section className="tp-sequence"><div className="tp-section-title"><div><h3>{order==='sequence'?'Class topic sequence':'Textbook order'}</h3><p>{order==='sequence'?'Your order of teaching, with pacing against your plan and learning so far.':'Topics in the order they appear in the textbook.'}</p></div></div>
   <MasteryKey/>
   <div className="tp-table-wrap"><table className="tp-table tp-overview-table"><thead><tr><th>Topic</th><th>Teaching</th><th>Pacing</th>{!individual&&<th>Average mastery<small>Introduced subtopics</small></th>}<th>{individual?'Mastery':'Class mastery'}<small>{individual?'Average level':'Students by average level'} · introduced subtopics</small></th><th>Tasks</th></tr></thead><tbody>{ordered.map(t=>{
    const seq=plan.topics.indexOf(t)+1,ch=chapter(t),p=paceStatus(t),count=tasks(t),levels=roster.map(s=>studentLevel(t,s));
    return <tr key={t.name} className={t.name===plan.focus?'tp-current-row':''}>
     <td><div className="tp-topic-cell">{hasSequence&&<span className="tp-number" title="Position in your scope and sequence">{String(seq).padStart(2,'0')}</span>}<div><TopicEyebrow number={ch} pages={pages.get(t.name)}/><button className="tp-topic-link" onClick={()=>onTopic(t.name)}><strong>{t.name}</strong></button><small>{t.subtopics.length} subtopics{t.name===plan.focus?' • Current focus':''}</small></div></div></td>
     <td><span className={`tp-tag ${t.name===plan.focus?'tp-focus-tag':t.state==='Taught'?'tp-taught':''}`}>{t.name===plan.focus?'Teaching · focus':t.state}</span><small>{t.introduced} / {t.subtopics.length} introduced</small></td>
     <td><span className={`tp-pace tp-pace-${p.status.toLowerCase().replace(' ','-')}`}>{paceLabel(t)}</span><small>{t.start&&t.end?`${shortDate(t.start)} – ${shortDate(t.end)}`:'No dates set'}</small></td>
     {!individual&&<td>{levels.some(v=>v>0)?<AverageMastery noun="topic" values={roster.map(st=>mean(scope(t).map(j=>values(t,j,[st])[0])))}/>:<span className="tp-muted">—</span>}</td>}
     <td>{levels.some(v=>v>0)?individual?<Level value={levels[0]??0}/>:<Distribution subject={t.name} values={levels}/>:<span className="tp-muted">No evidence yet</span>}</td>
     <td>{count||'—'}</td>
    </tr>})}</tbody></table></div>
  </section>
 </>;
}
