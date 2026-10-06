import type {DashboardClass, Bucket} from './model';
import type {AdaptiveStage} from '../test-controls/adaptive-data';
import {progressiveStudentStatus} from './progressive-class';
import ClassTaskList from './ClassTaskList';
import ClassActivity from './ClassActivity';
import TextbookProgressTab from '../components/TextbookProgressTab';
import {generateCurriculumData} from '../data/curriculumData';
import {loadData} from '../data/storage';
import type {Student} from '../types';
import type {TaskFilters} from './task-list-model';
export default function ClassContent({item,section,stage,onSection,onReport,onAssign,preset,filters,onFiltersChange}:{item:DashboardClass;section:string;stage:AdaptiveStage;onSection:(s:string)=>void;onReport:(id:string)=>void;onAssign:()=>void;preset?:Bucket;filters?:TaskFilters;onFiltersChange?:(filters:TaskFilters)=>void}){
 const progressive=item.id==='class-progressive-results';
 if(section==='tasks')return <ClassTaskList onFiltersChange={onFiltersChange} showClassChrome={false} item={item} initialPreset={preset} initialFilters={filters} fullPage onReport={t=>onReport(t.id)} onAssign={onAssign} onSection={onSection} studentResult={progressive?(id,name,grades)=>progressiveStudentStatus(id,name,stage,grades):undefined}/>;
 if(section==='activity')return <ClassActivity item={item} stage={stage} onReport={onReport}/>;
 if(section==='students')return <div className="cw-table-scroll"><table><thead><tr><th>Student</th><th>Assigned tasks</th><th>Class</th></tr></thead><tbody>{item.students.map(name=><tr key={name}><td>{name}</td><td>{item.tasks.filter(t=>!progressive||progressiveStudentStatus(t.id,name,stage)!=='Not assigned').map(t=><button key={t.id} onClick={()=>onReport(t.id)}>{t.title}</button>)}</td><td>{item.name}</td></tr>)}</tbody></table></div>;
 if(section==='textbook'){
  const data=loadData();const roster:Student[]=item.students.map((name,i)=>data.students.find(s=>s.classId===item.id&&s.name===name)??({id:`${item.id}-${i}`,name,firstName:name.split(' ')[0],lastName:name.split(' ').slice(1).join(' '),classId:item.id,mathspaceGroup:'Explorer',avatarUrl:''}));
  return <div className="cw-textbook"><TextbookProgressTab curriculumData={generateCurriculumData(item.id,roster)}/></div>;
 }
 return <div className="cw-empty"><h2>{section[0].toUpperCase()+section.slice(1)}</h2><p>This view is outside the current class activity prototype.</p><button onClick={()=>onSection('activity')}>Return to activity</button></div>;
}
