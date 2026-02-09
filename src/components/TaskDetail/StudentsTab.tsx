import { useState, useEffect } from 'react';
import type { StudentTaskDetail, TaskType } from '../../types';
import Tooltip from '../Tooltip';

// Confidence icons
const SoaringIcon = () => (
  <img src=/assets/Icons/Confidence-03-Soaring.svg" alt="" width="16" height="16" />
);
const FlyingIcon = () => (
  <img src=/assets/Icons/Confidence-02a-Flying.svg" alt="" width="16" height="16" />
);
const HatchlingIcon = () => (
  <img src=/assets/Icons/Confidence-01-Hatchling.svg" alt="" width="16" height="16" />
);

interface StudentsTabProps {
  students: StudentTaskDetail[];
  selectedStudentIds?: string[];
  onSelectionChange?: (studentIds: string[]) => void;
  atRiskStudentIds?: string[];
  highlightAtRisk?: boolean;
  taskType?: TaskType;
}

export default function StudentsTab({ students, selectedStudentIds, onSelectionChange, atRiskStudentIds = [], highlightAtRisk = false, taskType = 'custom' }: StudentsTabProps) {
  const showConfidenceColumn = taskType === 'topic-readiness-checkin';
  const [localSelectedStudents, setLocalSelectedStudents] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Use controlled selection if provided, otherwise use local state
  const selectedStudents = selectedStudentIds ?? localSelectedStudents;
  const setSelectedStudents = onSelectionChange ?? setLocalSelectedStudents;

  // Clear selections when students list changes (due to filtering)
  useEffect(() => {
    const validIds = students.map(s => s.studentId);
    const validSelected = selectedStudents.filter(id => validIds.includes(id));
    if (validSelected.length !== selectedStudents.length) {
      setSelectedStudents(validSelected);
    }
  }, [students]);

  const toggleSelect = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.studentId));
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getConfidenceLabel = (readiness: string) => {
    switch (readiness) {
      case 'ready': return { label: 'Soaring', icon: <SoaringIcon /> };
      case 'partially-ready': return { label: 'Flying', icon: <FlyingIcon /> };
      case 'not-ready': return { label: 'Hatchling', icon: <HatchlingIcon /> };
      default: return { label: readiness, icon: null };
    }
  };

  return (
    <div className="students-tab">
      <table className="task-students-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input
                type="checkbox"
                checked={selectedStudents.length === students.length && students.length > 0}
                onChange={toggleSelectAll}
              />
            </th>
            <th>Student</th>
            <th>Progress</th>
            {showConfidenceColumn && <th>Confidence</th>}
            <th>Result</th>
            <th>Mark</th>
            <th>Time</th>
            <th style={{ width: '200px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr
              key={student.studentId}
              className={highlightAtRisk && atRiskStudentIds.includes(student.studentId) ? 'at-risk' : ''}
            >
              <td>
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.studentId)}
                  onChange={() => toggleSelect(student.studentId)}
                />
              </td>
              <td>
                <div className="student-cell">
                  <img
                    src={student.avatarUrl}
                    alt={student.studentName}
                    className="student-avatar-small"
                  />
                  <span className="student-name-text">
                    {student.lastName}, {student.firstName}
                  </span>
                </div>
              </td>
              <td>
                <div className="progress-cell">
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar-fill ${student.status}`}
                      style={{ width: `${student.completionProgress}%` }}
                    />
                    <span className="progress-text">
                      {student.questionsAnswered}/{student.totalQuestions}
                    </span>
                  </div>
                  {student.completedAt && (
                    <span className={`completion-date ${student.isExtensionPeriod ? 'extension' : ''}`}>
                      {new Date(student.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {student.isExtensionPeriod && ' (ext)'}
                    </span>
                  )}
                </div>
              </td>
              {showConfidenceColumn && (
                <td>
                  <span className={`confidence-badge ${student.readiness}`}>
                    {getConfidenceLabel(student.readiness).icon}
                    <span>{getConfidenceLabel(student.readiness).label}</span>
                  </span>
                </td>
              )}
              <td className="result-cell">
                {student.status === 'completed' ? (
                  `${student.resultPercentage}%`
                ) : student.status === 'in-progress' ? (
                  <Tooltip
                    content={
                      <div className="result-tooltip">
                        <strong>In Progress</strong>
                        <p>Current accuracy on {student.questionsAnswered} of {student.totalQuestions} questions answered.</p>
                        <p className="tooltip-note">* Final result may differ once all questions are completed.</p>
                      </div>
                    }
                  >
                    <span className="result-in-progress">
                      {student.resultPercentage}%*
                    </span>
                  </Tooltip>
                ) : (
                  <span className="result-not-started">—</span>
                )}
              </td>
              <td className="mark-cell">
                {student.status === 'completed' ? (
                  student.markPenalty ? (
                    <span>
                      <span className="mark-penalty">{student.markCorrect + student.markPenalty}</span>
                      <span className="mark-actual">{student.markCorrect}/{student.markTotal}</span>
                    </span>
                  ) : (
                    `${student.markCorrect}/${student.markTotal}`
                  )
                ) : student.status === 'in-progress' ? (
                  <Tooltip
                    content={
                      <div className="result-tooltip">
                        <strong>In Progress</strong>
                        <p>Questions answered so far. Not all questions have been attempted yet.</p>
                        <p className="tooltip-note">* Final mark will be calculated when complete.</p>
                      </div>
                    }
                  >
                    <span className="mark-in-progress">
                      {student.questionsAnswered}/{student.totalQuestions}*
                    </span>
                  </Tooltip>
                ) : (
                  <span className="mark-not-started">—</span>
                )}
              </td>
              <td className="time-cell">
                {student.timeSpentMinutes > 0 ? formatTime(student.timeSpentMinutes) : '-'}
              </td>
              <td className="actions-cell">
                <div className="action-buttons">
                  <button className="btn btn-secondary btn-sm">
                    Scorecard
                  </button>
                  <div className="sticker-button">
                    <div className="sticker-count">
                      <img src=/assets/Icons/Cards_star.svg" width="16" height="16" alt="" />
                      {student.stickersReceived}
                    </div>
                    <div className="sticker-give">
                      <img src=/assets/Pictogram/Stickers.svg" width="24" height="24" alt="" />
                    </div>
                  </div>
                  <div className="more-menu-container">
                    <button
                      className="more-btn"
                      onClick={() => setOpenMenuId(openMenuId === student.studentId ? null : student.studentId)}
                    >
                      ⋮
                    </button>
                    {openMenuId === student.studentId && (
                      <StudentActionMenu
                        studentName={`${student.firstName} ${student.lastName}`}
                        onClose={() => setOpenMenuId(null)}
                      />
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface StudentActionMenuProps {
  studentName: string;
  onClose: () => void;
}

function StudentActionMenu({ studentName, onClose }: StudentActionMenuProps) {
  return (
    <div className="student-action-menu" onClick={e => e.stopPropagation()}>
      <div className="menu-header">{studentName}</div>

      <div className="menu-section">
        <div className="menu-section-label">REPORTING</div>
        <button className="menu-item" onClick={onClose}>
          <span className="menu-icon">📊</span>
          Scorecard
        </button>
        <button className="menu-item" onClick={onClose}>
          <span className="menu-icon">📓</span>
          Student workbook
        </button>
      </div>

      <div className="menu-section">
        <div className="menu-section-label">ACTIONS</div>
        <button className="menu-item" onClick={onClose}>
          <span className="menu-icon">↻</span>
          Assign revision
        </button>
        <button className="menu-item" onClick={onClose}>
          <span className="menu-icon">↩</span>
          Reassign
        </button>
        <button className="menu-item" onClick={onClose}>
          <span className="menu-icon">★</span>
          Give sticker
        </button>
      </div>

      <div className="menu-section">
        <div className="menu-section-label">STUDENT</div>
        <button className="menu-item" onClick={onClose}>
          <span className="menu-icon">💡</span>
          Insights
        </button>
        <button className="menu-item" onClick={onClose}>
          <span className="menu-icon">📈</span>
          Topic mastery
        </button>
        <button className="menu-item" onClick={onClose}>
          <span className="menu-icon">🎯</span>
          Skills mastery
        </button>
        <button className="menu-item" onClick={onClose}>
          <span className="menu-icon">📋</span>
          Activity
        </button>
      </div>
    </div>
  );
}
