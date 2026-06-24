import React, { useState } from 'react';

function Login({ onLoginSuccess }) {
  const [role, setRole] = useState('admin');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shouldShake, setShouldShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const shakeCard = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const payload = { role, password };
      if (role === 'employee') {
        payload.employeeId = employeeId;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess(data.role, data.token, data.name, data.employeeId);
      } else {
        setErrorMsg(data.message || 'Authentication failed');
        shakeCard();
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setErrorMsg('Server connection failed. Make sure server is running.');
      shakeCard();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper" id="loginWrapper">
      <div className={`login-card glass-panel ${shouldShake ? 'shake' : ''}`}>
        <div className="login-header">
          <div className="logo-icon">
            <img src="/logo.jpg" alt="ShiftSync Logo" />
          </div>
          <h2>ShiftSync Portal</h2>
          <p>Access your rotational work logs and HR databases</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="loginRole">Select Portal Role</label>
            <select 
              id="loginRole" 
              className="form-input"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setErrorMsg('');
              }}
            >
              <option value="admin">Administrator Portal</option>
              <option value="employee">Employee Personal Portal</option>
            </select>
          </div>

          {role === 'employee' && (
            <div className="form-group">
              <label htmlFor="loginEmployeeId">Employee ID</label>
              <input 
                type="text" 
                id="loginEmployeeId" 
                className="form-input" 
                placeholder="EMP-10001"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required 
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="loginPassword">Portal Password</label>
            <input 
              type="password" 
              id="loginPassword" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            {errorMsg && <span className="error-msg" id="loginErrorMsg">{errorMsg}</span>}
          </div>

          <button 
            type="submit" 
            className="action-btn login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Authorizing...' : 'Authorize Access'}
          </button>
        </form>
        
        <div className="login-footer">
          {role === 'admin' ? (
            <p>Hint: Admin password is <strong>123</strong></p>
          ) : (
            <p>Use your <strong>Employee ID</strong> and <strong>Admin-created password</strong> to login.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
