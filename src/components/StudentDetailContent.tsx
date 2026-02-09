import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadData, updateStudent, addStudentToGroup, removeStudentFromGroup, saveData } from '../data/storage';
import type { Student, Class, PersistentGroup, MathspaceGroup } from '../types';

interface StudentDetailContentProps {
  studentId: string;
  isCompact?: boolean;
}

export default function StudentDetailContent({ studentId, isCompact = false }: StudentDetailContentProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [studentGroups, setStudentGroups] = useState<PersistentGroup[]>([]);
  const [allGroups, setAllGroups] = useState<PersistentGroup[]>([]);
  const [showAddToGroup, setShowAddToGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadStudentData = () => {
    const data = loadData();
    const stu = data.students.find(s => s.id === studentId);
    setStudent(stu || null);

    if (stu) {
      const cls = data.classes.find(c => c.id === stu.classId);
      setClassData(cls || null);
      setStudentGroups(data.persistentGroups.filter(g => g.studentIds.includes(stu.id)));
      setAllGroups(data.persistentGroups.filter(g =>
        !g.classId || g.classId === stu.classId
      ));
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const handleMathspaceGroupChange = (newGroup: MathspaceGroup) => {
    if (!student) return;
    updateStudent(student.id, { mathspaceGroupOverride: newGroup });
    loadStudentData();
  };

  const handleAddToGroups = (groupIds: string[]) => {
    if (!student) return;
    groupIds.forEach(groupId => {
      if (!studentGroups.find(g => g.id === groupId)) {
        addStudentToGroup(student.id, groupId);
      }
    });
    setShowAddToGroup(false);
    loadStudentData();
  };

  const handleRemoveFromGroup = (groupId: string) => {
    if (!student) return;
    if (confirm('Remove student from this group?')) {
      removeStudentFromGroup(student.id, groupId);
      loadStudentData();
    }
  };

  const getMathspaceGroupColor = (group: MathspaceGroup) => {
    switch (group) {
      case 'Explorer': return '#10b981';
      case 'Adventurer': return '#f59e0b';
      case 'Trailblazer': return '#8b5cf6';
    }
  };

  const availableGroups = allGroups.filter(g =>
    !studentGroups.find(sg => sg.id === g.id) &&
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!student) {
    return (
      <div className="student-detail-empty">
        <h2>Student Not Found</h2>
        <p>The requested student could not be found.</p>
      </div>
    );
  }

  return (
    <div className={`student-detail-content ${isCompact ? 'compact' : ''}`}>
      {!isCompact && (
        <div className="student-detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="student-detail-avatar"
            />
            <div>
              <h2 style={{ margin: 0 }}>{student.name}</h2>
              <Link to={`/classes/${classData?.id}`} className="student-class-link">
                {classData?.name}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Mathspace Group</h3>
        <div style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>Current Group</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                className="group-pill"
                style={{
                  backgroundColor: `${getMathspaceGroupColor(student.mathspaceGroupOverride || student.mathspaceGroup)}20`,
                  color: getMathspaceGroupColor(student.mathspaceGroupOverride || student.mathspaceGroup)
                }}
              >
                {student.mathspaceGroupOverride || student.mathspaceGroup}
                {student.mathspaceGroupOverride && ' (Override)'}
              </span>
              {student.mathspaceGroupOverride && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  onClick={() => {
                    const data = loadData();
                    const stu = data.students.find(s => s.id === student.id);
                    if (stu) {
                      delete stu.mathspaceGroupOverride;
                      saveData(data);
                      loadStudentData();
                    }
                  }}
                >
                  Remove Override
                </button>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Override Placement</label>
            <select
              value={student.mathspaceGroupOverride || ''}
              onChange={e => handleMathspaceGroupChange(e.target.value as MathspaceGroup)}
              style={{ maxWidth: '300px' }}
            >
              <option value="">Use system placement ({student.mathspaceGroup})</option>
              <option value="Explorer">Explorer</option>
              <option value="Adventurer">Adventurer</option>
              <option value="Trailblazer">Trailblazer</option>
            </select>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Override the system's Mathspace Group assignment for this student.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Custom Groups</h3>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddToGroup(true)}
          >
            + Add to Group
          </button>
        </div>
        {studentGroups.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
            This student is not in any custom groups yet.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Description</th>
                <th>Scope</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {studentGroups.map(group => (
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
                  <td>
                    <span className="badge badge-blue">
                      {group.classId ? classData?.name : 'Cross-class'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                      onClick={() => handleRemoveFromGroup(group.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddToGroup && (
        <AddToGroupModal
          availableGroups={availableGroups}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAdd={handleAddToGroups}
          onClose={() => {
            setShowAddToGroup(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
}

interface AddToGroupModalProps {
  availableGroups: PersistentGroup[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAdd: (groupIds: string[]) => void;
  onClose: () => void;
}

function AddToGroupModal({ availableGroups, searchTerm, onSearchChange, onAdd, onClose }: AddToGroupModalProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const handleToggle = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add to Groups</h2>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Search Groups</label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search by group name..."
            />
          </div>
          <div className="form-group">
            <label>Available Groups ({selectedGroupIds.length} selected)</label>
            <div className="checkbox-list">
              {availableGroups.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                  No groups available. Student is already in all applicable groups.
                </p>
              ) : (
                availableGroups.map(group => (
                  <label key={group.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(group.id)}
                      onChange={() => handleToggle(group.id)}
                    />
                    <span
                      className="group-pill"
                      style={{
                        backgroundColor: `${group.color}20`,
                        color: group.color
                      }}
                    >
                      {group.name}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>
                      {group.studentIds.length} members
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onAdd(selectedGroupIds)}
            disabled={selectedGroupIds.length === 0}
          >
            Add to {selectedGroupIds.length} Group{selectedGroupIds.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
