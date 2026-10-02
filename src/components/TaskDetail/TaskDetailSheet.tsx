import ReadinessExperience from './ReadinessExperience';
import {ReportHeader} from '../../test-controls/ReportHeader';
import {PrototypeBack} from '../../test-controls/PrototypeNavigation';
import '../../test-controls/test-controls.css';
import '../../test-controls/report-controls.css';
import './readiness-report.css';
import {generateTaskDetailData} from '../../data/readiness-report';
import ReadinessRecommendations from './ReadinessRecommendations';
import { useState, useEffect } from 'react';
import { loadData } from '../../data/storage';
import type { Task, Student, StudentTaskDetail, TaskDetailData, ReadinessLevel, SkillFilterBucket, TaskGroup, TestStatus } from '../../types';
import TaskInsightsPanel from './TaskInsightsPanel';
import StudentsTab from './StudentsTab';
import QuestionsTab from './QuestionsTab';
import SkillsTab from './SkillsTab';
import ActionFlowModal from './ActionFlowModal';
import '../../pages/TaskReport.css';
import {
  type Scenario,
  type LocalGroup,
  fmt,
  fmtShort as _fmtShort,
  testStatusFromScenario,
  GroupCard,
  ReassignModal,
} from '../../pages/TaskReport';

interface TaskDetailSheetProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailSheet({ taskId, onClose }: TaskDetailSheetProps) {
  const [summaryLayout,setSummaryLayout] = useState('Simplified');
  const [activeTab, setActiveTab] = useState<'students' | 'questions' | 'skills'>('students');
  const [taskDetail, setTaskDetail] = useState<TaskDetailData | null>(null);
  // Multi-select filters - empty array means 'all'
  const [readinessFilters, setReadinessFilters] = useState<ReadinessLevel[]>([]);
  const [skillFilters, setSkillFilters] = useState<SkillFilterBucket[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showAtRiskModal, setShowAtRiskModal] = useState(false);
  const [showQuickWinsModal, setShowQuickWinsModal] = useState(false);
  const [highlightAtRisk, setHighlightAtRisk] = useState(false);

  // Test report state
  const [rawTask, setRawTask] = useState<Task | null>(null);
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [rawResults, setRawResults] = useState<{ studentId: string; status: string; score: number }[]>([]);
  const [localGroups, setLocalGroups] = useState<LocalGroup[]>([]);
  const [scenario, setScenario] = useState<Scenario>('after');
  const [isPaused, setIsPaused] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignStudentIds, setReassignStudentIds] = useState<string[]>([]);
  const [layout, setLayout] = useState<'classic' | 'compact'>('classic');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  useEffect(() => {
    const data = loadData();
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;

    const classStudents = data.students.filter(s => s.classId === task.classId);
    const taskResult = data.taskResults.find(r => r.taskId === taskId);
    const teacher = data.teacher;
    const classData = data.classes.find(c => c.id === task.classId);

    // Generate mock detailed data
    const detailData = generateTaskDetailData(task, classStudents, taskResult, teacher.name, classData?.name || '');
    setTaskDetail(detailData);

    // Save raw data for test controls
    setRawTask(task);
    setRawStudents(classStudents);
    setRawResults(taskResult?.perStudent ?? []);
    if (task.taskGroups && task.taskGroups.length > 0) {
      setLocalGroups(task.taskGroups as LocalGroup[]);
    } else {
      setLocalGroups([{
        id: 'synthetic-all',
        name: 'All Students',
        studentIds: classStudents.map(s => s.id),
        startDate: task.startDate ?? task.createdAt,
        dueDate: task.dueDate,
        expiryDate: task.expiryDate,
        resultsLocked: false,
        resultsReleaseRule: 'manual',
      }]);
    }
  }, [taskId]);

  // Test controls computed
  const isTest = rawTask?.taskType === 'test';
  const testStatus: TestStatus = testStatusFromScenario(scenario, isPaused);

  const getGroupStatus = (idx: number): TestStatus => {
    if (scenario === 'before') return 'scheduled';
    if (scenario === 'during') return idx === 0 ? (isPaused ? 'paused' : 'live') : 'scheduled';
    return 'completed';
  };

  const toggleGroupLock = (id: string) =>
    setLocalGroups(prev => prev.map(g => g.id === id ? { ...g, resultsLocked: !g.resultsLocked } : g));

  const changeGroupRule = (id: string, rule: LocalGroup['resultsReleaseRule']) =>
    setLocalGroups(prev => prev.map(g => g.id === id ? { ...g, resultsReleaseRule: rule } : g));

  const changeGroupDays = (id: string, days: number) =>
    setLocalGroups(prev => prev.map(g => g.id === id ? { ...g, releaseAfterDays: days } : g));

  const handleReassign = () => {
    setReassignStudentIds([]);
    setShowReassignModal(false);
  };

  if (!taskDetail) {
    return null;
  }

  // Get skill IDs for the selected buckets (multi-select)
  const getSkillIdsInBuckets = (): string[] => {
    if (skillFilters.length === 0) return [];
    const skillIds: string[] = [];
    if (skillFilters.includes('critical-gap')) {
      skillIds.push(...taskDetail.insights.skillsSummary.criticalGap.map(s => s.id));
    }
    if (skillFilters.includes('needs-practice')) {
      skillIds.push(...taskDetail.insights.skillsSummary.needsMorePractice.map(s => s.id));
    }
    if (skillFilters.includes('proficient')) {
      skillIds.push(...taskDetail.insights.skillsSummary.proficient.map(s => s.id));
    }
    return [...new Set(skillIds)]; // Remove duplicates
  };

  const skillIdsInBucket = getSkillIdsInBuckets();

  // Filter students by readiness and/or skill bucket (multi-select)
  const filteredStudents = taskDetail.students.filter(student => {
    // Apply readiness filter (if any selected)
    if (readinessFilters.length > 0 && !readinessFilters.includes(student.readiness)) {
      return false;
    }
    // Apply skill bucket filter - check if student has any skill in the selected buckets
    if (skillFilters.length > 0 && skillIdsInBucket.length > 0) {
      const studentSkills = taskDetail.skillsData.students.find(s => s.studentId === student.studentId);
      if (!studentSkills) return false;
      // Check if student has at least one skill in any selected bucket
      const hasSkillInBucket = skillIdsInBucket.some(skillId => {
        const mastery = studentSkills.skillMasteries[skillId] || 0;
        // Check mastery against all selected buckets
        if (skillFilters.includes('critical-gap') && mastery <= 1.5) return true;
        if (skillFilters.includes('needs-practice') && mastery > 1.5 && mastery < 3.5) return true;
        if (skillFilters.includes('proficient') && mastery >= 3.5) return true;
        return false;
      });
      if (!hasSkillInBucket) return false;
    }
    return true;
  });

  // Filter questions by skill bucket (multi-select)
  const filteredQuestions = taskDetail.questions.filter(question => {
    if (skillFilters.length === 0) return true;
    // Check if question has any skill in the selected buckets
    return question.skills.some(skill => skillIdsInBucket.includes(skill.id));
  });

  // Filter skills for the skills tab (multi-select)
  const filteredSkillsData = {
    ...taskDetail.skillsData,
    skills: skillFilters.length === 0
      ? taskDetail.skillsData.skills
      : taskDetail.skillsData.skills.filter(skill => skillIdsInBucket.includes(skill.skillId)),
    students: taskDetail.skillsData.students.filter(student => {
      if (readinessFilters.length > 0 && !readinessFilters.includes(student.readiness)) {
        return false;
      }
      return true;
    })
  };

  // Handler for at-risk students click - show action modal
  const handleAtRiskClick = () => {
    setShowAtRiskModal(true);
  };

  // Handler for quick wins click - show action modal
  const handleQuickWinsClick = () => {
    setShowQuickWinsModal(true);
  };

  // Handle action from at-risk modal
  const handleAtRiskAction = (action: string, studentIds: string[]) => {
    console.log('At-risk action:', action, 'for students:', studentIds);
    // In a real app, this would trigger the appropriate action
    setShowAtRiskModal(false);
  };

  // Handle action from quick wins modal
  const handleQuickWinsAction = (action: string, skillIds: string[]) => {
    console.log('Quick wins action:', action, 'for skills:', skillIds);
    // In a real app, this would trigger the appropriate action
    setShowQuickWinsModal(false);
  };

  // Get at-risk students data for the modal
  const getAtRiskStudents = (): StudentTaskDetail[] => {
    return taskDetail.students.filter(s =>
      taskDetail.insights.atRiskStudents.includes(s.studentId)
    );
  };

  // Get quick wins skills with affected students
  const getQuickWinsWithStudents = () => {
    return taskDetail.insights.quickWinSkills.map(skill => {
      // Find skill data to get class average
      const skillData = taskDetail.skillsData.skills.find(s => s.skillId === skill.id);
      const classAverageMastery = skillData?.classAverageMastery || 0;

      // Find students who need practice on this skill (mastery < 4)
      const affectedStudents = taskDetail.skillsData.students
        .filter(student => {
          const mastery = student.skillMasteries[skill.id] || 0;
          return mastery < 4; // Below proficient
        })
        .map(student => ({
          studentId: student.studentId,
          studentName: student.studentName,
          firstName: student.firstName,
          lastName: student.lastName,
          avatarUrl: student.avatarUrl,
          mastery: student.skillMasteries[skill.id] || 0
        }))
        .sort((a, b) => a.mastery - b.mastery); // Sort by mastery ascending

      return {
        ...skill,
        classAverageMastery,
        affectedStudents
      };
    });
  };

  // Calculate counts for display
  const totalSelectedOrFiltered = selectedStudentIds.length > 0 ? selectedStudentIds.length : filteredStudents.length;

  const formatDateRange = () => {
    const { header } = taskDetail;
    if (header.taskType!=='topic-readiness-checkin' && header.dueDates && header.dueDates.length > 1) {
      return header.dueDates.map(dd => {
        const date = new Date(dd.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return `${date} (${dd.groupNames.join(', ')})`;
      }).join(' → ');
    }
    const start = new Date(header.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const due = new Date(header.dueDates.map(d=>d.date).sort().at(-1) || header.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `${start} → ${due}`;
  };

  const getTaskTypeLabel = () => {
    const labels: Record<string, string> = {
      'topic-readiness-checkin': 'Topic Readiness Check-in',
      'adaptive': 'Adaptive Task',
      'custom': 'Custom Task',
      'test': 'Test',
      'revision': 'Revision'
    };
    return labels[taskDetail.header.taskType] || taskDetail.header.taskType;
  };

  const getTaskTypeColor = () => {
    const colors: Record<string, string> = {
      'topic-readiness-checkin': '#7C6ECC',
      'adaptive': '#1CB7C8',
      'custom': '#0E7AC2',
      'test': '#D5424D',
      'revision': '#16A188'
    };
    return colors[taskDetail.header.taskType] || '#5A5A68';
  };

  // Check if currently in extension period
  const isInExtensionPeriod = () => {
    const now = new Date();
    const dueDates = taskDetail.header.dueDates;
    const expiryDate = taskDetail.header.expiryDate ? new Date(taskDetail.header.expiryDate) : null;

    if (!expiryDate || dueDates.length === 0) return false;

    // Get latest due date
    const latestDueDate = dueDates.reduce((latest, dd) => {
      const d = new Date(dd.date);
      return d > latest ? d : latest;
    }, new Date(dueDates[0].date));

    return now > latestDueDate && now < expiryDate;
  };

  const pageReport = taskDetail.header.taskType === 'topic-readiness-checkin';
  const inExtensionPeriod = isInExtensionPeriod();

  return (
    <div className={pageReport?'tc-app readiness-report':'sheet-overlay'} onClick={pageReport?undefined:onClose}>
      <div className={pageReport?'tc-main':'sheet'} onClick={e => e.stopPropagation()}>
        {pageReport?<><div className="rp-prototype-toolbar"><PrototypeBack to="/prototypes/topic-readiness-check-in"/><span>Topic Readiness Check-in · {taskDetail.header.classId==='class-a'?'Building prerequisite foundations':'Mixed readiness, stronger foundations'}</span><div className="readiness-layout-control"><span>Summary layout</span><div className="ar-toggle" role="group" aria-label="Summary layout">{['Detailed','Simplified'].map(v=><button key={v} aria-pressed={summaryLayout===v} className={summaryLayout===v?'active':''} onClick={()=>setSummaryLayout(v)}>{v}</button>)}</div></div></div><ReportHeader title={taskDetail.header.title} className={taskDetail.header.className} classPath={`/classes/${taskDetail.header.classId}/tasks`} area={taskDetail.header.areaOfStudy} type="Readiness check-in" typeIcon={<i className="rc-metadata-icon" style={{maskImage:'url(/assets/readiness/task-type.svg)'}}/>} questions={taskDetail.header.questionsCount} skills={taskDetail.header.skillsCount} teacher={taskDetail.header.teacherName} dates={<><i className="rc-metadata-icon" style={{maskImage:'url(/assets/dashboard/date.svg)'}}/>{formatDateRange()}</>} status={<span className={`tc-status ${taskDetail.header.status==='expired'?'closed':'active'}`}><i className="rc-metadata-icon" style={{maskImage:`url(/assets/${taskDetail.header.status==='expired'?'report-controls/closed':'dashboard/active'}.svg)`}}/>{taskDetail.header.status==='expired'?'Closed':'Active'}</span>} actions={<button onClick={onClose}>Back to tasks</button>}/></>:(
        <div className="sheet-header">
          <div className="sheet-header-content">
            <div className="sheet-title-row">
              <h2 style={{ margin: 0 }}>{taskDetail.header.title}</h2>
              <span
                className="task-type-chip"
                style={{
                  backgroundColor: `${getTaskTypeColor()}15`,
                  color: getTaskTypeColor(),
                  marginLeft: '0.75rem'
                }}
              >
                {getTaskTypeLabel()}
              </span>
              <span
                className={`status-badge ${taskDetail.header.status}`}
                style={{ marginLeft: '0.5rem' }}
              >
                {taskDetail.header.status === 'active' ? 'Active' : 'Expired'}
              </span>
              {inExtensionPeriod && (
                <span className="status-badge extension" style={{ marginLeft: '0.5rem' }}>
                  Extension Period
                </span>
              )}
            </div>
            <div className="sheet-meta-row">
              <span className="sheet-meta-item">
                {taskDetail.header.areaOfStudy}
              </span>
              <span className="sheet-meta-divider">•</span>
              <span className="sheet-meta-item">
                {formatDateRange()}
              </span>
              {taskDetail.header.expiryDate && (
                <>
                  <span className="sheet-meta-divider">•</span>
                  <span className="sheet-meta-item expiry">
                    Expires: {new Date(taskDetail.header.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </>
              )}
            </div>
            <div className="sheet-stats-row">
              <span className="sheet-stat">
                <strong>{taskDetail.header.questionsCount}</strong> Questions
              </span>
              <span className="sheet-stat">
                <strong>{taskDetail.header.skillsCount}</strong> Skills
              </span>
              <span className="sheet-stat">
                Assigned by <strong>{taskDetail.header.teacherName}</strong>
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>)}

        <div className={pageReport?'readiness-report-body':'sheet-body'}>
          {isTest && (
            <>
              {/* Scenario switcher — prototype demo only */}
              <div className="scenario-bar">
                <span className="scenario-bar__label">Prototype:</span>
                {(['before', 'during', 'after'] as Scenario[]).map(s => (
                  <button
                    key={s}
                    className={`scenario-btn ${scenario === s ? 'active' : ''}`}
                    onClick={() => { setScenario(s); setIsPaused(false); }}
                  >
                    {s === 'before' ? 'Before test' : s === 'during' ? 'During test' : 'After test'}
                  </button>
                ))}
                {scenario === 'during' && (
                  <>
                    <span style={{ color: '#B8B8BF' }}>|</span>
                    <button className={`scenario-btn ${isPaused ? 'active' : ''}`} onClick={() => setIsPaused(p => !p)}>
                      {isPaused ? '⏸ Paused' : '▶ Playing'}
                    </button>
                  </>
                )}
                <div className="layout-toggle">
                  <button className={`layout-toggle-btn ${layout === 'classic' ? 'active' : ''}`} onClick={() => setLayout('classic')}>V1</button>
                  <button className={`layout-toggle-btn ${layout === 'compact' ? 'active' : ''}`} onClick={() => setLayout('compact')}>V2</button>
                </div>
              </div>

              {/* Test controls bar */}
              <div className="test-controls-bar">
                <div className="test-controls-left">
                  <div className={`test-status-pill test-status-pill--${testStatus}`}>
                    <span className="test-status-dot" />
                    {testStatus === 'scheduled' && 'Scheduled'}
                    {testStatus === 'live' && 'Live'}
                    {testStatus === 'paused' && 'Paused'}
                    {testStatus === 'completed' && 'Completed'}
                  </div>
                  <div className="test-controls-meta">
                    {testStatus === 'scheduled' && rawTask?.startDate && `Starts ${fmt(rawTask.startDate)}`}
                    {testStatus === 'live' && rawTask && `Ends ${fmt(rawTask.dueDate)}`}
                    {testStatus === 'paused' && 'Test paused — students cannot submit'}
                    {testStatus === 'completed' && rawTask && `Ended ${fmt(rawTask.dueDate)}`}
                  </div>
                </div>
                <div className="test-actions">
                  {testStatus === 'scheduled' && (<>
                    <button className="btn-report btn-report--primary">Start early</button>
                    <button className="btn-report btn-report--secondary">Reschedule</button>
                    <button className="btn-report btn-report--secondary">Edit test</button>
                  </>)}
                  {testStatus === 'live' && (<>
                    <button className="btn-report btn-report--warning" onClick={() => setIsPaused(true)}>⏸ Pause test</button>
                    <button className="btn-report btn-report--secondary">Restart</button>
                    <button className="btn-report btn-report--secondary">Reschedule</button>
                  </>)}
                  {testStatus === 'paused' && (<>
                    <button className="btn-report btn-report--primary" onClick={() => setIsPaused(false)}>▶ Resume test</button>
                    <button className="btn-report btn-report--secondary">Restart</button>
                    <button className="btn-report btn-report--secondary">Reschedule</button>
                  </>)}
                  {testStatus === 'completed' && (<>
                    <button className="btn-report btn-report--secondary" onClick={() => {
                      const missedIds = rawStudents.filter(s => {
                        const r = rawResults.find(r => r.studentId === s.id);
                        return !r || r.status === 'Not Started';
                      }).map(s => s.id);
                      setReassignStudentIds(missedIds);
                      setShowReassignModal(true);
                    }}>Reassign missed</button>
                    <button className="btn-report btn-report--secondary" onClick={() => {
                      setReassignStudentIds(rawStudents.map(s => s.id));
                      setShowReassignModal(true);
                    }}>Reassign test</button>
                    <button className="btn-report btn-report--secondary">Export results</button>
                  </>)}
                </div>
              </div>

              {/* Test groups — V1: full cards, V2: compact chips */}
              {localGroups.length > 0 && layout === 'classic' && (
                <div className="groups-section">
                  <div className="groups-section__header">
                    <h3 className="groups-section__title">
                      Test Groups
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.8125rem', fontWeight: 400, color: '#767682' }}>
                        {localGroups.length} group{localGroups.length !== 1 ? 's' : ''}
                      </span>
                    </h3>
                    <button className="btn-report btn-report--secondary btn-report--sm">+ Add group</button>
                  </div>
                  <div className="groups-grid" style={{ gridTemplateColumns: `repeat(${Math.min(localGroups.length, 3)}, 1fr)` }}>
                    {localGroups.map((g, idx) => (
                      <GroupCard
                        key={g.id}
                        group={g}
                        groupStatus={getGroupStatus(idx)}
                        students={rawStudents}
                        results={rawResults}
                        onToggleLock={() => toggleGroupLock(g.id)}
                        onChangeRule={rule => changeGroupRule(g.id, rule)}
                        onChangeDays={days => changeGroupDays(g.id, days)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {localGroups.length > 0 && layout === 'compact' && (
                <>
                  <div className="groups-chips-bar">
                    {localGroups.map((g, idx) => {
                      const gs = rawStudents.filter(s => g.studentIds.includes(s.id));
                      const gr = rawResults.filter(r => g.studentIds.includes(r.studentId));
                      const done = gr.filter(r => r.status === 'Completed').length;
                      const total = gs.length;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                      const isExpanded = expandedGroupId === g.id;
                      const gStatus = getGroupStatus(idx);
                      const statusDot: Record<string, string> = { scheduled: '#B8B8BF', live: '#22C55E', paused: '#F59E0B', completed: '#22C55E' };
                      return (
                        <button
                          key={g.id}
                          className={`group-chip-btn ${isExpanded ? 'chip-active' : ''}`}
                          onClick={() => setExpandedGroupId(isExpanded ? null : g.id)}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot[gStatus], flexShrink: 0 }} />
                          <span className="group-chip__name">{g.name}</span>
                          <div className="group-chip__mini-bar">
                            <div className="group-chip__mini-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="group-chip__count">{done}/{total}</span>
                          <span className="group-chip__lock">{g.resultsLocked ? '🔒' : '🔓'}</span>
                        </button>
                      );
                    })}
                    <button className="btn-report btn-report--secondary btn-report--sm" style={{ marginLeft: 'auto' }}>+ Add group</button>
                  </div>
                  {expandedGroupId && (() => {
                    const g = localGroups.find(g => g.id === expandedGroupId);
                    const idx = localGroups.findIndex(g => g.id === expandedGroupId);
                    if (!g) return null;
                    return (
                      <div className="group-chip-expanded">
                        <GroupCard
                          group={g}
                          groupStatus={getGroupStatus(idx)}
                          students={rawStudents}
                          results={rawResults}
                          onToggleLock={() => toggleGroupLock(g.id)}
                          onChangeRule={rule => changeGroupRule(g.id, rule)}
                          onChangeDays={days => changeGroupDays(g.id, days)}
                        />
                      </div>
                    );
                  })()}
                </>
              )}
            </>
          )}

          {!pageReport&&<TaskInsightsPanel
            recommendations={taskDetail.header.taskType==='topic-readiness-checkin'?<ReadinessRecommendations title={taskDetail.header.title} students={getAtRiskStudents()} skills={taskDetail.insights.quickWinSkills}/>:undefined}
            insights={taskDetail.insights}
            taskType={taskDetail.header.taskType}
            readinessFilters={readinessFilters}
            onReadinessFilterChange={setReadinessFilters}
            skillFilters={skillFilters}
            onSkillFilterChange={setSkillFilters}
            onAtRiskClick={handleAtRiskClick}
            onQuickWinsClick={handleQuickWinsClick}
            highlightAtRisk={highlightAtRisk}
            onHighlightAtRiskChange={setHighlightAtRisk}
          />}

          {pageReport?<ReadinessExperience data={taskDetail} layout={summaryLayout}/>:<>
          <div className={pageReport?'tc-report-title':'sheet-tabs-row'}>
            <div className={pageReport?'tc-report-tabs':'sheet-tabs'} role="tablist" aria-label="Report views">
              <button
                role="tab" aria-selected={activeTab === 'students'} className={`${pageReport?'':'sheet-tab'} ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                Students ({filteredStudents.length})
              </button>
              <button
                role="tab" aria-selected={activeTab === 'questions'} className={`${pageReport?'':'sheet-tab'} ${activeTab === 'questions' ? 'active' : ''}`}
                onClick={() => setActiveTab('questions')}
              >
                Questions ({filteredQuestions.length})
              </button>
              <button
                role="tab" aria-selected={activeTab === 'skills'} className={`${pageReport?'':'sheet-tab'} ${activeTab === 'skills' ? 'active' : ''}`}
                onClick={() => setActiveTab('skills')}
              >
                Skills ({filteredSkillsData.skills.length})
              </button>
            </div>
            <button className="btn btn-primary assign-btn">
              <img src="/assets/Icons/Add.svg" alt="" width="16" height="16" />
              Assign
              {totalSelectedOrFiltered > 0 && totalSelectedOrFiltered !== taskDetail.students.length && (
                <span className="assign-count">({totalSelectedOrFiltered})</span>
              )}
            </button>
          </div>

          <div className="sheet-tab-content">
            {activeTab === 'students' && (
              <StudentsTab
                students={filteredStudents}
                taskGroups={localGroups.length > 1 ? (localGroups as unknown as TaskGroup[]) : undefined}
                selectedStudentIds={selectedStudentIds}
                onSelectionChange={setSelectedStudentIds}
                atRiskStudentIds={taskDetail.insights.atRiskStudents}
                highlightAtRisk={highlightAtRisk}
                taskType={taskDetail.header.taskType}
                onReassignStudent={(sid) => { setReassignStudentIds([sid]); setShowReassignModal(true); }}
              />
            )}
            {activeTab === 'questions' && (
              <QuestionsTab questions={filteredQuestions} />
            )}
            {activeTab === 'skills' && (
              <SkillsTab skillsData={filteredSkillsData} />
            )}
          </div></>}
        </div>
      </div>

      {/* Action Flow Modals */}
      {showAtRiskModal && taskDetail.insights.atRiskStudents.length > 0 && (
        <ActionFlowModal
          type="at-risk"
          students={getAtRiskStudents()}
          onClose={() => setShowAtRiskModal(false)}
          onAction={handleAtRiskAction}
        />
      )}

      {showQuickWinsModal && taskDetail.insights.quickWinSkills.length > 0 && (
        <ActionFlowModal
          type="quick-wins"
          skills={getQuickWinsWithStudents()}
          onClose={() => setShowQuickWinsModal(false)}
          onAction={handleQuickWinsAction}
        />
      )}

      {showReassignModal && (
        <ReassignModal
          students={rawStudents.filter(s => reassignStudentIds.includes(s.id))}
          groups={localGroups}
          onConfirm={handleReassign}
          onClose={() => setShowReassignModal(false)}
        />
      )}
    </div>
  );
}
