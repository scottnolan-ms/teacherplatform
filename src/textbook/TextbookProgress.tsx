import {Fragment,useEffect,useRef,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import type {DashboardClass,DemoTask} from '../dashboard/model';
import {loadDashboard,saveDashboard,topics as bookTopics} from '../dashboard/model';
import {loadData} from '../data/storage';
import {DEMO_DATE,pageRanges,paceStatus,readiness,refreshFeaturedJourney,seedPlan,snapshot,subtopicSkills,taskTopic} from './model';
import ClassTaskList from '../dashboard/ClassTaskList';
import {SkillsMatrix} from '../test-controls/SkillsMatrix';
import type {Learner,Plan,TopicPlan} from './model';
import './textbook.css';
import {TopicRecommendations} from './TopicRecommendations';
import StudentProgressSheet from './StudentProgressSheet';
import {DesignOptions,PrototypeControls} from '../test-controls/DesignOptions';
import {EvidenceOptions,masteryPalette,masteryPalettes} from './distribution-options';
import type {DistributionLayout,EvidenceScenario} from './distribution-options';

import {TopicTable,SkillsTable,TopicSummary} from './TopicTools';
import type {ContextAction} from './TopicTools';
import {prerequisiteValues,subtopicValues,topicSkillRows} from './learning-data';
import {TeachingPreview} from './FollowUp';
import {Overview} from './Overview';
import {ProgressKey} from './EvidenceUI';
import {TopicTaskReport} from './TopicTaskReport';
import ScopeSequenceSheet from './ScopeSequence';
import TopicSheet from './TopicSheet';
import {TopicHeader} from './TopicHeader';
import {ReadinessChip,ReadinessPanel} from './ReadinessPanel';
import {TaskBuilder,TextbookAssignments} from './TaskBuilder';
import type {Assignment,Draft} from './TaskBuilder';

function readSaved<T>(key:string,fallback:T):T {
 try {
  return JSON.parse(localStorage.getItem(key)??'null')??fallback;
 } catch {
  return fallback;
 }
}

const topicTabIcons={
 Subtopics:'dashboard/lesson',
 Students:'report-controls/students',
 Skills:'report-header/skills',
 Tasks:'dashboard/task-empty',
} as const;

const skillsFor=(topic:TopicPlan)=>[...new Set(topic.subtopics.flatMap(subtopicSkills))];

export default function TextbookProgress({item,learners,studentId}:{item:DashboardClass;learners:Learner[];studentId?:string}){
 const [preview,setPreview]=useState<ContextAction|null>(null);
 const [growthOn,setGrowthOn]=useState(false),[since,setSince]=useState('2026-10-09'),[sort,setSort]=useState('name');
 const [params,setParams]=useSearchParams();
 // Design states can be linked directly: ?header=bar, ?demo=sequence,nofocus and ?subtopic=<index>.
 const [header,setHeader]=useState<'card'|'bar'>(params.get('header')==='bar'?'bar':'card'),demo=(params.get('demo')??'').split(',');
 // Where the My sequence / Textbook switch sits: ?order=menu (dropdown in the page title, the default), title (toggle in the title) or toggle (beside the view toggle).
 const [orderUI,setOrderUI]=useState<'toggle'|'title'|'menu'>(()=>{const v=params.get('order');return v==='title'||v==='toggle'?v:'menu'});
 const [layout,setLayout]=useState<DistributionLayout>('symbols'),[scenario,setScenario]=useState<EvidenceScenario>('current');
 const [pacingLayout,setPacingLayout]=useState<'inline'|'stacked'>(()=>params.get('pacing')==='stacked'?'stacked':'inline');
 const [masteryColours,setMasteryColours]=useState(()=>masteryPalette(params.get('mastery')));
 const [hideCounts,setHideCounts]=useState(()=>params.get('segmentCounts')==='hidden');
 const [subtleExpanded,setSubtleExpanded]=useState(()=>params.get('expandedMastery')==='neutral');
 const summaryRef=useRef<HTMLElement>(null);
 const storageKey=`textbook-plan-v1-${item.id}`;
 const [plan,setPlan]=useState<Plan>(()=>{
  const seed=seedPlan(item);
  const featuredJourney=demo.includes('sequence')&&item.id==='dash-7a'&&!item.textbook;
  let saved=featuredJourney?seedPlan({...item,focus:{topic:'Decimals and percentages',end:'',done:3,total:5,pace:'On track'}}):readSaved<Plan>(storageKey,seed);
  if(!featuredJourney&&item.id==='dash-7a'&&!item.textbook)saved=refreshFeaturedJourney(saved,seed);
  // Plans saved before illustrative dates existed pick them up by topic name.
  if(!saved.topics.some(t=>t.start||t.end))saved={...saved,topics:saved.topics.map(t=>{const s=seed.topics.find(x=>x.name===t.name);return s?{...t,start:s.start,end:s.end}:t})};
  // The dashboard remains the source for an externally changed topic focus.
  if(!featuredJourney&&item.focus&&item.focus.topic!==saved.focus&&saved.topics.some(t=>t.name===item.focus?.topic))saved={...saved,focus:item.focus.topic};
  // Linked demo states are shown without being saved.
  if(!featuredJourney&&demo.includes('sequence')&&saved.topics.length>7){const topics=[...saved.topics];[topics[6],topics[7]]=[topics[7],topics[6]];saved={...saved,topics}}
  if(demo.includes('nofocus'))saved={...saved,focus:''};
  return saved;
 });
 const [studentSheet,setStudentSheet]=useState<{id:string;learners:Learner[];topic?:string}|null>(null);
 const studentTrigger=useRef<HTMLElement|null>(null);
 const openStudent=(id:string,people:Learner[],topic?:string)=>{
  studentTrigger.current=document.activeElement as HTMLElement;
  setStudentSheet({id,learners:people,topic});
 };
 const closeStudent=()=>{
  setStudentSheet(null);
  requestAnimationFrame(()=>studentTrigger.current?.focus({preventScroll:true}));
 };
 const [reportTask,setReportTask]=useState<DemoTask|null>(null);
 const reportTrigger=useRef<HTMLElement|null>(null);
 const openReport=(task:DemoTask)=>{
  reportTrigger.current=document.activeElement as HTMLElement;
  setReportTask(task);
 };
 const closeReport=()=>{
  setReportTask(null);
  requestAnimationFrame(()=>reportTrigger.current?.focus({preventScroll:true}));
 };
 const [expandedSubtopic,setExpandedSubtopic]=useState<string[]>(()=>{const i=params.get('subtopic'),t=plan.topics.find(t=>t.name===params.get('topic')),s=i&&t?t.subtopics[Number(i)]:undefined;return s?[s]:[]});
 const [view,setView]=useState('Subtopics'),[filter,setFilter]=useState('All students'),[query,setQuery]=useState('');
 const [editPlan,setEditPlan]=useState(false),[order,setOrder]=useState<'sequence'|'textbook'>('sequence');
 const draftKey=`textbook-drafts-${item.id}`,assignmentKey=`textbook-assignments-${item.id}`;
 const [draft,setDraft]=useState<Draft|null>(null),[savedDrafts,setSavedDrafts]=useState<Draft[]>(()=>readSaved(draftKey,[]));
 const [assignments,setAssignments]=useState<Assignment[]>(()=>readSaved(assignmentKey,[]));
 const [notice,setNotice]=useState(''),[showAbout,setShowAbout]=useState(false);
 const topicParam=params.get('topic');
 const topic=plan.topics.find(t=>t.name===(topicParam==='focus'?plan.focus:topicParam));
 const focus=plan.topics.find(t=>t.name===plan.focus);
 const selected=learners.find(s=>s.id===studentId);
 const roster=selected?learners.filter(s=>s.id===selected.id):learners;
 // Topic focus is the full page for the current topic; any topic opened from the Overview is a sheet over it.
 const inSheet=!!topic&&topicParam!=='focus',page=inSheet?undefined:topic;
 const detail=topic;
 const values=(t:TopicPlan,index:number,people=roster)=>subtopicValues(item,t,index,people,scenario);
 const prerequisites=(t:TopicPlan,s:Learner)=>prerequisiteValues(item,t,s,scenario);
 const struggling=(t:TopicPlan)=>roster.filter(s=>prerequisites(t,s).some(v=>v>0&&v<3));
 const unchecked=(t:TopicPlan)=>roster.filter(s=>readiness(prerequisites(t,s))==='Unchecked');
 const [filterKind,filterIndex]=filter.split(':');
 const scopedSubtopic=filterIndex===undefined?undefined:topic?.subtopics[Number(filterIndex)];
 const visibleStudents=topic?roster.filter(student=>{
  if(!student.name.toLowerCase().includes(query.toLowerCase()))return false;
  if(filter==='All students'||filterKind==='sub')return true;
  if(filterKind==='support'||filterKind==='missing'){
   const [result]=values(topic,Number(filterIndex),[student]);
   return filterKind==='missing'?result===0:result>0&&result<3;
  }
  if(filter==='Prerequisite support')return prerequisites(topic,student).some(value=>value>0&&value<3);
  return readiness(prerequisites(topic,student))===filter;
 }):roster;
 const average=(v:number[])=>{const known=v.filter(n=>n>0);return known.length?known.reduce((a,b)=>a+b,0)/known.length:0};
 const assignedFor=(name:string)=>assignments.filter(task=>task.topic===name&&(!selected||task.students.includes(selected.id)));
 const studentTaskIds=selected?new Set(loadData().taskResults.filter(r=>r.perStudent.some(s=>s.studentId===selected.id)).map(r=>r.taskId)):null;
 const reportTasks=item.tasks.filter(t=>!studentTaskIds||studentTaskIds.has(t.id));
 const tasksFor=(name:string)=>reportTasks.filter(t=>taskTopic(t.title,plan.topics)===name);
 const topicTasks=topic?tasksFor(topic.name):[];
 const topicAssignments=topic?assignedFor(topic.name):[];
 const taskCount=(name:string)=>assignedFor(name).length+tasksFor(name).length;
 const goTopic=(name?:string)=>{const next=new URLSearchParams(params);if(name)next.set('topic',name);else next.delete('topic');next.delete('subtopic');setParams(next);if(name!==topicParam)setView('Subtopics');setFilter('All students');setQuery('');setExpandedSubtopic([])};
 const persistPlan=(next:Plan)=>{setPlan(next);try{localStorage.setItem(storageKey,JSON.stringify(next));const c=loadDashboard();saveDashboard(c.map(c=>c.id===item.id?{...c,focus:next.focus?{topic:next.focus,start:next.topics.find(t=>t.name===next.focus)?.start,end:next.topics.find(t=>t.name===next.focus)?.end??'',done:next.topics.find(t=>t.name===next.focus)?.introduced??0,total:next.topics.find(t=>t.name===next.focus)?.subtopics.length??0,pace:c.focus?.pace??'On track'}:null}:c))}catch{setNotice('Changes are available for this session. Browser storage is unavailable.')}};
 const setFocus=(t:TopicPlan)=>{persistPlan({...plan,focus:t.name,topics:plan.topics.map(p=>p.name===t.name?{...p,state:'Teaching'}:p)});setNotice(`${t.name} is now the class topic focus.`)};
 const investigate=(_t:TopicPlan,f:string)=>{setView('Students');setFilter(f)};
 const build=(t?:TopicPlan,kind='Topic practice',people=roster,content=t?skillsFor(t):[])=>{
  setDraft({id:crypto.randomUUID(),topic:t?.name??'',kind,students:people.map(s=>s.id),content:[...new Set(content)]});
 };
 const prepare=(t:TopicPlan,kind:string,people:Learner[])=>build(t,kind,people,kind==='Readiness check-in'?[...t.prerequisites]:t.prerequisites.filter((_,i)=>people.some(s=>prerequisites(t,s)[i]>0&&prerequisites(t,s)[i]<3)));
 const topicSkills=topic?topicSkillRows(item,topic,roster,scenario):[];
 const gridColumns=topicSkills.filter(skill=>skill.kind==='Current grade'&&(!scopedSubtopic||skill.subtopic===scopedSubtopic));
 const gridSkills=gridColumns.map(({code,name})=>({id:code,code,name}));
 const gridRows=visibleStudents.map(student=>{
  const index=roster.indexOf(student);
  const latest=gridColumns.map(skill=>skill.values[index]);
  const baseline=latest.map((value,j)=>growthOn&&since?snapshot(value,`${student.id}:${gridColumns[j].code}`,since)||value:value);
  return {id:student.id,name:student.name,values:latest,baseline};
 }).sort((a,b)=>{
  if(sort==='high')return average(b.values)-average(a.values);
  if(sort==='low')return average(a.values)-average(b.values);
  if(sort==='growth'){
   const gained=(row:typeof a)=>row.values.reduce((sum,value,i)=>sum+Math.max(0,value-row.baseline[i]),0);
   return gained(b)-gained(a);
  }
  return a.name.localeCompare(b.name);
 });
 const contextAction=(action:ContextAction)=>{if(!topic)return;if(action.kind.startsWith('Prepare')){setPreview(action);return}const relevant=topicSkills.filter(s=>action.skills.includes(s.name));const people=action.supportOnly?roster.filter((_,i)=>relevant.some(s=>s.values[i]>0&&s.values[i]<3)):roster;build(topic,action.supportOnly?'Targeted practice':'Topic practice',people,action.skills)};
 const modal=useRef<HTMLDialogElement>(null);
 const savePlan=(next:Plan)=>{persistPlan(next);setEditPlan(false);setNotice('Class teaching plan saved.')};
 const modalOpen=!!draft||showAbout;
 useEffect(()=>{if(modalOpen){const prior=document.activeElement as HTMLElement;const dialog=modal.current;dialog?.showModal();return()=>{dialog?.close();if(prior?.isConnected)prior.focus()}}},[modalOpen]);
 const closeModal=()=>{setDraft(null);setShowAbout(false)};
 const sameDraft=(a:Draft,b:Draft)=>(a.id??a.topic)===(b.id??b.topic);
 const saveDrafts=(next:Draft[])=>{
  setSavedDrafts(next);
  try{localStorage.setItem(draftKey,JSON.stringify(next));return true}catch{return false}
 };
 const saveDraft=()=>{
  if(!draft)return;
  const saved=saveDrafts([...savedDrafts.filter(d=>!sameDraft(d,draft)),draft]);
  setNotice(saved?'Task draft saved.':'Task draft kept for this session.');
  closeModal();
 };
 const assignTask=(title:string,due:string)=>{
  if(!draft)return;
  const task={...draft,id:draft.id??crypto.randomUUID(),title,due};
  const next=[...assignments.filter(a=>a.id!==task.id),task];
  setAssignments(next);
  let persisted=true;
  try{localStorage.setItem(assignmentKey,JSON.stringify(next))}catch{persisted=false}
  saveDrafts(savedDrafts.filter(d=>!sameDraft(d,draft)));
  setNotice(persisted?`“${title}” assigned to ${task.students.length} ${task.students.length===1?'student':'students'} in this prototype.`:`“${title}” assigned for this session.`);
  if(topic?.name===task.topic)setView('Tasks');
  closeModal();
 };
 const visibleDrafts=savedDrafts.filter(d=>!selected||d.students.length===1&&d.students[0]===selected.id);
 const practiceCandidates=(t:TopicPlan)=>t.subtopics.slice(0,t.introduced).map((name,index)=>{
  const row=values(t,index);
  return {t,name,index,people:roster.filter((_,i)=>row[i]>0&&row[i]<3),missing:roster.filter((_,i)=>row[i]===0)};
 });
 const practiceRecommendation=({t,name,people}:ReturnType<typeof practiceCandidates>[number],overview=false)=>({
  id:'topic',title:`Revisit ${name.toLowerCase()}`,
  description:selected?`${selected.name} is Exploring or Emerging in ${name.toLowerCase()}.`:`${people.length} of ${roster.length} students are Exploring or Emerging in ${name.toLowerCase()}${overview?` (${t.name})`:''}.`,
  action:'Review',icon:'progress',tone:'purple',
  review:()=>build(t,'Targeted practice',people,subtopicSkills(name)),
 });
 const recommendations=(t:TopicPlan)=>{
  const candidates=practiceCandidates(t);
  const priority=[...candidates].sort((a,b)=>b.people.length-a.people.length)[0];
  const missing=[...candidates].sort((a,b)=>b.missing.length-a.missing.length)[0];
  const items=[];
  if(priority?.people.length)items.push({...practiceRecommendation(priority),investigate:selected?undefined:()=>investigate(t,`support:${priority.index}`)});
  if(missing?.missing.length)items.push({
   id:'missing',title:`Check understanding of ${missing.name.toLowerCase()}`,
   description:selected?'There are no results for this introduced subtopic.':`${missing.missing.length} of ${roster.length} students have no results for this introduced subtopic.`,
   action:'Review',icon:'results',tone:'purple',reviewLabel:'Build check-in',
   review:()=>build(t,'Practice check-in',missing.missing,subtopicSkills(missing.name)),
   investigate:selected?undefined:()=>investigate(t,`missing:${missing.index}`),
  });
  if(!t.introduced){
   const support=struggling(t),unknown=unchecked(t);
   if(unknown.length)items.push({
    id:'unchecked',title:'Check prerequisite readiness',
    description:selected?'There is no prerequisite evidence yet.':`${unknown.length} of ${roster.length} students have unchecked readiness.`,
    action:'Review',icon:'results',tone:'purple',reviewLabel:'Build readiness check-in',
    review:()=>prepare(t,'Readiness check-in',unknown),investigate:selected?undefined:()=>investigate(t,'Unchecked'),
   });
   if(support.length)items.push({
    id:'prerequisites',title:'Practise prerequisite skills',
    description:selected?'Some prerequisite skills are at Exploring or Emerging.':`${support.length} of ${roster.length} students are Exploring or Emerging in at least one prerequisite.`,
    action:'Review',icon:'progress',tone:'purple',reviewLabel:'Build prerequisite practice',
    review:()=>prepare(t,'Targeted practice',support),investigate:selected?undefined:()=>investigate(t,'Prerequisite support'),
   });
  }
  if(!items.length&&roster.length){
   const next=t.subtopics[t.introduced];
   if(next)items.push({
    id:'next-subtopic',title:`Prepare ${next.toLowerCase()}`,
    description:'This is the next subtopic in the teaching plan.',
    action:'Review',icon:'progress',tone:'purple',reviewLabel:'Build a task',
    review:()=>build(t,'Topic practice',roster,subtopicSkills(next)),
   });
   else{
    const consolidate=candidates.map(candidate=>{
     const results=values(t,candidate.index);
     return {...candidate,people:roster.filter((_,i)=>results[i]===3)};
    }).sort((a,b)=>b.people.length-a.people.length)[0];
    if(consolidate?.people.length)items.push({
     id:'consolidate',title:`Consolidate ${consolidate.name.toLowerCase()}`,
     description:selected?'Mastery is Familiar for this subtopic.':`${consolidate.people.length} of ${roster.length} students are Familiar in this subtopic.`,
     action:'Review',icon:'progress',tone:'purple',reviewLabel:'Build practice',
     review:()=>build(t,'Topic practice',consolidate.people,subtopicSkills(consolidate.name)),
    });
    else if(candidates.length)items.push({
     id:'extend',title:'Extend learning in this topic',description:'All available subtopic results are Proficient or Mastered.',
     action:'Review',icon:'progress',tone:'purple',reviewLabel:'Build extension',
     review:()=>build(t,'Extension practice'),
    });
   }
  }
  return items.length?<TopicRecommendations key={`${t.name}:${scenario}`} topic={t.name} items={items} visibleCount={1}/>:null;
 };
 const overviewRecommendations=()=>{
  const candidates=plan.topics.flatMap(practiceCandidates);
  const priority=[...candidates].sort((a,b)=>b.people.length-a.people.length)[0];
  const missing=[...candidates].sort((a,b)=>b.missing.length-a.missing.length)[0];
  const items=[];
  if(priority?.people.length)items.push({...practiceRecommendation(priority,true),investigate:()=>goTopic(priority.t.name),investigateLabel:'Open topic'});
  if(missing?.missing.length)items.push({
   id:'coverage',title:`Check understanding of ${missing.name.toLowerCase()}`,
   description:selected?`${selected.name} has no results for this introduced subtopic.`:`${missing.missing.length} of ${roster.length} students have no results for this introduced subtopic in ${missing.t.name}.`,
   action:'Review',icon:'results',tone:'purple',review:()=>build(missing.t,'Practice check-in',missing.missing,subtopicSkills(missing.name)),
   investigate:()=>goTopic(missing.t.name),investigateLabel:'Open topic',reviewLabel:'Build check-in',
  });
  return <div className="tp-overview-recommendations"><TopicRecommendations visibleCount={1} topic={selected?`${selected.name} · Textbook progress`:'Textbook progress'} items={items}/></div>;
 };
 const draftList=visibleDrafts.length>0&&<details className="tp-saved-drafts"><summary>Saved task drafts ({visibleDrafts.length})</summary><ul>{visibleDrafts.map(d=><li key={d.id??d.topic}><button onClick={()=>setDraft(d)}>{d.title||`${d.topic} · ${d.kind.toLowerCase()}`}</button><button aria-label={`Discard draft for ${d.topic}`} onClick={()=>{saveDrafts(savedDrafts.filter(x=>!sameDraft(x,d)));setNotice('Task draft discarded.')}}>Discard</button></li>)}</ul></details>;
 const bookOrder=item.textbook?.topics??bookTopics;
 const chapter=(t:TopicPlan)=>{const i=bookOrder.indexOf(t.name);return i<0?plan.topics.length:i+1};
 // A class has its own sequence once its teaching order differs from the textbook's.
 const pages=pageRanges(plan.topics,bookOrder);
 const hasSequence=plan.topics.some((t,i)=>chapter(t)!==i+1),shownOrder=hasSequence?order:'textbook';
 const bookName=item.textbook?.name??`Australian Curriculum Year ${item.year}`,bookParts=bookName.match(/^(.*?)\s*((?:Year|Grade) \d+)\s*(.*)$/);
 const book=bookParts?{curriculum:bookParts[1]||'Textbook',grade:bookParts[2],edition:bookParts[3]||(item.textbook?'':'v9 2nd Edition')}:{curriculum:'Textbook',grade:bookName,edition:''};
 // The sheet's topic list mirrors the Overview: same order, with pacing and learning so a teacher can jump by need.
 const entries=inSheet?(shownOrder==='sequence'?plan.topics:[...plan.topics].sort((a,b)=>chapter(a)-chapter(b))).map(t=>{const p=paceStatus(t);return {name:t.name,label:hasSequence?String(plan.topics.indexOf(t)+1).padStart(2,'0'):'',number:chapter(t),pages:pages.get(t.name),introduced:t.introduced,total:t.subtopics.length,pace:p.status==='Behind'?`Behind by ${-p.delta}`:p.status==='Ahead'?`Ahead by ${p.delta}`:p.status,paceClass:`tp-pace-${p.status.toLowerCase().replace(' ','-')}`,average:average(t.subtopics.flatMap((_,j)=>!t.introduced||j<t.introduced?values(t,j):[])),focus:t.name===plan.focus}}):[];
 const topicHeader=topic&&<TopicHeader key={topicParam} topic={topic} sheet={inSheet} seq={hasSequence?plan.topics.indexOf(topic)+1:undefined} number={chapter(topic)} pages={pages.get(topic.name)} focused={topic.name===plan.focus} summaryRef={summaryRef} actions={<>
  {!studentId&&<button onClick={()=>setEditPlan(true)}>Edit plan</button>}
  {inSheet&&topic.name===plan.focus&&<button className="tp-outline" onClick={()=>goTopic('focus')}>Go to Topic focus →</button>}
  {!studentId&&topic.name!==plan.focus&&<button className="tp-outline" onClick={()=>setFocus(topic)}>Set as topic focus</button>}
 </>}/>;
 const summary=detail&&<TopicSummary summaryRef={summaryRef} studentIds={roster.map(s=>s.id)} topic={detail} rows={detail.subtopics.map((_,i)=>values(detail,i))} skills={topicSkills} onAction={contextAction} recommendations={recommendations(detail)} individual={!!selected}/>;
 const readinessPanel=topic&&(()=>{
  const support=struggling(topic),unknown=unchecked(topic);
  return <ReadinessPanel introduced={topic.introduced>0} statuses={roster.map(student=>readiness(prerequisites(topic,student)))} individual={selected?readiness(prerequisites(topic,selected)):undefined} onFilter={state=>investigate(topic,state)}>
   {(support.length>0||unknown.length>0)&&<div className="tp-readiness-actions">
    {support.length>0&&<button className="tp-outline" onClick={()=>prepare(topic,'Targeted practice',support)}>Build prerequisite practice</button>}
    {unknown.length>0&&<button className="tp-outline" onClick={()=>prepare(topic,'Readiness check-in',unknown)}>Build readiness check-in</button>}
   </div>}
  </ReadinessPanel>;
 })();
 const tabs: (keyof typeof topicTabIcons)[]=selected?['Subtopics','Skills','Tasks']:['Subtopics','Students','Skills','Tasks'];
 const legend=<ProgressKey scope={view==='Subtopics'?'both':'skill'}/>;
 const body=topic&&<>
   <div className="tc-report-tabs tp-detail-nav" role="tablist" aria-label="Topic progress">{tabs.map((v,i)=><button role="tab" className={view===v?'active':undefined} tabIndex={view===v?0:-1} onKeyDown={e=>{
    const n=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:-1;
    if(n>=0){e.preventDefault();setView(tabs[n]);setFilter('All students');e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]')[n]?.focus()}
   }} aria-selected={view===v} key={v} onClick={()=>{setView(v);setFilter('All students')}}><i className="tc-report-tab-icon" aria-hidden="true" style={{maskImage:`url(/assets/${topicTabIcons[v]}.svg)`}}/>{v}{v==='Students'?` (${roster.length})`:v==='Tasks'?` (${topicTasks.length+topicAssignments.length})`:''}</button>)}</div>
   {(view==='Skills'||view==='Students')&&<div className="tp-key-toolbar">{legend}</div>}
   {view==='Subtopics'&&<TopicTable topic={topic} pages={pages.get(topic.name)} values={i=>values(topic,i)} skills={topicSkills} expanded={expandedSubtopic} onExpand={setExpandedSubtopic} onAction={contextAction} legend={legend} individual={!!selected}/>}
   {view==='Skills'&&<SkillsTable skills={topicSkills} onAction={contextAction} individual={!!selected}/>}
   {view==='Tasks'&&<div className="tp-topic-tasks">
    <TextbookAssignments assignments={topicAssignments} learners={learners}/>
    {topicTasks.length?<ClassTaskList key={topic.name} showClassChrome={false} fullPage item={{...item,tasks:topicTasks}} onReport={openReport} onAssign={()=>build(topic)}/>:<div className="tp-empty">{!topicAssignments.length&&<h3>No tasks assigned for this topic yet</h3>}<button className="tp-outline" onClick={()=>build(topic)}>Build a task</button></div>}
   </div>}
   {!selected&&view==='Students'&&<div className="tp-students-grid"><div className="tp-filters"><div className="tp-toggle" role="group" aria-label="Growth indication">{[false,true].map(v=><button key={String(v)} className={growthOn===v?'active':''} aria-pressed={growthOn===v} onClick={()=>{setGrowthOn(v);if(!v&&sort==='growth')setSort('name')}}>{v?'Growth':'Latest'}</button>)}</div>{growthOn&&<label>Since<input type="date" min="2026-09-01" max={DEMO_DATE} value={since} onChange={e=>setSince(e.target.value)}/></label>}<label>Show<select value={filter} onChange={e=>setFilter(e.target.value)}>{['All students','Prerequisite support','Ready','Partially ready','Not ready','Unchecked',...topic.subtopics.map((_,i)=>`support:${i}`),...topic.subtopics.map((_,i)=>`missing:${i}`),...topic.subtopics.map((_,i)=>`sub:${i}`)].map(f=><option key={f} value={f}>{f.startsWith('support:')?`Needs practice: ${topic.subtopics[Number(f.slice(8))]}`:f.startsWith('missing:')?`No results: ${topic.subtopics[Number(f.slice(8))]}`:f.startsWith('sub:')?topic.subtopics[Number(f.slice(4))]:f}</option>)}</select></label><select aria-label="Sort students" value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Student: A–Z</option><option value="high">Proficiency: high–low</option><option value="low">Proficiency: low–high</option>{growthOn&&<option value="growth">Growth: most first</option>}</select><input aria-label="Search students" placeholder="Search students" value={query} onChange={e=>setQuery(e.target.value)}/></div>{growthOn&&<p className="tp-footnote">Green cells show levels gained since {new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${since||DEMO_DATE}T12:00:00Z`))}. A dash means no measured growth or no comparable earlier evidence. History is illustrative.</p>}<SkillsMatrix rows={gridRows} skills={gridSkills} total={roster.length} current={growthOn} countLabel="Proficient" readinessLabel="Readiness" averageLabel="Avg. proficiency" codeHeadings hideKey excludeMissing onOpen={id=>openStudent(id,gridRows,topic.name)} renderReadiness={id=>{const s=roster.find(p=>p.id===id);const r=s?readiness(prerequisites(topic,s)):'Unchecked';return <ReadinessChip status={r}/>}}/></div>}
  </>;
 const topicContent=topic&&<Fragment key={topic.name}>{summary}{readinessPanel}{body}</Fragment>;
 const orderInTitle=!page&&hasSequence&&orderUI!=='toggle';
 return <EvidenceOptions.Provider value={{layout,compact:false,scenario,mastery:masteryColours,hideCounts,subtleExpanded}}><section className="tp-page" data-mastery-palette={masteryColours} aria-label="Textbook progress">
  <PrototypeControls><DesignOptions><label>Page header<select aria-label="Page header layout" value={header} onChange={e=>setHeader(e.target.value as 'card'|'bar')}><option value="card">01 · Textbook card</option><option value="bar">02 · Compact bar</option></select></label><label>Sequence switch<select aria-label="Sequence switch placement" value={orderUI} onChange={e=>setOrderUI(e.target.value as 'toggle'|'title'|'menu')}><option value="menu">01 · Dropdown in the page title</option><option value="toggle">02 · Toggle beside the view toggle</option><option value="title">03 · Toggle in the page title</option></select></label><label>Overview pacing dates<select aria-label="Overview pacing dates" value={pacingLayout} onChange={e=>setPacingLayout(e.target.value==='stacked'?'stacked':'inline')}><option value="inline">Side by side</option><option value="stacked">Stacked</option></select></label><label>Mastery distribution<select aria-label="Mastery distribution layout" value={layout} onChange={e=>setLayout(e.target.value as DistributionLayout)}><option value="stacked">01 · Labelled stacked bar</option><option value="counts">02 · Counts by mastery level</option><option value="dots">03 · Student dots (small classes only)</option><option value="symbols">04 · Stacked bar with mastery symbols</option></select></label><label>Mastery palette<select aria-label="Mastery palette" value={masteryColours} onChange={e=>setMasteryColours(masteryPalette(e.target.value))}>{Object.entries(masteryPalettes).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Expanded subtopic mastery<select value={subtleExpanded?'neutral':'colour'} onChange={e=>setSubtleExpanded(e.target.value==='neutral')}><option value="colour">Use mastery palette</option><option value="neutral">Use neutral colours on expanded rows</option></select></label><label>Counts in graph segments<select value={hideCounts?'hidden':'visible'} onChange={e=>setHideCounts(e.target.value==='hidden')}><option value="visible">Show counts</option><option value="hidden">Hide counts</option></select></label><p>All layouts show the same students and evidence. Dots are a small-class exploration; above 60 students they switch to a scalable bar. No evidence stays separate from the five mastery levels.</p></DesignOptions><label>Scenario<select aria-label="Mastery evidence scenario" value={scenario} onChange={e=>{setScenario(e.target.value as EvidenceScenario);setFilter('All students')}}><option value="current">Current illustrative class</option><option value="split">Wide spread</option><option value="limited">Limited evidence</option><option value="none">No evidence yet</option></select></label></PrototypeControls>
  {notice&&!inSheet&&<div role="status" className="tp-notice">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notification">×</button></div>}
  {topicParam&&!topic&&<div className="tp-notice">{topicParam==='focus'?'Choose a topic focus from your sequence.':'This topic is not in this class sequence.'}<button onClick={()=>goTopic()}>Show sequence</button></div>}
  <div className="tp-view-bar"><div className="tp-view-toggle" role="group" aria-label="Textbook progress view"><button aria-pressed={!page} onClick={()=>goTopic()}>Overview</button><button aria-pressed={!!page} disabled={!!selected&&!focus} onClick={()=>focus?goTopic('focus'):setEditPlan(true)}>◎ Topic focus</button></div>{!page&&hasSequence&&orderUI==='toggle'&&<div className="tp-view-toggle" role="group" aria-label="Topic order">{(['sequence','textbook'] as const).map(v=><button key={v} aria-pressed={order===v} onClick={()=>setOrder(v)}>{v==='sequence'?'My sequence':'Textbook order'}</button>)}</div>}<div className="tp-view-actions"><button className="tp-about" onClick={()=>setShowAbout(true)}>About this view ⓘ</button>{!page&&!studentId&&<button className="tp-outline" onClick={()=>setEditPlan(true)}>{hasSequence?'Edit scope & sequence':'Add scope & sequence'}</button>}</div></div>
  <header className={`tp-top tp-top-${header}`}>
   <div className="tp-top-title"><h2>{orderInTitle?<>{orderUI==='title'?<span className="tp-view-toggle tp-title-switch" role="group" aria-label="Topic order">{(['sequence','textbook'] as const).map(v=><button key={v} aria-pressed={order===v} onClick={()=>setOrder(v)}>{v==='sequence'?'My sequence':'Textbook'}</button>)}</span>:<select className="tp-title-select" aria-label="Topic order" value={order} onChange={e=>setOrder(e.target.value as 'sequence'|'textbook')}><option value="sequence">My sequence</option><option value="textbook">Textbook</option></select>} progress</>:'Textbook progress'}</h2>{header==='bar'?<p className="tp-top-chips"><span className="tp-top-chip"><img src="/assets/textbook/cover-ac-year-7.jpg" alt=""/>{book.curriculum} {book.grade}{book.edition?` · ${book.edition}`:''}</span>{selected&&<span className="tp-top-chip">{selected.name}</span>}</p>:<p>{selected?`${selected.name} · learning across the textbook`:'Your teaching plan, informed by how students are learning.'}</p>}</div>
   {header==='card'&&<div className="tp-textbook-card" aria-label="Focus textbook"><img src="/assets/textbook/cover-ac-year-7.jpg" alt=""/><div><span>{book.curriculum}</span><strong>{book.grade}</strong><span>{book.edition}</span></div></div>}

  </header>
  {page&&<>{topicHeader}{topicContent}</>}
  {!selected&&!focus&&!topic&&<div className="tp-empty"><h3>Choose a topic focus</h3><p>Open a topic below to connect your teaching plan with student learning.</p></div>}
  {draftList}
  {!page&&<Overview item={item} plan={plan} roster={roster} individual={!!selected} values={values} onTopic={goTopic} onStudent={(id,name)=>openStudent(id,roster,name)} order={shownOrder} hasSequence={hasSequence} pacingLayout={pacingLayout} onBuild={build} recommendations={overviewRecommendations()} taskCount={taskCount}/>}
  {inSheet&&topic&&<TopicSheet suspended={!!reportTask||!!studentSheet} title={`${topic.name} · ${item.name}`} bar={`Textbook progress · ${item.name}`} order={shownOrder} onOrder={setOrder} hasSequence={hasSequence} entries={entries} current={topic.name} onTopic={goTopic} onClose={()=>goTopic()} header={topicHeader}>{notice&&<div role="status" className="tp-notice">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notification">×</button></div>}{topicContent}</TopicSheet>}
  {reportTask&&<TopicTaskReport key={reportTask.id} item={item} task={reportTask} onClose={closeReport}/>}
  {preview&&<TeachingPreview action={preview} onClose={()=>setPreview(null)} onDraft={()=>{contextAction({...preview,kind:"Build a task"});setPreview(null)}}/>}
  {editPlan&&<ScopeSequenceSheet item={item} plan={plan} initialTopic={topic?.name} onSave={savePlan} onClose={()=>setEditPlan(false)}/>}
  {studentSheet&&<StudentProgressSheet item={item} learners={studentSheet.learners} studentId={studentSheet.id}
   plan={plan} initialTopic={studentSheet.topic} order={shownOrder} nested={inSheet}
   onStudent={id=>setStudentSheet({...studentSheet,id})} onClose={closeStudent}
   onPractice={(name,kind,content)=>build(plan.topics.find(t=>t.name===name),kind,learners.filter(student=>student.id===studentSheet.id),content)}/>}
  <dialog ref={modal} className="tp-dialog" onCancel={closeModal} onClick={e=>{if(e.target===e.currentTarget)closeModal()}} aria-label={draft?'Build a task':'About textbook progress'}><div className="tp-dialog-body"><button className="tp-dialog-close" onClick={closeModal} aria-label="Close dialog">×</button>
   {showAbout&&<><span className="tp-eyebrow">Understanding the evidence</span><h2>Plan teaching. Understand learning.</h2><h3>Readiness is about prerequisites</h3><p>It describes the knowledge needed to begin a topic, using check-ins and other relevant work. It is separate from a check-in result or topic mastery.</p><h3>Progress is about learning within a topic</h3><p>The five mastery levels describe understanding. No evidence is a separate state. Class distributions retain every student, including those without evidence.</p><h3>Pacing belongs to the class</h3><p>Dates, order and introduced subtopics reflect the teaching plan, not automatic judgements about learning speed.</p><h3>This prototype</h3><p>Learning evidence, prerequisite mappings and initial teaching coverage are illustrative. Readiness here uses a demonstration rule, not Mathspace’s production calculation. Plans, drafts and prototype assignments are saved in this browser.</p></>}
   {draft&&<TaskBuilder draft={draft} topics={plan.topics} learners={roster} className={item.name} onChange={setDraft} onTopic={t=>setDraft({...draft,topic:t.name,kind:'Topic practice',title:undefined,content:skillsFor(t)})} onSave={saveDraft} onAssign={assignTask} onCancel={closeModal}/>}
  </div></dialog>
 </section></EvidenceOptions.Provider>
}
