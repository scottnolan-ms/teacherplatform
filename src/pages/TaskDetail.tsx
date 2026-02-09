import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadData } from '../data/storage';
import type { Task, Class, TaskResult } from '../types';

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);

  useEffect(() => {
    const data = loadData();
    const t = data.tasks.find(task => task.id === taskId);
    setTask(t || null);

    if (t) {
      const cls = data.classes.find(c => c.id === t.classId);
      setClassData(cls || null);

      const result = data.taskResults.find(r => r.taskId === taskId);
      setTaskResult(result || null);
    }
  }, [taskId]);

  if (!task) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Task Not Found</h1>
        </div>
      </div>
    );
  }

  const completedCount = taskResult?.perStudent.filter(s => s.status === 'Completed').length || 0;
  const totalCount = taskResult?.perStudent.length || 0;
  const averageScore = taskResult
    ? Math.round(taskResult.perStudent.reduce((sum, s) => sum + s.score, 0) / taskResult.perStudent.length)
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{task.title}</h1>
        <p>
          <Link to={`/classes/${classData?.id}`} style={{ color: '#3b82f6' }}>
            {classData?.name}
          </Link>
          {' • '}
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      </div>

      <div className="card">
        <h3>Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {completedCount}/{totalCount}
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
              {task.assignments.length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Group Assignments</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Assignments by Group</h3>
        {task.assignments.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
            No group assignments configured for this task.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Type</th>
                <th>Question Set</th>
              </tr>
            </thead>
            <tbody>
              {task.assignments.map((assignment, i) => {
                const data = loadData();
                const questionSet = data.questionSets.find(qs => qs.id === assignment.questionSetId);

                return (
                  <tr key={i}>
                    <td>
                      <span className="badge badge-blue">{assignment.groupName}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem', color: '#64748b', textTransform: 'capitalize' }}>
                        {assignment.groupType}
                      </span>
                    </td>
                    <td>{questionSet?.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <Link to={`/tasks/${task.id}/report`} className="btn btn-primary">
          View Full Report
        </Link>
      </div>
    </div>
  );
}
