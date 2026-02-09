import { useState } from 'react';
import type { Student, TemporaryGroup } from '../types';

interface CreateTemporaryGroupModalProps {
  students: Student[];
  onClose: () => void;
  onCreated: (group: TemporaryGroup) => void;
}

export default function CreateTemporaryGroupModal({ students, onClose, onCreated }: CreateTemporaryGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#64748b');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

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

    const newGroup: TemporaryGroup = {
      id: `temp-group-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      type: 'temporary',
      studentIds: selectedStudentIds
    };

    onCreated(newGroup);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Temporary Group</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
            This group will only exist for this task
          </p>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Quick Review Group"
            />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>
          <div className="form-group">
            <label>Color (optional)</label>
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
                placeholder="#64748b"
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Select Students ({selectedStudentIds.length} selected)</label>
            <div className="checkbox-list">
              {students.map(student => (
                <label key={student.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => handleToggleStudent(student.id)}
                  />
                  <span>{student.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            Create Temporary Group
          </button>
        </div>
      </div>
    </div>
  );
}
