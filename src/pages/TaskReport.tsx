import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadData } from '../data/storage';
import type { Task, Class, TaskResult, Student, PersistentGroup, MathspaceGroup } from '../types';

type FilterType = 'all' | 'mathspace' | 'persistent' | 'temporary';

export default function TaskReport() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [persistentGroups, setPersistentGroups] = useState<PersistentGroup[]>([]);

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  useEffect(() => {
    const data = loadData();
    const t = data.tasks.find(task => task.id === taskId);
    setTask(t || null);

    if (t) {
      const cls = data.classes.find(c => c.id === t.classId);
      setClassData(cls || null);

      const result = data.taskResults.find(r => r.taskId === taskId);
      setTaskResult(result || null);

      setStudents(data.students.filter(s => s.classId === t.classId));
      setPersistentGroups(data.persistentGroups);
    }
  }, [taskId]);

  const getMathspaceGroupColor = (group: MathspaceGroup) => {
    switch (group) {
      case 'Explorer': return '#10b981';
      case 'Adventurer': return '#f59e0b';
      case 'Trailblazer': return '#8b5cf6';
    }
  };

  const getFilteredStudents = () => {
    if (filterType === 'all' || !selectedGroupId) {
      return students;
    }

    if (filterType === 'mathspace') {
      return students.filter(s =>
        (s.mathspaceGroupOverride || s.mathspaceGroup) === selectedGroupId
      );
    } else if (filterType === 'persistent') {
      const group = persistentGroups.find(g => g.id === selectedGroupId);
      return students.filter(s => group?.studentIds.includes(s.id));
    } else if (filterType === 'temporary') {
      const tempGroup = task?.temporaryGroups?.find(g => g.id === selectedGroupId);
      return students.filter(s => tempGroup?.studentIds.includes(s.id));
    }

    return students;
  };

  const filteredStudents = getFilteredStudents();
  const filteredResults = taskResult?.perStudent.filter(r =>
    filteredStudents.find(s => s.id === r.studentId)
  ) || [];

  const completedCount = filteredResults.filter(s => s.status === 'Completed').length;
  const averageScore = filteredResults.length > 0
    ? Math.round(filteredResults.reduce((sum, s) => sum + s.score, 0) / filteredResults.length)
    : 0;

  // Group comparison data
  const mathspaceGroups: MathspaceGroup[] = ['Explorer', 'Adventurer', 'Trailblazer'];
  const mathspaceComparison = mathspaceGroups.map(groupName => {
    const groupStudents = students.filter(s =>
      (s.mathspaceGroupOverride || s.mathspaceGroup) === groupName
    );
    const groupResults = taskResult?.perStudent.filter(r =>
      groupStudents.find(s => s.id === r.studentId)
    ) || [];
    const completed = groupResults.filter(r => r.status === 'Completed').length;
    const avgScore = groupResults.length > 0
      ? Math.round(groupResults.reduce((sum, r) => sum + r.score, 0) / groupResults.length)
      : 0;

    return {
      name: groupName,
      count: groupStudents.length,
      completed,
      averageScore: avgScore
    };
  });

  if (!task || !taskResult) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Task Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1>{task.title} - Report</h1>
            <p>
              <Link to={`/classes/${classData?.id}`} style={{ color: '#3b82f6' }}>
                {classData?.name}
              </Link>
              {' • '}
              <Link to={`/tasks/${task.id}`} style={{ color: '#3b82f6' }}>
                Back to Task
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Summary {filterType !== 'all' && '(Filtered)'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {completedCount}/{filteredResults.length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Completed</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {averageScore}%
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Average Score</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              {filteredStudents.length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Students</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Group Type</label>
            <select
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value as FilterType);
                setSelectedGroupId('');
              }}
            >
              <option value="all">All Students</option>
              <option value="mathspace">Mathspace Groups</option>
              <option value="persistent">Persistent Custom Groups</option>
              <option value="temporary">Temporary Groups</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Specific Group</label>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              disabled={filterType === 'all'}
            >
              <option value="">Select a group...</option>
              {filterType === 'mathspace' && mathspaceGroups.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
              {filterType === 'persistent' && persistentGroups
                .filter(g => !g.classId || g.classId === task.classId)
                .map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              {filterType === 'temporary' && task.temporaryGroups?.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Mathspace Group Comparison</h3>
        <table className="table" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Group</th>
              <th>Students</th>
              <th>Completed</th>
              <th>Avg Score</th>
              <th>Assignment</th>
            </tr>
          </thead>
          <tbody>
            {mathspaceComparison.map(group => {
              const assignment = task.assignments.find(
                a => a.groupType === 'mathspace' && a.groupId === group.name
              );
              const questionSet = assignment
                ? loadData().questionSets.find(qs => qs.id === assignment.questionSetId)
                : null;

              return (
                <tr key={group.name}>
                  <td>
                    <span
                      className="group-pill"
                      style={{
                        backgroundColor: `${getMathspaceGroupColor(group.name as MathspaceGroup)}20`,
                        color: getMathspaceGroupColor(group.name as MathspaceGroup)
                      }}
                    >
                      {group.name}
                    </span>
                  </td>
                  <td>{group.count}</td>
                  <td>{group.completed}/{group.count}</td>
                  <td>{group.averageScore}%</td>
                  <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {questionSet?.name || 'None'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Student Results {filterType !== 'all' && '(Filtered)'}</h3>
        <table className="table" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Mathspace Group</th>
              <th>Status</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => {
              const result = taskResult.perStudent.find(r => r.studentId === student.id);
              if (!result) return null;

              return (
                <tr key={student.id}>
                  <td>
                    <Link to={`/students/${student.id}`} style={{ fontWeight: 500, color: '#3b82f6' }}>
                      {student.name}
                    </Link>
                  </td>
                  <td>
                    <span
                      className="group-pill"
                      style={{
                        backgroundColor: `${getMathspaceGroupColor(student.mathspaceGroupOverride || student.mathspaceGroup)}20`,
                        color: getMathspaceGroupColor(student.mathspaceGroupOverride || student.mathspaceGroup)
                      }}
                    >
                      {student.mathspaceGroupOverride || student.mathspaceGroup}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        result.status === 'Completed'
                          ? 'badge-green'
                          : result.status === 'In Progress'
                          ? 'badge-yellow'
                          : 'badge-red'
                      }`}
                    >
                      {result.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{result.score}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
