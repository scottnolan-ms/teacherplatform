import type {
  CurriculumData,
  CurriculumTopic,
  CurriculumSubtopic,
  CurriculumSkill,
  StudentTopicMastery,
  ProficiencyLevel,
  Student
} from '../types';

// Curriculum structure for Year 9 Mathematics (NSW syllabus-aligned)
// Topics → Subtopics → Skills with curriculum codes
const CURRICULUM_STRUCTURE = {
  topics: [
    {
      id: 'topic-linear-relationships',
      name: 'Linear Relationships',
      code: 'MA4-ALG',
      gradeLevel: 'Year 9',
      isPrerequisite: false,
      subtopics: [
        {
          id: 'sub-algebraic-expressions',
          name: 'Algebraic Expressions',
          skills: [
            { id: 'skill-2', code: 'MA4-ALG-C-01.3', name: 'Algebraic expressions' },
            { id: 'skill-alg-simplify', code: 'MA4-ALG-C-01.4', name: 'Simplifying expressions' },
          ]
        },
        {
          id: 'sub-solving-equations',
          name: 'Solving Equations',
          skills: [
            { id: 'skill-3', code: 'MA4-ALG-C-01.2', name: 'Solving linear equations' },
            { id: 'skill-alg-simultaneous', code: 'MA4-ALG-C-01.5', name: 'Simultaneous equations' },
          ]
        },
        {
          id: 'sub-expanding-factorising',
          name: 'Expanding & Factorising',
          skills: [
            { id: 'skill-4', code: 'MA4-ALG-C-01.1', name: 'Expanding brackets' },
            { id: 'skill-alg-factorise', code: 'MA4-ALG-C-02.1', name: 'Factorising expressions' },
          ]
        }
      ]
    },
    {
      id: 'topic-indices',
      name: 'Indices & Standard Form',
      code: 'MA4-IND',
      gradeLevel: 'Year 9',
      isPrerequisite: false,
      subtopics: [
        {
          id: 'sub-index-laws',
          name: 'Index Laws',
          skills: [
            { id: 'skill-1', code: 'MA4-IND-C-01.3', name: 'Indices and standard form' },
            { id: 'skill-ind-negative', code: 'MA4-IND-C-01.2', name: 'Negative & zero indices' },
          ]
        },
        {
          id: 'sub-scientific-notation',
          name: 'Scientific Notation',
          skills: [
            { id: 'skill-ind-sci', code: 'MA4-IND-C-02.1', name: 'Converting to scientific notation' },
            { id: 'skill-ind-sci-ops', code: 'MA4-IND-C-02.2', name: 'Operations with scientific notation' },
          ]
        }
      ]
    },
    {
      id: 'topic-computation',
      name: 'Computation with Integers',
      code: 'MA4-INT',
      gradeLevel: 'Year 9',
      isPrerequisite: false,
      subtopics: [
        {
          id: 'sub-integer-ops',
          name: 'Integer Operations',
          skills: [
            { id: 'skill-5', code: 'MA4-INT-C-01.4', name: 'Integer operations' },
            { id: 'skill-6', code: 'MA4-INT-C-01.3', name: 'Order of operations' },
          ]
        },
        {
          id: 'sub-fractions-decimals',
          name: 'Fractions & Decimals',
          skills: [
            { id: 'skill-7', code: 'MA4-INT-C-01.2', name: 'Fraction operations' },
            { id: 'skill-8', code: 'MA4-INT-C-01.1', name: 'Decimal operations' },
          ]
        }
      ]
    },
    {
      id: 'topic-measurement',
      name: 'Measurement & Ratio',
      code: 'MA3-MR',
      gradeLevel: 'Year 8 (Prerequisite)',
      isPrerequisite: true,
      subtopics: [
        {
          id: 'sub-ratio-rates',
          name: 'Ratio & Rates',
          skills: [
            { id: 'skill-9', code: 'MA3-MR-02.B.5', name: 'Measurement and ratio' },
            { id: 'skill-mr-rates', code: 'MA3-MR-02.B.4', name: 'Rates and unit conversion' },
          ]
        },
        {
          id: 'sub-multiplication',
          name: 'Multiplication Foundations',
          skills: [
            { id: 'skill-10', code: 'MA3-MR-02.B.3', name: 'Basic multiplication' },
            { id: 'skill-mr-division', code: 'MA3-MR-02.B.2', name: 'Division strategies' },
          ]
        }
      ]
    }
  ]
};

function getProficiency(mastery: number): ProficiencyLevel {
  if (mastery >= 3.5) return 'strong';
  if (mastery >= 2.0) return 'developing';
  return 'needs-support';
}

// Seeded random for deterministic results per class
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return () => {
    hash = (hash * 16807 + 0) % 2147483647;
    return (hash & 0x7FFFFFFF) / 0x7FFFFFFF;
  };
}

export function generateCurriculumData(
  classId: string,
  students: Student[]
): CurriculumData {
  const isClassB = classId === 'class-b';
  const rand = seededRandom(classId + '-curriculum');

  // Class A: lower overall mastery (struggling), Class B: higher overall mastery (partially ready)
  // Per-topic mastery targets differ between classes
  const topicTargets: Record<string, { classA: number; classB: number }> = {
    'topic-linear-relationships': { classA: 1.6, classB: 3.4 },
    'topic-indices': { classA: 1.2, classB: 3.0 },
    'topic-computation': { classA: 2.4, classB: 4.0 },
    'topic-measurement': { classA: 1.8, classB: 3.8 },
  };

  // Generate student-level mastery data
  const studentMasteries: StudentTopicMastery[] = students.map(student => {
    const topicMasteries: Record<string, number> = {};
    const subtopicMasteries: Record<string, number> = {};
    const skillMasteries: Record<string, number> = {};

    for (const topic of CURRICULUM_STRUCTURE.topics) {
      const targetAvg = isClassB ? topicTargets[topic.id].classB : topicTargets[topic.id].classA;
      // Add student variation around target
      const studentVariation = (rand() - 0.5) * 2.0;
      const studentTopicBase = Math.max(0, Math.min(5, targetAvg + studentVariation));

      let topicSkillTotal = 0;
      let topicSkillCount = 0;

      for (const subtopic of topic.subtopics) {
        let subtopicTotal = 0;
        let subtopicCount = 0;

        for (const skill of subtopic.skills) {
          const skillVariation = (rand() - 0.5) * 1.5;
          const mastery = Math.max(0, Math.min(5, Math.round(studentTopicBase + skillVariation)));
          skillMasteries[skill.id] = mastery;
          subtopicTotal += mastery;
          subtopicCount++;
        }

        const subtopicAvg = subtopicCount > 0 ? subtopicTotal / subtopicCount : 0;
        subtopicMasteries[subtopic.id] = subtopicAvg;
        topicSkillTotal += subtopicTotal;
        topicSkillCount += subtopicCount;
      }

      topicMasteries[topic.id] = topicSkillCount > 0 ? topicSkillTotal / topicSkillCount : 0;
    }

    return {
      studentId: student.id,
      studentName: student.name,
      firstName: student.firstName,
      lastName: student.lastName,
      avatarUrl: student.avatarUrl,
      topicMasteries,
      subtopicMasteries,
      skillMasteries,
    };
  });

  // Build class-level aggregates
  const topics: CurriculumTopic[] = CURRICULUM_STRUCTURE.topics.map(topic => {
    const subtopics: CurriculumSubtopic[] = topic.subtopics.map(subtopic => {
      const skills: CurriculumSkill[] = subtopic.skills.map(skill => {
        const masteryValues = studentMasteries.map(s => s.skillMasteries[skill.id] ?? 0);
        const avg = masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length;
        const proficientCount = masteryValues.filter(m => m >= 4).length;

        return {
          id: skill.id,
          code: skill.code,
          name: skill.name,
          classAverageMastery: avg,
          proficientStudentCount: proficientCount,
          totalStudents: students.length,
          isPrerequisite: topic.isPrerequisite,
        };
      });

      const subtopicAvg = skills.reduce((a, s) => a + s.classAverageMastery, 0) / skills.length;

      return {
        id: subtopic.id,
        name: subtopic.name,
        skills,
        classAverageMastery: subtopicAvg,
        proficiency: getProficiency(subtopicAvg),
      };
    });

    const topicAvg = subtopics.reduce((a, s) => a + s.classAverageMastery, 0) / subtopics.length;

    // Student breakdown for topic
    const topicMasteryValues = studentMasteries.map(s => s.topicMasteries[topic.id] ?? 0);
    const strong = topicMasteryValues.filter(m => m >= 3.5).length;
    const developing = topicMasteryValues.filter(m => m >= 2.0 && m < 3.5).length;
    const needsSupport = topicMasteryValues.filter(m => m < 2.0).length;

    return {
      id: topic.id,
      name: topic.name,
      code: topic.code,
      gradeLevel: topic.gradeLevel,
      isPrerequisite: topic.isPrerequisite,
      subtopics,
      classAverageMastery: topicAvg,
      proficiency: getProficiency(topicAvg),
      readinessLevel: getProficiency(topicAvg) === 'strong' ? 'ready' as const
        : getProficiency(topicAvg) === 'developing' ? 'partially-ready' as const
        : 'not-ready' as const,
      studentBreakdown: { strong, developing, needsSupport },
    };
  });

  const overallAvg = topics.reduce((a, t) => a + t.classAverageMastery, 0) / topics.length;

  return {
    topics,
    students: studentMasteries,
    overallClassMastery: overallAvg,
    overallProficiency: getProficiency(overallAvg),
  };
}
