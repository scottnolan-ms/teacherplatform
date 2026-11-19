import {useState} from 'react';
import {OrganiseStudents} from '../test-controls/PrototypeNavigation';
import {DisplayAvatar,DisplayName} from '../test-controls/TableDisplay';
import type {DashboardClass} from '../dashboard/model';
import {useEvidenceOptions} from './distribution-options';
import {AverageMastery} from './EvidenceUI';
import {textbookLearning} from './learning-data';
import type {Learner,SupportFlag,TopicPlan} from './model';
import {Help} from './TopicTools';
import {levels,masteryScore} from './model';

export function StudentJourney({topics,number,onTopic,average=false,attention}:{topics:{name:string;total:number;completed:number}[];number:(name:string,index:number)=>number;onTopic:(name:string,subtopic?:string)=>void;average?:boolean;attention?:ReadonlyMap<string,SupportFlag[]>}){
 const [active,setActive]=useState(0);
 return <div className="tp-journey tp-student-journey" role="group" aria-label={average?'Class average journey':'Topic journey'}
  onKeyDown={event=>{
   const next=event.key==='ArrowRight'?(active+1)%topics.length:event.key==='ArrowLeft'?(active+topics.length-1)%topics.length:event.key==='Home'?0:event.key==='End'?topics.length-1:-1;
   if(next<0)return;
   event.preventDefault();
   event.stopPropagation();
   event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  }}>
  {topics.map((topic,index)=>{
   const percent=topic.total?Math.round(topic.completed/topic.total*100):0;
   const flags=attention?.get(topic.name);
   const progress=average?`${percent}% of subtopics completed on average`:`${topic.completed} of ${topic.total} subtopics completed`;
   const reasons=flags?.map(flag=>`${flag.subtopic}: ${flag.mastery===0?'No evidence':`${levels[flag.mastery]} ${masteryScore(flag.mastery)} out of 100`}`);
   const label=[topic.name,progress,...(reasons?['Needs attention',...reasons]:[])].join(' · ');
   return <button key={topic.name} type="button" style={{flex:topic.total||1}} data-needs-attention={flags?true:undefined}
    title={label} aria-label={label} tabIndex={active===index?0:-1} onFocus={()=>setActive(index)} onClick={()=>onTopic(topic.name,flags?.[0].subtopic)}>
    {flags&&<i className="tp-journey-attention" aria-hidden="true"/>}
    <span><i style={{width:`${percent}%`}}/></span><small>{number(topic.name,index)}</small>
   </button>;
  })}
 </div>;
}

export function OverviewStudents({item,topics,roster,number,onTopic,onStudent,support,supportOnly}:{support:ReadonlyMap<string,SupportFlag[]>;supportOnly:boolean;item:DashboardClass;topics:TopicPlan[];roster:Learner[];number:(name:string,index:number)=>number;onTopic:(topic:string)=>void;onStudent:(id:string,topic?:string,subtopic?:string)=>void}){
 const {scenario}=useEvidenceOptions();
 const rows=textbookLearning(item,topics,roster,scenario);
 const [sort,setSort]=useState('first-asc');
 const last=sort.startsWith('last'),ascending=sort.endsWith('asc');
 const orderName=(name:string)=>last?name.trim().split(/\s+/).at(-1)??name:name;
 const visible=rows.filter(row=>!supportOnly||support.has(row.learner.id)).sort((a,b)=>{
  const comparison=orderName(a.learner.name).localeCompare(orderName(b.learner.name));
  return (ascending?1:-1)*(comparison||a.learner.name.localeCompare(b.learner.name));
 });
 const totalSubtopics=topics.reduce((sum,topic)=>sum+topic.subtopics.length,0);
 const totalSkills=rows[0]?.progress.reduce((sum,topic)=>sum+topic.skillCount,0)??0;
 const mean=(key:'completed'|'collected')=>rows.reduce((sum,row)=>sum+row[key],0)/rows.length;
 const format=(number:number)=>number.toLocaleString('en-AU',{maximumFractionDigits:1});
 const journey=topics.map((topic,index)=>({
  name:topic.name,total:topic.subtopics.length,
  completed:rows.reduce((sum,row)=>sum+row.progress[index].completed,0)/rows.length,
 }));
 return <>
  <div className="tp-table-wrap">
   <table className="tp-table tp-overview-students">
    <colgroup><col className="tp-overview-student-col"/><col className="tp-overview-student-mastery-col"/><col className="tp-overview-student-count-col"/><col className="tp-overview-student-count-col"/><col/></colgroup>
    <thead><tr>
     <th aria-sort={ascending?'ascending':'descending'}><div className="rp-name-sort">Student <OrganiseStudents value={sort} onChange={setSort}/></div></th>
     <th>Avg. mastery</th>
     <th>Subtopics <Help label="About subtopics completed">Subtopics at Familiar or above.</Help></th>
     <th>Skills <Help label="About skills collected">Textbook skills at Proficient or Mastered.</Help></th>
     <th>Journey <Help label="About the student journey">Each segment is a topic. The fill shows subtopics at Familiar or above. A warning marks prior subtopics below Familiar or missing evidence where most of the class has completed the subtopic. Select a segment to open the topic or its first flagged subtopic.</Help></th>
    </tr></thead>
    <tbody>
     {visible.length>0&&<tr className="tp-class-average">
      <th scope="row">Class average</th>
      <td><AverageMastery values={rows.map(row=>row.average)} compact/></td>
      <td>{format(mean('completed'))} of {totalSubtopics}</td><td>{format(mean('collected'))} of {totalSkills}</td>
      <td><StudentJourney topics={journey} number={number} onTopic={onTopic} average/></td>
     </tr>}
     {visible.map(row=>{
      const attention=new Map<string,SupportFlag[]>();
      const flags=support.get(row.learner.id)??[];
      for(const flag of [...flags].sort((a,b)=>(a.mastery||Infinity)-(b.mastery||Infinity))){
       const previous=attention.get(flag.topic);
       if(previous)previous.push(flag);
       else attention.set(flag.topic,[flag]);
      }
      return <tr key={row.learner.id}>
       <th scope="row"><button className="tp-overview-student-link" onClick={()=>onStudent(row.learner.id)}><DisplayAvatar name={row.learner.name}/><DisplayName name={row.learner.name}/></button></th>
       <td><AverageMastery values={[row.average]} individual compact/></td>
       <td>{row.completed} of {totalSubtopics}</td><td>{row.collected} of {totalSkills}</td>
       <td><StudentJourney topics={row.progress} number={number} attention={attention} onTopic={(name,subtopic)=>onStudent(row.learner.id,name,subtopic)}/></td>
      </tr>;
     })}
    </tbody>
   </table>
   {!visible.length&&<p className="tp-footnote">{supportOnly&&rows.length?"No students flagged in prior subtopics.":"No students in this class."}</p>}
  </div>
 </>;
}
