import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

function AdminPortal({ token }) {
  // Database States
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [quickTags, setQuickTags] = useState([]);
  const [focusedLog, setFocusedLog] = useState(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'excel'

  // Search States
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Form States
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formShift, setFormShift] = useState('A');
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  // Excel Import States
  const [excelFile, setExcelFile] = useState(null);
  const [excelParsedData, setExcelParsedData] = useState([]);
  const [excelError, setExcelError] = useState('');
  const [excelSuccessMsg, setExcelSuccessMsg] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // API Call Headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Fetch all database metrics & items
  const fetchDashboardData = async () => {
    try {
      // 1. Fetch all logs
      const resLogs = await fetch('/api/logs', { headers: getHeaders() });
      const dataLogs = await resLogs.json();
      if (dataLogs.success) {
        setAllLogs(dataLogs.data);
        // If search is empty, filteredLogs is equal to allLogs
        if (!searchQuery.trim()) {
          setFilteredLogs(dataLogs.data);
        }
      }

      // 2. Fetch unique names for quick tags
      const resNames = await fetch('/api/logs/names', { headers: getHeaders() });
      const dataNames = await resNames.json();
      if (dataNames.success) {
        setQuickTags(dataNames.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Run initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch search results when query changes
  useEffect(() => {
    const handleSearch = async () => {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) {
        setFilteredLogs(allLogs);
        setFocusedLog(null);
        return;
      }

      try {
        const res = await fetch(`/api/logs?search=${encodeURIComponent(trimmedQuery)}`, {
          headers: getHeaders()
        });
        const data = await res.json();
        if (data.success) {
          const results = data.data;
          setFilteredLogs(results);

          // Focus logic:
          if (results.length === 1) {
            setFocusedLog(results[0]);
          } else {
            // Check if there is an exact name match in the filtered list
            const exactMatch = results.find(
              (p) => p.name.toLowerCase() === trimmedQuery.toLowerCase()
            );
            if (exactMatch) {
              setFocusedLog(exactMatch);
            } else {
              setFocusedLog(null);
            }
          }
        }
      } catch (error) {
        console.error('Error searching logs:', error);
      }
    };

    // Simple debounce/execution on search change
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 150);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, allLogs]);

  // Form submission handler (Manual)
  const handleAddLogSubmit = async (e) => {
    e.preventDefault();

    const newLogData = {
      date: formDate,
      shift: formShift,
      name: formName.trim(),
      id: formId.trim(),
      work_description: formDescription.trim()
    };

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newLogData)
      });
      const data = await res.json();

      if (data.success) {
        // Clear form fields
        setFormName('');
        setFormId('');
        setFormDescription('');
        setFormDate(new Date().toISOString().split('T')[0]);

        // Show success alert
        setShowSuccessMsg(true);
        setTimeout(() => setShowSuccessMsg(false), 3000);

        // Reload data
        fetchDashboardData();
      } else {
        alert(data.message || 'Failed to submit log entry.');
      }
    } catch (error) {
      console.error('Error creating log entry:', error);
      alert('Network error. Check backend connection.');
    }
  };

  // Excel date parser utility
  const parseExcelDate = (val) => {
    if (!val) return '';
    if (typeof val === 'number') {
      // Excel serial date to YYYY-MM-DD
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    
    const strVal = String(val).trim();
    
    // Try parsing DD/MM/YYYY or DD-MM-YYYY
    const parts = strVal.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // DD/MM/YYYY -> YYYY-MM-DD
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      } else if (parts[0].length === 4) {
        // YYYY/MM/DD -> YYYY-MM-DD
        const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      }
    }

    try {
      const d = new Date(strVal);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}

    return '';
  };

  // Normalizes Excel Shift string values
  const normalizeShift = (val) => {
    if (!val) return '';
    const str = String(val).trim().toUpperCase();
    if (['A', 'B', 'C'].includes(str)) return str;
    if (str.includes('MORN') || str.includes('DAY') || str === 'M') return 'A';
    if (str.includes('EVEN') || str.includes('AFT') || str === 'E') return 'B';
    if (str.includes('NIGH') || str === 'N') return 'C';
    return str;
  };

  // File processors
  const processExcelFile = (file) => {
    setExcelFile(file.name);
    setExcelParsedData([]);
    setExcelError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rawRows.length < 2) {
          setExcelError('Roster sheet appears to be empty or missing column headers.');
          return;
        }

        const headers = rawRows[0].map(h => String(h).trim().toLowerCase());

        // Dynamic column index matching
        const dateIdx = headers.findIndex(h => h.includes('date'));
        const shiftIdx = headers.findIndex(h => h.includes('shift') || h.includes('rota') || h.includes('code'));
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('employee') || h.includes('worker') || h.includes('staff'));
        const idIdx = headers.findIndex(h => h.includes('id') || h.includes('ref') || h.includes('number'));
        const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('work') || h.includes('task') || h.includes('duty') || h.includes('detail'));

        if (dateIdx === -1 || shiftIdx === -1 || nameIdx === -1 || idIdx === -1 || descIdx === -1) {
          setExcelError('Unable to automatically map column headers. Make sure your sheet contains columns for Date, Shift, Name, ID, and Work Description.');
          return;
        }

        const logs = [];
        const errs = [];

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0 || row.every(val => val === undefined || val === null || val === '')) {
            continue;
          }

          const rawDate = row[dateIdx];
          const rawShift = row[shiftIdx];
          const rawName = row[nameIdx];
          const rawId = row[idIdx];
          const rawDesc = row[descIdx];

          const date = parseExcelDate(rawDate);
          const shift = normalizeShift(rawShift);
          const name = rawName ? String(rawName).trim() : '';
          const id = rawId ? String(rawId).trim() : '';
          const work_description = rawDesc ? String(rawDesc).trim() : '';

          if (!date || !shift || !name || !id || !work_description) {
            errs.push(`Row ${i + 1}: Missing values`);
            continue;
          }

          if (!['A', 'B', 'C'].includes(shift)) {
            errs.push(`Row ${i + 1}: Invalid Shift "${rawShift}" (Expected A, B, or C)`);
            continue;
          }

          logs.push({ date, shift, name, id, work_description });
        }

        if (logs.length === 0) {
          setExcelError('No valid shift entries were found in this file.');
        } else {
          setExcelParsedData(logs);
          if (errs.length > 0) {
            setExcelError(`Parsed ${logs.length} rows successfully. Skipped ${errs.length} malformed rows:\n${errs.join('\n')}`);
          }
        }
      } catch (err) {
        console.error(err);
        setExcelError('Parsing error: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (file) processExcelFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processExcelFile(file);
  };

  const handleExcelImportSubmit = async () => {
    if (excelParsedData.length === 0) return;
    setIsImporting(true);

    try {
      const res = await fetch('/api/logs/batch', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(excelParsedData)
      });
      const data = await res.json();

      if (data.success) {
        setExcelSuccessMsg(`Successfully imported ${data.count} shift logs!`);
        setExcelParsedData([]);
        setExcelFile(null);
        setTimeout(() => setExcelSuccessMsg(''), 4000);
        fetchDashboardData();
      } else {
        alert(data.message || 'Import failed.');
      }
    } catch (error) {
      console.error('Error batch importing:', error);
      alert('Network failure. Check backend connection.');
    } finally {
      setIsImporting(false);
    }
  };

  // Click tag handler
  const handleTagClick = (name) => {
    setSearchQuery(name);
  };

  // Card click handler (focus on single log and smooth scroll up)
  const handleCardClick = (log) => {
    setSearchQuery(log.name);
    setFocusedLog(log);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setFocusedLog(null);
  };

  // Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };

  // Stats derivations
  const totalCount = allLogs.length;
  const loggedShifts = [...new Set(allLogs.map(item => item.shift))].sort().join(', ') || 'None';
  const matchCountLabel = searchQuery.trim() ? filteredLogs.length : 'All';
  const matchFooterLabel = searchQuery.trim() 
    ? `Matches for "${searchQuery}"`
    : 'Showing all records';

  return (
    <div id="adminPortalArea">
      <div className="portal-grid">
        
        {/* Column 1: Add New Logs Form */}
        <section className="form-column">
          <div className="glass-panel form-card">
            
            {/* Tab Selectors */}
            <div className="tab-selector" style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '1.5rem', 
              borderBottom: '1px solid var(--glass-border)', 
              paddingBottom: '0.75rem' 
            }}>
              <button 
                type="button"
                onClick={() => { setActiveTab('manual'); setExcelError(''); }} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: activeTab === 'manual' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'manual' ? '2px solid var(--accent-purple)' : 'none',
                  paddingBottom: '0.45rem',
                  fontSize: '0.9rem'
                }}
              >
                Manual Log
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('excel'); setShowSuccessMsg(false); }} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: activeTab === 'excel' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'excel' ? '2px solid var(--accent-purple)' : 'none',
                  paddingBottom: '0.45rem',
                  fontSize: '0.9rem'
                }}
              >
                Excel Import
              </button>
            </div>

            {activeTab === 'manual' ? (
              <>
                <h3 className="panel-title">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V15M15 12H9M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Log New Shift Entry
                </h3>
                
                <form id="addLogForm" className="input-form" onSubmit={handleAddLogSubmit}>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="addDate">Date Logged</label>
                      <input 
                        type="date" 
                        id="addDate" 
                        className="form-input" 
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="addShift">Duty Shift</label>
                      <select 
                        id="addShift" 
                        className="form-input"
                        value={formShift}
                        onChange={(e) => setFormShift(e.target.value)}
                        required
                      >
                        <option value="A">Shift A (Morning)</option>
                        <option value="B">Shift B (Evening)</option>
                        <option value="C">Shift C (Night)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="addName">Employee Name</label>
                      <input 
                        type="text" 
                        id="addName" 
                        className="form-input" 
                        placeholder="e.g. Arjun"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="addId">Staff Reference ID</label>
                      <input 
                        type="text" 
                        id="addId" 
                        className="form-input" 
                        placeholder="e.g. C301"
                        value={formId}
                        onChange={(e) => setFormId(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="addDescription">Work & Duty Description</label>
                    <textarea 
                      id="addDescription" 
                      className="form-input" 
                      rows="4" 
                      placeholder="Describe the duties, servicing or inspections performed during this shift..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="action-btn form-submit-btn">Submit Shift Log</button>
                  {showSuccessMsg && (
                    <div id="addSuccessMsg" className="success-message" style={{ display: 'block' }}>
                      Log successfully registered!
                    </div>
                  )}
                </form>
              </>
            ) : (
              // Excel Import tab contents
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 className="panel-title" style={{ marginBottom: '0.25rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 10V16M12 16L9 13M12 16L15 13M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.14901 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Import Excel Roster
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Upload a spreadsheet sheet. The system will convert rows directly into JSON format and insert them into the logs collection.
                </p>

                {/* Dropzone area */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  style={{
                    border: '2px dashed var(--glass-border)',
                    borderRadius: '12px',
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(0,0,0,0.01)',
                    transition: 'border-color 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  onClick={() => document.getElementById('excelFileInput').click()}
                >
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: '40px', height: '40px', color: 'var(--text-muted)' }}>
                    <path d="M12 4V16M12 4L8 8M12 4L16 8M4 17V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {excelFile ? excelFile : 'Drag & Drop Excel file here'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Supports .xlsx, .xls
                    </p>
                  </div>
                  <button className="action-btn" type="button" style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}>
                    Choose File
                  </button>
                  <input 
                    type="file" 
                    id="excelFileInput" 
                    accept=".xlsx, .xls" 
                    style={{ display: 'none' }} 
                    onChange={handleExcelUpload} 
                  />
                </div>

                {/* Feedback Messages */}
                {excelError && (
                  <div style={{ 
                    background: 'rgba(244, 63, 94, 0.06)', 
                    border: '1px solid rgba(244, 63, 94, 0.15)', 
                    color: 'var(--accent-rose)', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-line',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {excelError}
                  </div>
                )}

                {excelSuccessMsg && (
                  <div className="success-message">
                    {excelSuccessMsg}
                  </div>
                )}

                {/* Import Confirmation Preview */}
                {excelParsedData.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-emerald)' }}>
                        Parsed {excelParsedData.length} records successfully!
                      </span>
                    </div>
                    
                    {/* Small preview table */}
                    <div style={{ 
                      maxHeight: '150px', 
                      overflowY: 'auto', 
                      border: '1px solid var(--glass-border)', 
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.015)'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.45rem' }}>Name</th>
                            <th style={{ padding: '0.45rem' }}>ID</th>
                            <th style={{ padding: '0.45rem' }}>Date</th>
                            <th style={{ padding: '0.45rem' }}>Shift</th>
                          </tr>
                        </thead>
                        <tbody>
                          {excelParsedData.slice(0, 5).map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                              <td style={{ padding: '0.45rem' }}>{row.name}</td>
                              <td style={{ padding: '0.45rem' }}>{row.id}</td>
                              <td style={{ padding: '0.45rem' }}>{row.date}</td>
                              <td style={{ padding: '0.45rem' }}>{row.shift}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {excelParsedData.length > 5 && (
                        <div style={{ textAlign: 'center', padding: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          And {excelParsedData.length - 5} more rows...
                        </div>
                      )}
                    </div>

                    <button 
                      type="button" 
                      className="action-btn form-submit-btn" 
                      onClick={handleExcelImportSubmit}
                      disabled={isImporting}
                    >
                      {isImporting ? 'Importing Roster...' : `Confirm Import (${excelParsedData.length} entries)`}
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        </section>

        {/* Column 2: Dashboard controls & Database Search */}
        <div className="dashboard-controls-column">
          {/* Search Panel */}
          <section className="search-section glass-panel">
            <div className="search-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input 
                type="text" 
                id="searchInput" 
                placeholder="Search personnel by name..." 
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  id="clearSearchBtn" 
                  className="clear-btn" 
                  aria-label="Clear search" 
                  type="button" 
                  style={{ display: 'flex' }}
                  onClick={() => setSearchQuery('')}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="search-quick-tags">
              <span className="quick-tag-label">Quick Search:</span>
              <div id="quickTagsContainer" className="quick-tags-list">
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

          {/* Stats Overview */}
          <section className="stats-grid">
            <div className="stat-card glass-panel" id="statTotalPersonnel">
              <div className="stat-header">
                <span className="stat-title">Personnel Count</span>
                <div className="stat-icon icon-blue">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="stat-value" id="valTotal">{totalCount}</div>
              <div className="stat-footer">Across multiple shifts</div>
            </div>

            <div className="stat-card glass-panel" id="statActiveShifts">
              <div className="stat-header">
                <span className="stat-title">Shifts Logged</span>
                <div className="stat-icon icon-purple">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="stat-value" id="valShifts">{loggedShifts}</div>
              <div className="stat-footer">Rotational tracking</div>
            </div>

            <div className="stat-card glass-panel" id="statSearchStatus">
              <div className="stat-header">
                <span className="stat-title">Database Search</span>
                <div className="stat-icon icon-cyan">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9739 14.8355 21.5839C12.7677 22.1939 10.5632 22.1168 8.54299 21.3639C6.52279 20.611 4.8003 19.2239 3.63673 17.408" stroke="currentColor" stroke-width="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <div className="stat-value" id="valMatches">{matchCountLabel}</div>
              <div className="stat-footer" id="valMatchesLabel">{matchFooterLabel}</div>
            </div>
          </section>
        </div>
      </div>

      {/* Details Focus Panel */}
      {focusedLog && (
        <section className="detail-focus-section" id="detailFocusSection" style={{ display: 'block' }}>
          <div className="detail-focus-card glass-panel">
            <span className="detail-focus-badge">Retrieved Profile</span>
            
            <div className="detail-profile-header">
              <div className={`detail-avatar avatar-${focusedLog.shift.toLowerCase()}`}>
                {focusedLog.name.charAt(0)}
              </div>
              <div className="detail-info">
                <h3>{focusedLog.name}</h3>
                <div className="detail-meta">
                  <span className="detail-id">ID: {focusedLog.id}</span>
                  <span className={`shift-badge badge-${focusedLog.shift.toLowerCase()}`}>
                    Shift {focusedLog.shift} Roster
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-grid-item">
                <span className="label">Date Logged</span>
                <span className="val">{formatDate(focusedLog.date)}</span>
              </div>
              <div className="detail-grid-item">
                <span className="label">Duty Shift Code</span>
                <span className="val">Shift {focusedLog.shift} (Rotational)</span>
              </div>
              <div className="detail-grid-item">
                <span className="label">Staff Reference</span>
                <span className="val">REF-{focusedLog.id}-2026</span>
              </div>
            </div>

            <div className="detail-description">
              <h4>Task & Work Description Log</h4>
              <p>{focusedLog.work_description}</p>
            </div>
          </div>
        </section>
      )}

      {/* Results Grid */}
      <section className="results-section">
        <h2 className="section-title" id="resultsTitle">
          {searchQuery.trim() ? `Search Results (${filteredLogs.length})` : 'All Roster Logs'}
        </h2>
        
        {filteredLogs.length > 0 ? (
          <div className="log-grid" id="logGrid" style={{ display: 'grid' }}>
            {filteredLogs.map((person) => {
              const isExactMatch = searchQuery.trim().toLowerCase() === person.name.toLowerCase();
              return (
                <div 
                  key={person._id} 
                  className={`person-card glass-panel ${isExactMatch ? 'active-match' : ''}`}
                  onClick={() => handleCardClick(person)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-top">
                    <div className="person-identity">
                      <div className={`avatar avatar-${person.shift.toLowerCase()}`}>
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="person-name">{person.name}</h3>
                        <span className="person-id">{person.id}</span>
                      </div>
                    </div>
                    <span className={`shift-badge badge-${person.shift.toLowerCase()}`}>
                      Shift {person.shift}
                    </span>
                  </div>
                  
                  <div className="card-middle">
                    <div className="log-date">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{formatDate(person.date)}</span>
                    </div>
                    <p className="work-desc">{person.work_description}</p>
                  </div>
                  
                  <div className="card-footer">
                    <span>
                      Focus Log Details
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* No Results Fallback */
          <div className="no-results-panel glass-panel" id="noResultsPanel" style={{ display: 'flex' }}>
            <div className="no-results-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 16H14M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>No matching personnel found</h3>
            <p>We couldn't find anyone named <strong>{searchQuery}</strong>. Check spelling or add them as a new log entry.</p>
            <button id="resetSearchBtn" className="action-btn" type="button" onClick={handleResetSearch}>
              Reset Search
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminPortal;
