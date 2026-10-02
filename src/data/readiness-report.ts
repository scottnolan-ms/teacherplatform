import {populateReadinessQuestions} from './readiness-responses';
import {applyReadinessEvidence,prerequisiteSkills} from './readiness-evidence';
import type {Task, Student, TaskResult, TaskDetailData, StudentTaskDetail, QuestionDetail, SkillsTabData, TaskInsights, ReadinessLevel, MasteryLevel, SkillReference} from '../types';
function seededRandom(key:string){let seed=Array.from(key).reduce((s,c)=>Math.imul(s,31)+c.charCodeAt(0)|0,1);return ()=>{seed=Math.imul(seed,1664525)+1013904223|0;return (seed>>>0)/4294967296}}
// Mock data generator function
export function generateTaskDetailData(
  task: Task,
  students: Student[],
  taskResult: TaskResult | undefined,
  teacherName: string,
  className: string
): TaskDetailData {
  const readinessTask=task.taskType==='topic-readiness-checkin';
  const skills = readinessTask?prerequisiteSkills.map(([name,code],i)=>({id:`skill-${i+1}`,name,code})):generateMockSkills(task.skillsCount || 8);
  const questions = generateMockQuestions(readinessTask?15:task.questionsCount || 10, skills, students.length);

  // Get latest due date for extension period calculation
  const dueDates = task.dueDates || [{ date: task.dueDate, groupIds: [], groupNames: ['All Students'] }];
  const latestDueDate = dueDates.reduce((latest, dd) => {
    const d = new Date(dd.date);
    return d > latest ? d : latest;
  }, new Date(dueDates[0].date));
  const expiryDate = task.expiryDate ? new Date(task.expiryDate) : undefined;

  const studentDetails = generateStudentDetails(students, taskResult, skills, readinessTask?15:task.questionsCount || 10, latestDueDate, expiryDate);
  if(task.taskType==='topic-readiness-checkin') {
    const scenarios = [
      {progress:0,result:0,ready:'ready',prior:'ready'},
      {progress:100,result:90,ready:'not-ready'},
      {progress:100,result:100,ready:'partially-ready'},
      {progress:100,result:100,ready:'ready'},
      {progress:0,result:0,ready:'not-ready'},
      {progress:100,result:60,ready:'partially-ready',prior:'partially-ready'},
      {progress:100,result:60,ready:'ready'},
      {progress:100,result:30,ready:'not-ready'},
    ] as const;
    scenarios.forEach((scenario,index)=>{const student=studentDetails[index];if(!student)return;Object.assign(student,{completionProgress:scenario.progress,questionsAnswered:Math.round(student.totalQuestions*scenario.progress/100),resultPercentage:scenario.result,readiness:scenario.ready,priorReadiness:'prior' in scenario?scenario.prior:undefined,markCorrect:Math.round(student.totalQuestions*scenario.progress/100*scenario.result/100),markTotal:scenario.progress?Math.round(student.totalQuestions*scenario.progress/100):student.totalQuestions,status:scenario.progress===100?'completed':scenario.progress?'in-progress':'not-started',completedAt:scenario.progress===100?student.completedAt??latestDueDate.toISOString():undefined,timeSpentMinutes:scenario.progress?student.timeSpentMinutes||18:0});});
  }
  const skillsData = generateSkillsTabData(studentDetails, skills, task.classId);
  if(task.taskType==='topic-readiness-checkin') {
    applyReadinessEvidence(studentDetails,skillsData);
    populateReadinessQuestions(questions,studentDetails);
    for(const [index,name] of ['Find the gradient of a line segment','Find the midpoint of a line interval'].entries()) {
      const skillId=`topic-standard-${index+1}`;
      skillsData.skills.push({skillId,skillName:name,skillCode:'AC9M9A03',skillType:'topic-standard',yearLevel:9,classAverageMastery:0,proficientCount:0,totalStudents:studentDetails.length});
      skillsData.students.forEach((row,i)=>{row.skillMasteries[skillId]=(i%6) as MasteryLevel;(row.skillMasteriesAtDueDate??={})[skillId]=0;});
    }
  }
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
      questionsCount: readinessTask?15:task.questionsCount || 10,
      skillsCount: readinessTask?13:task.skillsCount || 8,
      teacherName,
      status: Date.parse(task.expiryDate??task.dueDate)<Date.now()?'expired':task.status || 'active',
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
  const random=seededRandom(`questions-${count}-${totalStudents}`);
  const grades = ['Year 8', 'Year 9', 'Year 10'];
  const subtopics = [
    { id: 'sub-1', name: 'Equations' },
    { id: 'sub-2', name: 'Expressions' },
    { id: 'sub-3', name: 'Functions' },
    { id: 'sub-4', name: 'Graphing' }
  ];

  return Array.from({ length: count }, (_, i) => {
    const correct = Math.floor(random() * (totalStudents * 0.7)) + Math.floor(totalStudents * 0.1);
    const partial = Math.floor(random() * (totalStudents * 0.2));
    const incorrect = Math.floor(random() * (totalStudents * 0.2));
    const skipped = totalStudents - correct - partial - incorrect;

    return {
      questionId: `q-${i + 1}`,
      questionNumber: i + 1,
      questionPreview: `Question ${i + 1}: Solve for x...`,
      grade: grades[Math.floor(random() * grades.length)],
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
  const random=seededRandom(students.map(s=>s.id).join('-'));
  return students.map(student => {
    const result = taskResult?.perStudent.find(r => r.studentId === student.id);
    const isCompleted = result?.status === 'Completed';
    const isInProgress = result?.status === 'In Progress';

    const questionsAnswered = isCompleted
      ? totalQuestions
      : isInProgress
        ? Math.floor(random() * (totalQuestions - 1)) + 1
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

      if (isPastDueDate && expiryDate && !isPastExpiry && random() > 0.8) {
        // 20% of students completed during extension (between due date and now)
        const extensionMs = now.getTime() - latestDueDate.getTime();
        const randomOffset = random() * extensionMs;
        completedAt = new Date(latestDueDate.getTime() + randomOffset).toISOString();
        isExtensionPeriod = true;
      } else {
        // Generate completion date BEFORE the due date (1-7 days before due date)
        // This ensures students who completed "on time" show dates before due date
        const daysBeforeDue = Math.floor(random() * 7) + 1;
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
      timeSpentMinutes: isCompleted ? Math.floor(random() * 45) + 15 : isInProgress ? Math.floor(random() * 20) + 5 : 0,
      status: isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'not-started',
      stickersReceived: Math.floor(random() * 5)
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

  const random=seededRandom(classId??'class-a');
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

  const studentSkillMasteries = students.map((student,studentIndex) => {
    const masteries: Record<string, MasteryLevel> = {};
    const masteriesAtDueDate: Record<string, MasteryLevel> = {};
    let totalMastery = 0;
    let totalMasteryAtDueDate = 0;
    let proficientCount = 0;
    let proficientCountAtDueDate = 0;

    skills.forEach((skill, skillIndex) => {
      let masteryAtDueDate: MasteryLevel;
      let currentMastery: MasteryLevel;

      if (student.status === 'not-started' && !student.priorReadiness) {
        masteryAtDueDate = 0;
        currentMastery = 0;
      } else {
        // Get the target average for this skill at due date
        const targetAvgAtDueDate = targetClassAveragesAtDueDate[skillIndex % targetClassAveragesAtDueDate.length];
        const growthAmount = skillGrowthAmounts[skillIndex % skillGrowthAmounts.length];

        // Generate mastery AT DUE DATE that trends toward the target, adjusted by student readiness
        let baseMasteryAtDueDate: number;
        if (student.readiness === 'ready') {
          baseMasteryAtDueDate = Math.min(5, targetAvgAtDueDate + (random() * 1.5 - 0.5));
        } else if (student.readiness === 'partially-ready') {
          baseMasteryAtDueDate = Math.max(0, Math.min(5, targetAvgAtDueDate + (random() * 2 - 1)));
        } else {
          baseMasteryAtDueDate = Math.max(0, targetAvgAtDueDate - (random() * 1.5 + 0.5));
        }
        masteryAtDueDate = Math.round(baseMasteryAtDueDate) as MasteryLevel;

        // Calculate CURRENT mastery based on growth since due date
        // Some students improve more than others based on engagement
        let studentGrowthMultiplier: number;
        if (student.readiness === 'ready') {
          // Ready students maintain or slightly improve
          studentGrowthMultiplier = 0.5 + random() * 0.5;
        } else if (student.readiness === 'partially-ready') {
          // Partially ready students have higher growth potential (room to improve)
          studentGrowthMultiplier = 0.8 + random() * 0.7;
        } else {
          // Not ready students may or may not engage after due date
          studentGrowthMultiplier = random() > 0.5 ? 0.5 + random() * 1.0 : 0;
        }

        const actualGrowth = growthAmount * studentGrowthMultiplier;
        const baseCurrentMastery = baseMasteryAtDueDate + actualGrowth;
        currentMastery = Math.min(5, Math.max(0, Math.round(baseCurrentMastery))) as MasteryLevel;
      }

      // Deliberately independent task results and prerequisite evidence for comparison.
      if(studentIndex===1) {masteryAtDueDate=(skillIndex%3===0?2:1) as MasteryLevel;currentMastery=(skillIndex%3===0?4:3) as MasteryLevel;}
      if(studentIndex===2) {masteryAtDueDate=(skillIndex%2===0?2:3) as MasteryLevel;currentMastery=4;}
      if(studentIndex===6) {masteryAtDueDate=4;currentMastery=5;}
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

export function calculateInsights(students: StudentTaskDetail[], skills: SkillReference[], skillsData: SkillsTabData): TaskInsights {
  const ready = students.filter(s => s.readiness === 'ready').length;
  const partiallyReady = students.filter(s => s.readiness === 'partially-ready').length;
  const notReady = students.filter(s => s.readiness === 'not-ready').length;

  // Use actual class averages from skillsData
  const skillAverages: Record<string, number> = skillsData.classAverage.skillMasteries;

  // Categorize skills based on actual class averages
  const criticalGap = skills.filter(s => (skillAverages[s.id] || 0) < 2);
  const needsMorePractice = skills.filter(s => {
    const avg = skillAverages[s.id] || 0;
    return avg >= 2 && avg < 4;
  });
  const proficient = skills.filter(s => (skillAverages[s.id] || 0) >= 4);

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
