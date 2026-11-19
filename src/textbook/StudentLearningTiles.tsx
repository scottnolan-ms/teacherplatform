import type {ReactNode} from 'react';
import {averageLevel,levels as masteryLevels,masteryScore,readiness} from './model';

const readinessIcons={Ready:'ready','Partially ready':'partial','Not ready':'not-ready',Unchecked:'unchecked'} as const;

export function SummaryTile({label,icon,value,detail}:{label:ReactNode;icon:string;value:string;detail?:string}){
 return <div className="tp-student-summary-tile">
  <span>{label}</span>
  <strong><i className={`tp-summary-icon ${icon.startsWith('mastery-')?'tp-summary-mastery-icon':''}`} style={{maskImage:`url(/assets/textbook-summary/${icon}.svg)`}} aria-hidden="true"/>{value}</strong>
  {detail&&<small>{detail}</small>}
 </div>;
}

export function MasteryAverageTile({values,label='Avg. subtopic mastery'}:{values:number[];label?:string}){
 const average=averageLevel(values),level=Math.floor(average);
 return <SummaryTile label={label} icon={`mastery-${level}`} value={masteryLevels[level]}
  detail={average>0?`${masteryScore(average)} out of 100`:undefined}/>;
}

export function StudentLearningTiles({levels,collected,skillCount,prerequisites}:{levels:number[];collected:number;skillCount:number;prerequisites?:number[]}){
 const status=prerequisites?readiness(prerequisites):undefined;
 return <div className="tp-student-learning-tiles">
  {status&&prerequisites&&<SummaryTile label="Prerequisite readiness" icon={readinessIcons[status]} value={status}
   detail={prerequisites.length?`${prerequisites.filter(value=>value>=4).length} of ${prerequisites.length} proficient or mastered`:undefined}/>}
  <MasteryAverageTile values={levels}/>
  <SummaryTile label="Subtopics completed" icon="subtopics" value={`${levels.filter(value=>value>=3).length} of ${levels.length}`} detail="Familiar or above"/>
  <SummaryTile label="Skills collected" icon="skills" value={`${collected} of ${skillCount}`} detail="Proficient or Mastered"/>
 </div>;
}
