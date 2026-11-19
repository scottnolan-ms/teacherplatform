import {Link,useParams,useSearchParams} from 'react-router-dom';
import StudentDetailContent from '../components/StudentDetailContent';
import {legacyClasses} from '../dashboard/class-data';
import {loadDashboard} from '../dashboard/model';
import {progressiveClass} from '../dashboard/progressive-class';
import {loadData} from '../data/storage';
import {useProgressiveStage} from '../test-controls/progressive-scenario';
import {classLearners,classStudentPath} from '../textbook/learner-roster';
import TextbookProgress from '../textbook/TextbookProgress';
import './class-workspace.css';

function ClassStudentDetail({classId,studentId}:{classId:string;studentId:string}) {
 const [stage]=useProgressiveStage();
 const [params]=useSearchParams();
 const item=[progressiveClass(stage),...loadDashboard(),...legacyClasses(loadData())].find(c=>c.id===classId);
 const roster=item?classLearners(item):[];
 const student=roster.find(s=>s.id===studentId);
 if(!item||!student)return <div className="page"><h1>Student not found</h1><Link to="/classes">Classes</Link></div>;
 const textbook=params.get('tab')==='textbook';
 const path=classStudentPath(classId,studentId);

 return <div className="tp-student-page">
  <header className="tp-student-page-heading"><Link to={`/classes/${classId}?tab=students`}>← {item.name} students</Link><h1>{student.name}</h1></header>
  <nav className="cw-tabs" aria-label="Student sections">
   <Link to={path} aria-current={!textbook?'page':undefined}>Student details</Link>
   <Link to={`${path}?tab=textbook`} aria-current={textbook?'page':undefined}>Textbook progress</Link>
  </nav>
  {textbook?<TextbookProgress key={studentId} item={item} learners={roster} studentId={studentId}/>:
   <section className="tp-student-page-heading"><h2>Student details</h2><p>{item.name} · Year {item.year}</p></section>}
 </div>;
}

export default function StudentDetail() {
 const {classId,studentId}=useParams();
 const [params]=useSearchParams();
 if(!studentId)return <div className="page"><h1>Student not found</h1></div>;
 if(classId&&!loadData().students.some(s=>s.id===studentId&&s.classId===classId))return <ClassStudentDetail classId={classId} studentId={studentId}/>;
 return <div className="page"><StudentDetailContent key={studentId} studentId={studentId} startInTextbook={params.get('tab')==='textbook'}/></div>;
}
