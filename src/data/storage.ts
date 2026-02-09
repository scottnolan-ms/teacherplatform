import type { AppData, PersistentGroup, Task, TaskResult, Student } from '../types';
import { initialData } from './seedData';

const STORAGE_KEY = 'teacher-groups-app-data';

export function loadData(): AppData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);

    // Check if data is valid (students have required fields)
    const hasValidStudents = parsed.students?.length > 0 &&
      parsed.students[0]?.lastName !== undefined;

    // If data is corrupted or missing key fields, reset to initial data
    if (!hasValidStudents) {
      console.log('Resetting localStorage due to schema change');
      saveData(initialData);
      return initialData;
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
    return merged;
  }
  // Initialize with seed data
  saveData(initialData);
  return initialData;
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
