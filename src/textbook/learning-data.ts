import type {DashboardClass} from '../dashboard/model';
import type {EvidenceScenario} from './distribution-options';
import {averageLevel,mastery,prerequisiteLevels,scenarioValue,skillMastery,subtopicSkills} from './model';
import type {Learner,TopicPlan} from './model';
import type {SkillRow} from './TopicTools';

export function subtopicValues(item:DashboardClass,topic:TopicPlan,index:number,learners:Learner[],scenario:EvidenceScenario){
 return learners.map(student=>scenarioValue(mastery(item.id,student.id,topic,index,item.history),`${student.id}:${index}`,scenario));
}

export function prerequisiteValues(item:DashboardClass,topic:TopicPlan,student:Learner,scenario:EvidenceScenario){
 return prerequisiteLevels(item.id,student.id,topic,item.history).map((value,index)=>scenarioValue(value,`${student.id}:prereq:${index}`,scenario));
}

export function topicSkillRows(item:DashboardClass,topic:TopicPlan,learners:Learner[],scenario:EvidenceScenario):SkillRow[]{
 const prerequisites=learners.map(student=>prerequisiteValues(item,topic,student,scenario));
 return [
  ...topic.subtopics.flatMap((subtopic,index)=>subtopicSkills(subtopic).map((name,skillIndex)=>({
   code:`DEMO-T${index+1}.${skillIndex+1}`,name,kind:'Current grade' as const,subtopic,
   values:learners.map(student=>scenarioValue(skillMastery(item.id,student.id,topic,index,skillIndex,item.history),`${student.id}:${index}:${skillIndex}`,scenario)),
  }))),
  ...topic.prerequisites.map((name,index)=>({
   code:`DEMO-P${index+1}`,name,kind:'Prerequisite' as const,subtopic:'Prerequisite knowledge',
   values:prerequisites.map(row=>row[index]),
  })),
 ];
}

export function textbookLearning(item:DashboardClass,topics:TopicPlan[],learners:Learner[],scenario:EvidenceScenario){
 const topicResults=topics.map(topic=>({
  name:topic.name,
  subtopics:topic.subtopics.map((_,index)=>subtopicValues(item,topic,index,learners,scenario)),
  skills:topicSkillRows(item,topic,learners,scenario).filter(skill=>skill.kind==='Current grade'),
 }));
 return learners.map((learner,index)=>{
  const progress=topicResults.map(topic=>{
   const levels=topic.subtopics.map(row=>row[index]);
   return {
    name:topic.name,levels,total:levels.length,completed:levels.filter(value=>value>=3).length,
    collected:topic.skills.filter(skill=>skill.values[index]>=4).length,skillCount:topic.skills.length,
   };
  });
  return {
   learner,progress,average:averageLevel(progress.flatMap(topic=>topic.levels)),
   completed:progress.reduce((sum,topic)=>sum+topic.completed,0),
   collected:progress.reduce((sum,topic)=>sum+topic.collected,0),
  };
 });
}
