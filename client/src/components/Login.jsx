import React, { useState } from 'react';

function Login({ onLoginSuccess }) {
  const [role, setRole] = useState('admin');
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, password }),
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess(data.role, data.token);
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
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6V12L16 14" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="logoGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2>ShiftSync Portal</h2>
          <p>Access your rotational work logs and databases</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="loginRole">Select Portal Role</label>
            <select 
              id="loginRole" 
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Administrator Portal</option>
              <option value="employee">Employee Personal Portal</option>
            </select>
          </div>

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
          <p>Hint: Admin pass is <strong>123</strong>, Employee pass is <strong>321</strong></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
