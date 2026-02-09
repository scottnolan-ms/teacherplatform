import { useState } from 'react';
import type { SkillsTabData, MasteryLevel } from '../../types';

// Mastery level icons
const MasteryIcon = ({ level }: { level: number }) => {
  const icons: Record<number, string> = {
    0: '//assets/Mastery/Skills/No activity-Fill.svg',
    1: '//assets/Mastery/Skills/Earned - 01 - Exploring 0-25.svg',
    2: '//assets/Mastery/Skills/Earned - 02 - Emerging 25-50.svg',
    3: '//assets/Mastery/Skills/Earned - 03 - Familiar 50-75.svg',
    4: '//assets/Mastery/Skills/Earned - 04 Proficient 75-99.svg',
    5: '//assets/Mastery/Skills/Earned - 05 Mastered.svg'
  };
  const roundedLevel = Math.min(5, Math.max(0, Math.round(level)));
  return <img src={icons[roundedLevel]} alt={`Mastery ${roundedLevel}`} width="20" height="20" />;
};

interface SkillsTabProps {
  skillsData: SkillsTabData;
}

export default function SkillsTab({ skillsData }: SkillsTabProps) {
  const { skills, students, classAverage } = skillsData;
  const [dateFilter, setDateFilter] = useState<string>('at-due-date');

  // Helper to get the appropriate mastery value based on date filter
  const getStudentMastery = (student: typeof students[0], skillId: string): number => {
    if (dateFilter === 'at-due-date') {
      return student.skillMasteriesAtDueDate?.[skillId] ?? student.skillMasteries[skillId] ?? 0;
    }
    return student.skillMasteries[skillId] ?? 0;
  };

  // Helper to get student's average mastery based on date filter
  const getStudentAverageMastery = (student: typeof students[0]): number => {
    if (dateFilter === 'at-due-date') {
      return student.averageMasteryAtDueDate ?? student.averageMastery;
    }
    return student.averageMastery;
  };

  // Helper to get student's proficient count based on date filter
  const getStudentProficientCount = (student: typeof students[0]): number => {
    if (dateFilter === 'at-due-date') {
      return student.proficientSkillsCountAtDueDate ?? student.proficientSkillsCount;
    }
    return student.proficientSkillsCount;
  };

  // Helper to get class average mastery for a skill based on date filter
  const getClassSkillMastery = (skillId: string): number => {
    if (dateFilter === 'at-due-date') {
      return classAverage.skillMasteriesAtDueDate?.[skillId] ?? classAverage.skillMasteries[skillId] ?? 0;
    }
    return classAverage.skillMasteries[skillId] ?? 0;
  };

  // Helper to get class average overall mastery based on date filter
  const getClassAverageMastery = (): number => {
    if (dateFilter === 'at-due-date') {
      return classAverage.averageMasteryAtDueDate ?? classAverage.averageMastery;
    }
    return classAverage.averageMastery;
  };

  // Helper to get class proficient count based on date filter
  const getClassProficientCount = (): number => {
    if (dateFilter === 'at-due-date') {
      return classAverage.proficientSkillsCountAtDueDate ?? classAverage.proficientSkillsCount;
    }
    return classAverage.proficientSkillsCount;
  };

  // Helper to calculate growth for a student's skill
  const getStudentSkillGrowth = (student: typeof students[0], skillId: string): number | null => {
    if (dateFilter !== 'due-to-today') return null;
    const currentMastery = student.skillMasteries[skillId] ?? 0;
    const atDueDateMastery = student.skillMasteriesAtDueDate?.[skillId] ?? currentMastery;
    return currentMastery - atDueDateMastery;
  };

  // Helper to calculate growth for class average skill
  const getClassSkillGrowth = (skillId: string): number | null => {
    if (dateFilter !== 'due-to-today') return null;
    const currentMastery = classAverage.skillMasteries[skillId] ?? 0;
    const atDueDateMastery = classAverage.skillMasteriesAtDueDate?.[skillId] ?? currentMastery;
    return currentMastery - atDueDateMastery;
  };

  // Format growth display
  const formatGrowth = (growth: number | null): string => {
    if (growth === null || growth === 0) return '';
    return growth > 0 ? `+${growth.toFixed(1)}` : growth.toFixed(1);
  };

  // Get growth class for styling
  const getGrowthClass = (growth: number | null): string => {
    if (growth === null || growth === 0) return '';
    return growth > 0 ? 'growth-positive' : 'growth-negative';
  };

  const dateFilterOptions = [
    { value: 'at-due-date', label: 'At due date', description: 'Snapshot at task completion' },
    { value: 'due-to-today', label: 'Due date to today', description: 'Shows growth since completion' }
  ];

  const getMasteryDisplay = (level: MasteryLevel | number) => {
    const roundedLevel = Math.round(level) as MasteryLevel;
    const displays: Record<number, { label: string; className: string }> = {
      0: { label: '-', className: 'no-activity' },
      1: { label: '1', className: 'exploring' },
      2: { label: '2', className: 'emerging' },
      3: { label: '3', className: 'familiar' },
      4: { label: '4', className: 'proficient' },
      5: { label: '5', className: 'mastered' }
    };
    return displays[roundedLevel] || displays[0];
  };

  const getReadinessLabel = (readiness: string) => {
    switch (readiness) {
      case 'ready': return 'Ready';
      case 'partially-ready': return 'Partial';
      case 'not-ready': return 'Not Ready';
      default: return readiness;
    }
  };

  return (
    <div className="skills-tab">
      <div className="skills-tab-toolbar">
        <div className="mastery-legend">
          <span className="legend-title">Mastery:</span>
          <span className="legend-item no-activity"><MasteryIcon level={0} /> No activity</span>
          <span className="legend-item exploring"><MasteryIcon level={1} /> Exploring</span>
          <span className="legend-item emerging"><MasteryIcon level={2} /> Emerging</span>
          <span className="legend-item familiar"><MasteryIcon level={3} /> Familiar</span>
          <span className="legend-item proficient"><MasteryIcon level={4} /> Proficient</span>
          <span className="legend-item mastered"><MasteryIcon level={5} /> Mastered</span>
        </div>
        <div className="skills-date-filter">
          <label className="date-filter-label">Mastery data:</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-filter-select"
          >
            {dateFilterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="skills-matrix-container">
        <table className="skills-matrix-table">
          <thead>
            <tr>
              <th className="sticky-col student-col">Student</th>
              <th>Readiness</th>
              <th>Avg Mastery</th>
              <th>Skills/{skills.length}</th>
              {skills.map(skill => (
                <th key={skill.skillId} className="skill-header" title={skill.skillName}>
                  {skill.skillCode || skill.skillName.substring(0, 10)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Class Average Row */}
            <tr className="class-average-row">
              <td className="sticky-col student-col">
                <strong>CLASS AVERAGE</strong>
              </td>
              <td>
                <span className={`readiness-badge ${classAverage.readiness}`}>
                  {getReadinessLabel(classAverage.readiness)}
                </span>
              </td>
              <td className="avg-mastery-cell">
                {getClassAverageMastery().toFixed(1)}
              </td>
              <td className="proficient-count-cell">
                {getClassProficientCount()}/{skills.length}
              </td>
              {skills.map(skill => {
                const avgMastery = getClassSkillMastery(skill.skillId);
                const display = getMasteryDisplay(avgMastery);
                const growth = getClassSkillGrowth(skill.skillId);
                const growthClass = getGrowthClass(growth);
                return (
                  <td key={skill.skillId} className={`mastery-cell ${growthClass}`}>
                    <span className={`mastery-indicator with-icon ${display.className}`} title={`Avg: ${avgMastery.toFixed(1)}`}>
                      <MasteryIcon level={avgMastery} />
                      <span className="mastery-value">{avgMastery.toFixed(1)}</span>
                      {growth !== null && growth !== 0 && (
                        <span className={`mastery-growth ${growthClass}`}>{formatGrowth(growth)}</span>
                      )}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Student Rows */}
            {students.map(student => (
              <tr key={student.studentId}>
                <td className="sticky-col student-col">
                  <div className="student-cell-compact">
                    <img
                      src={student.avatarUrl}
                      alt={student.studentName}
                      className="student-avatar-tiny"
                    />
                    <span>{student.lastName}, {student.firstName}</span>
                  </div>
                </td>
                <td>
                  <span className={`readiness-badge ${student.readiness}`}>
                    {getReadinessLabel(student.readiness)}
                  </span>
                </td>
                <td className="avg-mastery-cell">
                  {getStudentAverageMastery(student).toFixed(1)}
                </td>
                <td className="proficient-count-cell">
                  {getStudentProficientCount(student)}/{student.totalSkillsCount}
                </td>
                {skills.map(skill => {
                  const mastery = getStudentMastery(student, skill.skillId);
                  const display = getMasteryDisplay(mastery);
                  const growth = getStudentSkillGrowth(student, skill.skillId);
                  const growthClass = getGrowthClass(growth);
                  return (
                    <td key={skill.skillId} className={`mastery-cell ${growthClass}`}>
                      <span className={`mastery-indicator with-icon ${display.className}`}>
                        <MasteryIcon level={mastery} />
                        {growth !== null && growth !== 0 && (
                          <span className={`mastery-growth ${growthClass}`}>{formatGrowth(growth)}</span>
                        )}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
