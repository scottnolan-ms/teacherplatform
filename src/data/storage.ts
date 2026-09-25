import { seed as testStudents } from '../test-controls/model';
import type { AppData, PersistentGroup, Task, TaskResult, Student } from '../types';
import { initialData } from './seedData';

const STORAGE_KEY = 'teacher-groups-app-data-v2';

export function loadData(): AppData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);

    // Check if data is valid (students have required fields and correct asset paths)
    const hasValidStudents = parsed.students?.length > 0 &&
      parsed.students[0]?.lastName !== undefined &&
      parsed.students[0]?.avatarUrl?.startsWith('/assets/');

    // If data is corrupted or missing key fields, reset to initial data
    if (!hasValidStudents) {
      console.log('Resetting localStorage due to schema change');
      saveData(initialData);
      return ensureTestClass(initialData);
    }

    // Merge with initial data to ensure all fields exist (handles schema migrations)
    const merged: AppData = {
      ...initialData,
      ...parsed,
      // Ensure arrays exist even if missing from stored data
      students: parsed.students || initialData.students,
      classes: parsed.classes || initialData.classes,
      persistentGroups: parsed.persistentGroups || initialData.persistentGroups,
      tasks: parsed.tasks || initialData.tasks,
      taskResults: parsed.taskResults || initialData.taskResults,
      questionSets: parsed.questionSets || initialData.questionSets,
      studentActivities: parsed.studentActivities || initialData.studentActivities,
    };
    return ensureTestClass(merged);
  }
  // Initialize with seed data
  saveData(initialData);
  return ensureTestClass(initialData);
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Helper functions for specific operations
export function updateStudent(studentId: string, updates: Partial<Student>): void {
  const data = loadData();
  const studentIndex = data.students.findIndex(s => s.id === studentId);
  if (studentIndex !== -1) {
    data.students[studentIndex] = { ...data.students[studentIndex], ...updates };
    saveData(data);
  }
}

export function createPersistentGroup(group: PersistentGroup): void {
  const data = loadData();
  data.persistentGroups.push(group);
  saveData(data);
}

export function updatePersistentGroup(groupId: string, updates: Partial<PersistentGroup>): void {
  const data = loadData();
  const groupIndex = data.persistentGroups.findIndex(g => g.id === groupId);
  if (groupIndex !== -1) {
    data.persistentGroups[groupIndex] = {
      ...data.persistentGroups[groupIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveData(data);
  }
}

export function deletePersistentGroup(groupId: string): void {
  const data = loadData();
  data.persistentGroups = data.persistentGroups.filter(g => g.id !== groupId);
  saveData(data);
}

export function createTask(task: Task): void {
  const data = loadData();
  data.tasks.push(task);

  // Create initial empty task results
  const studentIds = data.students
    .filter(s => s.classId === task.classId)
    .map(s => s.id);

  const taskResult: TaskResult = {
    taskId: task.id,
    perStudent: studentIds.map(studentId => ({
      studentId,
      status: 'Not Started',
      score: Math.floor(Math.random() * 100) // Random scores for prototype
    }))
  };

  data.taskResults.push(taskResult);
  saveData(data);
}

export function addStudentToGroup(studentId: string, groupId: string): void {
  const data = loadData();
  const group = data.persistentGroups.find(g => g.id === groupId);
  if (group && !group.studentIds.includes(studentId)) {
    group.studentIds.push(studentId);
    group.updatedAt = new Date().toISOString();
    saveData(data);
  }
}

export function removeStudentFromGroup(studentId: string, groupId: string): void {
  const data = loadData();
  const group = data.persistentGroups.find(g => g.id === groupId);
  if (group) {
    group.studentIds = group.studentIds.filter(id => id !== studentId);
    group.updatedAt = new Date().toISOString();
    saveData(data);
  }
}

// Add the report demo without replacing existing classes or stored edits.
function ensureTestClass(data: AppData): AppData {
 const classId='class-test-controls'; const taskId='linear-equations-test';
 if(!data.classes.some(c=>c.id===classId)) data.classes.push({id:classId,name:'Year 8 — Test controls',schoolId:data.school.id,teacherId:data.teacher.id});
 for(const attempt of testStudents){
  const id=`test-student-${attempt.id}`;
  if(!data.students.some(s=>s.id===id))data.students.push({id,name:attempt.name,firstName:attempt.name.split(' ')[0],lastName:attempt.name.split(' ').slice(1).join(' '),classId,mathspaceGroup:'Adventurer',avatarUrl:data.students[(attempt.id-1)%data.students.length].avatarUrl});
  if(!data.studentActivities.some(a=>a.studentId===id)&&data.studentActivities[0])data.studentActivities.push({...data.studentActivities[0],studentId:id});
 }
 if(!data.tasks.some(t=>t.id===taskId))data.tasks.push({id:taskId,title:'Linear equations test',classId,taskType:'test',areaOfStudy:'Algebra',startDate:'2026-09-25T10:00',dueDate:'2026-09-28T15:00',expiryDate:'2026-09-28T15:00',createdAt:'2026-09-25T09:00',questionsCount:15,skillsCount:6,status:'active',testStatus:'live',assignments:[],taskGroups:['Group 1','Group 2'].map((name,i)=>({id:`test-group-${i+1}`,name,studentIds:testStudents.filter(s=>s.group===name).map(s=>`test-student-${s.id}`),startDate:i?'2026-09-28T09:00':'2026-09-25T10:00',dueDate:i?'2026-09-28T15:00':'2026-09-25T11:00',resultsLocked:true,resultsReleaseRule:'on-expiry'}))});
 if(!data.taskResults.some(r=>r.taskId===taskId))data.taskResults.push({taskId,perStudent:testStudents.map(s=>({studentId:`test-student-${s.id}`,status:s.status==='Completed'?'Completed':s.progress?'In Progress':'Not Started',score:s.status==='Completed'?83:0}))});
 saveData(data); return data;
}
