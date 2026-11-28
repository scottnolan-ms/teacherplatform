import type { DashboardClass, DemoTask } from '../dashboard/model';
import { difficulties, questions } from '../test-controls/report-data';
import type { Question } from '../test-controls/report-data';

export type CreationVersion = 'current' | 'near-term' | 'future';
export type CalculatorMode = 'off' | 'selected' | 'all';
export type ReleaseRule = 'manual' | 'available' | 'group' | 'all' | 'expiry';

export type TestQuestion = Question & { minutes: number; topic: string };
export type SelectedQuestion = { key: string; questionId: number; calculator: boolean };
export type AssignmentGroup = {
  id: string;
  name: string;
  students: string[];
  start: string;
  due: string;
  timer: 'when-student-begins' | 'scheduled' | 'untimed';
  duration: number;
  calculator: CalculatorMode;
};

export type TestSetup = {
  version: CreationVersion;
  questions: SelectedQuestion[];
  groups: AssignmentGroup[];
  calculator: CalculatorMode;
  release: ReleaseRule;
  variations: boolean;
  integrity: boolean;
};

export const versions: { id: CreationVersion; label: string; description: string }[] = [
  { id: 'current', label: 'Current flow', description: 'Open a custom task, browse the textbook and configure the test.' },
  { id: 'near-term', label: 'Near-term preview', description: 'Set calculator access per question and review it from the report.' },
  { id: 'future', label: 'Future concept', description: 'Start with a teaching purpose and preview the test as a student.' },
];

export const releaseLabels: Record<ReleaseRule, string> = {
  manual: 'Manually when I’m ready',
  available: 'As soon as available',
  group: 'As each task group is done',
  all: 'When all task groups are done',
  expiry: 'When the due date is reached',
};

export const calculatorLabels: Record<CalculatorMode, string> = { off: 'Off', selected: 'Selected', all: 'All' };

const subtopics = ['One-step equations', 'Two-step equations', 'Equations with brackets', 'Variables on both sides', 'Equations with fractions and decimals'];
const subtopicIndex = [0, 0, 0, 1, 1, 4, 2, 3, 3, 1, 4, 3, 4, 4, 2];
export const testQuestions: TestQuestion[] = questions.map((question, index) => ({
  ...question,
  marks: index === 0 ? 1 : question.marks,
  topic: 'Equations',
  skill: subtopics[subtopicIndex[index]],
  minutes: question.difficulty === 'Hard' ? 3 : question.difficulty === 'Medium' ? 2 : 1,
}));
export const questionBank = new Map(testQuestions.map(question => [question.id, question]));
export const chapterTopics = [
  { name: 'Algebra', subtopics: ['Collecting like terms', 'Substitution'] },
  { name: 'Equations', subtopics },
];
export const difficultyLevels = difficulties;

export function localDateTime(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function newGroup(index: number, students: string[] = []): AssignmentGroup {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const due = new Date(start);
  due.setDate(start.getDate() + 6);
  due.setHours(15, 0, 0, 0);
  return {
    id: crypto.randomUUID(), name: `Task group ${index}`, students,
    start: localDateTime(start), due: localDateTime(due), timer: 'when-student-begins',
    duration: 20, calculator: 'all',
  };
}

export function dueTime(group: AssignmentGroup) {
  const start = Date.parse(group.start);
  return group.timer === 'scheduled' && Number.isFinite(start) && Number.isFinite(group.duration)
    ? localDateTime(new Date(start + group.duration * 60_000))
    : group.due;
}

export function assignmentError(groups: AssignmentGroup[]) {
  const names = new Set<string>();
  for (const group of groups) {
    if (!group.name.trim()) return 'Give each task group a name.';
    const name = group.name.trim().toLowerCase();
    if (names.has(name)) return 'Give each task group a different name.';
    names.add(name);
    if (!group.students.length) return `Choose students for ${group.name}.`;
    if (group.timer !== 'untimed' && (!Number.isInteger(group.duration) || group.duration < 1 || group.duration > 180)) {
      return `Enter a duration from 1 to 180 minutes for ${group.name}.`;
    }
    if (!(Date.parse(group.start) < Date.parse(dueTime(group)))) return `Set a due date after the start for ${group.name}.`;
  }
  return '';
}

export function usesCalculator(group: AssignmentGroup, question: SelectedQuestion) {
  return group.calculator === 'all' || (group.calculator === 'selected' && question.calculator);
}

export function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function makeTest(title: string, setup: TestSetup, item: DashboardClass): DemoTask {
  const groups = setup.groups.map(group => ({ ...group, name: group.name.trim() }));
  const starts = groups.map(group => group.start).sort();
  const dues = groups.map(dueTime).sort();
  const due = dues[dues.length - 1];
  const dueDate = due.slice(0, 10);
  const today = localDateTime(new Date()).slice(0, 10);
  const assignedCount = groups.reduce((count, group) => count + group.students.length, 0);
  return {
    id: `authored-test-${crypto.randomUUID()}`, title: title.trim(), type: 'Test',
    completed: false, participation: 0, result: null, assignedCount,
    assignedTo: assignedCount === item.students.length ? 'Whole class' : `${assignedCount} students`,
    dueIn: (Date.parse(dueDate) - Date.parse(today)) / 86_400_000,
    startDate: starts[0].slice(0, 10), dueDate, expiryDate: dueDate,
    minutes: groups.length === 1 && groups[0].timer !== 'untimed' ? groups[0].duration : undefined,
    testSetup: { ...setup, groups },
  };
}

export function testReportPath(classId: string, taskId: string) {
  return `/classes/${classId}/tasks/${taskId}/report`;
}
