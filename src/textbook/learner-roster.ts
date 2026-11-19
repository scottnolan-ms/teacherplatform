import type {DashboardClass} from '../dashboard/model';
import {loadData} from '../data/storage';
import type {Learner} from './model';

export function classLearners(item:DashboardClass):Learner[] {
 const students=loadData().students.filter(student=>student.classId===item.id);
 return item.students.map((name,i)=>({name,id:students.find(student=>student.name===name)?.id??`${item.id}-${i}`}));
}

export function classStudentPath(classId:string,studentId:string) {
 return `/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentId)}`;
}
