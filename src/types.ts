export type MathspaceGroup = 'Explorer' | 'Adventurer' | 'Trailblazer';

// Task Detail Types
export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type ReadinessLevel = 'ready' | 'partially-ready' | 'not-ready';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type TaskStatus = 'active' | 'expired';
export type TaskType = 'topic-readiness-checkin' | 'adaptive' | 'custom' | 'test' | 'revision';

export interface School {
  id: string;
  name: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  schoolId: string;
}

export interface Student {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  classId: string;
  mathspaceGroup: MathspaceGroup;
  mathspaceGroupOverride?: MathspaceGroup;
  avatarUrl: string;
}

export interface StudentActivity {
  studentId: string;
  studentLedTasks: {
    discoveryCheckins: number;
    topicReadinessCheckins: number;
    adaptiveTasks: number;
    revisions: number;
  };
  teacherAssignedTasks: {
    topicReadinessCheckins: number;
    adaptiveTasks: number;
    customTasks: number;
    revisions: number;
    tests: number;
  };
  skills: {
    count: number;
    change: number; // can be positive or negative
  };
  questions: {
    total: number;
    new: number;
    revisionCleared: number;
    revisionRemaining: number;
  };
  accuracy: {
    percentage: number;
    correct: number;
    partial: number;
    incorrect: number;
    skipped: number;
  };
  points: number;
  timeSpent: {
    days: number;
    hours: number;
    minutes: number;
  };
  lastActive: Date;
  stickersReceived: number;
}

export interface Class {
  id: string;
  name: string;
  schoolId: string;
  teacherId: string;
}

export interface PersistentGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  tags: string[];
  type: 'persistent';
  classId?: string;
  studentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TemporaryGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  type: 'temporary';
  studentIds: string[];
}

export type Group = PersistentGroup | TemporaryGroup;

export interface QuestionSet {
  id: string;
  name: string;
}

export interface TaskAssignment {
  groupId: string;
  groupType: 'mathspace' | 'persistent' | 'temporary';
  groupName: string;
  questionSetId: string;
}

export interface TaskDueDate {
  date: string;
  groupIds: string[];
  groupNames: string[];
}

export interface Task {
  id: string;
  title: string;
  classId: string;
  taskType?: TaskType;
  areaOfStudy?: string;
  startDate?: string;
  dueDate: string;
  dueDates?: TaskDueDate[];
  expiryDate?: string;
  assignments: TaskAssignment[];
  temporaryGroups?: TemporaryGroup[];
  createdAt: string;
  questionsCount?: number;
  skillsCount?: number;
  status?: TaskStatus;
}

export interface StudentTaskResult {
  studentId: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  score: number;
}

export interface TaskResult {
  taskId: string;
  perStudent: StudentTaskResult[];
}

export interface AppData {
  school: School;
  teacher: Teacher;
  classes: Class[];
  students: Student[];
  persistentGroups: PersistentGroup[];
  tasks: Task[];
  taskResults: TaskResult[];
  questionSets: QuestionSet[];
  studentActivities: StudentActivity[];
}

// ============================================
// TASK DETAIL TYPES
// ============================================

export interface TaskDetailHeader {
  taskId: string;
  title: string;
  areaOfStudy: string;
  taskType: TaskType;
  startDate: string;
  dueDates: TaskDueDate[];
  expiryDate?: string;
  questionsCount: number;
  skillsCount: number;
  teacherName: string;
  status: TaskStatus;
  classId: string;
  className: string;
}

export interface StudentTaskDetail {
  studentId: string;
  studentName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  mathspaceGroup: MathspaceGroup;

  // Progress
  completionProgress: number;
  questionsAnswered: number;
  totalQuestions: number;
  completedAt?: string;
  isExtensionPeriod?: boolean;

  // Readiness/Confidence
  readiness: ReadinessLevel;
  confidence: ConfidenceLevel;

  // Results
  resultPercentage: number;
  markCorrect: number;
  markTotal: number;
  markPenalty?: number;

  // Time
  timeSpentMinutes: number;

  // Status
  status: 'not-started' | 'in-progress' | 'completed';

  // Stickers
  stickersReceived: number;
}

export interface Subtopic {
  id: string;
  name: string;
}

export interface SkillReference {
  id: string;
  name: string;
  code?: string;
}

export interface QuestionDetail {
  questionId: string;
  questionNumber: number;
  questionPreview: string;
  grade: string;
  subtopics: Subtopic[];
  skills: SkillReference[];
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalAttempts: number;
}

export interface SkillMasteryData {
  skillId: string;
  skillName: string;
  skillCode?: string;
  classAverageMastery: number;
  proficientCount: number;
  totalStudents: number;
}

export interface StudentSkillMastery {
  studentId: string;
  studentName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  readiness: ReadinessLevel;
  averageMastery: number;
  proficientSkillsCount: number;
  totalSkillsCount: number;
  skillMasteries: Record<string, MasteryLevel>;
  // Growth tracking: mastery at due date vs current
  skillMasteriesAtDueDate?: Record<string, MasteryLevel>;
  averageMasteryAtDueDate?: number;
  proficientSkillsCountAtDueDate?: number;
}

export interface SkillsTabData {
  skills: SkillMasteryData[];
  students: StudentSkillMastery[];
  classAverage: {
    readiness: ReadinessLevel;
    averageMastery: number;
    proficientSkillsCount: number;
    totalSkillsCount: number;
    skillMasteries: Record<string, number>;
    // Growth tracking: at due date values
    skillMasteriesAtDueDate?: Record<string, number>;
    averageMasteryAtDueDate?: number;
    proficientSkillsCountAtDueDate?: number;
  };
}

export interface ClassReadinessBreakdown {
  ready: number;
  partiallyReady: number;
  notReady: number;
  total: number;
}

export interface SkillsSummary {
  criticalGap: SkillReference[];
  needsMorePractice: SkillReference[];
  proficient: SkillReference[];
}

export type SkillFilterBucket = 'all' | 'critical-gap' | 'needs-practice' | 'proficient';

export interface TaskInsights {
  readinessBreakdown: ClassReadinessBreakdown;
  skillsSummary: SkillsSummary;
  atRiskStudents: string[];
  quickWinSkills: SkillReference[];
  commonStruggles: string[];
  timeOutliers: string[];
}

export interface TaskDetailData {
  header: TaskDetailHeader;
  students: StudentTaskDetail[];
  questions: QuestionDetail[];
  skillsData: SkillsTabData;
  insights: TaskInsights;
}

// ============================================
// CURRICULUM / TEXTBOOK TYPES
// ============================================

export type ProficiencyLevel = 'strong' | 'developing' | 'needs-support';

export interface CurriculumSkill {
  id: string;
  code: string;
  name: string;
  classAverageMastery: number;
  proficientStudentCount: number;
  totalStudents: number;
  isPrerequisite: boolean;
}

export interface CurriculumSubtopic {
  id: string;
  name: string;
  skills: CurriculumSkill[];
  classAverageMastery: number;
  proficiency: ProficiencyLevel;
}

export interface CurriculumTopic {
  id: string;
  name: string;
  code: string;           // e.g. "MA4-ALG"
  gradeLevel: string;     // e.g. "Year 9" or "Year 8 (Prerequisite)"
  isPrerequisite: boolean;
  subtopics: CurriculumSubtopic[];
  classAverageMastery: number;
  proficiency: ProficiencyLevel;
  readinessTaskId?: string;      // linked readiness check-in task
  readinessLevel?: ReadinessLevel;
  studentBreakdown: {
    strong: number;
    developing: number;
    needsSupport: number;
  };
}

export interface StudentTopicMastery {
  studentId: string;
  studentName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  topicMasteries: Record<string, number>;      // topicId → avg mastery
  subtopicMasteries: Record<string, number>;   // subtopicId → avg mastery
  skillMasteries: Record<string, number>;      // skillId → mastery level
}

export interface CurriculumData {
  topics: CurriculumTopic[];
  students: StudentTopicMastery[];
  overallClassMastery: number;
  overallProficiency: ProficiencyLevel;
}
