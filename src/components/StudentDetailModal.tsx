import { useState, useEffect } from 'react';
import { loadData } from '../data/storage';
import StudentDetailContent from './StudentDetailContent';
import type { Student, Class } from '../types';

interface StudentDetailModalProps {
  studentId: string;
  onClose: () => void;
  onExpandToFullPage: () => void;
}

export default function StudentDetailModal({ studentId, onClose, onExpandToFullPage }: StudentDetailModalProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);

  useEffect(() => {
    const data = loadData();
    const stu = data.students.find(s => s.id === studentId);
    setStudent(stu || null);
    if (stu) {
      const cls = data.classes.find(c => c.id === stu.classId);
      setClassData(cls || null);
    }
  }, [studentId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            {student && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  style={{ width: 40, height: 40, borderRadius: '50%' }}
                />
                <div>
                  <h2 style={{ margin: 0 }}>{student.name}</h2>
                  <span style={{ fontSize: '0.875rem', color: '#5A5A68' }}>{classData?.name}</span>
                </div>
              </div>
            )}
          </div>
          <div className="modal-header-actions">
            <button
              className="btn btn-secondary"
              onClick={onExpandToFullPage}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 6V2H6M14 6V2H10M2 10V14H6M14 10V14H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Open full page
            </button>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="modal-body" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
          <StudentDetailContent
            studentId={studentId}
            isCompact={true}
          />
        </div>
      </div>
    </div>
  );
}
