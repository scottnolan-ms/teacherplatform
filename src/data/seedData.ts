import type { AppData, MathspaceGroup, Student, StudentActivity, Task, TaskResult, StudentTaskResult } from '../types';

const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'Jacob', 'Sofia', 'Logan', 'Avery', 'Jackson'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

const avatars = [
  'Avatar-Animal-Bear-Doctor.png', 'Avatar-Animal-Bear-Inspector.png', 'Avatar-Animal-Bull-Clap.png',
  'Avatar-Animal-Bunny-Magic.png', 'Avatar-Animal-Bunny.png', 'Avatar-Animal-Cake.png',
  'Avatar-Animal-Capybara-Floaty.png', 'Avatar-Animal-Deer-Formal.png', 'Avatar-Animal-Deer-Winter.png',
  'Avatar-Animal-Giraffe.png', 'Avatar-Animal-Lion-Soccer.png', 'Avatar-Animal-Penguin-Astronaut.png',
  'Avatar-Animal-Penguin-Royal.png', 'Avatar-Animal-Penguin-Top-hat.png', 'Avatar-Animal-Penguin-Winter.png',
  'Avatar-Animal-Racoon-Pilot.png', 'Avatar-Animal-RedPanda-Woods.png', 'Avatar-Animal-Roo-Boxing.png',
  'Avatar-Animal-Seal.png', 'Avatar-Animal-Sloth.png', 'Avatar-Animal-Snake.png',
  'Avatar-Animal-Tiger.png', 'Avatar-Animal-Wolf-Formal.png', 'Avatar-Dino-Grad.png',
  'Avatar-Dino-Music.png', 'Animal-Cat@2x.png', 'Animal-Duck@2x.png', 'Animal-Panda@2x.png',
  'Animal-Shark@2x.png', 'Avatar-Generic.png'
];

const mathspaceGroups: MathspaceGroup[] = ['Explorer', 'Adventurer', 'Trailblazer'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLastActiveDate(): Date {
  const hoursAgo = [2, 5, 14, 24 * 2, 24 * 19, 24 * 7 * 2, 24 * 30];
  const selected = hoursAgo[Math.floor(Math.random() * hoursAgo.length)];
  return new Date(Date.now() - selected * 60 * 60 * 1000);
}

function generateStudents(classId: string, startIndex: number): Student[] {
  return Array.from({ length: 30 }, (_, i) => {
    const studentIndex = startIndex + i;
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    return {
      id: `student-${studentIndex}`,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      classId,
      mathspaceGroup: mathspaceGroups[Math.floor(Math.random() * 3)],
      avatarUrl: `/src/assets/Avatars/${avatars[studentIndex % avatars.length]}`
    };
  });
}

function generateStudentActivities(students: Student[]): StudentActivity[] {
  return students.map(student => {
    const totalQuestions = randomInt(50, 500);
    const correct = randomInt(Math.floor(totalQuestions * 0.5), Math.floor(totalQuestions * 0.9));
    const partial = randomInt(0, Math.floor(totalQuestions * 0.1));
    const incorrect = randomInt(0, totalQuestions - correct - partial);
    const skipped = totalQuestions - correct - partial - incorrect;

    return {
      studentId: student.id,
      studentLedTasks: {
        discoveryCheckins: randomInt(0, 5),
        topicReadinessCheckins: randomInt(0, 8),
        adaptiveTasks: randomInt(0, 6),
        revisions: randomInt(0, 4)
      },
      teacherAssignedTasks: {
        topicReadinessCheckins: randomInt(0, 10),
        adaptiveTasks: randomInt(0, 10),
        customTasks: randomInt(0, 8),
        revisions: randomInt(0, 5),
        tests: randomInt(0, 3)
      },
      skills: {
        count: randomInt(5, 50),
        change: randomInt(-5, 15)
      },
      questions: {
        total: totalQuestions,
        new: randomInt(10, 100),
        revisionCleared: randomInt(0, 50),
        revisionRemaining: randomInt(0, 30)
      },
      accuracy: {
        percentage: Math.round((correct / totalQuestions) * 100),
        correct,
        partial,
        incorrect,
        skipped
      },
      points: randomInt(200, 5000),
      timeSpent: {
        days: randomInt(0, 2),
        hours: randomInt(0, 23),
        minutes: randomInt(0, 59)
      },
      lastActive: generateLastActiveDate(),
      stickersReceived: randomInt(2, 20)
    };
  });
}

const allStudents = [
  ...generateStudents('class-a', 1),
  ...generateStudents('class-b', 31)
];

function generateTasks(classId: string): Task[] {
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Readiness check-in: Due Feb 4th, with extension period until Feb 10th
  // Today is Feb 6th, so we're in the extension period (past due but before expiry)
  const feb4th = new Date('2025-02-04T23:59:59');
  const feb1st = new Date('2025-02-01T23:59:59');
  const jan28th = new Date('2025-01-28T00:00:00');
  const feb10th = new Date('2025-02-10T23:59:59');

  return [
    {
      id: `task-${classId}-1`,
      title: 'Linear Equations Readiness Check-in',
      classId,
      taskType: 'topic-readiness-checkin',
      areaOfStudy: 'Algebra',
      startDate: jan28th.toISOString(),
      dueDate: feb4th.toISOString(),
      dueDates: [
        { date: feb1st.toISOString(), groupIds: ['mathspace-Explorer'], groupNames: ['Explorer'] },
        { date: feb4th.toISOString(), groupIds: ['mathspace-Adventurer', 'mathspace-Trailblazer'], groupNames: ['Adventurer', 'Trailblazer'] }
      ],
      expiryDate: feb10th.toISOString(),
      questionsCount: 10,
      skillsCount: 10,
      status: 'active',
      assignments: [
        { groupId: 'mathspace-Explorer', groupType: 'mathspace', groupName: 'Explorer', questionSetId: 'qs-a' },
        { groupId: 'mathspace-Adventurer', groupType: 'mathspace', groupName: 'Adventurer', questionSetId: 'qs-b' },
        { groupId: 'mathspace-Trailblazer', groupType: 'mathspace', groupName: 'Trailblazer', questionSetId: 'qs-c' }
      ],
      createdAt: jan28th.toISOString()
    },
    {
      id: `task-${classId}-2`,
      title: 'Quadratic Functions Practice',
      classId,
      taskType: 'adaptive',
      areaOfStudy: 'Algebra',
      startDate: now.toISOString(),
      dueDate: twoWeeksFromNow.toISOString(),
      questionsCount: 15,
      skillsCount: 5,
      status: 'active',
      assignments: [
        { groupId: 'mathspace-Adventurer', groupType: 'mathspace', groupName: 'Adventurer', questionSetId: 'qs-b' },
        { groupId: 'mathspace-Trailblazer', groupType: 'mathspace', groupName: 'Trailblazer', questionSetId: 'qs-c' }
      ],
      createdAt: now.toISOString()
    },
    {
      id: `task-${classId}-3`,
      title: 'Geometry Foundations Test',
      classId,
      taskType: 'test',
      areaOfStudy: 'Geometry',
      startDate: oneWeekAgo.toISOString(),
      dueDate: oneWeekAgo.toISOString(),
      questionsCount: 20,
      skillsCount: 12,
      status: 'expired',
      assignments: [
        { groupId: 'mathspace-Explorer', groupType: 'mathspace', groupName: 'Explorer', questionSetId: 'qs-a' },
        { groupId: 'mathspace-Adventurer', groupType: 'mathspace', groupName: 'Adventurer', questionSetId: 'qs-a' },
        { groupId: 'mathspace-Trailblazer', groupType: 'mathspace', groupName: 'Trailblazer', questionSetId: 'qs-a' }
      ],
      createdAt: twoWeeksAgo.toISOString()
    },
    {
      id: `task-${classId}-4`,
      title: 'Fractions Review',
      classId,
      taskType: 'revision',
      areaOfStudy: 'Number',
      startDate: twoWeeksAgo.toISOString(),
      dueDate: oneWeekAgo.toISOString(),
      questionsCount: 12,
      skillsCount: 6,
      status: 'expired',
      assignments: [
        { groupId: 'group-1', groupType: 'persistent', groupName: 'Struggling with Algebra', questionSetId: 'qs-a' }
      ],
      createdAt: twoWeeksAgo.toISOString()
    }
  ];
}

function generateTaskResults(tasks: Task[], students: Student[]): TaskResult[] {
  return tasks.map(task => {
    const classStudents = students.filter(s => s.classId === task.classId);
    const isClassB = task.classId === 'class-b';
    const isReadinessCheckin = task.taskType === 'topic-readiness-checkin';

    const perStudent: StudentTaskResult[] = classStudents.map((student, index) => {
      const rand = Math.random();
      let status: 'Not Started' | 'In Progress' | 'Completed';
      let score: number;

      // Class B readiness check-in: Force specific distribution
      // 5 Soaring (17%), 22 Flying (73%), 3 Hatchling (10%)
      if (isClassB && isReadinessCheckin) {
        // Almost all students completed for Class B readiness check-in
        status = index < 28 ? 'Completed' : (rand < 0.5 ? 'In Progress' : 'Not Started');

        if (status === 'Completed') {
          if (index < 5) {
            // First 5 students are Soaring (score >= 70)
            score = randomInt(75, 95);
          } else if (index < 27) {
            // Next 22 students are Flying (score 40-69)
            score = randomInt(45, 68);
          } else {
            // Last 3 completed students are Hatchling (score < 40)
            score = randomInt(25, 38);
          }
        } else if (status === 'In Progress') {
          // In progress students count as Hatchling
          score = randomInt(20, 35);
        } else {
          score = 0;
        }
      } else {
        // Default behavior for other tasks/classes
        if (task.status === 'expired') {
          status = rand < 0.85 ? 'Completed' : rand < 0.95 ? 'In Progress' : 'Not Started';
        } else {
          status = rand < 0.4 ? 'Completed' : rand < 0.7 ? 'In Progress' : 'Not Started';
        }
        score = status === 'Completed' ? randomInt(45, 100) : status === 'In Progress' ? randomInt(20, 70) : 0;
      }

      return {
        studentId: student.id,
        status,
        score
      };
    });
    return {
      taskId: task.id,
      perStudent
    };
  });
}

const allTasks = [
  ...generateTasks('class-a'),
  ...generateTasks('class-b')
];

const allTaskResults = generateTaskResults(allTasks, allStudents);

export const initialData: AppData = {
  school: {
    id: 'school-1',
    name: 'Oakwood High School'
  },
  teacher: {
    id: 'teacher-1',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@oakwood.edu',
    schoolId: 'school-1'
  },
  classes: [
    {
      id: 'class-a',
      name: 'Class A - Year 9 Math',
      schoolId: 'school-1',
      teacherId: 'teacher-1'
    },
    {
      id: 'class-b',
      name: 'Class B - Year 9 Math',
      schoolId: 'school-1',
      teacherId: 'teacher-1'
    }
  ],
  students: allStudents,
  persistentGroups: [
    {
      id: 'group-1',
      name: 'Struggling with Algebra',
      description: 'Students who need extra support with algebraic concepts',
      color: '#ef4444',
      tags: ['algebra', 'support'],
      type: 'persistent',
      classId: 'class-a',
      studentIds: ['student-1', 'student-5', 'student-8', 'student-12'],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'group-2',
      name: 'Advanced Problem Solvers',
      description: 'High-performing students ready for challenge tasks',
      color: '#3b82f6',
      tags: ['advanced', 'enrichment'],
      type: 'persistent',
      classId: 'class-a',
      studentIds: ['student-2', 'student-4', 'student-9', 'student-15', 'student-20'],
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  tasks: allTasks,
  taskResults: allTaskResults,
  questionSets: [
    { id: 'qs-a', name: 'Question Set A - Foundation' },
    { id: 'qs-b', name: 'Question Set B - Standard' },
    { id: 'qs-c', name: 'Question Set C - Advanced' }
  ],
  studentActivities: generateStudentActivities(allStudents)
};
