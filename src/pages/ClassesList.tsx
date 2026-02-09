import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadData } from '../data/storage';
import type { Class, Student } from '../types';

export default function ClassesList() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const data = loadData();
    setClasses(data.classes);
    setStudents(data.students);
  }, []);

  const getStudentCount = (classId: string) => {
    return students.filter(s => s.classId === classId).length;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Classes</h1>
        <p>Manage your classes and groups</p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(cls => (
              <tr key={cls.id}>
                <td>
                  <Link to={`/classes/${cls.id}`} style={{ fontWeight: 500, color: '#3b82f6' }}>
                    {cls.name}
                  </Link>
                </td>
                <td>{getStudentCount(cls.id)}</td>
                <td>
                  <Link to={`/classes/${cls.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
