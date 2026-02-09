import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadData, createTask } from '../data/storage';
import type { Class, Student, PersistentGroup, QuestionSet, Task, TaskAssignment, TemporaryGroup, MathspaceGroup } from '../types';
import CreateGroupModal from '../components/CreateGroupModal';
import CreateTemporaryGroupModal from '../components/CreateTemporaryGroupModal';

const MATHSPACE_GROUPS: MathspaceGroup[] = ['Explorer', 'Adventurer', 'Trailblazer'];

export default function CreateTask() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: Basics
  const [title, setTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);

  // Step 2: Targeting
  const [students, setStudents] = useState<Student[]>([]);
  const [persistentGroups, setPersistentGroups] = useState<PersistentGroup[]>([]);
  const [temporaryGroups, setTemporaryGroups] = useState<TemporaryGroup[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [autoAssign, setAutoAssign] = useState(false);
  const [showCreatePersistent, setShowCreatePersistent] = useState(false);
  const [showCreateTemporary, setShowCreateTemporary] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    const data = loadData();
    setClasses(data.classes);
    setQuestionSets(data.questionSets);
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const data = loadData();
      setStudents(data.students.filter(s => s.classId === selectedClassId));
      setPersistentGroups(data.persistentGroups.filter(g =>
        !g.classId || g.classId === selectedClassId
      ));
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (autoAssign && selectedClassId && assignments.length === 0) {
      const defaultAssignments: TaskAssignment[] = [
        {
          groupId: 'Explorer',
          groupType: 'mathspace',
          groupName: 'Explorer',
          questionSetId: 'qs-a'
        },
        {
          groupId: 'Adventurer',
          groupType: 'mathspace',
          groupName: 'Adventurer',
          questionSetId: 'qs-b'
        },
        {
          groupId: 'Trailblazer',
          groupType: 'mathspace',
          groupName: 'Trailblazer',
          questionSetId: 'qs-c'
        }
      ];
      setAssignments(defaultAssignments);
    }
  }, [autoAssign, selectedClassId]);

  const handleAssignmentChange = (groupId: string, groupType: 'mathspace' | 'persistent' | 'temporary', groupName: string, questionSetId: string) => {
    setAssignments(prev => {
      const existing = prev.find(a => a.groupId === groupId && a.groupType === groupType);
      if (existing) {
        return prev.map(a =>
          a.groupId === groupId && a.groupType === groupType
            ? { ...a, questionSetId }
            : a
        );
      } else {
        return [...prev, { groupId, groupType, groupName, questionSetId }];
      }
    });
  };

  const handleCreateTask = () => {
    if (!title.trim() || !selectedClassId || !dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      classId: selectedClassId,
      dueDate,
      assignments,
      temporaryGroups: temporaryGroups.length > 0 ? temporaryGroups : undefined,
      createdAt: new Date().toISOString()
    };

    createTask(newTask);
    navigate(`/tasks/${newTask.id}`);
  };

  const getGroupMembers = (groupId: string, groupType: 'mathspace' | 'persistent' | 'temporary'): Student[] => {
    if (groupType === 'mathspace') {
      return students.filter(s =>
        (s.mathspaceGroupOverride || s.mathspaceGroup) === groupId
      );
    } else if (groupType === 'persistent') {
      const group = persistentGroups.find(g => g.id === groupId);
      return students.filter(s => group?.studentIds.includes(s.id));
    } else {
      const group = temporaryGroups.find(g => g.id === groupId);
      return students.filter(s => group?.studentIds.includes(s.id));
    }
  };

  const getMathspaceGroupColor = (group: MathspaceGroup) => {
    switch (group) {
      case 'Explorer': return '#10b981';
      case 'Adventurer': return '#f59e0b';
      case 'Trailblazer': return '#8b5cf6';
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Create Task</h1>
        <p>Step {step} of 3</p>
      </div>

      {step === 1 && (
        <div className="card">
          <h3>Task Basics</h3>
          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Week 5 Algebra Practice"
            />
          </div>
          <div className="form-group">
            <label>Class *</label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="">Select a class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => setStep(2)}
              disabled={!title.trim() || !selectedClassId || !dueDate}
            >
              Next: Targeting
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Mathspace Auto-Assign</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoAssign}
                  onChange={e => setAutoAssign(e.target.checked)}
                />
                <span>Enable auto-assign by Mathspace Groups</span>
              </label>
            </div>
            {autoAssign && (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Automatically assigns foundation content to Explorer, standard to Adventurer, and advanced to Trailblazer.
              </p>
            )}
          </div>

          <div className="card">
            <h3>A. Mathspace Groups</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
              System-defined groups based on student performance
            </p>
            {MATHSPACE_GROUPS.map(groupName => {
              const members = getGroupMembers(groupName, 'mathspace');
              const assignment = assignments.find(a => a.groupId === groupName && a.groupType === 'mathspace');
              const isExpanded = expandedGroup === `mathspace-${groupName}`;

              return (
                <div key={groupName} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.375rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span
                      className="group-pill"
                      style={{
                        backgroundColor: `${getMathspaceGroupColor(groupName)}20`,
                        color: getMathspaceGroupColor(groupName)
                      }}
                    >
                      {groupName}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {members.length} students
                    </span>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginLeft: 'auto' }}
                      onClick={() => setExpandedGroup(isExpanded ? null : `mathspace-${groupName}`)}
                    >
                      {isExpanded ? 'Hide' : 'Show'} Members
                    </button>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.25rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      {members.map(s => s.name).join(', ')}
                    </div>
                  )}
                  <select
                    value={assignment?.questionSetId || ''}
                    onChange={e => handleAssignmentChange(groupName, 'mathspace', groupName, e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">No assignment</option>
                    {questionSets.map(qs => (
                      <option key={qs.id} value={qs.id}>
                        {qs.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="card">
            <h3>B. Persistent Custom Groups</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Reusable groups you've created
            </p>
            {persistentGroups.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                No custom groups available for this class.
              </p>
            ) : (
              persistentGroups.map(group => {
                const members = getGroupMembers(group.id, 'persistent');
                const assignment = assignments.find(a => a.groupId === group.id && a.groupType === 'persistent');
                const isExpanded = expandedGroup === `persistent-${group.id}`;

                return (
                  <div key={group.id} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.375rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <span
                        className="group-pill"
                        style={{
                          backgroundColor: `${group.color}20`,
                          color: group.color
                        }}
                      >
                        {group.name}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {members.length} students
                      </span>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginLeft: 'auto' }}
                        onClick={() => setExpandedGroup(isExpanded ? null : `persistent-${group.id}`)}
                      >
                        {isExpanded ? 'Hide' : 'Show'} Members
                      </button>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.25rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        {members.map(s => s.name).join(', ')}
                      </div>
                    )}
                    <select
                      value={assignment?.questionSetId || ''}
                      onChange={e => handleAssignmentChange(group.id, 'persistent', group.name, e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="">No assignment</option>
                      {questionSets.map(qs => (
                        <option key={qs.id} value={qs.id}>
                          {qs.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setShowCreatePersistent(true)}
              style={{ marginTop: '0.5rem' }}
            >
              + Create Persistent Group
            </button>
          </div>

          <div className="card">
            <h3>C. Temporary Groups</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Single-use groups for this task only
            </p>
            {temporaryGroups.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                No temporary groups created yet.
              </p>
            ) : (
              temporaryGroups.map(group => {
                const members = getGroupMembers(group.id, 'temporary');
                const assignment = assignments.find(a => a.groupId === group.id && a.groupType === 'temporary');
                const isExpanded = expandedGroup === `temporary-${group.id}`;

                return (
                  <div key={group.id} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.375rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <span
                        className="group-pill"
                        style={{
                          backgroundColor: `${group.color || '#64748b'}20`,
                          color: group.color || '#64748b'
                        }}
                      >
                        {group.name}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {members.length} students
                      </span>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginLeft: 'auto' }}
                        onClick={() => setExpandedGroup(isExpanded ? null : `temporary-${group.id}`)}
                      >
                        {isExpanded ? 'Hide' : 'Show'} Members
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => setTemporaryGroups(prev => prev.filter(g => g.id !== group.id))}
                      >
                        Delete
                      </button>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.25rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        {members.map(s => s.name).join(', ')}
                      </div>
                    )}
                    <select
                      value={assignment?.questionSetId || ''}
                      onChange={e => handleAssignmentChange(group.id, 'temporary', group.name, e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="">No assignment</option>
                      {questionSets.map(qs => (
                        <option key={qs.id} value={qs.id}>
                          {qs.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setShowCreateTemporary(true)}
              style={{ marginTop: '0.5rem' }}
            >
              + Create Temporary Group
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              Next: Review
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="card">
            <h3>Review Task</h3>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Title:</strong> {title}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Class:</strong> {classes.find(c => c.id === selectedClassId)?.name}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Due Date:</strong> {dueDate}
              </div>
              <div>
                <strong>Assignments:</strong>
                {assignments.length === 0 ? (
                  <p style={{ color: '#64748b', marginTop: '0.5rem' }}>No assignments configured</p>
                ) : (
                  <ul style={{ marginTop: '0.5rem' }}>
                    {assignments.map((a, i) => (
                      <li key={i}>
                        {a.groupName} → {questionSets.find(qs => qs.id === a.questionSetId)?.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <button className="btn btn-primary" onClick={handleCreateTask}>
              Create Task
            </button>
          </div>
        </>
      )}

      {showCreatePersistent && (
        <CreateGroupModal
          preselectedClassId={selectedClassId}
          onClose={() => setShowCreatePersistent(false)}
          onCreated={(group) => {
            setPersistentGroups([...persistentGroups, group]);
            setShowCreatePersistent(false);
          }}
        />
      )}

      {showCreateTemporary && (
        <CreateTemporaryGroupModal
          students={students}
          onClose={() => setShowCreateTemporary(false)}
          onCreated={(group) => {
            setTemporaryGroups([...temporaryGroups, group]);
            setShowCreateTemporary(false);
          }}
        />
      )}
    </div>
  );
}
