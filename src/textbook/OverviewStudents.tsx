import {useState} from 'react';
import {DisplayAvatar,DisplayName} from '../test-controls/TableDisplay';
import type {DashboardClass} from '../dashboard/model';
import {useEvidenceOptions} from './distribution-options';
import {AverageMastery} from './EvidenceUI';
import {textbookLearning} from './learning-data';
import type {Learner,TopicPlan} from './model';
import {Help} from './TopicTools';

export function StudentJourney({topics,number,onTopic,average=false}:{topics:{name:string;total:number;completed:number}[];number:(name:string,index:number)=>number;onTopic:(name:string)=>void;average?:boolean}){
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
   const label=`${topic.name} · ${average?`${percent}% of subtopics completed on average`:`${topic.completed} of ${topic.total} subtopics completed`}`;
   return <button key={topic.name} type="button" style={{flex:topic.total||1}} title={label} aria-label={label} tabIndex={active===index?0:-1} onFocus={()=>setActive(index)} onClick={()=>onTopic(topic.name)}>
    <span><i style={{width:`${percent}%`}}/></span><small>{number(topic.name,index)}</small>
   </button>;
  })}
 </div>;
}

export function OverviewStudents({item,topics,roster,number,onTopic,onStudent}:{item:DashboardClass;topics:TopicPlan[];roster:Learner[];number:(name:string,index:number)=>number;onTopic:(topic:string)=>void;onStudent:(id:string,topic?:string)=>void}){
 const {scenario}=useEvidenceOptions();
 const rows=textbookLearning(item,topics,roster,scenario);
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
    <thead><tr>
     <th>Student</th><th>Journey <Help label="About the student journey">Each segment is a topic. The fill is the share of its subtopics at Familiar or above. Select a segment to open that topic.</Help></th>
     <th>Avg. subtopic mastery</th>
     <th>Subtopics completed <Help label="About subtopics completed">Subtopics at Familiar or above.</Help></th>
     <th>Skills collected <Help label="About skills collected">Textbook skills at Proficient or Mastered.</Help></th>
    </tr></thead>
    <tbody>
     {rows.length>0&&<tr className="tp-class-average">
      <th scope="row">Class average</th>
      <td><StudentJourney topics={journey} number={number} onTopic={onTopic} average/></td>
      <td><AverageMastery values={rows.map(row=>row.average)} small/></td>
      <td>{format(mean('completed'))} of {totalSubtopics}</td><td>{format(mean('collected'))} of {totalSkills}</td>
     </tr>}
     {rows.map(row=><tr key={row.learner.id}>
      <th scope="row"><button className="tp-overview-student-link" onClick={()=>onStudent(row.learner.id)}><DisplayAvatar name={row.learner.name}/><DisplayName name={row.learner.name}/></button></th>
      <td><StudentJourney topics={row.progress} number={number} onTopic={name=>onStudent(row.learner.id,name)}/></td>
      <td><AverageMastery values={[row.average]} individual small/></td>
      <td>{row.completed} of {totalSubtopics}</td><td>{row.collected} of {totalSkills}</td>
     </tr>)}
    </tbody>
   </table>
   {!rows.length&&<p className="tp-footnote">No students in this class.</p>}
  </div>
 </>;
}
