import { useState, useEffect } from 'react';
import { loadData } from '../../data/storage';
import type { Task, Student, TaskResult, TaskDetailData, StudentTaskDetail, QuestionDetail, SkillsTabData, TaskInsights, ReadinessLevel, MasteryLevel, SkillReference, SkillFilterBucket } from '../../types';
import TaskInsightsPanel from './TaskInsightsPanel';
import StudentsTab from './StudentsTab';
import QuestionsTab from './QuestionsTab';
import SkillsTab from './SkillsTab';
import ActionFlowModal from './ActionFlowModal';

interface TaskDetailSheetProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailSheet({ taskId, onClose }: TaskDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'questions' | 'skills'>('students');
  const [taskDetail, setTaskDetail] = useState<TaskDetailData | null>(null);
  // Multi-select filters - empty array means 'all'
  const [readinessFilters, setReadinessFilters] = useState<ReadinessLevel[]>([]);
  const [skillFilters, setSkillFilters] = useState<SkillFilterBucket[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showAtRiskModal, setShowAtRiskModal] = useState(false);
  const [showQuickWinsModal, setShowQuickWinsModal] = useState(false);
  const [highlightAtRisk, setHighlightAtRisk] = useState(false);

  useEffect(() => {
    const data = loadData();
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;

    const classStudents = data.students.filter(s => s.classId === task.classId);
    const taskResult = data.taskResults.find(r => r.taskId === taskId);
    const teacher = data.teacher;
    const classData = data.classes.find(c => c.id === task.classId);

    // Generate mock detailed data
    const detailData = generateTaskDetailData(task, classStudents, taskResult, teacher.name, classData?.name || '');
    setTaskDetail(detailData);
  }, [taskId]);

  if (!taskDetail) {
    return null;
  }

  // Get skill IDs for the selected buckets (multi-select)
  const getSkillIdsInBuckets = (): string[] => {
    if (skillFilters.length === 0) return [];
    const skillIds: string[] = [];
    if (skillFilters.includes('critical-gap')) {
      skillIds.push(...taskDetail.insights.skillsSummary.criticalGap.map(s => s.id));
    }
    if (skillFilters.includes('needs-practice')) {
      skillIds.push(...taskDetail.insights.skillsSummary.needsMorePractice.map(s => s.id));
    }
    if (skillFilters.includes('proficient')) {
      skillIds.push(...taskDetail.insights.skillsSummary.proficient.map(s => s.id));
    }
    return [...new Set(skillIds)]; // Remove duplicates
  };

  const skillIdsInBucket = getSkillIdsInBuckets();

  // Filter students by readiness and/or skill bucket (multi-select)
  const filteredStudents = taskDetail.students.filter(student => {
    // Apply readiness filter (if any selected)
    if (readinessFilters.length > 0 && !readinessFilters.includes(student.readiness)) {
      return false;
    }
    // Apply skill bucket filter - check if student has any skill in the selected buckets
    if (skillFilters.length > 0 && skillIdsInBucket.length > 0) {
      const studentSkills = taskDetail.skillsData.students.find(s => s.studentId === student.studentId);
      if (!studentSkills) return false;
      // Check if student has at least one skill in any selected bucket
      const hasSkillInBucket = skillIdsInBucket.some(skillId => {
        const mastery = studentSkills.skillMasteries[skillId] || 0;
        // Check mastery against all selected buckets
        if (skillFilters.includes('critical-gap') && mastery <= 1.5) return true;
        if (skillFilters.includes('needs-practice') && mastery > 1.5 && mastery < 3.5) return true;
        if (skillFilters.includes('proficient') && mastery >= 3.5) return true;
        return false;
      });
      if (!hasSkillInBucket) return false;
    }
    return true;
  });

  // Filter questions by skill bucket (multi-select)
  const filteredQuestions = taskDetail.questions.filter(question => {
    if (skillFilters.length === 0) return true;
    // Check if question has any skill in the selected buckets
    return question.skills.some(skill => skillIdsInBucket.includes(skill.id));
  });

  // Filter skills for the skills tab (multi-select)
  const filteredSkillsData = {
    ...taskDetail.skillsData,
    skills: skillFilters.length === 0
      ? taskDetail.skillsData.skills
      : taskDetail.skillsData.skills.filter(skill => skillIdsInBucket.includes(skill.skillId)),
    students: taskDetail.skillsData.students.filter(student => {
      if (readinessFilters.length > 0 && !readinessFilters.includes(student.readiness)) {
        return false;
      }
      return true;
    })
  };

  // Handler for at-risk students click - show action modal
  const handleAtRiskClick = () => {
    setShowAtRiskModal(true);
  };

  // Handler for quick wins click - show action modal
  const handleQuickWinsClick = () => {
    setShowQuickWinsModal(true);
  };

  // Handle action from at-risk modal
  const handleAtRiskAction = (action: string, studentIds: string[]) => {
    console.log('At-risk action:', action, 'for students:', studentIds);
    // In a real app, this would trigger the appropriate action
    setShowAtRiskModal(false);
  };

  // Handle action from quick wins modal
  const handleQuickWinsAction = (action: string, skillIds: string[]) => {
    console.log('Quick wins action:', action, 'for skills:', skillIds);
    // In a real app, this would trigger the appropriate action
    setShowQuickWinsModal(false);
  };

  // Get at-risk students data for the modal
  const getAtRiskStudents = (): StudentTaskDetail[] => {
    return taskDetail.students.filter(s =>
      taskDetail.insights.atRiskStudents.includes(s.studentId)
    );
  };

  // Get quick wins skills with affected students
  const getQuickWinsWithStudents = () => {
    return taskDetail.insights.quickWinSkills.map(skill => {
      // Find skill data to get class average
      const skillData = taskDetail.skillsData.skills.find(s => s.skillId === skill.id);
      const classAverageMastery = skillData?.classAverageMastery || 0;

      // Find students who need practice on this skill (mastery < 4)
      const affectedStudents = taskDetail.skillsData.students
        .filter(student => {
          const mastery = student.skillMasteries[skill.id] || 0;
          return mastery < 4; // Below proficient
        })
        .map(student => ({
          studentId: student.studentId,
          studentName: student.studentName,
          firstName: student.firstName,
          lastName: student.lastName,
          avatarUrl: student.avatarUrl,
          mastery: student.skillMasteries[skill.id] || 0
        }))
        .sort((a, b) => a.mastery - b.mastery); // Sort by mastery ascending

      return {
        ...skill,
        classAverageMastery,
        affectedStudents
      };
    });
  };

  // Calculate counts for display
  const totalSelectedOrFiltered = selectedStudentIds.length > 0 ? selectedStudentIds.length : filteredStudents.length;

  const formatDateRange = () => {
    const { header } = taskDetail;
    if (header.dueDates && header.dueDates.length > 1) {
      return header.dueDates.map(dd => {
        const date = new Date(dd.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return `${date} (${dd.groupNames.join(', ')})`;
      }).join(' → ');
    }
    const start = new Date(header.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const due = new Date(header.dueDates[0]?.date || header.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `${start} → ${due}`;
  };

  const getTaskTypeLabel = () => {
    const labels: Record<string, string> = {
      'topic-readiness-checkin': 'Topic Readiness Check-in',
      'adaptive': 'Adaptive Task',
      'custom': 'Custom Task',
      'test': 'Test',
      'revision': 'Revision'
    };
    return labels[taskDetail.header.taskType] || taskDetail.header.taskType;
  };

  const getTaskTypeColor = () => {
    const colors: Record<string, string> = {
      'topic-readiness-checkin': '#7C6ECC',
      'adaptive': '#1CB7C8',
      'custom': '#0E7AC2',
      'test': '#D5424D',
      'revision': '#16A188'
    };
    return colors[taskDetail.header.taskType] || '#5A5A68';
  };

  // Check if currently in extension period
  const isInExtensionPeriod = () => {
    const now = new Date();
    const dueDates = taskDetail.header.dueDates;
    const expiryDate = taskDetail.header.expiryDate ? new Date(taskDetail.header.expiryDate) : null;

    if (!expiryDate || dueDates.length === 0) return false;

    // Get latest due date
    const latestDueDate = dueDates.reduce((latest, dd) => {
      const d = new Date(dd.date);
      return d > latest ? d : latest;
    }, new Date(dueDates[0].date));

    return now > latestDueDate && now < expiryDate;
  };

  const inExtensionPeriod = isInExtensionPeriod();

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-header">
          <div className="sheet-header-content">
            <div className="sheet-title-row">
              <h2 style={{ margin: 0 }}>{taskDetail.header.title}</h2>
              <span
                className="task-type-chip"
                style={{
                  backgroundColor: `${getTaskTypeColor()}15`,
                  color: getTaskTypeColor(),
                  marginLeft: '0.75rem'
                }}
              >
                {getTaskTypeLabel()}
              </span>
              <span
                className={`status-badge ${taskDetail.header.status}`}
                style={{ marginLeft: '0.5rem' }}
              >
                {taskDetail.header.status === 'active' ? 'Active' : 'Expired'}
              </span>
              {inExtensionPeriod && (
                <span className="status-badge extension" style={{ marginLeft: '0.5rem' }}>
                  Extension Period
                </span>
              )}
            </div>
            <div className="sheet-meta-row">
              <span className="sheet-meta-item">
                {taskDetail.header.areaOfStudy}
              </span>
              <span className="sheet-meta-divider">•</span>
              <span className="sheet-meta-item">
                {formatDateRange()}
              </span>
              {taskDetail.header.expiryDate && (
                <>
                  <span className="sheet-meta-divider">•</span>
                  <span className="sheet-meta-item expiry">
                    Expires: {new Date(taskDetail.header.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </>
              )}
            </div>
            <div className="sheet-stats-row">
              <span className="sheet-stat">
                <strong>{taskDetail.header.questionsCount}</strong> Questions
              </span>
              <span className="sheet-stat">
                <strong>{taskDetail.header.skillsCount}</strong> Skills
              </span>
              <span className="sheet-stat">
                Assigned by <strong>{taskDetail.header.teacherName}</strong>
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="sheet-body">
          <TaskInsightsPanel
            insights={taskDetail.insights}
            taskType={taskDetail.header.taskType}
            readinessFilters={readinessFilters}
            onReadinessFilterChange={setReadinessFilters}
            skillFilters={skillFilters}
            onSkillFilterChange={setSkillFilters}
            onAtRiskClick={handleAtRiskClick}
            onQuickWinsClick={handleQuickWinsClick}
            highlightAtRisk={highlightAtRisk}
            onHighlightAtRiskChange={setHighlightAtRisk}
          />

          <div className="sheet-tabs-row">
            <div className="sheet-tabs">
              <button
                className={`sheet-tab ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                Students ({filteredStudents.length})
              </button>
              <button
                className={`sheet-tab ${activeTab === 'questions' ? 'active' : ''}`}
                onClick={() => setActiveTab('questions')}
              >
                Questions ({filteredQuestions.length})
              </button>
              <button
                className={`sheet-tab ${activeTab === 'skills' ? 'active' : ''}`}
                onClick={() => setActiveTab('skills')}
              >
                Skills ({filteredSkillsData.skills.length})
              </button>
            </div>
            <button className="btn btn-primary assign-btn">
              <img src="//assets/Icons/Add.svg" alt="" width="16" height="16" />
              Assign
              {totalSelectedOrFiltered > 0 && totalSelectedOrFiltered !== taskDetail.students.length && (
                <span className="assign-count">({totalSelectedOrFiltered})</span>
              )}
            </button>
          </div>

          <div className="sheet-tab-content">
            {activeTab === 'students' && (
              <StudentsTab
                students={filteredStudents}
                selectedStudentIds={selectedStudentIds}
                onSelectionChange={setSelectedStudentIds}
                atRiskStudentIds={taskDetail.insights.atRiskStudents}
                highlightAtRisk={highlightAtRisk}
                taskType={taskDetail.header.taskType}
              />
            )}
            {activeTab === 'questions' && (
              <QuestionsTab questions={filteredQuestions} />
            )}
            {activeTab === 'skills' && (
              <SkillsTab skillsData={filteredSkillsData} />
            )}
          </div>
        </div>
      </div>

      {/* Action Flow Modals */}
      {showAtRiskModal && taskDetail.insights.atRiskStudents.length > 0 && (
        <ActionFlowModal
          type="at-risk"
          students={getAtRiskStudents()}
          onClose={() => setShowAtRiskModal(false)}
          onAction={handleAtRiskAction}
        />
      )}

      {showQuickWinsModal && taskDetail.insights.quickWinSkills.length > 0 && (
        <ActionFlowModal
          type="quick-wins"
          skills={getQuickWinsWithStudents()}
          onClose={() => setShowQuickWinsModal(false)}
          onAction={handleQuickWinsAction}
        />
      )}
    </div>
  );
}

// Mock data generator function
function generateTaskDetailData(
  task: Task,
  students: Student[],
  taskResult: TaskResult | undefined,
  teacherName: string,
  className: string
): TaskDetailData {
  const skills = generateMockSkills(task.skillsCount || 8);
  const questions = generateMockQuestions(task.questionsCount || 10, skills, students.length);

  // Get latest due date for extension period calculation
  const dueDates = task.dueDates || [{ date: task.dueDate, groupIds: [], groupNames: ['All Students'] }];
  const latestDueDate = dueDates.reduce((latest, dd) => {
    const d = new Date(dd.date);
    return d > latest ? d : latest;
  }, new Date(dueDates[0].date));
  const expiryDate = task.expiryDate ? new Date(task.expiryDate) : undefined;

  const studentDetails = generateStudentDetails(students, taskResult, skills, task.questionsCount || 10, latestDueDate, expiryDate);
  const skillsData = generateSkillsTabData(studentDetails, skills, task.classId);
  const insights = calculateInsights(studentDetails, skills, skillsData);

  return {
    header: {
      taskId: task.id,
      title: task.title,
      areaOfStudy: task.areaOfStudy || 'General',
      taskType: task.taskType || 'custom',
      startDate: task.startDate || task.createdAt,
      dueDates: task.dueDates || [{ date: task.dueDate, groupIds: [], groupNames: ['All Students'] }],
      expiryDate: task.expiryDate,
      questionsCount: task.questionsCount || 10,
      skillsCount: task.skillsCount || 8,
      teacherName,
      status: task.status || 'active',
      classId: task.classId,
      className
    },
    students: studentDetails,
    questions,
    skillsData,
    insights
  };
}

function generateMockSkills(_count: number): SkillReference[] {
  // Fixed set of 10 skills with specific codes and target mastery levels
  const skills = [
    { id: 'skill-1', name: 'Indices and standard form', code: 'MA4-IND-C-01.3' },
    { id: 'skill-2', name: 'Algebraic expressions', code: 'MA4-ALG-C-01.3' },
    { id: 'skill-3', name: 'Solving linear equations', code: 'MA4-ALG-C-01.2' },
    { id: 'skill-4', name: 'Expanding brackets', code: 'MA4-ALG-C-01.1' },
    { id: 'skill-5', name: 'Integer operations', code: 'MA4-INT-C-01.4' },
    { id: 'skill-6', name: 'Order of operations', code: 'MA4-INT-C-01.3' },
    { id: 'skill-7', name: 'Fraction operations', code: 'MA4-INT-C-01.2' },
    { id: 'skill-8', name: 'Decimal operations', code: 'MA4-INT-C-01.1' },
    { id: 'skill-9', name: 'Measurement and ratio', code: 'MA3-MR-02.B.5' },
    { id: 'skill-10', name: 'Basic multiplication', code: 'MA3-MR-02.B.3' }
  ];

  return skills;
}

function generateMockQuestions(count: number, skills: SkillReference[], totalStudents: number): QuestionDetail[] {
  const grades = ['Year 8', 'Year 9', 'Year 10'];
  const subtopics = [
    { id: 'sub-1', name: 'Equations' },
    { id: 'sub-2', name: 'Expressions' },
    { id: 'sub-3', name: 'Functions' },
    { id: 'sub-4', name: 'Graphing' }
  ];

  return Array.from({ length: count }, (_, i) => {
    const correct = Math.floor(Math.random() * (totalStudents * 0.7)) + Math.floor(totalStudents * 0.1);
    const partial = Math.floor(Math.random() * (totalStudents * 0.2));
    const incorrect = Math.floor(Math.random() * (totalStudents * 0.2));
    const skipped = totalStudents - correct - partial - incorrect;

    return {
      questionId: `q-${i + 1}`,
      questionNumber: i + 1,
      questionPreview: `Question ${i + 1}: Solve for x...`,
      grade: grades[Math.floor(Math.random() * grades.length)],
      subtopics: [subtopics[i % subtopics.length]],
      skills: [skills[i % skills.length]],
      correctCount: Math.max(0, correct),
      partialCount: Math.max(0, partial),
      incorrectCount: Math.max(0, incorrect),
      skippedCount: Math.max(0, skipped),
      totalAttempts: totalStudents
    };
  });
}

function generateStudentDetails(
  students: Student[],
  taskResult: TaskResult | undefined,
  _skills: SkillReference[],
  totalQuestions: number,
  latestDueDate: Date,
  expiryDate?: Date
): StudentTaskDetail[] {
  return students.map(student => {
    const result = taskResult?.perStudent.find(r => r.studentId === student.id);
    const isCompleted = result?.status === 'Completed';
    const isInProgress = result?.status === 'In Progress';

    const questionsAnswered = isCompleted
      ? totalQuestions
      : isInProgress
        ? Math.floor(Math.random() * (totalQuestions - 1)) + 1
        : 0;

    const readiness: ReadinessLevel = isCompleted
      ? (result?.score || 0) >= 70 ? 'ready' : (result?.score || 0) >= 40 ? 'partially-ready' : 'not-ready'
      : 'not-ready';

    const markCorrect = Math.floor(((result?.score || 0) / 100) * totalQuestions);

    // Generate realistic completion date based on task dates
    // Completion date must be in the past (before "now")
    let completedAt: string | undefined;
    let isExtensionPeriod = false;

    if (isCompleted) {
      const now = new Date();

      // Check if we're currently past the due date (in extension period)
      const isPastDueDate = now > latestDueDate;
      const isPastExpiry = expiryDate && now > expiryDate;

      if (isPastDueDate && expiryDate && !isPastExpiry && Math.random() > 0.8) {
        // 20% of students completed during extension (between due date and now)
        const extensionMs = now.getTime() - latestDueDate.getTime();
        const randomOffset = Math.random() * extensionMs;
        completedAt = new Date(latestDueDate.getTime() + randomOffset).toISOString();
        isExtensionPeriod = true;
      } else {
        // Generate completion date BEFORE the due date (1-7 days before due date)
        // This ensures students who completed "on time" show dates before due date
        const daysBeforeDue = Math.floor(Math.random() * 7) + 1;
        const completedDate = new Date(latestDueDate.getTime() - daysBeforeDue * 24 * 60 * 60 * 1000);
        completedAt = completedDate.toISOString();
        isExtensionPeriod = false;
      }
    }

    return {
      studentId: student.id,
      studentName: student.name,
      firstName: student.firstName,
      lastName: student.lastName,
      avatarUrl: student.avatarUrl,
      mathspaceGroup: student.mathspaceGroupOverride || student.mathspaceGroup,
      completionProgress: Math.round((questionsAnswered / totalQuestions) * 100),
      questionsAnswered,
      totalQuestions,
      completedAt,
      isExtensionPeriod,
      readiness,
      confidence: readiness === 'ready' ? 'high' : readiness === 'partially-ready' ? 'medium' : 'low',
      resultPercentage: result?.score || 0,
      markCorrect,
      markTotal: totalQuestions,
      markPenalty: undefined,
      timeSpentMinutes: isCompleted ? Math.floor(Math.random() * 45) + 15 : isInProgress ? Math.floor(Math.random() * 20) + 5 : 0,
      status: isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'not-started',
      stickersReceived: Math.floor(Math.random() * 5)
    };
  });
}

function generateSkillsTabData(students: StudentTaskDetail[], skills: SkillReference[], classId?: string): SkillsTabData {
  // Class A (Hatchling/Not Ready): Low mastery across skills - class needs help
  // Target class averages for each skill AT DUE DATE matching specific mastery levels:
  // MA4-IND-C-01.3: No activity (0), MA4-ALG-C-01.3/2/1: Exploring (1),
  // MA4-INT-C-01.4/3: Emerging (2), MA4-INT-C-01.2/1: Familiar (3),
  // MA3-MR-02.B.5: Proficient (4), MA3-MR-02.B.3: Mastered (5)
  const classATargets = [0.2, 1.0, 1.1, 1.2, 2.0, 2.1, 3.0, 3.1, 4.0, 5.0];

  // Class B (Flying/Partially Ready): Higher mastery - class is almost ready
  // Most skills at Familiar (3) or Proficient (4), a few at Mastered (5)
  // ~20% students Soaring, ~60% Flying, ~20% Hatchling
  const classBTargets = [2.5, 3.0, 3.2, 3.5, 3.8, 4.0, 4.2, 4.5, 4.8, 5.0];

  const isClassB = classId === 'class-b';
  const targetClassAveragesAtDueDate = isClassB ? classBTargets : classATargets;

  // Growth amounts for each skill (can be positive, negative, or zero)
  // Positive = improvement since due date, Negative = regression (rare), Zero = no change
  // Class A: Skills with lower mastery tend to have more growth potential
  const classAGrowth = [
    0.3,   // skill-1: No activity -> slight improvement
    0.8,   // skill-2: Exploring -> moderate improvement
    0.5,   // skill-3: Exploring -> some improvement
    0.4,   // skill-4: Exploring -> some improvement
    0.6,   // skill-5: Emerging -> decent improvement
    0.3,   // skill-6: Emerging -> slight improvement
    0.2,   // skill-7: Familiar -> little improvement (already decent)
    0.1,   // skill-8: Familiar -> minimal change (already decent)
    0,     // skill-9: Proficient -> no change (already good)
    0      // skill-10: Mastered -> no change (already mastered)
  ];

  // Class B: Already high mastery, minimal growth needed
  const classBGrowth = [
    0.4,   // skill-1: Emerging -> moderate improvement
    0.3,   // skill-2: Familiar -> some improvement
    0.2,   // skill-3: Familiar -> some improvement
    0.2,   // skill-4: Familiar -> some improvement
    0.1,   // skill-5: Proficient -> slight improvement
    0.1,   // skill-6: Proficient -> slight improvement
    0,     // skill-7: Proficient -> no change
    0,     // skill-8: Proficient -> no change
    0,     // skill-9: Mastered -> no change
    0      // skill-10: Mastered -> no change
  ];

  const skillGrowthAmounts = isClassB ? classBGrowth : classAGrowth;

  const studentSkillMasteries = students.map(student => {
    const masteries: Record<string, MasteryLevel> = {};
    const masteriesAtDueDate: Record<string, MasteryLevel> = {};
    let totalMastery = 0;
    let totalMasteryAtDueDate = 0;
    let proficientCount = 0;
    let proficientCountAtDueDate = 0;

    skills.forEach((skill, skillIndex) => {
      let masteryAtDueDate: MasteryLevel;
      let currentMastery: MasteryLevel;

      if (student.status === 'not-started') {
        masteryAtDueDate = 0;
        currentMastery = 0;
      } else {
        // Get the target average for this skill at due date
        const targetAvgAtDueDate = targetClassAveragesAtDueDate[skillIndex % targetClassAveragesAtDueDate.length];
        const growthAmount = skillGrowthAmounts[skillIndex % skillGrowthAmounts.length];

        // Generate mastery AT DUE DATE that trends toward the target, adjusted by student readiness
        let baseMasteryAtDueDate: number;
        if (student.readiness === 'ready') {
          baseMasteryAtDueDate = Math.min(5, targetAvgAtDueDate + (Math.random() * 1.5 - 0.5));
        } else if (student.readiness === 'partially-ready') {
          baseMasteryAtDueDate = Math.max(0, Math.min(5, targetAvgAtDueDate + (Math.random() * 2 - 1)));
        } else {
          baseMasteryAtDueDate = Math.max(0, targetAvgAtDueDate - (Math.random() * 1.5 + 0.5));
        }
        masteryAtDueDate = Math.round(baseMasteryAtDueDate) as MasteryLevel;

        // Calculate CURRENT mastery based on growth since due date
        // Some students improve more than others based on engagement
        let studentGrowthMultiplier: number;
        if (student.readiness === 'ready') {
          // Ready students maintain or slightly improve
          studentGrowthMultiplier = 0.5 + Math.random() * 0.5;
        } else if (student.readiness === 'partially-ready') {
          // Partially ready students have higher growth potential (room to improve)
          studentGrowthMultiplier = 0.8 + Math.random() * 0.7;
        } else {
          // Not ready students may or may not engage after due date
          studentGrowthMultiplier = Math.random() > 0.5 ? 0.5 + Math.random() * 1.0 : 0;
        }

        const actualGrowth = growthAmount * studentGrowthMultiplier;
        const baseCurrentMastery = baseMasteryAtDueDate + actualGrowth;
        currentMastery = Math.min(5, Math.max(0, Math.round(baseCurrentMastery))) as MasteryLevel;
      }

      masteriesAtDueDate[skill.id] = masteryAtDueDate;
      masteries[skill.id] = currentMastery;

      totalMasteryAtDueDate += masteryAtDueDate;
      totalMastery += currentMastery;

      if (masteryAtDueDate >= 4) proficientCountAtDueDate++;
      if (currentMastery >= 4) proficientCount++;
    });

    return {
      studentId: student.studentId,
      studentName: student.studentName,
      firstName: student.firstName,
      lastName: student.lastName,
      avatarUrl: student.avatarUrl,
      readiness: student.readiness,
      averageMastery: skills.length > 0 ? totalMastery / skills.length : 0,
      proficientSkillsCount: proficientCount,
      totalSkillsCount: skills.length,
      skillMasteries: masteries,
      // Growth tracking fields
      skillMasteriesAtDueDate: masteriesAtDueDate,
      averageMasteryAtDueDate: skills.length > 0 ? totalMasteryAtDueDate / skills.length : 0,
      proficientSkillsCountAtDueDate: proficientCountAtDueDate
    };
  });

  // Calculate class averages for CURRENT values
  const classSkillMasteries: Record<string, number> = {};
  const classSkillMasteriesAtDueDate: Record<string, number> = {};

  skills.forEach(skill => {
    const totalCurrent = studentSkillMasteries.reduce((sum, s) => sum + (s.skillMasteries[skill.id] || 0), 0);
    const totalAtDueDate = studentSkillMasteries.reduce((sum, s) => sum + (s.skillMasteriesAtDueDate?.[skill.id] || 0), 0);
    classSkillMasteries[skill.id] = students.length > 0 ? totalCurrent / students.length : 0;
    classSkillMasteriesAtDueDate[skill.id] = students.length > 0 ? totalAtDueDate / students.length : 0;
  });

  const totalProficient = studentSkillMasteries.reduce((sum, s) => sum + s.proficientSkillsCount, 0);
  const totalProficientAtDueDate = studentSkillMasteries.reduce((sum, s) => sum + (s.proficientSkillsCountAtDueDate || 0), 0);
  const avgMastery = studentSkillMasteries.reduce((sum, s) => sum + s.averageMastery, 0) / (students.length || 1);
  const avgMasteryAtDueDate = studentSkillMasteries.reduce((sum, s) => sum + (s.averageMasteryAtDueDate || 0), 0) / (students.length || 1);

  const skillMasteryData = skills.map(skill => {
    const avgMasteryForSkill = classSkillMasteries[skill.id] || 0;
    const proficient = studentSkillMasteries.filter(s => (s.skillMasteries[skill.id] || 0) >= 4).length;
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillCode: skill.code,
      classAverageMastery: avgMasteryForSkill,
      proficientCount: proficient,
      totalStudents: students.length
    };
  });

  return {
    skills: skillMasteryData,
    students: studentSkillMasteries,
    classAverage: {
      readiness: avgMastery >= 3.5 ? 'ready' : avgMastery >= 2 ? 'partially-ready' : 'not-ready',
      averageMastery: avgMastery,
      proficientSkillsCount: Math.round(totalProficient / (students.length || 1)),
      totalSkillsCount: skills.length,
      skillMasteries: classSkillMasteries,
      // Growth tracking for class average
      skillMasteriesAtDueDate: classSkillMasteriesAtDueDate,
      averageMasteryAtDueDate: avgMasteryAtDueDate,
      proficientSkillsCountAtDueDate: Math.round(totalProficientAtDueDate / (students.length || 1))
    }
  };
}

function calculateInsights(students: StudentTaskDetail[], skills: SkillReference[], skillsData: SkillsTabData): TaskInsights {
  const ready = students.filter(s => s.readiness === 'ready').length;
  const partiallyReady = students.filter(s => s.readiness === 'partially-ready').length;
  const notReady = students.filter(s => s.readiness === 'not-ready').length;

  // Use actual class averages from skillsData
  const skillAverages: Record<string, number> = skillsData.classAverage.skillMasteries;

  // Categorize skills based on actual class averages
  const criticalGap = skills.filter(s => (skillAverages[s.id] || 0) <= 1.5);
  const needsMorePractice = skills.filter(s => {
    const avg = skillAverages[s.id] || 0;
    return avg > 1.5 && avg < 3.5;
  });
  const proficient = skills.filter(s => (skillAverages[s.id] || 0) >= 3.5);

  // Quick wins - skills close to proficient (2.8 to 3.5)
  const quickWinSkills = skills.filter(s => {
    const avg = skillAverages[s.id] || 0;
    return avg >= 2.8 && avg < 3.5;
  });

  // At-risk students
  const atRiskStudents = students
    .filter(s => s.readiness === 'not-ready' && s.resultPercentage < 50)
    .map(s => s.studentId);

  // Time outliers
  const avgTime = students.reduce((sum, s) => sum + s.timeSpentMinutes, 0) / (students.length || 1);
  const timeOutliers = students
    .filter(s => s.timeSpentMinutes > avgTime * 2)
    .map(s => s.studentId);

  return {
    readinessBreakdown: {
      ready,
      partiallyReady,
      notReady,
      total: students.length
    },
    skillsSummary: {
      criticalGap,
      needsMorePractice,
      proficient
    },
    atRiskStudents,
    quickWinSkills,
    commonStruggles: [],
    timeOutliers
  };
}
