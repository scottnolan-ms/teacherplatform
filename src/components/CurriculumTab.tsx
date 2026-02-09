import { useState } from 'react';
import type { CurriculumData, CurriculumTopic, CurriculumSubtopic, ProficiencyLevel } from '../types';

// Mastery level icons (reused from SkillsTab)
const MasteryIcon = ({ level }: { level: number }) => {
  const icons: Record<number, string> = {
    0: '/assets/Mastery/Skills/No activity-Fill.svg',
    1: '/assets/Mastery/Skills/Earned - 01 - Exploring 0-25.svg',
    2: '/assets/Mastery/Skills/Earned - 02 - Emerging 25-50.svg',
    3: '/assets/Mastery/Skills/Earned - 03 - Familiar 50-75.svg',
    4: '/assets/Mastery/Skills/Earned - 04 Proficient 75-99.svg',
    5: '/assets/Mastery/Skills/Earned - 05 Mastered.svg'
  };
  const roundedLevel = Math.min(5, Math.max(0, Math.round(level)));
  return <img src={icons[roundedLevel]} alt={`Mastery ${roundedLevel}`} width="20" height="20" />;
};

interface CurriculumTabProps {
  curriculumData: CurriculumData;
}

export default function CurriculumTab({ curriculumData }: CurriculumTabProps) {
  const { topics, students } = curriculumData;
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [expandedSubtopicId, setExpandedSubtopicId] = useState<string | null>(null);

  const getProficiencyLabel = (proficiency: ProficiencyLevel): string => {
    switch (proficiency) {
      case 'strong': return 'Strong';
      case 'developing': return 'Developing';
      case 'needs-support': return 'Needs Support';
    }
  };

  const getProficiencyClass = (proficiency: ProficiencyLevel): string => {
    switch (proficiency) {
      case 'strong': return 'proficiency-strong';
      case 'developing': return 'proficiency-developing';
      case 'needs-support': return 'proficiency-needs-support';
    }
  };

  const getMasteryLabel = (level: number): string => {
    if (level >= 4.5) return 'Mastered';
    if (level >= 3.5) return 'Proficient';
    if (level >= 2.5) return 'Familiar';
    if (level >= 1.5) return 'Emerging';
    if (level >= 0.5) return 'Exploring';
    return 'No Activity';
  };

  const toggleTopic = (topicId: string) => {
    if (expandedTopicId === topicId) {
      setExpandedTopicId(null);
      setExpandedSubtopicId(null);
    } else {
      setExpandedTopicId(topicId);
      setExpandedSubtopicId(null);
    }
  };

  const toggleSubtopic = (subtopicId: string) => {
    setExpandedSubtopicId(expandedSubtopicId === subtopicId ? null : subtopicId);
  };

  // Donut chart for student breakdown
  const TopicDonut = ({ topic }: { topic: CurriculumTopic }) => {
    const total = topic.studentBreakdown.strong + topic.studentBreakdown.developing + topic.studentBreakdown.needsSupport;
    const strongPct = (topic.studentBreakdown.strong / total) * 100;
    const developingPct = (topic.studentBreakdown.developing / total) * 100;

    const circumference = 2 * Math.PI * 36;
    const strongDash = (strongPct / 100) * circumference;
    const developingDash = (developingPct / 100) * circumference;
    const strongOffset = 0;
    const developingOffset = -strongDash;
    const needsSupportOffset = -(strongDash + developingDash);

    return (
      <div className="curriculum-donut">
        <svg width="72" height="72" viewBox="0 0 80 80">
          {/* Needs support (red) - full circle background */}
          <circle cx="40" cy="40" r="36" fill="none" stroke="#D5424D" strokeWidth="7"
            strokeDasharray={`${circumference}`} strokeDashoffset={needsSupportOffset}
            transform="rotate(-90 40 40)" />
          {/* Developing (amber) */}
          {developingPct > 0 && (
            <circle cx="40" cy="40" r="36" fill="none" stroke="#C08300" strokeWidth="7"
              strokeDasharray={`${developingDash} ${circumference - developingDash}`}
              strokeDashoffset={developingOffset}
              transform="rotate(-90 40 40)" />
          )}
          {/* Strong (green) */}
          {strongPct > 0 && (
            <circle cx="40" cy="40" r="36" fill="none" stroke="#16A188" strokeWidth="7"
              strokeDasharray={`${strongDash} ${circumference - strongDash}`}
              strokeDashoffset={strongOffset}
              transform="rotate(-90 40 40)" />
          )}
        </svg>
        <div className="donut-center">
          <span className="donut-number">{total}</span>
        </div>
      </div>
    );
  };

  // Mastery bar
  const MasteryBar = ({ value, maxValue = 5 }: { value: number; maxValue?: number }) => {
    const pct = Math.min(100, (value / maxValue) * 100);
    let barColor = '#D5424D';
    if (value >= 3.5) barColor = '#16A188';
    else if (value >= 2.0) barColor = '#C08300';

    return (
      <div className="mastery-bar">
        <div className="mastery-bar-track">
          <div className="mastery-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <span className="mastery-bar-label">{value.toFixed(1)}</span>
      </div>
    );
  };

  const renderSubtopicDetail = (subtopic: CurriculumSubtopic) => (
    <div className="curriculum-subtopic-detail" key={subtopic.id}>
      <table className="curriculum-skills-table">
        <thead>
          <tr>
            <th>Skill Code</th>
            <th>Skill Name</th>
            <th>Class Average</th>
            <th>Proficient Students</th>
          </tr>
        </thead>
        <tbody>
          {subtopic.skills.map(skill => (
            <tr key={skill.id}>
              <td>
                <span className="curriculum-skill-code">{skill.code}</span>
              </td>
              <td>{skill.name}</td>
              <td>
                <div className="curriculum-skill-mastery">
                  <MasteryIcon level={skill.classAverageMastery} />
                  <span>{skill.classAverageMastery.toFixed(1)}</span>
                  <span className="mastery-label-text">{getMasteryLabel(skill.classAverageMastery)}</span>
                </div>
              </td>
              <td>
                <span className={`proficiency-count ${skill.proficientStudentCount / skill.totalStudents >= 0.6 ? 'good' : skill.proficientStudentCount / skill.totalStudents >= 0.3 ? 'moderate' : 'low'}`}>
                  {skill.proficientStudentCount}/{skill.totalStudents}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Student mastery breakdown for this subtopic */}
      <div className="curriculum-students-preview">
        <div className="curriculum-students-header">
          Student Mastery Distribution
        </div>
        <div className="curriculum-student-bars">
          {students
            .sort((a, b) => (b.subtopicMasteries[subtopic.id] ?? 0) - (a.subtopicMasteries[subtopic.id] ?? 0))
            .slice(0, 10)
            .map(student => (
              <div key={student.studentId} className="curriculum-student-row">
                <div className="curriculum-student-info">
                  <img src={student.avatarUrl} alt="" className="student-avatar-tiny" />
                  <span>{student.lastName}, {student.firstName}</span>
                </div>
                <MasteryBar value={student.subtopicMasteries[subtopic.id] ?? 0} />
              </div>
            ))}
          {students.length > 10 && (
            <div className="curriculum-more-students">
              and {students.length - 10} more students...
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="curriculum-tab">
      {/* Overall class summary */}
      <div className="curriculum-summary">
        <div className="curriculum-summary-stat">
          <span className="curriculum-summary-value">{curriculumData.overallClassMastery.toFixed(1)}</span>
          <span className="curriculum-summary-label">Class Avg Mastery</span>
        </div>
        <div className="curriculum-summary-stat">
          <span className={`curriculum-proficiency-badge ${getProficiencyClass(curriculumData.overallProficiency)}`}>
            {getProficiencyLabel(curriculumData.overallProficiency)}
          </span>
          <span className="curriculum-summary-label">Overall Proficiency</span>
        </div>
        <div className="curriculum-summary-stat">
          <span className="curriculum-summary-value">{topics.length}</span>
          <span className="curriculum-summary-label">Topics</span>
        </div>
        <div className="curriculum-summary-stat">
          <span className="curriculum-summary-value">{topics.reduce((a, t) => a + t.subtopics.reduce((b, s) => b + s.skills.length, 0), 0)}</span>
          <span className="curriculum-summary-label">Skills</span>
        </div>
      </div>

      {/* Mastery legend */}
      <div className="mastery-legend" style={{ marginBottom: '1rem' }}>
        <span className="legend-title">Mastery:</span>
        <span className="legend-item no-activity"><MasteryIcon level={0} /> No activity</span>
        <span className="legend-item exploring"><MasteryIcon level={1} /> Exploring</span>
        <span className="legend-item emerging"><MasteryIcon level={2} /> Emerging</span>
        <span className="legend-item familiar"><MasteryIcon level={3} /> Familiar</span>
        <span className="legend-item proficient"><MasteryIcon level={4} /> Proficient</span>
        <span className="legend-item mastered"><MasteryIcon level={5} /> Mastered</span>
      </div>

      {/* Topic cards */}
      <div className="curriculum-topics">
        {topics.map(topic => {
          const isExpanded = expandedTopicId === topic.id;

          return (
            <div key={topic.id} className={`curriculum-topic-card ${isExpanded ? 'expanded' : ''}`}>
              <button
                className="curriculum-topic-header"
                onClick={() => toggleTopic(topic.id)}
              >
                <div className="curriculum-topic-left">
                  <div className="curriculum-topic-title-row">
                    <h3 className="curriculum-topic-name">{topic.name}</h3>
                    {topic.isPrerequisite && (
                      <span className="curriculum-prerequisite-badge">Prerequisite</span>
                    )}
                    <span className="curriculum-grade-badge">{topic.gradeLevel}</span>
                  </div>
                  <div className="curriculum-topic-meta">
                    <span className="curriculum-topic-code">{topic.code}</span>
                    <span className="curriculum-topic-stats">
                      {topic.subtopics.length} subtopics &middot; {topic.subtopics.reduce((a, s) => a + s.skills.length, 0)} skills
                    </span>
                  </div>
                </div>

                <div className="curriculum-topic-right">
                  <div className="curriculum-topic-mastery">
                    <MasteryIcon level={topic.classAverageMastery} />
                    <span className="curriculum-mastery-value">{topic.classAverageMastery.toFixed(1)}</span>
                  </div>
                  <span className={`curriculum-proficiency-badge ${getProficiencyClass(topic.proficiency)}`}>
                    {getProficiencyLabel(topic.proficiency)}
                  </span>
                  <TopicDonut topic={topic} />
                  <span className={`curriculum-expand-arrow ${isExpanded ? 'expanded' : ''}`}>&#9662;</span>
                </div>
              </button>

              {/* Expanded: subtopic breakdown */}
              {isExpanded && (
                <div className="curriculum-topic-body">
                  {/* Student distribution legend */}
                  <div className="curriculum-breakdown-legend">
                    <span className="breakdown-item strong">
                      <span className="breakdown-dot" /> Strong: {topic.studentBreakdown.strong}
                    </span>
                    <span className="breakdown-item developing">
                      <span className="breakdown-dot" /> Developing: {topic.studentBreakdown.developing}
                    </span>
                    <span className="breakdown-item needs-support">
                      <span className="breakdown-dot" /> Needs Support: {topic.studentBreakdown.needsSupport}
                    </span>
                  </div>

                  {/* Subtopic rows */}
                  <div className="curriculum-subtopics">
                    {topic.subtopics.map(subtopic => {
                      const isSubExpanded = expandedSubtopicId === subtopic.id;

                      return (
                        <div key={subtopic.id} className="curriculum-subtopic">
                          <button
                            className="curriculum-subtopic-header"
                            onClick={() => toggleSubtopic(subtopic.id)}
                          >
                            <div className="curriculum-subtopic-left">
                              <span className="curriculum-subtopic-name">{subtopic.name}</span>
                              <span className="curriculum-subtopic-skills-count">
                                {subtopic.skills.length} skills
                              </span>
                            </div>
                            <div className="curriculum-subtopic-right">
                              <div className="curriculum-subtopic-mastery">
                                <MasteryIcon level={subtopic.classAverageMastery} />
                                <span>{subtopic.classAverageMastery.toFixed(1)}</span>
                              </div>
                              <span className={`curriculum-proficiency-badge small ${getProficiencyClass(subtopic.proficiency)}`}>
                                {getProficiencyLabel(subtopic.proficiency)}
                              </span>
                              <MasteryBar value={subtopic.classAverageMastery} />
                              <span className={`curriculum-expand-arrow small ${isSubExpanded ? 'expanded' : ''}`}>&#9662;</span>
                            </div>
                          </button>

                          {isSubExpanded && renderSubtopicDetail(subtopic)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
