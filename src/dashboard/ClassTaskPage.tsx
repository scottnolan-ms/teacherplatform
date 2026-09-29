import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ClassTaskList from './ClassTaskList';
import DashboardSheet from './DashboardSheet';
import type { Screen } from './Dashboard';
import { loadDashboard, saveDashboard } from './model';
import type { Bucket, DashboardClass } from './model';
import { loadData } from '../data/storage';
import './dashboard.css';
import { parseTaskFilters } from './task-list-model';
export default function ClassTaskPage(){
 const {classId}=useParams(),navigate=useNavigate(),[search]=useSearchParams();
 const [classes,setClasses]=useState(loadDashboard),[screen,setScreen]=useState<Screen|null>(null),[notice,setNotice]=useState('');
 const demo=classes.find(c=>c.id===classId),legacy=loadData(),cls=legacy.classes.find(c=>c.id===classId);
 const item:DashboardClass|undefined=demo??(cls?{id:cls.id,name:cls.name,year:Number(cls.name.match(/\d+/)?.[0]??7),teacher:legacy.teacher.name,students:legacy.students.filter(s=>s.classId===classId).map(s=>s.name),avatar:0,history:true,focus:null,completedTopics:0,tasks:legacy.tasks.filter(t=>t.classId===classId).map(t=>{const results=legacy.taskResults.find(r=>r.taskId===t.id)?.perStudent??[],started=results.filter(r=>r.status!=='Not Started'),finished=results.filter(r=>r.status==='Completed'),due=new Date(t.dueDate);const today=new Date();today.setHours(0,0,0,0);due.setHours(0,0,0,0);const dueIn=Math.round((due.getTime()-today.getTime())/86400000);return {id:t.id,title:t.title,type:({'custom':'Custom task','test':'Test','adaptive':'Adaptive task','revision':'Revision task','topic-readiness-checkin':'Topic readiness check-in'} as Record<string,string>)[t.taskType??'custom']??'Custom task',completed:t.status==='expired'||!!(t.expiryDate&&new Date(t.expiryDate)<today),dueIn,participation:started.length,result:finished.length?Math.round(finished.reduce((n,r)=>n+r.score,0)/finished.length):null,progress:results.length?Math.round(finished.length/results.length*100):0,startDate:(t.startDate??t.createdAt).slice(0,10),dueDate:t.dueDate.slice(0,10),expiryDate:t.expiryDate?.slice(0,10)}})}:undefined);
 const preset=search.get('preset') as Bucket;const validPreset=['All','Recent','Due soon','Active'].includes(preset)?preset:'All';
 const update=(id:string,change:Partial<DashboardClass>)=>setClasses(old=>{const next=old.map(c=>c.id===id?{...c,...change}:c);saveDashboard(next);return next});
 if(!item)return <div className="prototype-page"><h1>Class not found</h1><Link to="/dashboard">Back to dashboard</Link></div>;
 return <div className="task-page dash-page"><Link className="task-page-back" to={demo?'/dashboard':'/classes'}>← {demo?'Dashboard':'Classes'}</Link><ClassTaskList key={`${classId}-${search.toString()}`} item={item} initialPreset={validPreset} initialFilters={parseTaskFilters(search.get('filters'))} fullPage onReport={task=>demo?navigate(`/classes/${classId}/tasks/${task.id}/report`):navigate(`/tasks/${task.id}/report`)} onAssign={()=>demo?setScreen({kind:'assign',classId}):navigate('/tasks/create')} onSection={section=>demo?setScreen({kind:section==='textbook'?'textbook':section==='students'?'students':section==='insights'?'recommendations':'guide',classId,guide:section}):navigate(`/classes/${classId}?tab=${section}`)}/>{screen&&<DashboardSheet key={`${screen.kind}-${screen.taskId??''}`} screen={screen} classes={classes} onClose={()=>setScreen(null)} onOpen={next=>next.kind==='report'?navigate(`/classes/${classId}/tasks/${next.taskId}/report`):next.kind==='tasks'?(setScreen(null),navigate(`/classes/${classId}/tasks?preset=${next.bucket??'All'}`)):setScreen(next)} onUpdate={update} onAdd={()=>{}} onNotice={setNotice}/ >}{notice&&<div className="dash-toast" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notification">×</button></div>}</div>
}
