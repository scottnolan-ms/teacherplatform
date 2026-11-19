import TaskDetailSheet from '../components/TaskDetail/TaskDetailSheet';
import {DashboardTaskReport,hasReadinessReport} from '../dashboard/DashboardReportPage';
import type {DashboardClass,DemoTask} from '../dashboard/model';
import PaperPlus from '../paper-plus/PaperPlus';
import {paperTaskId} from '../paper-plus/model';
import AdaptiveResults from '../test-controls/AdaptiveResults';
import {ReportSheet} from '../test-controls/ReportSheet';
import TestControls from '../test-controls/TestControls';

export function TopicTaskReport({item,task,onClose}:{item:DashboardClass;task:DemoTask;onClose:()=>void}){
 let report;
 switch(task.id){
  case paperTaskId:report=<PaperPlus/>;break;
  case 'linear-equations-adaptive':report=<AdaptiveResults/>;break;
  case 'linear-equations-custom':report=<TestControls progressive/>;break;
  case 'linear-equations-test':report=<TestControls/>;break;
  default:report=hasReadinessReport(item.id,task.id)
   ?<TaskDetailSheet taskId={task.id} onClose={onClose}/>
   :<DashboardTaskReport item={item} task={task}/>;
 }
 return <ReportSheet title={task.title} view="Task report" onViewChange={()=>{}} onClose={onClose}
  className="tp-task-report-portal" dialogLabel={`Task report for ${task.title}`}
  renderHeader={close=><header className="tr-sheet-header tp-task-report-header">
   <strong>Task report · {task.title}</strong>
   <button type="button" className="tc-icon-button" aria-label="Close task report" onClick={close}>×</button>
  </header>}>
  {report}
 </ReportSheet>;
}
