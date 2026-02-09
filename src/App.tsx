import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import ClassesList from './pages/ClassesList';
import ClassDetail from './pages/ClassDetail';
import StudentsList from './pages/StudentsList';
import StudentDetail from './pages/StudentDetail';
import CreateTask from './pages/CreateTask';
import TaskDetail from './pages/TaskDetail';
import TaskReport from './pages/TaskReport';
import Stub from './pages/Stub';

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/tasks/create', label: 'Create Task', icon: '➕' },
    { path: '/classes', label: 'Classes', icon: '🏫' },
    { path: '/students', label: 'Students', icon: '👥' },
    { path: '/templates', label: 'Task Templates', icon: '📝' },
    { path: '/textbook', label: 'Textbook & Search', icon: '📚' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/profile', label: 'Profile/Admin', icon: '⚙️' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Teacher Portal</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function AppContent() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/classes" element={<ClassesList />} />
          <Route path="/classes/:classId" element={<ClassDetail />} />
          <Route path="/students" element={<StudentsList />} />
          <Route path="/students/:studentId" element={<StudentDetail />} />
          <Route path="/tasks/create" element={<CreateTask />} />
          <Route path="/tasks/:taskId" element={<TaskDetail />} />
          <Route path="/tasks/:taskId/report" element={<TaskReport />} />
          <Route path="/templates" element={<Stub page="Task Templates" />} />
          <Route path="/textbook" element={<Stub page="Textbook & Search" />} />
          <Route path="/notifications" element={<Stub page="Notifications" />} />
          <Route path="/profile" element={<Stub page="Profile/Admin" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
