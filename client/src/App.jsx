import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminPortal from './components/AdminPortal';
import EmployeePortal from './components/EmployeePortal';

function App() {
  const [role, setRole] = useState(localStorage.getItem('shiftsync_role') || null);
  const [token, setToken] = useState(localStorage.getItem('shiftsync_token') || null);
  const [empName, setEmpName] = useState(localStorage.getItem('shiftsync_emp_name') || '');
  const [empId, setEmpId] = useState(localStorage.getItem('shiftsync_emp_id') || '');

  // Synchronize authentication tokens
  const handleLogin = (userRole, userToken, name, employeeId) => {
    setRole(userRole);
    setToken(userToken);
    localStorage.setItem('shiftsync_role', userRole);
    localStorage.setItem('shiftsync_token', userToken);
    if (userRole === 'employee') {
      setEmpName(name || '');
      setEmpId(employeeId || '');
      localStorage.setItem('shiftsync_emp_name', name || '');
      localStorage.setItem('shiftsync_emp_id', employeeId || '');
    } else {
      setEmpName('');
      setEmpId('');
      localStorage.removeItem('shiftsync_emp_name');
      localStorage.removeItem('shiftsync_emp_id');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setToken(null);
    setEmpName('');
    setEmpId('');
    localStorage.removeItem('shiftsync_role');
    localStorage.removeItem('shiftsync_token');
    localStorage.removeItem('shiftsync_emp_name');
    localStorage.removeItem('shiftsync_emp_id');
  };

  // Determine portal sub-titles and styles dynamically based on authorization role
  const portalSubTitle = role === 'admin'
    ? 'ShiftSync Master Database & Control Center'
    : 'Personal Roster & Duty Logs Retrieval';

  const roleLabel = role === 'admin'
    ? 'Administrator Portal'
    : 'Employee Portal';

  const badgeStyle = role === 'admin'
    ? { borderColor: 'rgba(139, 92, 246, 0.3)' }
    : { borderColor: 'rgba(16, 185, 129, 0.3)' };

  const pulseStyle = role === 'admin'
    ? { backgroundColor: 'var(--accent-purple)', boxShadow: '0 0 10px var(--accent-purple)' }
    : { backgroundColor: 'var(--accent-emerald)', boxShadow: '0 0 10px var(--accent-emerald)' };

  return (
    <>
      {/* Ambient background glow elements */}
      <div className="glow-bg">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      {!role ? (
        <Login onLoginSuccess={handleLogin} />
      ) : (
        <div className="app-container" id="appContainer" style={{ display: 'flex' }}>
          <header className="app-header">
            <div className="logo-area">
              <div className="logo-icon">
                <img src="/logo.jpg" alt="ShiftSync Logo" />
              </div>
              <div>
                <h1>ShiftSync</h1>
                <p className="subtitle" id="portalSubTitle">{portalSubTitle}</p>
              </div>
            </div>
            
            <div className="header-actions">
              <div className="header-badge" style={badgeStyle}>
                <span className="pulse-indicator" style={pulseStyle}></span>
                <span className="badge-text" id="roleBadge">{roleLabel}</span>
              </div>
              <button id="logoutBtn" className="logout-btn" aria-label="Sign Out" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            </div>
          </header>

          <main className="main-content">
            {role === 'admin' ? (
              <AdminPortal token={token} />
            ) : (
              <EmployeePortal token={token} empId={empId} />
            )}
          </main>

          <footer className="app-footer">
            <p>&copy; 2026 ShiftSync Logistics. Secure Multi-Portal Access System.</p>
          </footer>
        </div>
      )}
    </>
  );
}

export default App;
