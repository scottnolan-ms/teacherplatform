import type {Action,Attempt} from './model';
import {StudentActionsMenu} from './StudentActionsMenu';
import type {StudentActionItem} from './StudentActionsMenu';
export function StudentRowMenu({student,avatarUrl,progressive,onScorecard,onWorkbook,onControls,onAction,reportingOnly=false}:{avatarUrl?:string;reportingOnly?:boolean;student:Attempt;progressive:boolean;onScorecard:()=>void;onWorkbook:()=>void;onControls:()=>void;onAction:(a:Action)=>void}){
 const icon=(id:string)=>`/assets/report-details/${id}.svg`;
 const actions:StudentActionItem[]=[{section:'Reporting',label:'Scorecard',icon:icon('30327'),onClick:onScorecard},{section:'Reporting',label:'Student workbook',icon:icon('7a08a'),onClick:onWorkbook}];
 if(!reportingOnly){
  if(!progressive)actions.push({section:'Actions',label:'Test controls',onClick:onControls});
  actions.push({section:'Actions',label:'Reassign',icon:icon('ce252'),onClick:()=>onAction('Reassign')},{section:'Actions',label:'Reschedule',disabled:student.status==='Completed',onClick:()=>onAction('Reschedule')});
  const names=['EmmaJohnson','LiamMartinez','SophiaOkonkwo','NoahOkafor','OliviaPetrov','DavisMason','AmeliaChen','LucasWilson','IslaPatel','EthanNguyen','MiaThompson','OliverLee'];
  const index=names.indexOf(student.name.replace(/ /g,''));
  if(index>=0)actions.push({section:'Student',label:'Student details & insights',icon:icon('60406'),href:`/students/${progressive?'progressive':'test'}-student-${index+1}`});
 }
 return <StudentActionsMenu name={student.name} avatarUrl={avatarUrl} actions={actions}/>;
}
