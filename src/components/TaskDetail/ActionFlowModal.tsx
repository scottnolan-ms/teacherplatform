import { useState } from 'react';
import type { StudentTaskDetail, SkillReference } from '../../types';

interface AtRiskActionFlowProps {
  type: 'at-risk';
  students: StudentTaskDetail[];
  onClose: () => void;
  onAction: (action: string, studentIds: string[]) => void;
}

interface QuickWinSkillWithStudents extends SkillReference {
  classAverageMastery: number;
  affectedStudents: {
    studentId: string;
    studentName: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    mastery: number;
  }[];
}

interface QuickWinsActionFlowProps {
  type: 'quick-wins';
  skills: QuickWinSkillWithStudents[];
  onClose: () => void;
  onAction: (action: string, skillIds: string[]) => void;
}

type ActionFlowModalProps = AtRiskActionFlowProps | QuickWinsActionFlowProps;

export default function ActionFlowModal(props: ActionFlowModalProps) {
  if (props.type === 'at-risk') {
    return <AtRiskFlow {...props as AtRiskActionFlowProps} />;
  }

  return <QuickWinsFlow {...props as QuickWinsActionFlowProps} />;
}

function AtRiskFlow({ students, onClose, onAction }: AtRiskActionFlowProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(students.map(s => s.studentId));

  const toggleStudent = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(s => s.studentId));
    }
  };

  return (
    <div className="action-flow-overlay" onClick={onClose}>
      <div className="action-flow-modal" onClick={e => e.stopPropagation()}>
        <div className="action-flow-header">
          <div className="action-flow-icon at-risk">!</div>
          <div>
            <h3>At-Risk Students</h3>
            <p className="action-flow-subtitle">
              {students.length} students are not ready and scored below 50%
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="action-flow-body">
          <div className="action-flow-list">
            <div className="action-flow-list-header">
              <label className="action-flow-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.length === students.length}
                  onChange={toggleAll}
                />
                <span>Select all ({students.length})</span>
              </label>
            </div>
            <div className="action-flow-students">
              {students.map(student => (
                <label key={student.studentId} className="action-flow-student-item">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student.studentId)}
                    onChange={() => toggleStudent(student.studentId)}
                  />
                  <img
                    src={student.avatarUrl}
                    alt={student.studentName}
                    className="student-avatar-small"
                  />
                  <div className="action-flow-student-info">
                    <span className="student-name">{student.lastName}, {student.firstName}</span>
                    <span className="student-stats">
                      {student.resultPercentage}% result • {student.questionsAnswered}/{student.totalQuestions} answered
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="action-flow-actions">
            <h4>Take Action</h4>
            <p className="action-flow-hint">Select students above, then choose an action</p>
            <div className="action-buttons-stack">
              <button
                className="action-flow-btn primary"
                onClick={() => onAction('assign-revision', selectedIds)}
                disabled={selectedIds.length === 0}
              >
                <span className="action-btn-icon">↻</span>
                <div className="action-btn-content">
                  <span className="action-btn-title">Assign Revision</span>
                  <span className="action-btn-desc">Create revision task for selected students</span>
                </div>
              </button>
              <button
                className="action-flow-btn"
                onClick={() => onAction('create-group', selectedIds)}
                disabled={selectedIds.length === 0}
              >
                <span className="action-btn-icon">👥</span>
                <div className="action-btn-content">
                  <span className="action-btn-title">Create Group</span>
                  <span className="action-btn-desc">Add selected students to a new group</span>
                </div>
              </button>
              <button
                className="action-flow-btn"
                onClick={() => onAction('send-reminder', selectedIds)}
                disabled={selectedIds.length === 0}
              >
                <span className="action-btn-icon">📧</span>
                <div className="action-btn-content">
                  <span className="action-btn-title">Send Reminder</span>
                  <span className="action-btn-desc">Notify students to complete the task</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickWinsFlow({ skills, onClose, onAction }: QuickWinsActionFlowProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(skills.map(s => s.id));
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  const toggleSkill = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === skills.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(skills.map(s => s.id));
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSkillId(expandedSkillId === id ? null : id);
  };

  // Get unique affected students across selected skills
  const getAffectedStudentsCount = () => {
    const studentIds = new Set<string>();
    skills.filter(s => selectedIds.includes(s.id)).forEach(skill => {
      skill.affectedStudents.forEach(student => {
        studentIds.add(student.studentId);
      });
    });
    return studentIds.size;
  };

  return (
    <div className="action-flow-overlay" onClick={onClose}>
      <div className="action-flow-modal quick-wins-modal" onClick={e => e.stopPropagation()}>
        <div className="action-flow-header">
          <div className="action-flow-icon quick-win">★</div>
          <div>
            <h3>Quick Win Skills</h3>
            <p className="action-flow-subtitle">
              {skills.length} skills are close to proficient - small effort, big impact
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="action-flow-body">
          <div className="action-flow-list">
            <div className="action-flow-list-header">
              <label className="action-flow-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.length === skills.length}
                  onChange={toggleAll}
                />
                <span>Select all ({skills.length})</span>
              </label>
            </div>
            <div className="action-flow-skills">
              {skills.map(skill => (
                <div key={skill.id} className="action-flow-skill-group">
                  <label className="action-flow-skill-item">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(skill.id)}
                      onChange={() => toggleSkill(skill.id)}
                    />
                    <div className="action-flow-skill-info">
                      <div className="skill-header-row">
                        <span className="skill-code">{skill.code}</span>
                        <span className="skill-name">{skill.name}</span>
                      </div>
                      <div className="skill-meta-row">
                        <span className="skill-avg-mastery">
                          Class avg: {skill.classAverageMastery.toFixed(1)}
                        </span>
                        <button
                          className="skill-students-toggle"
                          onClick={(e) => toggleExpand(skill.id, e)}
                        >
                          {skill.affectedStudents.length} students need practice
                          <span className={`toggle-arrow ${expandedSkillId === skill.id ? 'expanded' : ''}`}>
                            ▼
                          </span>
                        </button>
                      </div>
                    </div>
                  </label>
                  {expandedSkillId === skill.id && (
                    <div className="skill-affected-students">
                      {skill.affectedStudents.map(student => (
                        <div key={student.studentId} className="affected-student-item">
                          <img
                            src={student.avatarUrl}
                            alt={student.studentName}
                            className="student-avatar-tiny"
                          />
                          <span className="student-name-small">
                            {student.lastName}, {student.firstName}
                          </span>
                          <span className="student-mastery-badge">
                            Mastery: {student.mastery}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="action-flow-actions">
            <h4>Take Action</h4>
            <p className="action-flow-hint">
              {selectedIds.length > 0
                ? `${getAffectedStudentsCount()} students will be affected`
                : 'Select skills above, then choose an action'
              }
            </p>
            <div className="action-buttons-stack">
              <button
                className="action-flow-btn primary"
                onClick={() => onAction('assign-practice', selectedIds)}
                disabled={selectedIds.length === 0}
              >
                <span className="action-btn-icon">📝</span>
                <div className="action-btn-content">
                  <span className="action-btn-title">Assign Focused Practice</span>
                  <span className="action-btn-desc">Create practice task for selected skills</span>
                </div>
              </button>
              <button
                className="action-flow-btn"
                onClick={() => onAction('view-resources', selectedIds)}
                disabled={selectedIds.length === 0}
              >
                <span className="action-btn-icon">📚</span>
                <div className="action-btn-content">
                  <span className="action-btn-title">View Resources</span>
                  <span className="action-btn-desc">See teaching materials for these skills</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
