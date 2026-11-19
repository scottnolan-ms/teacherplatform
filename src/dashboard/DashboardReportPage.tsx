import {loadData} from '../data/storage';
import TaskDetailSheet from '../components/TaskDetail/TaskDetailSheet';
import { Link, useParams, useNavigate } from 'react-router-dom';
import TestControls from '../test-controls/TestControls';
import { demoRows } from '../test-controls/model';
import type { Attempt } from '../test-controls/model';
import { loadDashboard } from './model';
import type {DashboardClass,DemoTask} from './model';
import { demoTaskDetails } from './task-list-model';
export function hasReadinessReport(classId:string|undefined,taskId:string|undefined){
 const legacy=loadData();
 return legacy.tasks.some(t=>t.id===taskId&&t.classId===classId&&t.taskType==='topic-readiness-checkin')
  &&legacy.taskResults.some(r=>r.taskId===taskId&&r.perStudent.length);
}

export default function DashboardReportPage(){
 const {classId,taskId}=useParams();
 const navigate=useNavigate();
 if(taskId&&hasReadinessReport(classId,taskId))return <TaskDetailSheet key={taskId} taskId={taskId} onClose={()=>navigate(`/classes/${classId}/tasks`)}/>;
 const item=loadDashboard().find(c=>c.id===classId),task=item?.tasks.find(t=>t.id===taskId);
 if(!item||!task)return <div className="prototype-page"><h1>Task not found</h1><Link to="/dashboard">Back to dashboard</Link></div>;
 return <DashboardTaskReport key={`${item.id}-${task.id}`} item={item} task={task}/>;
}

export function DashboardTaskReport({item,task}:{item:DashboardClass;task:DemoTask}){
 const now=Date.now(),details=demoTaskDetails(task,item),templates=demoRows('Before due date');
 const rows:Attempt[]=item.students.map((name,i)=>{const started=i<task.participation,progress=started?(task.completed?100:Math.min(95,20+i*5)):0;return {...templates[i%templates.length],id:i+1,name,group:'Whole class',mode:task.type==='Test'?'Scheduled':'Untimed',progress,dueProgress:progress,status:task.completed?'Closed':started?'In progress':'Scheduled',previous:undefined,pausedAt:undefined,start:`${details.start}T09:00:00`,due:`${details.due}T15:00:00`,expires:task.completed?new Date(now-3600000).toISOString():`${details.expiry}T15:00:00`,closedAt:task.completed?`${details.due}T15:00:00`:undefined,accuracy:task.result===null?templates[i%templates.length].accuracy:Math.round(task.result/10),remaining:started?2700:3600,timeSpent:started?12+i%9:0}});
 return <TestControls progressive={task.type!=='Test'} context={{title:task.title,className:item.name,classPath:`/classes/${item.id}/tasks`,teacher:item.teacher,rows,now}}/>;
}
