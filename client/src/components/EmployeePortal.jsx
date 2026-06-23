import React, { useState, useEffect } from 'react';

function EmployeePortal({ token }) {
  const [employeeInput, setEmployeeInput] = useState('');
  const [searchedName, setSearchedName] = useState('');
  const [employeeLogs, setEmployeeLogs] = useState([]);
  const [quickTags, setQuickTags] = useState([]);
  const [showNoResults, setShowNoResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // API Call Headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Fetch unique names for tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/logs/names', { headers: getHeaders() });
        const data = await res.json();
        if (data.success) {
          setQuickTags(data.data);
        }
      } catch (error) {
        console.error('Error fetching name tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Fetch logs by name
  const retrieveEmployeeLogs = async (queryName) => {
    const query = (queryName || employeeInput).trim();
    if (!query) return;

    setSearchedName(query);
    setHasSearched(true);
    setShowNoResults(false);
    setEmployeeLogs([]);

    try {
      // Query starts-with/exact endpoint parameter `name`
      const res = await fetch(`/api/logs?name=${encodeURIComponent(query)}`, {
        headers: getHeaders()
      });
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        setEmployeeLogs(data.data);
        setShowNoResults(false);
      } else {
        setEmployeeLogs([]);
        setShowNoResults(true);
      }
    } catch (error) {
      console.error('Error fetching employee logs:', error);
      setShowNoResults(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      retrieveEmployeeLogs();
    }
  };

  const handleTagClick = (name) => {
    setEmployeeInput(name);
    retrieveEmployeeLogs(name);
  };

  // Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div id="employeePortalArea">
      <div className="employee-lookup-container">
        <section className="lookup-card glass-panel">
          <div className="lookup-header">
            <h3>Retrieve Your Duty Logs</h3>
            <p>Enter your full name to pull your active shift schedules and task logs.</p>
          </div>
          
          <div className="lookup-form">
            <div className="search-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21L14.75 15.75M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input 
                type="text" 
                id="employeeNameInput" 
                placeholder="Enter your name (e.g. Praveen)..." 
                autoComplete="off"
                value={employeeInput}
                onChange={(e) => setEmployeeInput(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            <button 
              id="retrieveBtn" 
              className="action-btn retrieve-submit-btn"
              onClick={() => retrieveEmployeeLogs()}
            >
              Fetch Roster Log
            </button>
          </div>

          {/* Employee Quick Tags */}
          <div className="search-quick-tags">
            <span className="quick-tag-label">Active Employees:</span>
            <div id="employeeQuickTags" className="quick-tags-list">
              {quickTags.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="quick-tag"
                  onClick={() => handleTagClick(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Personal Logs Viewer */}
        {hasSearched && employeeLogs.length > 0 && (
          <div id="employeeLogsViewer" className="employee-logs-viewer" style={{ display: 'flex' }}>
            <h4 className="employee-log-header">Active Shift Entries ({employeeLogs.length})</h4>
            
            {employeeLogs.map((person) => {
              const shiftClass = person.shift.toLowerCase();
              return (
                <div key={person._id} className="detail-focus-card glass-panel">
                  <span className="detail-focus-badge">Verified Record</span>
                  <div className="detail-profile-header">
                    <div className={`detail-avatar avatar-${shiftClass}`}>
                      {person.name.charAt(0)}
                    </div>
                    <div className="detail-info">
                      <h3>{person.name}</h3>
                      <div className="detail-meta">
                        <span className="detail-id">Staff ID: {person.id}</span>
                        <span className={`shift-badge badge-${shiftClass}`}>Shift {person.shift}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-grid-item">
                      <span className="label">Duty Date</span>
                      <span className="val">{formatDate(person.date)}</span>
                    </div>
                    <div className="detail-grid-item">
                      <span className="label">Roster Rota Code</span>
                      <span className="val">Shift {person.shift} (Standard Hours)</span>
                    </div>
                    <div className="detail-grid-item">
                      <span className="label">Staff Reference</span>
                      <span className="val">REF-{person.id}-2026</span>
                    </div>
                  </div>

                  <div className="detail-description">
                    <h4>Shift Duty Tasks Performed</h4>
                    <p>{person.work_description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Employee No Results Fallback */}
        {showNoResults && (
          <div className="no-results-panel glass-panel" id="employeeNoResults" style={{ display: 'flex' }}>
            <div className="no-results-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 16H14M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Roster Log Not Found</h3>
            <p>We could not find any active shifts registered under "<strong>{searchedName}</strong>". Please contact your supervisor to create your shift entry.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeePortal;
