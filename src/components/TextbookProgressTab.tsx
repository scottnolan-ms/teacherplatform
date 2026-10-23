import type {CurriculumData} from '../types';
import TextbookProgress from '../textbook/TextbookProgress';
import {legacyClasses} from '../dashboard/class-data';
import {loadData} from '../data/storage';

// Adapter for the older task-detail shell; all class views share the new experience.
export default function TextbookProgressTab({curriculumData}:{curriculumData:CurriculumData}){
 const data=loadData();
 const student=data.students.find(s=>s.id===curriculumData.students[0]?.studentId);
 const item=legacyClasses(data).find(c=>c.id===student?.classId);
 return item?<TextbookProgress key={item.id} item={item} learners={curriculumData.students.map(s=>({id:s.studentId,name:s.studentName}))}/>:<p>Select a class with students to view textbook progress.</p>;
}
