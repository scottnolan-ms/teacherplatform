import { useState, useEffect } from 'react';
import { loadData, createPersistentGroup } from '../data/storage';
import type { PersistentGroup, Student, Class } from '../types';

interface CreateGroupModalProps {
  preselectedClassId?: string;
  onClose: () => void;
  onCreated?: (group: PersistentGroup) => void;
}

export default function CreateGroupModal({ preselectedClassId, onClose, onCreated }: CreateGroupModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [tags, setTags] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  useEffect(() => {
    const data = loadData();
    setClasses(data.classes);
    setStudents(data.students);
  }, []);

  useEffect(() => {
    const data = loadData();
    const existingGroup = data.persistentGroups.find(
      g => g.name.toLowerCase() === name.toLowerCase()
    );
    setDuplicateWarning(!!existingGroup);
  }, [name]);

  const availableStudents = selectedClassId
    ? students.filter(s => s.classId === selectedClassId)
    : students;

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a group name');
      return;
    }

    const newGroup: PersistentGroup = {
      id: `group-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      color,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      type: 'persistent',
      classId: selectedClassId || undefined,
      studentIds: selectedStudentIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    createPersistentGroup(newGroup);
    if (onCreated) {
      onCreated(newGroup);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Custom Group</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
            Step {step} of 3
          </p>
        </div>
        <div className="modal-body">
          {step === 1 && (
            <>
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Advanced Problem Solvers"
                />
                {duplicateWarning && (
                  <p style={{ color: '#f59e0b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    A group with this name already exists.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    style={{ width: '60px', height: '40px' }}
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder="#3b82f6"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g., algebra, support, enrichment"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label>Scope</label>
                <select
                  value={selectedClassId}
                  onChange={e => {
                    setSelectedClassId(e.target.value);
                    setSelectedStudentIds([]);
                  }}
                  disabled={!!preselectedClassId}
                >
                  <option value="">Cross-class (all students)</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (recommended)
                    </option>
                  ))}
                </select>
                {!selectedClassId && (
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Class-scoped groups are recommended for better organization.
                  </p>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label>Select Students ({selectedStudentIds.length} selected)</label>
                <div className="checkbox-list">
                  {availableStudents.map(student => (
                    <label key={student.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => handleToggleStudent(student.id)}
                      />
                      <span>{student.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>
                        {classes.find(c => c.id === student.classId)?.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {step > 1 && (
            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !name.trim()}
            >
              Next
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleCreate}>
              Create Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
