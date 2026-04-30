import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData } from '../data/storage';
import type { Student, TaskGroup, TestStatus, ResultsReleaseRule } from '../types';
import './TaskReport.css';

export type Scenario = 'before' | 'during' | 'after';

export interface LocalGroup extends TaskGroup {
  resultsLocked: boolean;
  resultsReleaseRule: ResultsReleaseRule;
  releaseAfterDays?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function fmt(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

export function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function testStatusFromScenario(scenario: Scenario, paused: boolean): TestStatus {
  if (scenario === 'before') return 'scheduled';
  if (scenario === 'during') return paused ? 'paused' : 'live';
  return 'completed';
}

export const GROUP_PALETTE = [
  { bg: '#F1EEFF', color: '#3C2C7F' },
  { bg: '#BDE6FF', color: '#004F85' },
  { bg: '#C6F7ED', color: '#005048' },
  { bg: '#FDEBB8', color: '#754800' },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Completed: 'completed',
    'In Progress': 'in-progress',
    'Not Started': 'not-started',
    Reassigned: 'reassigned',
    Missed: 'missed',
    Scheduled: 'scheduled',
    Live: 'live',
    Paused: 'paused',
  };
  return <span className={`status-badge status-badge--${map[status] ?? 'not-started'}`}>{status}</span>;
}

// ─── Result Lock Control ──────────────────────────────────────────────────────

export function ResultLockControl({
  group,
  groupStatus,
  onToggleLock,
  onChangeRule,
  onChangeDays,
}: {
  group: LocalGroup;
  groupStatus: TestStatus;
  onToggleLock: () => void;
  onChangeRule: (r: ResultsReleaseRule) => void;
  onChangeDays: (d: number) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (groupStatus !== 'completed') {
    return (
      <div className="result-control">
        <div className="result-release-row">
          <label>Release results:</label>
          <select value={group.resultsReleaseRule} onChange={e => onChangeRule(e.target.value as ResultsReleaseRule)}>
            <option value="manual">Manual only</option>
            <option value="on-expiry">On expiry {group.expiryDate ? `(${fmtShort(group.expiryDate)})` : ''}</option>
            <option value="days-after-expiry">After expiry</option>
          </select>
          {group.resultsReleaseRule === 'days-after-expiry' && (
            <>
              <input
                type="number" min={1} max={30}
                value={group.releaseAfterDays ?? 1}
                onChange={e => onChangeDays(parseInt(e.target.value))}
              />
              <span>day(s)</span>
            </>
          )}
        </div>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="result-control">
        <div className="confirm-unlock-banner">
          <span className="confirm-unlock-banner__icon">⚠️</span>
          <span>
            <strong>{group.studentIds.length} students</strong> will immediately see their results.
          </span>
        </div>
        <div className="confirm-unlock-actions">
          <button className="btn-report btn-report--danger btn-report--sm" onClick={() => { onToggleLock(); setConfirming(false); }}>
            Release results
          </button>
          <button className="btn-report btn-report--secondary btn-report--sm" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const releaseNote = () => {
    if (!group.resultsLocked) return null;
    if (group.resultsReleaseRule === 'on-expiry' && group.expiryDate) {
      return `Auto-releases ${fmtShort(group.expiryDate)}`;
    }
    if (group.resultsReleaseRule === 'days-after-expiry' && group.expiryDate) {
      const d = new Date(group.expiryDate);
      d.setDate(d.getDate() + (group.releaseAfterDays ?? 1));
      return `Auto-releases ${fmtShort(d.toISOString())}`;
    }
    return 'Manual release only';
  };

  return (
    <div className="result-control">
      <button
        className={`result-lock-btn ${group.resultsLocked ? 'result-lock-btn--locked' : 'result-lock-btn--unlocked'}`}
        onClick={() => group.resultsLocked ? setConfirming(true) : onToggleLock()}
      >
        <span className="result-lock-btn__icon">{group.resultsLocked ? '🔒' : '🔓'}</span>
        <span className="result-lock-btn__text">
          <span>{group.resultsLocked ? 'Results locked' : 'Results visible to students'}</span>
          {releaseNote() && <span className="result-lock-btn__sub">{releaseNote()}</span>}
        </span>
      </button>
      {group.resultsLocked && (
        <div className="result-release-row">
          <label>Auto-release:</label>
          <select value={group.resultsReleaseRule} onChange={e => onChangeRule(e.target.value as ResultsReleaseRule)}>
            <option value="manual">Never (manual only)</option>
            <option value="on-expiry">On expiry {group.expiryDate ? `(${fmtShort(group.expiryDate)})` : ''}</option>
            <option value="days-after-expiry">After expiry</option>
          </select>
          {group.resultsReleaseRule === 'days-after-expiry' && (
            <>
              <input
                type="number" min={1} max={30}
                value={group.releaseAfterDays ?? 1}
                onChange={e => onChangeDays(parseInt(e.target.value))}
              />
              <span>day(s)</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Group Card ───────────────────────────────────────────────────────────────

export function GroupCard({
  group,
  groupStatus,
  students,
  results,
  onToggleLock,
  onChangeRule,
  onChangeDays,
}: {
  group: LocalGroup;
  groupStatus: TestStatus;
  students: Student[];
  results: { studentId: string; status: string; score: number }[];
  onToggleLock: () => void;
  onChangeRule: (r: ResultsReleaseRule) => void;
  onChangeDays: (d: number) => void;
}) {
  const groupStudents = students.filter(s => group.studentIds.includes(s.id));
  const groupResults = results.filter(r => group.studentIds.includes(r.studentId));
  const completedCount = groupResults.filter(r => r.status === 'Completed').length;
  const total = groupStudents.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const completedResults = groupResults.filter(r => r.status === 'Completed');
  const avgScore = completedResults.length > 0
    ? Math.round(completedResults.reduce((s, r) => s + r.score, 0) / completedResults.length)
    : 0;

  const statusLabel: Record<TestStatus, string> = {
    scheduled: 'Scheduled',
    live: 'Live',
    paused: 'Paused',
    completed: 'Done',
  };

  const statusBadgeClass: Record<TestStatus, string> = {
    scheduled: 'not-started',
    live: 'in-progress',
    paused: 'in-progress',
    completed: 'completed',
  };

  return (
    <div className={`group-card group-card--${groupStatus}`}>
      <div className="group-card__header">
        <div className="group-card__name">{group.name}</div>
        <span className={`status-badge status-badge--${statusBadgeClass[groupStatus]}`}>
          {statusLabel[groupStatus]}
        </span>
      </div>

      <div className="group-card__meta">
        <div className="group-card__meta-row">
          <span>👥</span>
          <span>{total} students</span>
        </div>
        <div className="group-card__meta-row">
          <span>📅</span>
          <span>Due {fmt(group.dueDate)}</span>
        </div>
        {group.expiryDate && (
          <div className="group-card__meta-row">
            <span>⏰</span>
            <span>Expires {fmt(group.expiryDate)}</span>
          </div>
        )}
      </div>

      {(group.timeExtensionMinutes || group.calculatorAllowed) && (
        <div className="group-card__tags">
          {group.timeExtensionMinutes && (
            <span className="group-tag group-tag--extension">⏱ +{group.timeExtensionMinutes} min</span>
          )}
          {group.calculatorAllowed && (
            <span className="group-tag group-tag--calculator">🧮 Calculator</span>
          )}
        </div>
      )}

      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Completion</span>
          <span className="progress-value">{completedCount}/{total}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>
        {groupStatus === 'completed' && avgScore > 0 && (
          <div className="avg-score">Class avg: <strong>{avgScore}%</strong></div>
        )}
      </div>

      <ResultLockControl
        group={group}
        groupStatus={groupStatus}
        onToggleLock={onToggleLock}
        onChangeRule={onChangeRule}
        onChangeDays={onChangeDays}
      />
    </div>
  );
}

// ─── Reassign Modal ───────────────────────────────────────────────────────────

export function ReassignModal({
  students,
  groups,
  onConfirm,
  onClose,
}: {
  students: Student[];
  groups: LocalGroup[];
  onConfirm: (newDueDate: string, groupId: string, includeInReport: boolean) => void;
  onClose: () => void;
}) {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const [dueDate, setDueDate] = useState(nextWeek.toISOString().split('T')[0]);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [includeInReport, setIncludeInReport] = useState(true);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal reassign-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reassign Test</h2>
        </div>
        <div className="modal-body">
          <p style={{ marginTop: 0, fontSize: '0.875rem', color: '#5A5A68' }}>
            Reassigning for <strong>{students.length}</strong> student{students.length !== 1 ? 's' : ''}:
          </p>

          <div className="reassign-student-chips">
            {students.map(s => (
              <span key={s.id} className="reassign-student-chip">
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#A69BF0', color: '#3C2C7F', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, flexShrink: 0 }}>
                  {initials(s.name)}
                </span>
                {s.name}
              </span>
            ))}
          </div>

          <div className="reassign-options">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>New due date</label>
              <input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            {groups.length > 1 && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Assign to group</label>
                <select value={groupId} onChange={e => setGroupId(e.target.value)}>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                  <option value="__new__">Create a new group for reassigned students</option>
                </select>
              </div>
            )}

            <div className="include-in-report-box">
              <input
                type="checkbox"
                id="include-in-report"
                checked={includeInReport}
                onChange={e => setIncludeInReport(e.target.checked)}
              />
              <div className="include-in-report-box__body">
                <label className="include-in-report-box__label" htmlFor="include-in-report">
                  Include results in this report
                </label>
                <span className="include-in-report-box__desc">
                  The reassigned attempt will appear in this report alongside other students, keeping results in one place.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(dueDate, groupId, includeInReport)}>
            Reassign {students.length} student{students.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component (redirects to class-scoped URL) ──────────────────────────

export default function TaskReport() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const data = loadData();
    const t = data.tasks.find(t => t.id === taskId);
    if (t) navigate(`/classes/${t.classId}/tasks/${t.id}`, { replace: true });
  }, [taskId, navigate]);

  return null;
}

