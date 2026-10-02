import type {AppData} from '../types';
import type {DashboardClass,DemoTask} from './model';
import {generateTaskDetailData} from '../data/readiness-report';

/** Only expose legacy tasks with a supported report and saved student results. */
export function legacyClasses(data:AppData):DashboardClass[]{
 return data.classes.filter(c=>c.id!=='class-progressive-results').map((c,index)=>{
  const students=data.students.filter(s=>s.classId===c.id);
  const tasks:DemoTask[]=data.tasks.filter(t=>t.classId===c.id&&(c.id==='class-test-controls'||t.taskType==='topic-readiness-checkin')&&data.taskResults.some(r=>r.taskId===t.id&&r.perStudent.length)).map(t=>{
   const details=generateTaskDetailData(t,students,data.taskResults.find(r=>r.taskId===t.id),data.teacher.name,c.name);
   const rows=details.students,started=rows.filter(r=>r.questionsAnswered>0);
   return {id:t.id,title:t.title,type:t.taskType==='test'?'Test':'Topic readiness check-in',completed:t.status==='expired'||Date.parse(t.expiryDate??t.dueDate)<Date.now(),dueIn:Math.ceil((Date.parse(t.dueDate)-Date.now())/86400000),participation:started.length,result:started.length?Math.round(started.reduce((n,r)=>n+r.resultPercentage,0)/started.length):null,progress:rows.length?Math.round(rows.reduce((n,r)=>n+r.completionProgress,0)/rows.length):0,minutes:started.length?Math.round(started.reduce((n,r)=>n+r.timeSpentMinutes,0)/started.length):0,startDate:(t.startDate??t.createdAt).slice(0,10),dueDate:t.dueDate.slice(0,10),expiryDate:t.expiryDate?.slice(0,10)};
  });
  return {id:c.id,name:c.name,year:Number(c.name.match(/\d+/)?.[0]??8),avatar:index%6,teacher:data.teacher.name,students:students.map(s=>s.name),tasks,history:true,focus:null,completedTopics:0};
 });
}
