import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadData } from '../data/storage';
import type { Student, Class, MathspaceGroup } from '../types';

export default function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => {
    const data = loadData();
    setStudents(data.students);
    setClasses(data.classes);
  }, []);

  const getMathspaceGroupColor = (group: MathspaceGroup) => {
    switch (group) {
      case 'Explorer': return '#10b981';
      case 'Adventurer': return '#f59e0b';
      case 'Trailblazer': return '#8b5cf6';
    }
  };

  const filteredStudents = filterClass
    ? students.filter(s => s.classId === filterClass)
    : students;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Students</h1>
        <p>Manage student profiles and group memberships</p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Filter by Class</label>
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            style={{ maxWidth: '300px' }}
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Mathspace Group</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.id}>
                <td>
                  <Link to={`/students/${student.id}`} style={{ fontWeight: 500, color: '#3b82f6' }}>
                    {student.name}
                  </Link>
                </td>
                <td>{classes.find(c => c.id === student.classId)?.name}</td>
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
                  <Link
                    to={`/students/${student.id}`}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  >
                    View Profile
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
