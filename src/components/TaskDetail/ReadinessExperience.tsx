import {useState} from 'react';
import type {TaskDetailData,SkillFilterBucket} from '../../types';
import ReadinessReportTabs from './ReadinessReportTabs';
import TaskInsightsPanel from './TaskInsightsPanel';
import ReadinessRecommendations from './ReadinessRecommendations';
import {SkillsAttention} from './ReadinessDetails';
import {attentionRows,followupStudents} from '../../data/readiness-evidence';
import {readinessView,readinessLevel,readinessLabels} from './readiness-view';

export default function ReadinessExperience({data,layout}:{data:TaskDetailData;layout:string}) {
 const [current,setCurrent]=useState(false),[types,setTypes]=useState<string[]>(['Prerequisite']),[readiness,setReadiness]=useState<string[]>([]),[buckets,setBuckets]=useState<SkillFilterBucket[]>([]),[gaps,setGaps]=useState(false);
 const [followup,setFollowup]=useState<{skills:string[];students:string[]}|null>(null);
 const view=readinessView(data,current,types);
 const switchSnapshot=(next:boolean)=>{setCurrent(next);setTypes(next?[]:['Prerequisite']);};
 const scopedStudents=followup?followupStudents(attentionRows(readinessView(data,current,[]).skillsData),followup.skills):[];
 const students=view.students.filter(s=>(!followup||scopedStudents.includes(s.studentId))&&(!readiness.length||readiness.includes(readinessLabels[readinessLevel(s)!]??'Unchecked')));
 const recs=<ReadinessRecommendations title={view.header.title} students={view.students.filter(s=>readinessLevel(s)==='not-ready')} skills={view.insights.quickWinSkills}/>;
 const toggle=<div className="readiness-snapshot"><div className="ar-toggle" role="group" aria-label="Readiness evidence view">{[false,true].map(v=><button key={String(v)} className={current===v?'active':''} aria-pressed={current===v} onClick={()=>switchSnapshot(v)}>{v?'Latest evidence':'Task snapshot'}</button>)}</div><span>{current?'Showing current readiness and mastery, including current year-level skills.':'Showing readiness and prerequisite skills mastery at the time of this check-in.'}</span></div>;
 const gapSkills=attentionRows(view.skillsData);
 return <>
 {layout==='Simplified'?<section className="readiness-simple-summary">{toggle}<div className="readiness-summary-columns"><div><h3>Summary</h3><div className="readiness-summary-tiles"><button className="readiness-summary-tile gaps" onClick={()=>setGaps(true)}><span>Skills gaps</span><strong><i style={{maskImage:'url(/assets/readiness/gaps.svg)'}}/>{gapSkills.length}</strong></button>{(['ready','partially-ready','not-ready'] as const).map(level=>{const label=readinessLabels[level],count=view.students.filter(s=>readinessLevel(s)===level).length;return <label key={level} className={`readiness-summary-tile ${level}`}><span>{label}</span><input type="checkbox" aria-label={`Filter ${label}`} checked={readiness.includes(label)} onChange={e=>setReadiness(e.target.checked?[...readiness,label]:readiness.filter(s=>s!==label))}/><strong><i style={{maskImage:`url(/assets/readiness/${level==='partially-ready'?'partial':level}.svg)`}}/>{Math.round(count/(view.students.length||1)*100)}%</strong></label>})}<div className="readiness-summary-tile"><span>Participation</span><strong><i style={{maskImage:'url(/assets/readiness/participation.svg)'}}/>{view.students.filter(s=>s.questionsAnswered>0).length} / {view.students.length}</strong></div></div></div><div>{recs}</div></div></section>:<>{toggle}<TaskInsightsPanel insights={view.insights} taskType="topic-readiness-checkin" recommendations={recs} readinessFilters={(Object.keys(readinessLabels) as (keyof typeof readinessLabels)[]).filter(k=>readiness.includes(readinessLabels[k]))} onReadinessFilterChange={v=>setReadiness(v.map(k=>readinessLabels[k]))} skillFilters={buckets} onSkillFilterChange={setBuckets}/></>}
 {followup&&<button className="tc-text readiness-clear" onClick={()=>setFollowup(null)}>Clear follow-up filter ({followup.skills.length} skills · {scopedStudents.length} students)</button>}
 {readiness.length>0&&<button className="tc-text readiness-clear" onClick={()=>setReadiness([])}>Clear readiness filters ({readiness.join(', ')})</button>}
 <ReadinessReportTabs followup={followup} onCurrent={switchSnapshot} data={view} students={students} questions={view.questions} skillsData={view.skillsData} current={current} skillTypes={types} onSkillTypes={setTypes} readiness={readiness} onReadiness={setReadiness} priority={buckets} onPriority={setBuckets}/>
 {gaps&&<SkillsAttention data={view} current={current} onClose={()=>setGaps(false)} onFollowup={(skills,students)=>{setFollowup({skills,students});setReadiness([]);setBuckets([]);setGaps(false)}}/>}
 </>;
}
