import type { TaskInsights, ReadinessLevel, SkillFilterBucket, SkillReference, TaskType } from '../../types';
import Tooltip from '../Tooltip';

// Confidence icons
const SoaringIcon = () => (
  <img src=/assets/Icons/Confidence-03-Soaring.svg" alt="" width="20" height="20" />
);
const FlyingIcon = () => (
  <img src=/assets/Icons/Confidence-02a-Flying.svg" alt="" width="20" height="20" />
);
const HatchlingIcon = () => (
  <img src=/assets/Icons/Confidence-01-Hatchling.svg" alt="" width="20" height="20" />
);

// Mastery level icons for skill buckets - paired icons showing range
const MasteryIconNoActivity = () => (
  <img src=/assets/Mastery/Skills/No activity-Fill.svg" alt="No Activity" width="24" height="24" />
);
const MasteryIconExploring = () => (
  <img src=/assets/Mastery/Skills/Earned - 01 - Exploring 0-25.svg" alt="Exploring" width="24" height="24" />
);
const MasteryIconEmerging = () => (
  <img src=/assets/Mastery/Skills/Earned - 02 - Emerging 25-50.svg" alt="Emerging" width="24" height="24" />
);
const MasteryIconFamiliar = () => (
  <img src=/assets/Mastery/Skills/Earned - 03 - Familiar 50-75.svg" alt="Familiar" width="24" height="24" />
);
const MasteryIconProficient = () => (
  <img src=/assets/Mastery/Skills/Earned - 04 Proficient 75-99.svg" alt="Proficient" width="24" height="24" />
);
const MasteryIconMastered = () => (
  <img src=/assets/Mastery/Skills/Earned - 05 Mastered.svg" alt="Mastered" width="24" height="24" />
);

interface TaskInsightsPanelProps {
  insights: TaskInsights;
  taskType: TaskType;
  readinessFilters: ReadinessLevel[];
  onReadinessFilterChange: (filters: ReadinessLevel[]) => void;
  skillFilters: SkillFilterBucket[];
  onSkillFilterChange: (filters: SkillFilterBucket[]) => void;
  onAtRiskClick?: () => void;
  onQuickWinsClick?: () => void;
  highlightAtRisk?: boolean;
  onHighlightAtRiskChange?: (highlight: boolean) => void;
}

export default function TaskInsightsPanel({
  insights,
  taskType,
  readinessFilters,
  onReadinessFilterChange,
  skillFilters,
  onSkillFilterChange,
  onAtRiskClick,
  onQuickWinsClick,
  highlightAtRisk = false,
  onHighlightAtRiskChange
}: TaskInsightsPanelProps) {
  const { readinessBreakdown, skillsSummary, atRiskStudents, quickWinSkills } = insights;

  // Only show readiness and skills insights for topic-readiness-checkin tasks
  const isReadinessTask = taskType === 'topic-readiness-checkin';

  const readyPercent = readinessBreakdown.total > 0
    ? Math.round((readinessBreakdown.ready / readinessBreakdown.total) * 100)
    : 0;
  const partialPercent = readinessBreakdown.total > 0
    ? Math.round((readinessBreakdown.partiallyReady / readinessBreakdown.total) * 100)
    : 0;
  const notReadyPercent = 100 - readyPercent - partialPercent;

  // Render skill chips with truncation
  const renderSkillChips = (skills: SkillReference[], maxVisible: number = 2) => {
    if (skills.length === 0) return null;

    const visibleSkills = skills.slice(0, maxVisible);
    const remainingSkills = skills.slice(maxVisible);

    return (
      <div className="skill-chips-row">
        {visibleSkills.map(skill => (
          <span key={skill.id} className="skill-code-chip" title={skill.name}>
            {skill.code || skill.name.substring(0, 8)}
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

  // For non-readiness tasks, calculate completion stats
  const completedCount = readinessBreakdown.ready + readinessBreakdown.partiallyReady;
  const inProgressCount = readinessBreakdown.notReady;
  const completedPercent = readinessBreakdown.total > 0
    ? Math.round((completedCount / readinessBreakdown.total) * 100)
    : 0;

  return (
    <div className="insights-panel">
      {isReadinessTask ? (
        // Readiness-specific insights
        <>
          <div className="insights-section insights-section-narrow">
            <h4 className="insights-title">Class Confidence in Topic</h4>
            <div className="readiness-chart-container">
              <div className="readiness-donut">
                <svg viewBox="0 0 100 100" className="donut-chart">
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#E8FBF6"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#16A188"
                    strokeWidth="12"
                    strokeDasharray={`${readyPercent * 2.51} ${251 - readyPercent * 2.51}`}
                    strokeDashoffset="63"
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#C08300"
                    strokeWidth="12"
                    strokeDasharray={`${partialPercent * 2.51} ${251 - partialPercent * 2.51}`}
                    strokeDashoffset={63 - readyPercent * 2.51}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#D5424D"
                    strokeWidth="12"
                    strokeDasharray={`${notReadyPercent * 2.51} ${251 - notReadyPercent * 2.51}`}
                    strokeDashoffset={63 - readyPercent * 2.51 - partialPercent * 2.51}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="donut-center">
                  <span className="donut-number">{readinessBreakdown.total}</span>
                  <span className="donut-label">students</span>
                </div>
              </div>
              <div className="readiness-legend">
                <label
                  className={`legend-item ${readinessFilters.includes('ready') ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={readinessFilters.includes('ready')}
                    onChange={() => {
                      if (readinessFilters.includes('ready')) {
                        onReadinessFilterChange(readinessFilters.filter(f => f !== 'ready'));
                      } else {
                        onReadinessFilterChange([...readinessFilters, 'ready']);
                      }
                    }}
                  />
                  <span className="legend-icon"><SoaringIcon /></span>
                  <span className="legend-text">Soaring</span>
                  <span className="legend-count">{readinessBreakdown.ready} ({readyPercent}%)</span>
                </label>
                <label
                  className={`legend-item ${readinessFilters.includes('partially-ready') ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={readinessFilters.includes('partially-ready')}
                    onChange={() => {
                      if (readinessFilters.includes('partially-ready')) {
                        onReadinessFilterChange(readinessFilters.filter(f => f !== 'partially-ready'));
                      } else {
                        onReadinessFilterChange([...readinessFilters, 'partially-ready']);
                      }
                    }}
                  />
                  <span className="legend-icon"><FlyingIcon /></span>
                  <span className="legend-text">Flying</span>
                  <span className="legend-count">{readinessBreakdown.partiallyReady} ({partialPercent}%)</span>
                </label>
                <label
                  className={`legend-item ${readinessFilters.includes('not-ready') ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={readinessFilters.includes('not-ready')}
                    onChange={() => {
                      if (readinessFilters.includes('not-ready')) {
                        onReadinessFilterChange(readinessFilters.filter(f => f !== 'not-ready'));
                      } else {
                        onReadinessFilterChange([...readinessFilters, 'not-ready']);
                      }
                    }}
                  />
                  <span className="legend-icon"><HatchlingIcon /></span>
                  <span className="legend-text">Hatchling</span>
                  <span className="legend-count">{readinessBreakdown.notReady} ({notReadyPercent}%)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="insights-divider"></div>

          <div className="insights-section insights-section-wide">
            <h4 className="insights-title">Skills Summary</h4>
            <div className="skill-buckets">
              <label
                className={`skill-bucket critical ${skillFilters.includes('critical-gap') ? 'active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={skillFilters.includes('critical-gap')}
                  onChange={() => {
                    if (skillFilters.includes('critical-gap')) {
                      onSkillFilterChange(skillFilters.filter(f => f !== 'critical-gap'));
                    } else {
                      onSkillFilterChange([...skillFilters, 'critical-gap']);
                    }
                  }}
                />
                <div className="bucket-content">
                  <div className="bucket-icons-fanning">
                    <span className="fanning-icon icon-1"><MasteryIconNoActivity /></span>
                    <span className="fanning-icon icon-2"><MasteryIconExploring /></span>
                  </div>
                  <span className="bucket-label">Critical Gap</span>
                  {renderSkillChips(skillsSummary.criticalGap)}
                </div>
              </label>
              <label
                className={`skill-bucket needs-practice ${skillFilters.includes('needs-practice') ? 'active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={skillFilters.includes('needs-practice')}
                  onChange={() => {
                    if (skillFilters.includes('needs-practice')) {
                      onSkillFilterChange(skillFilters.filter(f => f !== 'needs-practice'));
                    } else {
                      onSkillFilterChange([...skillFilters, 'needs-practice']);
                    }
                  }}
                />
                <div className="bucket-content">
                  <div className="bucket-icons-fanning">
                    <span className="fanning-icon icon-1"><MasteryIconEmerging /></span>
                    <span className="fanning-icon icon-2"><MasteryIconFamiliar /></span>
                  </div>
                  <span className="bucket-label">Needs Practice</span>
                  {renderSkillChips(skillsSummary.needsMorePractice)}
                </div>
              </label>
              <label
                className={`skill-bucket proficient ${skillFilters.includes('proficient') ? 'active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={skillFilters.includes('proficient')}
                  onChange={() => {
                    if (skillFilters.includes('proficient')) {
                      onSkillFilterChange(skillFilters.filter(f => f !== 'proficient'));
                    } else {
                      onSkillFilterChange([...skillFilters, 'proficient']);
                    }
                  }}
                />
                <div className="bucket-content">
                  <div className="bucket-icons-fanning">
                    <span className="fanning-icon icon-1"><MasteryIconProficient /></span>
                    <span className="fanning-icon icon-2"><MasteryIconMastered /></span>
                  </div>
                  <span className="bucket-label">Proficient</span>
                  {renderSkillChips(skillsSummary.proficient)}
                </div>
              </label>
            </div>
          </div>

          {(atRiskStudents.length > 0 || quickWinSkills.length > 0) && (
            <>
              <div className="insights-divider"></div>
              <div className="insights-section insights-section-narrow insights-alerts-stacked">
                {atRiskStudents.length > 0 && (
                  <div className="insight-alert-stacked at-risk">
                    <div className="alert-row-top">
                      <span className="alert-icon-circle">!</span>
                      <div className="alert-text-group">
                        <span className="alert-text">
                          <strong>{atRiskStudents.length}</strong> at-risk students
                        </span>
                        <Tooltip content="Students who are Hatchling (not ready) and scored below 50%">
                          <span className="alert-info-icon">?</span>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="alert-row-bottom">
                      <button
                        className={`alert-toggle ${highlightAtRisk ? 'active' : ''}`}
                        onClick={() => onHighlightAtRiskChange?.(!highlightAtRisk)}
                        title={highlightAtRisk ? 'Hide highlighting' : 'Highlight in table'}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3C4.5 3 2 8 2 8C2 8 4.5 13 8 13C11.5 13 14 8 14 8C14 8 11.5 3 8 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        {highlightAtRisk ? 'On' : 'Off'}
                      </button>
                      <button
                        className="alert-action-btn"
                        onClick={onAtRiskClick}
                      >
                        Action →
                      </button>
                    </div>
                  </div>
                )}
                {quickWinSkills.length > 0 && (
                  <div className="insight-alert-stacked quick-win">
                    <div className="alert-row-top">
                      <span className="alert-icon-circle">★</span>
                      <div className="alert-text-group">
                        <span className="alert-text">
                          <strong>{quickWinSkills.length}</strong> quick win skills
                        </span>
                        <Tooltip content="Skills where class average is close to proficient - small effort, big impact">
                          <span className="alert-info-icon">?</span>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="alert-row-bottom">
                      <button
                        className="alert-action-btn"
                        onClick={onQuickWinsClick}
                      >
                        Action →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        // Simpler completion-focused insights for other task types
        <div className="insights-section completion-overview">
          <h4 className="insights-title">Completion Overview</h4>
          <div className="completion-stats">
            <div className="completion-donut">
              <svg viewBox="0 0 100 100" className="donut-chart">
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="#F4F5F5"
                  strokeWidth="12"
                />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="#16A188"
                  strokeWidth="12"
                  strokeDasharray={`${completedPercent * 2.51} ${251 - completedPercent * 2.51}`}
                  strokeDashoffset="63"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="donut-center">
                <span className="donut-number">{completedPercent}%</span>
                <span className="donut-label">complete</span>
              </div>
            </div>
            <div className="completion-legend">
              <div className="completion-stat">
                <span className="completion-value completed">{completedCount}</span>
                <span className="completion-label">Completed</span>
              </div>
              <div className="completion-stat">
                <span className="completion-value in-progress">{inProgressCount}</span>
                <span className="completion-label">In Progress / Not Started</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
