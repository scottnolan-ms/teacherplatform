import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {TextbookSheetHeader} from './TextbookSheetHeader';
import type {DashboardClass} from '../dashboard/model';
import {topics as bookTopics} from '../dashboard/model';
import {ReportSheet} from '../test-controls/ReportSheet';
import {DisplayAvatar} from '../test-controls/TableDisplay';
import {StudentAvatar} from '../test-controls/StudentAvatar';
import {AverageMastery,ProgressKey,TopicEyebrow} from './EvidenceUI';
import {StudentLearningTiles} from './StudentLearningTiles';
import {TopicRecommendations} from './TopicRecommendations';
import {TopicTable} from './TopicTools';
import {StudentJourney} from './OverviewStudents';
import {classStudentPath} from './learner-roster';
import {subtopicValues,textbookLearning,topicSkillRows} from './learning-data';
import {pageRanges,subtopicSkills} from './model';
import type {Learner,Plan} from './model';
import {useEvidenceOptions} from './distribution-options';

type Props={
 item:DashboardClass;learners:Learner[];studentId:string;plan:Plan;initialTopic?:string;
 order:'sequence'|'textbook';nested:boolean;checkInAssigned:(topic:string)=>boolean;
 onStudent:(id:string)=>void;onClose:()=>void;onPractice:(topic:string,kind:string,content:string[])=>void;
};

export default function StudentProgressSheet({item,learners,studentId,plan,initialTopic,order,nested,checkInAssigned,onStudent,onClose,onPractice}:Props){
 const {scenario,mastery}=useEvidenceOptions();
 const [topicName,setTopicName]=useState(initialTopic??'');
 const [expanded,setExpanded]=useState<string[]>([]);
 const content=useRef<HTMLElement>(null);
 const index=learners.findIndex(student=>student.id===studentId);
 const student=learners[index];
 const book=item.textbook?.topics??bookTopics;
 const pages=pageRanges(plan.topics,book);
 const chapter=(name:string)=>pages.get(name)?.number??plan.topics.findIndex(topic=>topic.name===name)+1;
 const topics=order==='sequence'?plan.topics:[...plan.topics].sort((a,b)=>chapter(a.name)-chapter(b.name));
 const number=(name:string,position:number)=>order==='sequence'?position+1:chapter(name);
 const topic=topics.find(topic=>topic.name===topicName);
 const selectTopic=(name:string)=>{setTopicName(name);setExpanded([])};
 useEffect(()=>{content.current?.closest('.tr-sheet')?.scrollTo({top:0})},[topicName,studentId]);
 if(!student)return null;
 const [learning]=textbookLearning(item,topic?[topic]:topics,[student],scenario);
 const skills=topic?topicSkillRows(item,topic,[student],scenario):[];
 const prerequisites=skills.filter(skill=>skill.kind==='Prerequisite');
 const gaps=prerequisites.filter(skill=>skill.values[0]>0&&skill.values[0]<3);
 const missing=prerequisites.filter(skill=>skill.values[0]===0);
 const topicLevels=learning.progress[0]?.levels??[];
 const learningGap=topicLevels.findIndex(value=>value>0&&value<3);
 const skillCount=learning.progress.reduce((sum,entry)=>sum+entry.skillCount,0);
 const recommendation=topic&&(learningGap>=0?{
  title:`Practise ${topic.subtopics[learningGap].toLowerCase()}`,
  description:`${student.name} is Exploring or Emerging in this subtopic.`,
  kind:'Targeted practice',skills:subtopicSkills(topic.subtopics[learningGap]),
 }:gaps.length?{
  title:'Strengthen prerequisite skills',description:`${gaps.length} prerequisite ${gaps.length===1?'skill needs':'skills need'} more practice.`,
  kind:'Targeted practice',skills:gaps.map(skill=>skill.name),
 }:missing.length&&!checkInAssigned(topic.name)?{
  title:'Check prerequisite readiness',description:`${missing.length} prerequisite ${missing.length===1?'skill has':'skills have'} no evidence yet.`,
  kind:'Readiness check-in',skills:missing.map(skill=>skill.name),
 }:undefined);
 return <ReportSheet title="Student textbook progress" view="Student progress" onViewChange={()=>{}} onClose={onClose}
  className={`tp-student-progress-portal ${nested?'tp-student-progress-nested':''}`}
  dialogLabel="Student textbook progress"
  renderHeader={close=><TextbookSheetHeader item={item} title="Student textbook progress" closeLabel="Close student progress" onClose={close}/>}>
  <div className="tp-page tp-student-workspace" data-mastery-palette={mastery}>
   <nav className="tp-student-nav" aria-label="Topics">
    <h3>Topics</h3>
    <select aria-label="Topic" value={topicName} onChange={event=>selectTopic(event.target.value)}>
     <option value="">Textbook overview</option>
     {topics.map((entry,position)=><option key={entry.name} value={entry.name}>{number(entry.name,position)}. {entry.name}</option>)}
    </select>
    <div className="tp-student-nav-list">
     <button aria-current={!topic?'page':undefined} onClick={()=>selectTopic('')}>Textbook overview</button>
     {topics.map((entry,position)=><button key={entry.name} aria-current={entry.name===topicName?'page':undefined} onClick={()=>selectTopic(entry.name)}>
      <small>{number(entry.name,position)}</small><span>{entry.name}</span>
     </button>)}
    </div>
   </nav>
   <nav className="tp-student-nav" aria-label="Students">
    <h3>Students <small>{index+1} of {learners.length}</small></h3>
    <select aria-label="Student" value={studentId} onChange={event=>onStudent(event.target.value)}>
     {learners.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}
    </select>
    <div className="tp-student-nav-list">{learners.map(person=><button key={person.id} aria-current={person.id===studentId?'true':undefined} onClick={()=>onStudent(person.id)}>
     <DisplayAvatar name={person.name}/><span>{person.name}</span>
    </button>)}</div>
   </nav>
   <main className="tp-student-progress-content" ref={content}>
    <div className="sc-student-heading tp-student-identity">
     <StudentAvatar name={student.name} large/><h2><b>{student.name}</b></h2>
    </div>
    <header className="tp-student-progress-title">
     <h3>{topic?.name??'Textbook overview'}</h3>
     {topic&&<TopicEyebrow number={chapter(topic.name)} pages={pages.get(topic.name)} focus={topic.name===plan.focus}/>}
    </header>
    <section className="tp-dashboard tp-student-summary" aria-label="Student summary">
     <div className="tp-dashboard-body">
      <div><h3>Summary</h3><StudentLearningTiles levels={learning.progress.flatMap(entry=>entry.levels)}
       collected={learning.collected} skillCount={skillCount} prerequisites={topic?prerequisites.map(skill=>skill.values[0]):undefined}/>
      </div>
      {topic&&recommendation&&<TopicRecommendations key={`${studentId}:${topic.name}`} topic={topic.name} items={[{
       id:'student-follow-up',title:recommendation.title,description:recommendation.description,
       action:'Review',icon:'progress',tone:'purple',
       review:()=>onPractice(topic.name,recommendation.kind,recommendation.skills),
       reviewLabel:recommendation.kind==='Readiness check-in'?'Build check-in':'Build practice task',
      }]}/>}
     </div>
    </section>
    {topic?<>
     <h3>Subtopics</h3>
     <TopicTable topic={topic} pages={pages.get(topic.name)} values={i=>subtopicValues(item,topic,i,[student],scenario)}
      skills={skills} expanded={expanded} onExpand={setExpanded} legend={<ProgressKey/>} individual taskOnly showPrerequisites
      onAction={action=>onPractice(topic.name,'Topic practice',action.skills)}/>
    </>:<>
     <h3>{order==='sequence'?'Journey through your sequence':'Journey through the textbook'}</h3>
     <StudentJourney topics={learning.progress} number={number} onTopic={selectTopic}/>
     <div className="tp-table-wrap tp-student-overview-topics"><table className="tp-table">
      <thead><tr><th>Topic</th><th>Avg. subtopic mastery</th><th>Subtopics completed</th><th>Skills collected</th></tr></thead>
      <tbody>{learning.progress.map(entry=><tr key={entry.name}>
       <th scope="row"><button onClick={()=>selectTopic(entry.name)}>{entry.name}</button></th>
       <td><AverageMastery values={entry.levels} individual small/></td>
       <td>{entry.completed} of {entry.total}</td><td>{entry.collected} of {entry.skillCount}</td>
      </tr>)}</tbody>
     </table></div>
    </>}
    <p className="tp-student-profile-link"><Link to={`${classStudentPath(item.id,student.id)}?tab=textbook${topic?'&topic='+encodeURIComponent(topic.name):''}`}>Open student textbook progress →</Link></p>
   </main>
  </div>
 </ReportSheet>;
}
