import {parseTaskFilters} from '../dashboard/task-list-model';
import type {Bucket} from '../dashboard/model';
import ClassContent from '../dashboard/ClassContent';
import {legacyClasses} from '../dashboard/class-data';
import {ClassChrome,ClassMetadata} from '../dashboard/ClassChrome';
import {useProgressiveStage} from '../test-controls/progressive-scenario';
import {useState} from 'react';
import {Link,useNavigate,useParams,useSearchParams} from 'react-router-dom';
import {loadData} from '../data/storage';
import {loadDashboard} from '../dashboard/model';
import type {DashboardClass} from '../dashboard/model';
import {progressiveClass} from '../dashboard/progressive-class';
import {adaptiveStages} from '../test-controls/adaptive-data';
import {PrototypeBack} from '../test-controls/PrototypeNavigation';
import {Icon} from '../dashboard/Dashboard';
import '../dashboard/dashboard.css';
import './class-workspace.css';
export default function ClassWorkspace({tasks=false}:{tasks?:boolean}){
 const {classId}=useParams(),navigate=useNavigate(),[search]=useSearchParams();
 const [stage,setStage]=useProgressiveStage(),[collapsed,setCollapsed]=useState(()=>localStorage.getItem('classes-drawer-collapsed')==='true'),[classQuery,setClassQuery]=useState(''),[showFilter,setShowFilter]=useState(false),[showOtherClasses,setShowOtherClasses]=useState(false);
 const data=loadData();const dashboard=loadDashboard();
 const classes:DashboardClass[]=[progressiveClass(stage),...dashboard,...legacyClasses(data)];
 const item=classes.find(c=>c.id===classId)??(!classId?classes[0]:undefined);if(!item)return <div className="prototype-page"><h1>Class not found</h1><Link to="/classes">Classes</Link></div>;
 const progressive=item.id==='class-progressive-results',section=tasks||search.get('tab')==='tasks'?'tasks':search.get('tab')??'activity';
 const openSection=(name:string)=>{navigate(`/classes/${item.id}${name==='tasks'?'/tasks':`?tab=${name}`}`)};
 const openReport=(id:string)=>navigate(`/classes/${item.id}/tasks/${id}${progressive||item.id==='class-test-controls'?'':'/report'}`);
 const abbreviation=(c:DashboardClass)=>c.id==='class-progressive-results'?'8P':c.id==='class-test-controls'?'8T':c.name.match(/\d+[A-Z]/i)?.[0]??String(c.year);
 return <div className={`cw-workspace dash-page ${collapsed?'cw-collapsed':''}`}><aside className="cw-drawer" aria-label="Classes"><header>{!collapsed&&<h2>Classes</h2>}<button aria-label={collapsed?'Expand classes drawer':'Collapse classes drawer'} aria-expanded={!collapsed} onClick={()=>setCollapsed(v=>{localStorage.setItem('classes-drawer-collapsed',String(!v));return !v})}><i className="cw-icon" style={{maskImage:`url(/assets/class-activity/${collapsed?'962e7':'d18f0'}.svg)`}}/></button></header>{!collapsed&&<div className="cw-drawer-tools"><button onClick={()=>setShowFilter(!showFilter)} aria-expanded={showFilter}><Icon name="filter"/>Filter</button><Link to="/dashboard">Manage classes</Link></div>}{showFilter&&!collapsed&&<input aria-label="Filter classes" placeholder="Find a class" value={classQuery} onChange={e=>setClassQuery(e.target.value)}/>}<nav>{classes.filter(c=>!c.id.startsWith('dash-')||['dash-7a','dash-7b'].includes(c.id)||c.id===item.id||classQuery.length>0||showOtherClasses).filter(c=>c.name.toLowerCase().includes(classQuery.toLowerCase())).map(c=><Link key={c.id} to={`/classes/${c.id}${section==='tasks'?'/tasks':`?tab=${section}`}`} title={c.name} className={c.id===item.id?'active':''}><span className={`cw-class-avatar cw-colour-${c.avatar}`}>{abbreviation(c)}</span>{!collapsed&&<><strong>{c.name}</strong><ClassMetadata item={c}/></>}</Link>)}</nav>{!collapsed&&<button className="cw-more-classes" aria-expanded={showOtherClasses} onClick={()=>setShowOtherClasses(!showOtherClasses)}>{showOtherClasses?'Hide other dashboard scenarios':'Other dashboard scenarios (7)'}</button>}</aside><div className="cw-content"><div className="rp-prototype-toolbar"><PrototypeBack/>{progressive&&<label>Scenario<select aria-label="Class lifecycle scenario" value={stage} onChange={e=>setStage(e.target.value as typeof stage)}>{adaptiveStages.map(v=><option key={v}>{v}</option>)}</select></label>}<span>Illustrative class activity</span></div><ClassChrome item={item} abbreviation={abbreviation(item)} section={section} onSection={openSection}/><ClassContent key={item.id} item={item} section={section} stage={stage} preset={(['Recent','Due soon','Active'].includes(search.get('preset')??'')?search.get('preset'):'All') as Bucket} filters={parseTaskFilters(search.get('filters'))} onSection={openSection} onReport={openReport} onAssign={()=>navigate('/tasks/create')}/></div></div>;
}
