import { useState } from 'react';
import type { CurriculumData, CurriculumTopic, CurriculumSubtopic, CurriculumSkill, ProficiencyLevel } from '../types';
import Tooltip from './Tooltip';

// Mastery level icons
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

// Mastery icons for insight buckets
const MasteryIconNoActivity = () => (
  <img src="/assets/Mastery/Skills/No activity-Fill.svg" alt="No Activity" width="24" height="24" />
);
const MasteryIconExploring = () => (
  <img src="/assets/Mastery/Skills/Earned - 01 - Exploring 0-25.svg" alt="Exploring" width="24" height="24" />
);
const MasteryIconEmerging = () => (
  <img src="/assets/Mastery/Skills/Earned - 02 - Emerging 25-50.svg" alt="Emerging" width="24" height="24" />
);
const MasteryIconFamiliar = () => (
  <img src="/assets/Mastery/Skills/Earned - 03 - Familiar 50-75.svg" alt="Familiar" width="24" height="24" />
);
const MasteryIconProficient = () => (
  <img src="/assets/Mastery/Skills/Earned - 04 Proficient 75-99.svg" alt="Proficient" width="24" height="24" />
);
const MasteryIconMastered = () => (
  <img src="/assets/Mastery/Skills/Earned - 05 Mastered.svg" alt="Mastered" width="24" height="24" />
);

interface TextbookProgressTabProps {
  curriculumData: CurriculumData;
}

export default function TextbookProgressTab({ curriculumData }: TextbookProgressTabProps) {
  const { topics, students, insights } = curriculumData;
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
          <circle cx="40" cy="40" r="36" fill="none" stroke="#D5424D" strokeWidth="7"
            strokeDasharray={`${circumference}`} strokeDashoffset={needsSupportOffset}
            transform="rotate(-90 40 40)" />
          {developingPct > 0 && (
            <circle cx="40" cy="40" r="36" fill="none" stroke="#C08300" strokeWidth="7"
              strokeDasharray={`${developingDash} ${circumference - developingDash}`}
              strokeDashoffset={developingOffset}
              transform="rotate(-90 40 40)" />
          )}
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

  // Render skill chips with truncation (for insights)
  const renderSkillChips = (skills: CurriculumSkill[], maxVisible: number = 3) => {
    if (skills.length === 0) return <span className="tbp-no-skills">None</span>;

    const visibleSkills = skills.slice(0, maxVisible);
    const remainingSkills = skills.slice(maxVisible);

    return (
      <div className="skill-chips-row">
        {visibleSkills.map(skill => (
          <span key={skill.id} className="skill-code-chip" title={skill.name}>
            {skill.code}
          </span>
        ))}
        {remainingSkills.length > 0 && (
          <Tooltip
            content={
              <div className="skill-tooltip-list">
                {remainingSkills.map(skill => (
                  <div key={skill.id}>
                    <strong>{skill.code}</strong>: {skill.name}
                  </div>
                ))}
              </div>
            }
          >
            <span className="skill-more-chip">+{remainingSkills.length}</span>
          </Tooltip>
        )}
      </div>
    );
  };

  // Insights donut
  const { readinessBreakdown } = insights;
  const strongPct = readinessBreakdown.total > 0
    ? Math.round((readinessBreakdown.strong / readinessBreakdown.total) * 100) : 0;
  const developingPct = readinessBreakdown.total > 0
    ? Math.round((readinessBreakdown.developing / readinessBreakdown.total) * 100) : 0;
  const needsSupportPct = 100 - strongPct - developingPct;

  const renderSubtopicDetail = (subtopic: CurriculumSubtopic) => (
    <div className="curriculum-subtopic-detail" key={subtopic.id}>
      <table className="curriculum-skills-table">
        <thead>
          <tr>
            <th>Skill Code</th>
            <th>Skill Name</th>
            <th>Class Average</th>
            <th>Proficient Students</th>
            <th>Status</th>
            <th>Growth</th>
          </tr>
        </thead>
        <tbody>
          {subtopic.skills.map(skill => (
            <tr key={skill.id} className={!skill.tested ? 'untested-skill-row' : ''}>
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
              <td>
                {skill.tested ? (
                  <span className="tbp-tested-badge">Tested</span>
                ) : (
                  <span className="tbp-untested-badge">Not tested</span>
                )}
              </td>
              <td>
                {skill.tested && skill.growthFromTest != null ? (
                  <span className={`tbp-growth-chip ${skill.growthFromTest > 0 ? 'positive' : skill.growthFromTest < 0 ? 'negative' : ''}`}>
                    {skill.growthFromTest > 0 ? '+' : ''}{skill.growthFromTest.toFixed(1)}
                  </span>
                ) : (
                  <span className="tbp-no-growth">-</span>
                )}
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

  // Count tested/untested per topic
  const getTopicTestCoverage = (topic: CurriculumTopic) => {
    const allSkills = topic.subtopics.flatMap(s => s.skills);
    const tested = allSkills.filter(s => s.tested).length;
    return { tested, total: allSkills.length };
  };

  return (
    <div className="curriculum-tab">
      {/* === INSIGHTS PANEL === */}
      <div className="tbp-insights-panel">
        {/* Left: Class Overview Donut */}
        <div className="tbp-insights-section tbp-insights-section-narrow">
          <h4 className="tbp-insights-title">Class Overview</h4>
          <div className="tbp-overview-content">
            <div className="tbp-overview-donut">
              <svg viewBox="0 0 100 100" className="donut-chart">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F4F5F5" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#16A188" strokeWidth="12"
                  strokeDasharray={`${strongPct * 2.51} ${251 - strongPct * 2.51}`}
                  strokeDashoffset="63" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#C08300" strokeWidth="12"
                  strokeDasharray={`${developingPct * 2.51} ${251 - developingPct * 2.51}`}
                  strokeDashoffset={63 - strongPct * 2.51} transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#D5424D" strokeWidth="12"
                  strokeDasharray={`${needsSupportPct * 2.51} ${251 - needsSupportPct * 2.51}`}
                  strokeDashoffset={63 - strongPct * 2.51 - developingPct * 2.51} transform="rotate(-90 50 50)" />
              </svg>
              <div className="donut-center">
                <span className="donut-number">{readinessBreakdown.total}</span>
                <span className="donut-label">students</span>
              </div>
            </div>
            <div className="tbp-overview-legend">
              <div className="tbp-legend-item strong">
                <span className="breakdown-dot" />
                <span className="tbp-legend-text">Strong</span>
                <span className="tbp-legend-count">{readinessBreakdown.strong} ({strongPct}%)</span>
              </div>
              <div className="tbp-legend-item developing">
                <span className="breakdown-dot" />
                <span className="tbp-legend-text">Developing</span>
                <span className="tbp-legend-count">{readinessBreakdown.developing} ({developingPct}%)</span>
              </div>
              <div className="tbp-legend-item needs-support">
                <span className="breakdown-dot" />
                <span className="tbp-legend-text">Needs Support</span>
                <span className="tbp-legend-count">{readinessBreakdown.needsSupport} ({needsSupportPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tbp-insights-divider" />

        {/* Middle: Skills Summary Buckets */}
        <div className="tbp-insights-section tbp-insights-section-wide">
          <h4 className="tbp-insights-title">Skills Summary</h4>
          <div className="tbp-skill-buckets">
            <div className="tbp-skill-bucket critical">
              <div className="bucket-content">
                <div className="bucket-icons-fanning">
                  <span className="fanning-icon icon-1"><MasteryIconNoActivity /></span>
                  <span className="fanning-icon icon-2"><MasteryIconExploring /></span>
                </div>
                <span className="bucket-label">Critical Gap</span>
                <span className="bucket-count">{insights.skillsSummary.criticalGap.length}</span>
                {renderSkillChips(insights.skillsSummary.criticalGap)}
              </div>
            </div>
            <div className="tbp-skill-bucket needs-practice">
              <div className="bucket-content">
                <div className="bucket-icons-fanning">
                  <span className="fanning-icon icon-1"><MasteryIconEmerging /></span>
                  <span className="fanning-icon icon-2"><MasteryIconFamiliar /></span>
                </div>
                <span className="bucket-label">Needs Practice</span>
                <span className="bucket-count">{insights.skillsSummary.needsMorePractice.length}</span>
                {renderSkillChips(insights.skillsSummary.needsMorePractice)}
              </div>
            </div>
            <div className="tbp-skill-bucket proficient">
              <div className="bucket-content">
                <div className="bucket-icons-fanning">
                  <span className="fanning-icon icon-1"><MasteryIconProficient /></span>
                  <span className="fanning-icon icon-2"><MasteryIconMastered /></span>
                </div>
                <span className="bucket-label">Proficient</span>
                <span className="bucket-count">{insights.skillsSummary.proficient.length}</span>
                {renderSkillChips(insights.skillsSummary.proficient)}
              </div>
            </div>
          </div>
        </div>

        <div className="tbp-insights-divider" />

        {/* Right: Alerts */}
        <div className="tbp-insights-section tbp-insights-section-narrow tbp-insights-alerts">
          {insights.atRiskStudents.length > 0 && (
            <div className="tbp-alert at-risk">
              <span className="tbp-alert-icon">!</span>
              <div className="tbp-alert-content">
                <span className="tbp-alert-text">
                  <strong>{insights.atRiskStudents.length}</strong> at-risk students
                </span>
                <Tooltip content="Students with overall textbook mastery below 2.0">
                  <span className="alert-info-icon">?</span>
                </Tooltip>
              </div>
            </div>
          )}
          {insights.quickWinSkills.length > 0 && (
            <div className="tbp-alert quick-win">
              <span className="tbp-alert-icon">&#9733;</span>
              <div className="tbp-alert-content">
                <span className="tbp-alert-text">
                  <strong>{insights.quickWinSkills.length}</strong> quick win skills
                </span>
                <Tooltip content="Skills where class average is close to proficient (2.8-3.5) - small effort, big impact">
                  <span className="alert-info-icon">?</span>
                </Tooltip>
              </div>
            </div>
          )}
          {insights.skillsSummary.untested.length > 0 && (
            <div className="tbp-alert untested">
              <span className="tbp-alert-icon">?</span>
              <div className="tbp-alert-content">
                <span className="tbp-alert-text">
                  <strong>{insights.skillsSummary.untested.length}</strong> untested skills
                </span>
                <Tooltip content="Skills not yet measured by any readiness check-in or test">
                  <span className="alert-info-icon">?</span>
                </Tooltip>
              </div>
            </div>
          )}
          <div className="tbp-coverage-stat">
            <span className="tbp-coverage-label">Test coverage</span>
            <span className="tbp-coverage-value">{insights.testedSkillsCount}/{insights.totalSkillsCount} skills</span>
          </div>
        </div>
      </div>

      {/* === SUMMARY BAR === */}
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

      {/* === TOPIC CARDS === */}
      <div className="curriculum-topics">
        {topics.map(topic => {
          const isExpanded = expandedTopicId === topic.id;
          const coverage = getTopicTestCoverage(topic);

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
                    {coverage.tested > 0 && (
                      <span className="tbp-topic-coverage-badge">
                        {coverage.tested}/{coverage.total} tested
                      </span>
                    )}
                    {coverage.tested === 0 && (
                      <span className="tbp-topic-no-test-badge">Not tested</span>
                    )}
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
                      const subTestedCount = subtopic.skills.filter(s => s.tested).length;

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
                              {subTestedCount > 0 && subTestedCount < subtopic.skills.length && (
                                <span className="tbp-sub-coverage">{subTestedCount}/{subtopic.skills.length} tested</span>
                              )}
                              {subTestedCount === 0 && (
                                <span className="tbp-sub-no-test">Not tested</span>
                              )}
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
