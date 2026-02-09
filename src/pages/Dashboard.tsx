import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to the Teacher Portal</p>
      </div>
      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/tasks/create" className="btn btn-primary">Create New Task</Link>
          <Link to="/classes" className="btn btn-secondary">View Classes</Link>
          <Link to="/students" className="btn btn-secondary">View Students</Link>
        </div>
      </div>
    </div>
  );
}
