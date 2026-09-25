import { useState } from 'react';
import PortalNavigation from './components/PortalNavigation';
import Prototypes from './pages/Prototypes';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import TestControls from './test-controls/TestControls';

function AppContent() {
  const location = useLocation();
  const [collapsed,setCollapsed]=useState(()=>localStorage.getItem('portal-nav-collapsed')==='true');
  const toggleNav=()=>setCollapsed(value=>{localStorage.setItem('portal-nav-collapsed',String(!value));return !value});
  const isTest = ['/test-controls','/classes/class-test-controls/tasks/linear-equations-test','/tasks/linear-equations-test/report','/tasks/linear-equations-test'].includes(location.pathname);
  return (
    <div className={`portal-shell ${collapsed?'nav-collapsed':''}`}>
      <PortalNavigation collapsed={collapsed} onToggle={toggleNav}/>
      {isTest?<TestControls />:<main className="main-content">
        <Routes>
          <Route path="/prototypes" element={<Prototypes />} />
          <Route path="/skills" element={<Stub page="Skills" />} />
          <Route path="/support" element={<Stub page="Live support" />} />
          <Route path="/test-controls" element={<TestControls />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/classes" element={<ClassesList />} />
          <Route path="/classes/:classId" element={<ClassDetail />} />
          <Route path="/classes/:classId/tasks/:taskId" element={<ClassDetail />} />
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
      </main>}
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
