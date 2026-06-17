import { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData } from '../data/storage';
import type { Class, Student, PersistentGroup, StudentActivity, Task, TaskGroup, TaskResult, CurriculumData } from '../types';
import CreateGroupModal from '../components/CreateGroupModal';
import Tooltip from '../components/Tooltip';
import StudentDetailModal from '../components/StudentDetailModal';
import { TaskDetailSheet } from '../components/TaskDetail';
import TextbookProgressTab from '../components/TextbookProgressTab';
import { generateCurriculumData } from '../data/curriculumData';

type SortField = 'lastName' | 'firstName' | 'mathspaceGroup' | 'groups';
type SortDirection = 'asc' | 'desc';
type DateFilter = 'this-week' | 'last-30-days';

export default function ClassDetail() {
  const { classId, taskId } = useParams<{ classId: string; taskId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'students' | 'groups' | 'tasks' | 'textbook-progress'>(taskId ? 'tasks' : 'students');
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [groups, setGroups] = useState<PersistentGroup[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResults, setTaskResults] = useState<TaskResult[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [sortField, setSortField] = useState<SortField>('lastName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dateFilter] = useState<DateFilter>('this-week');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupsFilter, setShowGroupsFilter] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const loadClassData = () => {
    const data = loadData();
    const cls = data.classes.find(c => c.id === classId);
    setClassData(cls || null);
    const classStudents = data.students.filter(s => s.classId === classId);
    setStudents(classStudents);
    setStudentActivities(data.studentActivities.filter(a =>
      classStudents.some(s => s.id === a.studentId)
    ));
    setGroups(data.persistentGroups.filter(g => g.classId === classId || !g.classId));
    setTasks(data.tasks.filter(t => t.classId === classId));
    setTaskResults(data.taskResults);
  };

  const handleExpandToFullPage = () => {
    if (selectedStudentId) {
      navigate(`/students/${selectedStudentId}`);
      setSelectedStudentId(null);
    }
  };

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const curriculumData: CurriculumData | null = useMemo(() => {
    if (!classId || students.length === 0) return null;
    return generateCurriculumData(classId, students);
  }, [classId, students]);

  const getGroupStudentCount = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.studentIds.length || 0;
  };

  const getStudentGroups = (studentId: string) => {
    return groups.filter(g => g.studentIds.includes(studentId));
  };

  const formatTimeAgo = (date: Date): string => {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diffMs = now - then;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 14) {
      return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    } else {
      return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const formatTimeSpent = (time: { days: number; hours: number; minutes: number }): string => {
    const parts = [];
    if (time.days > 0) parts.push(`${time.days}d`);
    if (time.hours > 0) parts.push(`${time.hours}h`);
    if (time.minutes > 0 || parts.length === 0) parts.push(`${time.minutes}m`);
    return parts.join(' ');
  };

  const getFilteredAndSortedStudents = () => {
    // Filter by selected groups
    let filtered = students;
    if (selectedGroupIds.length > 0) {
      filtered = students.filter(student => {
        const studentGroups = getStudentGroups(student.id);
        const studentGroupIds = [
          `mathspace-${student.mathspaceGroupOverride || student.mathspaceGroup}`,
          ...studentGroups.map(g => g.id)
        ];
        return selectedGroupIds.some(selectedId => studentGroupIds.includes(selectedId));
      });
    }

    // Sort filtered results
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'lastName') {
        comparison = (a.lastName || '').localeCompare(b.lastName || '');
      } else if (sortField === 'firstName') {
        comparison = (a.firstName || '').localeCompare(b.firstName || '');
      } else if (sortField === 'mathspaceGroup') {
        const groupA = a.mathspaceGroupOverride || a.mathspaceGroup;
        const groupB = b.mathspaceGroupOverride || b.mathspaceGroup;
        const order = ['Explorer', 'Adventurer', 'Trailblazer'];
        comparison = order.indexOf(groupA) - order.indexOf(groupB);
      } else if (sortField === 'groups') {
        const groupsA = getStudentGroups(a.id);
        const groupsB = getStudentGroups(b.id);
        comparison = groupsA.length - groupsB.length;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setShowSortMenu(false);
  };

  const toggleGroupFilter = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  if (!classData) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Class Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{classData.name}</h1>
        <p>{students.length} students</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
        <button
          className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups
        </button>
        <button
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
        <button
          className={`tab ${activeTab === 'textbook-progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('textbook-progress')}
        >
          Textbook Progress
        </button>
      </div>

      {activeTab === 'students' && (
        <>
          <div className="activity-filter-row">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="date-filter">
                <button className="date-filter-btn">
                  <img src="/assets/Icons/Calendar.svg" alt="" width="16" height="16" />
                  {dateFilter === 'this-week' ? 'This week' : 'Last 30 days'}
                  <span className="dropdown-arrow">▼</span>
                </button>
              </div>
              <div className="date-filter" style={{ position: 'relative' }}>
                <button
                  className="date-filter-btn"
                  onClick={() => setShowGroupsFilter(!showGroupsFilter)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <circle cx="8" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                  Groups
                  {selectedGroupIds.length > 0 && ` (${selectedGroupIds.length})`}
                  <span className="dropdown-arrow">▼</span>
                </button>
                {showGroupsFilter && (
                  <div className="sort-menu" style={{ minWidth: '250px' }}>
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#5A5A68', textTransform: 'uppercase' }}>
                      Mathspace Groups
                    </div>
                    {['Explorer', 'Adventurer', 'Trailblazer'].map(msGroup => (
                      <button
                        key={msGroup}
                        onClick={() => toggleGroupFilter(`mathspace-${msGroup}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(`mathspace-${msGroup}`)}
                          onChange={() => {}}
                          style={{ width: 'auto' }}
                        />
                        {msGroup}
                      </button>
                    ))}
                    {groups.filter(g => g.classId === classId).length > 0 && (
                      <>
                        <div style={{ borderTop: '1px solid #EBECEC', margin: '0.5rem 0' }} />
                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#5A5A68', textTransform: 'uppercase' }}>
                          Custom Groups
                        </div>
                        {groups.filter(g => g.classId === classId).map(group => (
                          <button
                            key={group.id}
                            onClick={() => toggleGroupFilter(group.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedGroupIds.includes(group.id)}
                              onChange={() => {}}
                              style={{ width: 'auto' }}
                            />
                            <span
                              style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: group.color
                              }}
                            />
                            {group.name}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button className="btn btn-primary assign-task-btn">
              <img src="/assets/Icons/Add.svg" alt="" width="16" height="16" />
              Assign task
            </button>
          </div>

          <div className="activity-table-card">
            <table className="activity-table">
              <thead>
                <tr>
                  <th className="sortable-header">
                    <div className="header-content">
                      <span>Students ({students.length})</span>
                      <button
                        className="sort-button"
                        onClick={() => setShowSortMenu(!showSortMenu)}
                      >
                        ▼
                      </button>
                    </div>
                    {showSortMenu && (
                      <div className="sort-menu">
                        <button onClick={() => handleSort('lastName')}>
                          Last name: A-Z {sortField === 'lastName' && sortDirection === 'asc' && '✓'}
                        </button>
                        <button onClick={() => handleSort('lastName')}>
                          Last name: Z-A {sortField === 'lastName' && sortDirection === 'desc' && '✓'}
                        </button>
                        <button onClick={() => handleSort('firstName')}>
                          First name: A-Z {sortField === 'firstName' && sortDirection === 'asc' && '✓'}
                        </button>
                        <button onClick={() => handleSort('firstName')}>
                          First name: Z-A {sortField === 'firstName' && sortDirection === 'desc' && '✓'}
                        </button>
                        <button onClick={() => handleSort('mathspaceGroup')}>
                          Mathspace group: Explorer-Trailblazer {sortField === 'mathspaceGroup' && sortDirection === 'asc' && '✓'}
                        </button>
                        <button onClick={() => handleSort('mathspaceGroup')}>
                          Mathspace group: Trailblazer-Explorer {sortField === 'mathspaceGroup' && sortDirection === 'desc' && '✓'}
                        </button>
                        <button onClick={() => handleSort('groups')}>
                          Groups: Fewest-Most {sortField === 'groups' && sortDirection === 'asc' && '✓'}
                        </button>
                        <button onClick={() => handleSort('groups')}>
                          Groups: Most-Fewest {sortField === 'groups' && sortDirection === 'desc' && '✓'}
                        </button>
                      </div>
                    )}
                  </th>
                  <th>Groups</th>
                  <th>Summary</th>
                  <th className="icon-header">
                    <Tooltip content="Skills">
                      <img src="/assets/Icons/Outcome-Skill-Star-Fill.svg" alt="Skills" width="16" height="16" className="header-icon skills-icon" />
                    </Tooltip>
                    <span className="header-label">Skills</span>
                  </th>
                  <th className="icon-header">
                    <Tooltip content="Questions">
                      <img src="/assets/Icons/Question-Multiple-Angle.svg" alt="Questions" width="16" height="16" className="header-icon questions-icon" />
                    </Tooltip>
                    <span className="header-label">Questions</span>
                  </th>
                  <th className="icon-header">
                    <Tooltip content="Accuracy">
                      <img src="/assets/Icons/Target-hit.svg" alt="Accuracy" width="16" height="16" className="header-icon accuracy-icon" />
                    </Tooltip>
                    <span className="header-label">Accuracy</span>
                  </th>
                  <th className="icon-header">
                    <Tooltip content="Points">
                      <img src="/assets/Icons/Points.svg" alt="Points" width="16" height="16" className="header-icon points-icon" />
                    </Tooltip>
                    <span className="header-label">Points</span>
                  </th>
                  <th className="icon-header">
                    <Tooltip content="Time spent">
                      <img src="/assets/Icons/Time-Taken-acute.svg" alt="Time spent" width="16" height="16" className="header-icon time-icon" />
                    </Tooltip>
                    <span className="header-label">Time</span>
                  </th>
                  <th className="last-active-header">Last active</th>
                  <th className="sticky-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAndSortedStudents().map(student => {
                  const activity = studentActivities.find(a => a.studentId === student.id);
                  if (!activity) return null;

                  const studentLedCount = activity.studentLedTasks.discoveryCheckins +
                    activity.studentLedTasks.topicReadinessCheckins +
                    activity.studentLedTasks.adaptiveTasks +
                    activity.studentLedTasks.revisions;

                  const teacherAssignedCount = activity.teacherAssignedTasks.topicReadinessCheckins +
                    activity.teacherAssignedTasks.adaptiveTasks +
                    activity.teacherAssignedTasks.customTasks +
                    activity.teacherAssignedTasks.revisions +
                    activity.teacherAssignedTasks.tests;

                  const msGroup = student.mathspaceGroupOverride || student.mathspaceGroup;
                  const studentGroups = getStudentGroups(student.id);

                  return (
                    <tr key={student.id}>
                      <td className="student-cell">
                        <div className="student-avatar-wrapper">
                          <img src={student.avatarUrl} alt={student.name} className="student-avatar" />
                          <img
                            src={`/assets/Mathspace-Groups/${msGroup}.svg`}
                            alt={msGroup}
                            className="mathspace-badge"
                          />
                        </div>
                        <button
                          className="student-name-button"
                          onClick={() => setSelectedStudentId(student.id)}
                        >
                          {student.lastName}, {student.firstName}
                        </button>
                      </td>
                      <td className="groups-cell">
                        <div className="group-chips">
                          {studentGroups.length === 0 ? (
                            <span className="no-groups">-</span>
                          ) : (
                            studentGroups.map(group => (
                              <span
                                key={group.id}
                                className="group-chip"
                                style={{
                                  backgroundColor: `${group.color}20`,
                                  borderColor: group.color,
                                  color: group.color
                                }}
                              >
                                {group.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="summary-pills">
                          <Tooltip
                            content={
                              <div className="summary-tooltip">
                                <div className="tooltip-heading">Student led tasks</div>
                                <div className="tooltip-item">
                                  <img src="/assets/Icons/Task-Checkin.svg" width="16" height="16" alt="" />
                                  {activity.studentLedTasks.discoveryCheckins}
                                </div>
                                <div className="tooltip-item">
                                  <img src="/assets/Icons/Task-Topic-Readiness-Checkin.svg" width="16" height="16" alt="" />
                                  {activity.studentLedTasks.topicReadinessCheckins}
                                </div>
                                <div className="tooltip-item">
                                  <img src="/assets/Icons/Task-Adaptive.svg" width="16" height="16" alt="" />
                                  {activity.studentLedTasks.adaptiveTasks}
                                </div>
                                <div className="tooltip-item">
                                  <img src="/assets/Icons/Revision.svg" width="16" height="16" alt="" />
                                  {activity.studentLedTasks.revisions}
                                </div>
                              </div>
                            }
                          >
                            <div className="summary-pill student-led">
                              <img src="/assets/Icons/Self-directed.svg" width="16" height="16" alt="" />
                              {studentLedCount}
                            </div>
                          </Tooltip>
                          <Tooltip
                            content={
                              <div className="summary-tooltip">
                                <div className="tooltip-heading">Teacher assigned tasks</div>
                                <div className="tooltip-item">
                                  <img src="/assets/Icons/Task-Topic-Readiness-Checkin.svg" width="16" height="16" alt="" />
                                  {activity.teacherAssignedTasks.topicReadinessCheckins}
                                </div>
                                <div className="tooltip-item">
                                  <img src="/assets/Icons/Task-Adaptive.svg" width="16" height="16" alt="" />
                                  {activity.teacherAssignedTasks.adaptiveTasks}
                                </div>
                                <div className="tooltip-item">
                                  <img src="/assets/Icons/Task-Custom.svg" width="16" height="16" alt="" />
                                  {activity.teacherAssignedTasks.customTasks}
                                </div>
                                <div className="tooltip-item">
                                  <img src="/assets/Icons/Revision.svg" width="16" height="16" alt="" />
                                  {activity.teacherAssignedTasks.revisions}
                                </div>
                                <div className="tooltip-item">
                                  <img src="/assets/Icons/Test-mode.svg" width="16" height="16" alt="" />
                                  {activity.teacherAssignedTasks.tests}
                                </div>
                              </div>
                            }
                          >
                            <div className="summary-pill teacher-assigned">
                              <img src="/assets/Icons/Teacher.svg" width="16" height="16" alt="" />
                              {teacherAssignedCount}
                            </div>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="metric-cell">
                        <div className="skills-display">
                          <span className="metric-value">{activity.skills.count}</span>
                          <span className={`skills-change-chip ${activity.skills.change >= 0 ? 'positive' : 'negative'}`}>
                            {activity.skills.change > 0 ? '+' : ''}{activity.skills.change}
                          </span>
                        </div>
                      </td>
                      <td className="metric-cell">
                        <Tooltip
                          content={
                            <div className="questions-tooltip">
                              <div>New questions: {activity.questions.new}</div>
                              <div>Revision cleared: {activity.questions.revisionCleared}</div>
                              <div>Remaining revision: {activity.questions.revisionRemaining}</div>
                            </div>
                          }
                        >
                          <div>{activity.questions.total}</div>
                        </Tooltip>
                      </td>
                      <td className="metric-cell">
                        <Tooltip
                          content={
                            <div className="accuracy-tooltip">
                              <div className="tooltip-item">
                                <img src="/assets/Icons/Check_circle-Correct-Fill.svg" width="16" height="16" alt="" />
                                {activity.accuracy.correct}
                              </div>
                              <div className="tooltip-item">
                                <img src="/assets/Icons/Check-partial.svg" width="16" height="16" alt="" />
                                {activity.accuracy.partial}
                              </div>
                              <div className="tooltip-item">
                                <img src="/assets/Icons/Cancel-incorrect.svg" width="16" height="16" alt="" />
                                {activity.accuracy.incorrect}
                              </div>
                              <div className="tooltip-item">
                                <img src="/assets/Icons/Skip.svg" width="16" height="16" alt="" />
                                {activity.accuracy.skipped}
                              </div>
                            </div>
                          }
                        >
                          <div>{activity.accuracy.percentage}%</div>
                        </Tooltip>
                      </td>
                      <td className="metric-cell">{activity.points}</td>
                      <td className="metric-cell">{formatTimeSpent(activity.timeSpent)}</td>
                      <td className="last-active-cell">{formatTimeAgo(activity.lastActive)}</td>
                      <td className="sticky-actions">
                        <div className="sticker-button">
                          <div className="sticker-count">
                            <img src="/assets/Icons/Cards_star.svg" width="16" height="16" alt="" />
                            {activity.stickersReceived}
                          </div>
                          <div className="sticker-give">
                            <img src="/assets/Pictogram/Stickers.svg" width="24" height="24" alt="" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'groups' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateGroup(true)}
            >
              + Create Group
            </button>
          </div>
          <div className="card">
            {groups.filter(g => g.classId === classId).length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
                No groups created for this class yet. Create your first group to get started.
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Group Name</th>
                    <th>Description</th>
                    <th>Members</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.filter(g => g.classId === classId).map(group => (
                    <tr key={group.id}>
                      <td>
                        <span
                          className="group-pill"
                          style={{
                            backgroundColor: `${group.color}20`,
                            color: group.color
                          }}
                        >
                          {group.name}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        {group.description || '-'}
                      </td>
                      <td>{getGroupStudentCount(group.id)} students</td>
                      <td>
                        {group.tags.map(tag => (
                          <span
                            key={tag}
                            className="badge badge-blue"
                            style={{ marginRight: '0.25rem' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'tasks' && (
        <TasksTabContent
          tasks={tasks}
          taskResults={taskResults}
          classId={classId || ''}
          initialTaskId={taskId}
        />
      )}

      {activeTab === 'textbook-progress' && curriculumData && (
        <TextbookProgressTab curriculumData={curriculumData} />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          preselectedClassId={classId}
          onClose={() => {
            setShowCreateGroup(false);
            loadClassData();
          }}
        />
      )}

      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          onExpandToFullPage={handleExpandToFullPage}
        />
      )}
    </div>
  );
}

interface TasksTabContentProps {
  tasks: Task[];
  taskResults: TaskResult[];
  classId: string;
  initialTaskId?: string;
}

const TASK_TYPE_CONFIG: Record<string, { label: string; color: string; iconSrc: string; iconBg: string }> = {
  'topic-readiness-checkin': {
    label: 'Readiness check',
    color: '#7C6ECC',
    iconSrc: '/assets/Icons/Task-Topic-Readiness-Checkin.svg',
    iconBg: '#F1EEFF',
  },
  'adaptive': {
    label: 'Adaptive',
    color: '#1CB7C8',
    iconSrc: '/assets/Icons/Task-Adaptive.svg',
    iconBg: '#E0F9F7',
  },
  'custom': {
    label: 'Custom',
    color: '#0E7AC2',
    iconSrc: '/assets/Icons/Task-Custom.svg',
    iconBg: '#E0F2FF',
  },
  'test': {
    label: 'Test',
    color: '#D5424D',
    iconSrc: '/assets/Icons/Task-Topic-Test.svg',
    iconBg: '#FDEBED',
  },
  'revision': {
    label: 'Revision',
    color: '#16A188',
    iconSrc: '/assets/Icons/Revision.svg',
    iconBg: '#E8FBF6',
  },
};

const GROUP_PALETTE = [
  { bg: '#F1EEFF', color: '#3C2C7F' },
  { bg: '#FDEBB8', color: '#754800' },
  { bg: '#C6F7ED', color: '#005048' },
  { bg: '#BDE6FF', color: '#004F85' },
];

function getTaskStats(taskId: string, taskResults: TaskResult[]) {
  const result = taskResults.find(r => r.taskId === taskId);
  if (!result) return { completed: 0, total: 0, avgScore: 0 };
  const completed = result.perStudent.filter(s => s.status === 'Completed').length;
  const total = result.perStudent.length;
  const completedResults = result.perStudent.filter(s => s.status === 'Completed');
  const avgScore = completedResults.length > 0
    ? Math.round(completedResults.reduce((sum, s) => sum + s.score, 0) / completedResults.length)
    : 0;
  return { completed, total, avgScore };
}

function getGroupStats(taskId: string, groupStudentIds: string[], taskResults: TaskResult[]) {
  const result = taskResults.find(r => r.taskId === taskId);
  if (!result) return { completed: 0, total: groupStudentIds.length, avgScore: 0 };
  const groupResults = result.perStudent.filter(s => groupStudentIds.includes(s.studentId));
  const completed = groupResults.filter(s => s.status === 'Completed').length;
  const total = groupStudentIds.length;
  const completedResults = groupResults.filter(s => s.status === 'Completed');
  const avgScore = completedResults.length > 0
    ? Math.round(completedResults.reduce((sum, s) => sum + s.score, 0) / completedResults.length)
    : 0;
  return { completed, total, avgScore };
}

function getTaskRowStatus(task: Task): { label: string; variant: string } {
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const expiryDate = task.expiryDate ? new Date(task.expiryDate) : null;

  if (task.taskGroups && task.taskGroups.length > 0) {
    const activeCount = task.taskGroups.filter(g => {
      const gExpiry = g.expiryDate ? new Date(g.expiryDate) : null;
      return !gExpiry || now <= gExpiry;
    }).length;
    const total = task.taskGroups.length;
    if (activeCount === 0) return { label: 'Complete', variant: 'complete' };
    if (activeCount === total) return { label: `${activeCount}/${total} Active`, variant: 'active' };
    return { label: `${activeCount}/${total} Active`, variant: 'mixed' };
  }

  if (expiryDate && now > expiryDate) return { label: 'Complete', variant: 'complete' };
  if (task.status === 'expired') return { label: 'Complete', variant: 'complete' };
  if (now > dueDate && expiryDate && now <= expiryDate) return { label: 'Extension', variant: 'extension' };
  return { label: 'Active', variant: 'active' };
}

function getGroupRowStatus(group: TaskGroup): { label: string; variant: string } {
  const now = new Date();
  const dueDate = new Date(group.dueDate);
  const expiryDate = group.expiryDate ? new Date(group.expiryDate) : null;

  if (expiryDate && now > expiryDate) {
    if (group.resultsLocked) return { label: 'Results locked', variant: 'locked' };
    return { label: 'Complete', variant: 'complete' };
  }
  if (now > dueDate && expiryDate && now <= expiryDate) return { label: 'Extension', variant: 'extension' };
  return { label: 'Active', variant: 'active' };
}

function formatTaskDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ label, variant }: { label: string; variant: string }) {
  return (
    <span className={`tl-status tl-status--${variant}`}>
      {variant === 'active' || variant === 'mixed' ? (
        <span className="tl-status-dot" />
      ) : variant === 'complete' ? (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : variant === 'extension' ? (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.5 3V5.5L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ) : variant === 'locked' ? (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <rect x="2" y="5" width="7" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3.5 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ) : null}
      {label}
    </span>
  );
}

function ResultBadge({ score }: { score: number }) {
  if (score <= 0) return <span className="tl-dash">—</span>;
  const variant = score >= 70 ? 'good' : score >= 40 ? 'mid' : 'low';
  return <span className={`tl-result tl-result--${variant}`}>{score}%</span>;
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="tl-progress">
      <div className="tl-progress-track">
        <div className="tl-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="tl-progress-pct">{pct}%</span>
    </div>
  );
}

function TasksTable({
  taskList,
  title,
  taskResults,
  expandedTaskIds,
  onToggleExpand,
  onOpenTask,
}: {
  taskList: Task[];
  title: string;
  taskResults: TaskResult[];
  expandedTaskIds: Set<string>;
  onToggleExpand: (taskId: string, e: React.MouseEvent) => void;
  onOpenTask: (taskId: string) => void;
}) {
  if (taskList.length === 0) return null;

  return (
    <div className="tasks-section">
      <h3 className="tasks-section-heading">{title} ({taskList.length})</h3>
      <div className="tl-card">
        <div className="tl-scroll">
          <table className="tl-table">
            <thead>
              <tr>
                <th className="tl-th tl-th--name">Tasks ({taskList.length})</th>
                <th className="tl-th">Task type</th>
                <th className="tl-th">Progress</th>
                <th className="tl-th tl-th--center">Participation</th>
                <th className="tl-th tl-th--center">Results</th>
                <th className="tl-th tl-th--center">Revision</th>
                <th className="tl-th tl-th--center">
                  <img src="/assets/Icons/Time-Taken-acute.svg" width="15" height="15" alt="Time" style={{ verticalAlign: 'middle', opacity: 0.55 }} />
                </th>
                <th className="tl-th">Status</th>
                <th className="tl-th tl-th--date">Task start</th>
                <th className="tl-th tl-th--date">Task due</th>
                <th className="tl-th tl-th--date">Task expire</th>
              </tr>
            </thead>
            <tbody>
              {taskList.map(task => {
                const type = TASK_TYPE_CONFIG[task.taskType || 'custom'] || TASK_TYPE_CONFIG['custom'];
                const stats = getTaskStats(task.id, taskResults);
                const status = getTaskRowStatus(task);
                const hasGroups = !!(task.taskGroups && task.taskGroups.length > 0);
                const isExpanded = expandedTaskIds.has(task.id);
                const progressPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                const estTime = Math.round((task.questionsCount || 10) * 1.5);

                return (
                  <Fragment key={task.id}>
                    {/* ── Parent row ── */}
                    <tr className={`tl-row ${hasGroups ? 'tl-row--expandable' : ''} ${isExpanded ? 'tl-row--expanded' : ''}`}>
                      <td className="tl-td tl-td--name">
                        <div className="tl-name-cell">
                          {hasGroups ? (
                            <button
                              className={`tl-chevron ${isExpanded ? 'tl-chevron--open' : ''}`}
                              onClick={e => onToggleExpand(task.id, e)}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Collapse groups' : 'Expand groups'}
                            >
                              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                                <path d="M2.5 1.5L6.5 4.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          ) : (
                            <span className="tl-chevron-spacer" aria-hidden="true" />
                          )}
                          <span className="tl-task-icon" style={{ background: type.iconBg }}>
                            <img src={type.iconSrc} width="14" height="14" alt="" />
                          </span>
                          <button className="task-name-link" onClick={() => onOpenTask(task.id)}>
                            {task.title}
                          </button>
                        </div>
                      </td>
                      <td className="tl-td">
                        <span className="tl-type-chip" style={{ background: `${type.color}18`, color: type.color }}>
                          {type.label}
                        </span>
                      </td>
                      <td className="tl-td tl-td--progress">
                        {hasGroups
                          ? <span className="tl-avg-label">AVG {progressPct}%</span>
                          : <ProgressBar pct={progressPct} />}
                      </td>
                      <td className="tl-td tl-td--center">
                        <span className="tl-participation">{stats.completed}/{stats.total}</span>
                      </td>
                      <td className="tl-td tl-td--center">
                        {hasGroups && stats.avgScore > 0
                          ? <span className="tl-avg-label">Avg {stats.avgScore}%</span>
                          : <ResultBadge score={stats.avgScore} />}
                      </td>
                      <td className="tl-td tl-td--center"><span className="tl-dash">—</span></td>
                      <td className="tl-td tl-td--center"><span className="tl-time">{estTime}m</span></td>
                      <td className="tl-td"><StatusBadge label={status.label} variant={status.variant} /></td>
                      <td className="tl-td tl-td--date">{formatTaskDate(task.startDate)}</td>
                      <td className="tl-td tl-td--date">{formatTaskDate(task.dueDate)}</td>
                      <td className="tl-td tl-td--date">{formatTaskDate(task.expiryDate)}</td>
                    </tr>

                    {/* ── Group sub-rows (expanded) ── */}
                    {hasGroups && isExpanded && task.taskGroups!.map((group, idx) => {
                      const gStats = getGroupStats(task.id, group.studentIds, taskResults);
                      const gStatus = getGroupRowStatus(group);
                      const gPct = gStats.total > 0 ? Math.round((gStats.completed / gStats.total) * 100) : 0;
                      const palette = GROUP_PALETTE[idx % GROUP_PALETTE.length];

                      return (
                        <tr key={group.id} className="tl-group-row">
                          <td className="tl-td tl-td--name">
                            <div className="tl-name-cell tl-name-cell--group">
                              <span className="tl-chevron-spacer" aria-hidden="true" />
                              <span className="tl-task-icon-spacer" aria-hidden="true" />
                              <span
                                className="tl-group-chip"
                                style={{ background: palette.bg, color: palette.color }}
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                  <circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                                  <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                                  <circle cx="8" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                {group.name}
                              </span>
                            </div>
                          </td>
                          <td className="tl-td" />
                          <td className="tl-td tl-td--progress"><ProgressBar pct={gPct} /></td>
                          <td className="tl-td tl-td--center">
                            <span className="tl-participation">{gStats.completed}/{gStats.total}</span>
                          </td>
                          <td className="tl-td tl-td--center"><ResultBadge score={gStats.avgScore} /></td>
                          <td className="tl-td tl-td--center"><span className="tl-dash">—</span></td>
                          <td className="tl-td tl-td--center"><span className="tl-time">{estTime}m</span></td>
                          <td className="tl-td"><StatusBadge label={gStatus.label} variant={gStatus.variant} /></td>
                          <td className="tl-td tl-td--date">{formatTaskDate(group.startDate)}</td>
                          <td className="tl-td tl-td--date">{formatTaskDate(group.dueDate)}</td>
                          <td className="tl-td tl-td--date">{formatTaskDate(group.expiryDate)}</td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TasksTabContent({ tasks, taskResults, classId, initialTaskId }: TasksTabContentProps) {
  const navigate = useNavigate();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId ?? null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  const openTask = (taskId: string) => {
    navigate(`/classes/${classId}/tasks/${taskId}`);
    setSelectedTaskId(taskId);
  };

  const closeTask = () => {
    navigate(`/classes/${classId}`);
    setSelectedTaskId(null);
  };

  const toggleExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const now = new Date();
  const currentTasks = tasks.filter(t => new Date(t.dueDate) >= now);
  const historicTasks = tasks.filter(t => new Date(t.dueDate) < now);

  return (
    <>
      <TasksTable
        taskList={currentTasks}
        title="Current Tasks"
        taskResults={taskResults}
        expandedTaskIds={expandedTaskIds}
        onToggleExpand={toggleExpand}
        onOpenTask={openTask}
      />

      {historicTasks.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <TasksTable
            taskList={historicTasks}
            title="Past Tasks"
            taskResults={taskResults}
            expandedTaskIds={expandedTaskIds}
            onToggleExpand={toggleExpand}
            onOpenTask={openTask}
          />
        </div>
      )}

      {selectedTaskId && (
        <TaskDetailSheet
          taskId={selectedTaskId}
          onClose={closeTask}
        />
      )}
    </>
  );
}
