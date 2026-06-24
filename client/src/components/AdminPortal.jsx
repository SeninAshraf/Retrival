import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

function AdminPortal({ token }) {
  // Navigation
  const [primaryTab, setPrimaryTab] = useState('roster'); // 'roster', 'employees', 'salary', 'announcements', 'chats'

  // Roster / Database States
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [quickTags, setQuickTags] = useState([]);
  const [focusedLog, setFocusedLog] = useState(null);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'excel'
  const [searchQuery, setSearchQuery] = useState('');

  // Roster Manual Form States
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formShift, setFormShift] = useState('A');
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  // Roster Excel Import States
  const [excelFile, setExcelFile] = useState(null);
  const [excelParsedData, setExcelParsedData] = useState([]);
  const [excelError, setExcelError] = useState('');
  const [excelSuccessMsg, setExcelSuccessMsg] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // NEW: Employee Management States
  const [employees, setEmployees] = useState([]);
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [employeeAttendanceCount, setEmployeeAttendanceCount] = useState({ total: 0, A: 0, B: 0, C: 0 });
  const [employeeSalaryHistory, setEmployeeSalaryHistory] = useState([]);

  // Add Employee Form States
  const [empFullName, setEmpFullName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empMobileNumber, setEmpMobileNumber] = useState('');
  const [empDepartment, setEmpDepartment] = useState('Engineering');
  const [empDesignation, setEmpDesignation] = useState('Software Engineer');
  const [empMonthlySalary, setEmpMonthlySalary] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empStatus, setEmpStatus] = useState('Active');
  const [empJoiningDate, setEmpJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [empProfilePhoto, setEmpProfilePhoto] = useState('');
  const [empCompanyNotes, setEmpCompanyNotes] = useState('');

  // NEW: Salary Management States
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [salaryReport, setSalaryReport] = useState({ totalPayroll: 0, totalPaid: 0, totalUnpaid: 0, departmentBreakdown: {}, records: [] });
  
  // Add Salary Form States
  const [salEmployeeId, setSalEmployeeId] = useState('');
  const [salMonth, setSalMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salBase, setSalBase] = useState('');
  const [salBonus, setSalBonus] = useState('0');
  const [salDeductions, setSalDeductions] = useState('0');
  const [salRemarks, setSalRemarks] = useState('');
  const [salStatus, setSalStatus] = useState('Unpaid');

  // NEW: Announcement States
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState('All');
  const [annDept, setAnnDept] = useState('Engineering');

  // NEW: Chat States
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null); // Employee DB _id
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const chatEndRef = useRef(null);

  // API headers helper
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Load basic statistics on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch metrics and records for ShiftSync roster logs
  const fetchDashboardData = async () => {
    try {
      const resLogs = await fetch('/api/logs', { headers: getHeaders() });
      const dataLogs = await resLogs.json();
      if (dataLogs.success) {
        setAllLogs(dataLogs.data);
        if (!searchQuery.trim()) {
          setFilteredLogs(dataLogs.data);
        }
      }

      const resNames = await fetch('/api/logs/names', { headers: getHeaders() });
      const dataNames = await resNames.json();
      if (dataNames.success) {
        setQuickTags(dataNames.data);
      }
    } catch (error) {
      console.error('Error fetching roster data:', error);
    }
  };

  // Filter logs locally based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLogs(allLogs);
    } else {
      const lowerQuery = searchQuery.toLowerCase().trim();
      const filtered = allLogs.filter(log => 
        log.name.toLowerCase().includes(lowerQuery) ||
        log.id.toLowerCase().includes(lowerQuery) ||
        log.work_description.toLowerCase().includes(lowerQuery) ||
        log.shift.toLowerCase().includes(lowerQuery)
      );
      setFilteredLogs(filtered);
    }
  }, [searchQuery, allLogs]);

  // Tab switching side-effects (data loading)
  useEffect(() => {
    if (primaryTab === 'employees') {
      fetchEmployees();
    } else if (primaryTab === 'salary') {
      fetchEmployees();
      fetchSalaryReport();
    } else if (primaryTab === 'announcements') {
      fetchAnnouncements();
    } else if (primaryTab === 'chats') {
      fetchChatThreads();
    }
  }, [primaryTab, salaryMonth]);

  // Fetch employees list
  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch salary reports for a specific month
  const fetchSalaryReport = async () => {
    try {
      const res = await fetch(`/api/salary/reports?month=${salaryMonth}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setSalaryReport(data.data);
      }
    } catch (error) {
      console.error('Error fetching salary report:', error);
    }
  };

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  // Fetch chat threads
  const fetchChatThreads = async () => {
    try {
      const res = await fetch('/api/chats/threads', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setThreads(data.data);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  // Fetch chat messages in a thread
  const fetchChatMessages = async (employeeId, showLoading = true) => {
    try {
      const res = await fetch(`/api/chats/thread/${employeeId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data);
        // Mark as read
        await fetch('/api/chats/read', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ employeeId })
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Polling for chats to simulate real-time updates
  useEffect(() => {
    let interval;
    if (primaryTab === 'chats') {
      fetchChatThreads();
      if (activeThreadId) {
        fetchChatMessages(activeThreadId);
      }
      interval = setInterval(() => {
        fetchChatThreads();
        if (activeThreadId) {
          fetchChatMessages(activeThreadId, false);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [primaryTab, activeThreadId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Handle single employee click
  const handleEmployeeClick = async (emp) => {
    setSelectedEmployee(emp);
    
    // Compute Attendance Summary from client-side logs
    const empLogs = allLogs.filter(log => 
      String(log.id).trim().toLowerCase() === String(emp.employeeId).trim().toLowerCase()
    );
    setEmployeeAttendanceCount({
      total: empLogs.length,
      A: empLogs.filter(l => l.shift === 'A').length,
      B: empLogs.filter(l => l.shift === 'B').length,
      C: empLogs.filter(l => l.shift === 'C').length,
    });

    // Fetch employee salary history
    try {
      const res = await fetch(`/api/salary/employee/${emp._id}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setEmployeeSalaryHistory(data.data);
      } else {
        setEmployeeSalaryHistory([]);
      }
    } catch (err) {
      console.error(err);
      setEmployeeSalaryHistory([]);
    }
  };

  // Create Employee Submit
  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!empFullName || !empMobileNumber || !empMonthlySalary || !empPassword) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fullName: empFullName,
          email: empEmail,
          mobileNumber: empMobileNumber,
          department: empDepartment,
          designation: empDesignation,
          monthlySalary: Number(empMonthlySalary),
          password: empPassword,
          status: empStatus,
          joiningDate: empJoiningDate,
          profilePhoto: empProfilePhoto,
          companyNotes: empCompanyNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Account created successfully! Employee ID is: ${data.data.employeeId}`);
        setShowAddEmpModal(false);
        // Reset form
        setEmpFullName('');
        setEmpEmail('');
        setEmpMobileNumber('');
        setEmpMonthlySalary('');
        setEmpPassword('');
        setEmpProfilePhoto('');
        setEmpCompanyNotes('');
        setEmpStatus('Active');
        setEmpJoiningDate(new Date().toISOString().split('T')[0]);
        // Refresh
        fetchEmployees();
      } else {
        alert(data.message || 'Failed to create employee account.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error creating account.');
    }
  };

  // Convert profile image to base64
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEmpProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Record Salary Submit
  const handleAddSalarySubmit = async (e) => {
    e.preventDefault();
    if (!salEmployeeId || !salMonth || !salBase) {
      alert('Please fill out all required salary fields.');
      return;
    }

    try {
      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          employee: salEmployeeId,
          month: salMonth,
          baseSalary: Number(salBase),
          bonus: Number(salBonus) || 0,
          deductions: Number(salDeductions) || 0,
          paymentStatus: salStatus,
          remarks: salRemarks
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Salary record logged successfully!');
        setSalRemarks('');
        setSalBonus('0');
        setSalDeductions('0');
        fetchSalaryReport();
      } else {
        alert(data.message || 'Failed to log salary record.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    }
  };

  // Mark Salary as Paid
  const handleMarkSalaryPaid = async (recordId) => {
    try {
      const res = await fetch(`/api/salary/${recordId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ paymentStatus: 'Paid' })
      });
      const data = await res.json();
      if (data.success) {
        fetchSalaryReport();
      } else {
        alert(data.message || 'Failed to update payment status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Publish Announcement Submit
  const handleAddAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) {
      alert('Please provide title and content.');
      return;
    }

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          target: annTarget,
          department: annTarget === 'Department' ? annDept : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Announcement published!');
        setAnnTitle('');
        setAnnContent('');
        fetchAnnouncements();
      } else {
        alert(data.message || 'Failed to post announcement.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Chat message
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeThreadId) return;

    try {
      const res = await fetch('/api/chats/message', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          employee: activeThreadId,
          content: chatInputText.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatInputText('');
        fetchChatMessages(activeThreadId);
        fetchChatThreads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update employee notes from Admin card
  const handleUpdateNotes = async (notesText) => {
    try {
      const res = await fetch(`/api/employees/${selectedEmployee._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ companyNotes: notesText })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedEmployee(prev => ({ ...prev, companyNotes: notesText }));
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Employees List
  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.fullName.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
                        emp.employeeId.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
                        emp.designation.toLowerCase().includes(searchEmployeeQuery.toLowerCase());
    const matchDept = filterDept ? emp.department === filterDept : true;
    const matchStatus = filterStatus ? emp.status === filterStatus : true;
    return matchSearch && matchDept && matchStatus;
  });

  // Single shift logger submit
  const handleAddLogSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formId || !formDescription) {
      alert('Please fill in all manual shift fields.');
      return;
    }

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          date: formDate,
          shift: formShift,
          name: formName.trim(),
          id: formId.trim(),
          work_description: formDescription.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        setFormName('');
        setFormId('');
        setFormDescription('');
        setFormDate(new Date().toISOString().split('T')[0]);
        setShowSuccessMsg(true);
        setTimeout(() => setShowSuccessMsg(false), 3000);
        fetchDashboardData();
      } else {
        alert(data.message || 'Failed to submit log.');
      }
    } catch (error) {
      console.error('Error creating log entry:', error);
      alert('Network error. Check backend connection.');
    }
  };

  // Excel parsing utilities
  const parseExcelDate = (val) => {
    if (!val) return '';
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    const strVal = String(val).trim();
    const parts = strVal.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      } else if (parts[0].length === 4) {
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

  const normalizeShift = (val) => {
    if (!val) return '';
    const str = String(val).trim().toUpperCase();
    if (['A', 'B', 'C'].includes(str)) return str;
    if (str.includes('MORN') || str.includes('DAY') || str === 'M') return 'A';
    if (str.includes('EVEN') || str.includes('AFT') || str === 'E') return 'B';
    if (str.includes('NIGH') || str === 'N') return 'C';
    return str;
  };

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
        const dateIdx = headers.findIndex(h => h.includes('date'));
        const shiftIdx = headers.findIndex(h => h.includes('shift') || h.includes('rota') || h.includes('code'));
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('employee') || h.includes('worker') || h.includes('staff'));
        const idIdx = headers.findIndex(h => h.includes('id') || h.includes('ref') || h.includes('number'));
        const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('work') || h.includes('task') || h.includes('duty') || h.includes('detail'));

        if (dateIdx === -1 || shiftIdx === -1 || nameIdx === -1 || idIdx === -1 || descIdx === -1) {
          setExcelError('Unable to map column headers. File needs columns for Date, Shift, Name, ID, and Work Description.');
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
            setExcelError(`Parsed ${logs.length} rows. Skipped ${errs.length} malformed rows:\n${errs.join('\n')}`);
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

  const handleTagClick = (name) => {
    setSearchQuery(name);
  };

  const handleCardClick = (log) => {
    setSearchQuery(log.name);
    setFocusedLog(log);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setFocusedLog(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div id="adminPortalArea">
      
      {/* Primary Dashboard Navigation Tabs */}
      <nav className="dashboard-nav glass-panel" style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        padding: '0.75rem 1.5rem', 
        marginBottom: '2rem', 
        borderRadius: '12px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'roster', label: 'Roster Database', icon: '📅' },
          { id: 'employees', label: 'Employee Directory', icon: '👥' },
          { id: 'salary', label: 'Salary & Payroll', icon: '💰' },
          { id: 'announcements', label: 'Bulletins', icon: '📢' },
          { id: 'chats', label: 'Confidential Chats', icon: '💬' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`nav-tab-btn ${primaryTab === tab.id ? 'active' : ''}`}
            onClick={() => setPrimaryTab(tab.id)}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: primaryTab === tab.id ? 'var(--grad-primary)' : 'transparent',
              color: primaryTab === tab.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Roster Database Tab */}
      {primaryTab === 'roster' && (
        <div className="portal-grid">
          {/* Column 1: Add New Logs Form */}
          <section className="form-column">
            <div className="glass-panel form-card">
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
                    <span style={{ marginRight: '0.5rem' }}>➕</span>
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
                          placeholder="e.g. Senin Ashraf"
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
                          placeholder="e.g. EMP-10001"
                          value={formId}
                          onChange={(e) => setFormId(e.target.value)}
                          required 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="addDesc">Work Description & Duties</label>
                      <textarea 
                        id="addDesc" 
                        rows="4" 
                        className="form-input" 
                        placeholder="Detail shift activities and tasks completed..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        required
                      ></textarea>
                    </div>

                    <button type="submit" id="saveLogBtn" className="action-btn submit-btn">
                      Publish Shift Log
                    </button>
                    
                    {showSuccessMsg && (
                      <span className="success-banner" id="formSuccessBanner">
                        Shift log published and updated successfully!
                      </span>
                    )}
                  </form>
                </>
              ) : (
                <>
                  <h3 className="panel-title">
                    <span style={{ marginRight: '0.5rem' }}>📥</span>
                    Batch Excel Upload
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Upload a spreadsheet. Requires columns: <strong>Date, Shift/Rota, Name, ID, Work Description</strong>.
                  </p>

                  <div 
                    className="excel-drop-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('excelFileInput').click()}
                  >
                    <span>📁</span>
                    <p>{excelFile ? `Selected: ${excelFile}` : 'Drag and drop roster file here, or click to browse'}</p>
                    <input 
                      type="file" 
                      id="excelFileInput" 
                      accept=".xlsx, .xls"
                      onChange={handleExcelUpload} 
                      style={{ display: 'none' }} 
                    />
                  </div>

                  {excelError && (
                    <div className="excel-error-box">
                      <strong>Parsing Warnings:</strong>
                      <p>{excelError}</p>
                    </div>
                  )}

                  {excelParsedData.length > 0 && (
                    <div className="excel-preview-box">
                      <p>Parsed <strong>{excelParsedData.length}</strong> valid entries.</p>
                      <button 
                        type="button" 
                        className="action-btn import-btn"
                        onClick={handleExcelImportSubmit}
                        disabled={isImporting}
                      >
                        {isImporting ? 'Importing logs...' : 'Confirm and Save Records'}
                      </button>
                    </div>
                  )}

                  {excelSuccessMsg && (
                    <span className="success-banner">
                      {excelSuccessMsg}
                    </span>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Column 2: Logs List and Retrieval Database */}
          <section className="data-column">
            
            {/* Focused Log Preview Drawer */}
            {focusedLog && (
              <div className="focused-log-card glass-panel" id="focusedLogContainer" style={{ display: 'flex' }}>
                <span className="close-focus-btn" onClick={handleResetSearch}>&times;</span>
                <span className="focus-badge">Selected Record</span>
                <div className="focus-header">
                  <div className={`focus-avatar avatar-${focusedLog.shift.toLowerCase()}`}>
                    {focusedLog.name.charAt(0)}
                  </div>
                  <div>
                    <h3>{focusedLog.name}</h3>
                    <div className="focus-meta">
                      <span>Ref ID: <strong>{focusedLog.id}</strong></span>
                      <span className={`shift-badge badge-${focusedLog.shift.toLowerCase()}`}>Shift {focusedLog.shift}</span>
                    </div>
                  </div>
                </div>
                <div className="focus-details">
                  <div className="detail-item">
                    <span className="lbl">Logged On</span>
                    <span className="val">{formatDate(focusedLog.date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="lbl">Roster Description</span>
                    <span className="val">{focusedLog.work_description}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Ribbon */}
            <div className="metrics-ribbon">
              <div className="metric-box glass-panel">
                <span className="lbl">Total Shift Logs</span>
                <span className="val" id="metricTotalLogs">{totalCount}</span>
              </div>
              <div className="metric-box glass-panel">
                <span className="lbl">Active Shifts</span>
                <span className="val" id="metricActiveShifts">{loggedShifts}</span>
              </div>
              <div className="metric-box glass-panel">
                <span className="lbl">Filtered Results</span>
                <span className="val" id="metricFilterCount">{matchCountLabel}</span>
              </div>
            </div>

            {/* Roster Search Database Section */}
            <div className="glass-panel logs-list-card">
              <div className="list-card-header">
                <h3>Roster Database Logs</h3>
                <div className="search-bar">
                  <input 
                    type="text" 
                    id="dbSearchInput" 
                    placeholder="Search logs by staff name, ID or shift..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && <button onClick={handleResetSearch}>Clear</button>}
                </div>
              </div>

              {/* Quick Tags List */}
              <div className="quick-tags-section">
                <span>Filter by Employee:</span>
                <div id="quickTagsList" className="quick-tags-container">
                  {quickTags.map(name => (
                    <button 
                      key={name} 
                      type="button" 
                      className={`tag-btn ${searchQuery === name ? 'active' : ''}`}
                      onClick={() => handleTagClick(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster Data List */}
              <div className="results-section">
                <div className="section-title">
                  <span id="matchFooter">{matchFooterLabel}</span>
                </div>

                <div id="logsGrid" className="log-grid">
                  {filteredLogs.length === 0 ? (
                    <div className="no-results-panel">
                      <p>No matching shift logs found in the database.</p>
                    </div>
                  ) : (
                    filteredLogs.map(log => {
                      const shiftClass = log.shift.toLowerCase();
                      return (
                        <div 
                          key={log._id} 
                          className={`person-card glass-panel ${focusedLog && focusedLog._id === log._id ? 'active-match' : ''}`}
                          onClick={() => handleCardClick(log)}
                        >
                          <div className="card-top">
                            <div className="person-identity">
                              <div className={`avatar avatar-${shiftClass}`}>
                                {log.name.charAt(0)}
                              </div>
                              <div>
                                <div className="person-name">{log.name}</div>
                                <div className="person-id">{log.id}</div>
                              </div>
                            </div>
                            <span className={`shift-badge badge-${shiftClass}`}>Shift {log.shift}</span>
                          </div>
                          <div className="card-middle">
                            <div className="log-date">
                              <span>📅</span>
                              {formatDate(log.date)}
                            </div>
                            <p className="work-desc">{log.work_description}</p>
                          </div>
                          <div className="card-footer">
                            <span>View Record &rarr;</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Employee Directory Tab */}
      {primaryTab === 'employees' && (
        <div className="directory-tab-container" style={{ display: 'grid', gridTemplateColumns: selectedEmployee ? '1fr 400px' : '1fr', gap: '2rem' }}>
          
          <div className="employee-list-section glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <div className="header-actions-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2>Employee Directory</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage company accounts, roles, and profiles</p>
              </div>
              <button 
                type="button" 
                className="action-btn" 
                onClick={() => setShowAddEmpModal(true)}
                style={{ background: 'var(--grad-primary)', border: 'none', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                + Create Employee Account
              </button>
            </div>

            {/* Filters Row */}
            <div className="filters-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Search by ID, name or role..."
                className="form-input"
                style={{ flexGrow: 1, maxWidth: '300px' }}
                value={searchEmployeeQuery}
                onChange={(e) => setSearchEmployeeQuery(e.target.value)}
              />
              <select 
                className="form-input" 
                style={{ maxWidth: '180px' }}
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="">All Departments</option>
                {['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Logistics'].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select 
                className="form-input" 
                style={{ maxWidth: '150px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Employees Grid Table */}
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                    <th style={{ padding: '0.75rem' }}>Employee</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</td>
                    </tr>
                  ) : (
                    filteredEmployees.map(emp => (
                      <tr 
                        key={emp._id} 
                        onClick={() => handleEmployeeClick(emp)}
                        className={`clickable-row ${selectedEmployee && selectedEmployee._id === emp._id ? 'active-row' : ''}`}
                        style={{ 
                          borderBottom: '1px solid var(--glass-border)', 
                          cursor: 'pointer',
                          backgroundColor: selectedEmployee && selectedEmployee._id === emp._id ? 'rgba(124, 58, 237, 0.05)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            overflow: 'hidden', 
                            background: 'var(--grad-primary)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: '600'
                          }}>
                            {emp.profilePhoto ? (
                              <img src={emp.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              emp.fullName.charAt(0)
                            )}
                          </div>
                          <span style={{ fontWeight: '500' }}>{emp.fullName}</span>
                        </td>
                        <td>{emp.employeeId}</td>
                        <td>{emp.department}</td>
                        <td>{emp.designation}</td>
                        <td>{formatCurrency(emp.monthlySalary)}</td>
                        <td>
                          <span className={`status-pill ${emp.status.toLowerCase()}`} style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: emp.status === 'Active' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(225, 29, 72, 0.1)',
                            color: emp.status === 'Active' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                          }}>{emp.status}</span>
                        </td>
                        <td>{new Date(emp.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employee Detail Sidebar Drawer */}
          {selectedEmployee && (
            <aside className="employee-drawer glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="focus-badge">Employee Card</span>
                <button type="button" onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
              </div>

              {/* Profile Card Header */}
              <div className="drawer-header" style={{ textAlign: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.25rem' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '24px', 
                  overflow: 'hidden', 
                  background: 'var(--grad-primary)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '2rem',
                  marginBottom: '0.75rem',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {selectedEmployee.profilePhoto ? (
                    <img src={selectedEmployee.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    selectedEmployee.fullName.charAt(0)
                  )}
                </div>
                <h3>{selectedEmployee.fullName}</h3>
                <p style={{ color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }}>{selectedEmployee.designation}</p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                  <span className="detail-id" style={{ fontSize: '0.8rem', padding: '0.1rem 0.4rem' }}>{selectedEmployee.employeeId}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>|</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--accent-purple)' }}>{selectedEmployee.department}</span>
                </div>
              </div>

              {/* Details Content */}
              <div className="drawer-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', maxHeight: 'calc(100vh - 400px)', paddingRight: '0.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Employee Stats</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Joining Date</span>
                      <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{new Date(selectedEmployee.joiningDate).toLocaleDateString('en-US')}</p>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mobile</span>
                      <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{selectedEmployee.mobileNumber}</p>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Salary Payout</span>
                      <p style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>{formatCurrency(selectedEmployee.monthlySalary)}</p>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Attendance Status</span>
                      <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{employeeAttendanceCount.total} Shifts</p>
                    </div>
                  </div>
                </div>

                {/* Shift Attendance Breakdown */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Attendance Shifts Breakdown</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['A', 'B', 'C'].map(shift => (
                      <div key={shift} style={{ flexGrow: 1, textAlign: 'center', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--glass-border)', padding: '0.4rem', borderRadius: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>Shift {shift}</span>
                        <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{employeeAttendanceCount[shift] || 0}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Salary Payments history */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Recent Payment History</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {employeeSalaryHistory.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No salary payouts logged yet.</p>
                    ) : (
                      employeeSalaryHistory.slice(0, 3).map(sal => (
                        <div key={sal._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--glass-border)', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <span><strong>{sal.month}</strong></span>
                          <span>{formatCurrency(sal.netSalary)}</span>
                          <span style={{ color: sal.paymentStatus === 'Paid' ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: '600' }}>{sal.paymentStatus}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Administrative Notes */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Administrative Notes (Internal)</h4>
                  <textarea 
                    defaultValue={selectedEmployee.companyNotes}
                    onBlur={(e) => handleUpdateNotes(e.target.value)}
                    placeholder="Add internal notes about performance, notes, policy details..."
                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', resize: 'vertical' }}
                    rows="3"
                  ></textarea>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>*Auto-saves when you click outside.</span>
                </div>
              </div>
              
              <button 
                type="button"
                className="action-btn"
                onClick={() => {
                  setPrimaryTab('chats');
                  setActiveThreadId(selectedEmployee._id);
                }}
                style={{ width: '100%', background: 'none', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)', padding: '0.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                💬 Open Confidential Chat
              </button>
            </aside>
          )}

          {/* Create Employee Account Modal */}
          {showAddEmpModal && (
            <div className="modal-backdrop" style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div className="glass-panel modal-card" style={{
                background: '#fff', width: '90%', maxWidth: '600px', borderRadius: '16px',
                padding: '2rem', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Create Employee Account</h3>
                  <button type="button" onClick={() => setShowAddEmpModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                <form onSubmit={handleAddEmployeeSubmit} className="input-form">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input type="text" className="form-input" required value={empFullName} onChange={(e) => setEmpFullName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input type="text" className="form-input" required value={empMobileNumber} onChange={(e) => setEmpMobileNumber(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" className="form-input" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Joining Date *</label>
                      <input type="date" className="form-input" required value={empJoiningDate} onChange={(e) => setEmpJoiningDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Department *</label>
                      <select className="form-input" value={empDepartment} onChange={(e) => setEmpDepartment(e.target.value)}>
                        {['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Logistics'].map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Designation *</label>
                      <select className="form-input" value={empDesignation} onChange={(e) => setEmpDesignation(e.target.value)}>
                        {['Software Engineer', 'Senior Engineer', 'Manager', 'Analyst', 'HR Specialist', 'Logistics Lead', 'Coordinator'].map(des => (
                          <option key={des} value={des}>{des}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Monthly Base Salary (INR) *</label>
                      <input type="number" className="form-input" required value={empMonthlySalary} onChange={(e) => setEmpMonthlySalary(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Portal Login Password *</label>
                      <input type="password" placeholder="Define temporary password" className="form-input" required value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Profile Picture</label>
                      <input type="file" accept="image/*" className="form-input" onChange={handleProfilePhotoChange} />
                    </div>
                    <div className="form-group">
                      <label>Employment Status</label>
                      <select className="form-input" value={empStatus} onChange={(e) => setEmpStatus(e.target.value)}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Initial Administration Notes</label>
                    <textarea className="form-input" value={empCompanyNotes} onChange={(e) => setEmpCompanyNotes(e.target.value)} rows="2"></textarea>
                  </div>

                  <button type="submit" className="action-btn" style={{ width: '100%', background: 'var(--grad-primary)', border: 'none', color: '#fff', padding: '0.75rem', borderRadius: '8px', fontWeight: '600', marginTop: '1rem', cursor: 'pointer' }}>
                    Generate Account & ID
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Salary & Payroll Tab */}
      {primaryTab === 'salary' && (
        <div className="salary-tab-container" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
          
          {/* Column 1: Record Salary Form */}
          <div className="salary-form-card glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', height: 'fit-content' }}>
            <h3 className="panel-title">💰 Log Salary Payout</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Record monthly compensation details for staff roster</p>

            <form onSubmit={handleAddSalarySubmit} className="input-form">
              <div className="form-group">
                <label>Select Employee *</label>
                <select 
                  className="form-input"
                  required
                  value={salEmployeeId}
                  onChange={(e) => {
                    setSalEmployeeId(e.target.value);
                    const selected = employees.find(emp => emp._id === e.target.value);
                    if (selected) setSalBase(selected.monthlySalary);
                  }}
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Pay Month *</label>
                  <input type="month" className="form-input" required value={salMonth} onChange={(e) => setSalMonth(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Base Salary (INR) *</label>
                  <input type="number" className="form-input" required value={salBase} onChange={(e) => setSalBase(e.target.value)} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Bonus (INR)</label>
                  <input type="number" className="form-input" value={salBonus} onChange={(e) => setSalBonus(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Deductions (INR)</label>
                  <input type="number" className="form-input" value={salDeductions} onChange={(e) => setSalDeductions(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Payment Status</label>
                <select className="form-input" value={salStatus} onChange={(e) => setSalStatus(e.target.value)}>
                  <option value="Unpaid">Unpaid / Processing</option>
                  <option value="Paid">Paid / Settled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Remarks / Notes</label>
                <input type="text" className="form-input" placeholder="e.g. Performance bonus included" value={salRemarks} onChange={(e) => setSalRemarks(e.target.value)} />
              </div>

              <button type="submit" className="action-btn" style={{ width: '100%', background: 'var(--grad-primary)', border: 'none', color: '#fff', padding: '0.65rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Publish Payslip Record
              </button>
            </form>
          </div>

          {/* Column 2: Payroll reports and list */}
          <div className="salary-data-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header / Month Filter */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Payroll Summary Reports</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Select Report Month:</span>
                <input 
                  type="month" 
                  className="form-input" 
                  value={salaryMonth} 
                  onChange={(e) => setSalaryMonth(e.target.value)} 
                  style={{ width: '180px', margin: 0 }}
                />
              </div>
            </div>

            {/* Quick Stats Ribbon */}
            <div className="metrics-ribbon" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="metric-box glass-panel" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
                <span className="lbl">Total Payroll Cost</span>
                <span className="val" style={{ color: 'var(--accent-purple)' }}>{formatCurrency(salaryReport.totalPayroll)}</span>
              </div>
              <div className="metric-box glass-panel" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
                <span className="lbl">Settled Payouts</span>
                <span className="val" style={{ color: 'var(--accent-emerald)' }}>{formatCurrency(salaryReport.totalPaid)}</span>
              </div>
              <div className="metric-box glass-panel" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
                <span className="lbl">Outstanding Unpaid</span>
                <span className="val" style={{ color: 'var(--accent-rose)' }}>{formatCurrency(salaryReport.totalUnpaid)}</span>
              </div>
            </div>

            {/* Main Payouts Table */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <h4 style={{ marginBottom: '1rem' }}>Salary Registers ({salaryReport.records.length} items)</h4>
              
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                      <th style={{ padding: '0.5rem' }}>Staff Name</th>
                      <th>Ref ID</th>
                      <th>Department</th>
                      <th>Base Pay</th>
                      <th>Bonus/Deductions</th>
                      <th>Net Payout</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryReport.records.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No salary records logged for {salaryMonth}.</td>
                      </tr>
                    ) : (
                      salaryReport.records.map(rec => (
                        <tr key={rec._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '0.65rem 0.5rem', fontWeight: '500' }}>{rec.employee?.fullName || 'Removed staff'}</td>
                          <td>{rec.employee?.employeeId || 'N/A'}</td>
                          <td>{rec.employee?.department || 'N/A'}</td>
                          <td>{formatCurrency(rec.baseSalary)}</td>
                          <td style={{ color: rec.bonus > 0 ? 'var(--accent-emerald)' : 'inherit' }}>
                            {rec.bonus > 0 ? `+${formatCurrency(rec.bonus)}` : ''}
                            {rec.deductions > 0 ? ` -${formatCurrency(rec.deductions)}` : ''}
                            {rec.bonus === 0 && rec.deductions === 0 ? 'None' : ''}
                          </td>
                          <td style={{ fontWeight: '700' }}>{formatCurrency(rec.netSalary)}</td>
                          <td>
                            <span style={{
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: rec.paymentStatus === 'Paid' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(225, 29, 72, 0.1)',
                              color: rec.paymentStatus === 'Paid' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                            }}>{rec.paymentStatus}</span>
                          </td>
                          <td>
                            {rec.paymentStatus === 'Unpaid' ? (
                              <button 
                                type="button" 
                                className="action-btn"
                                onClick={() => handleMarkSalaryPaid(rec._id)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--grad-emerald)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Paid ({new Date(rec.paymentDate).toLocaleDateString()})</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Bulletins / Announcements Tab */}
      {primaryTab === 'announcements' && (
        <div className="announcements-tab-container" style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem' }}>
          
          {/* Column 1: Publish Announcement Form */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', height: 'fit-content' }}>
            <h3 className="panel-title">📢 Broadcast Bulletin</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Publish company announcements and department updates</p>

            <form onSubmit={handleAddAnnouncementSubmit} className="input-form">
              <div className="form-group">
                <label>Announcement Title *</label>
                <input type="text" className="form-input" required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="e.g. Office Holiday Notice" />
              </div>

              <div className="form-group">
                <label>Target Audience Scope</label>
                <select className="form-input" value={annTarget} onChange={(e) => setAnnTarget(e.target.value)}>
                  <option value="All">Broadcast to All Employees</option>
                  <option value="Department">Target Specific Department</option>
                </select>
              </div>

              {annTarget === 'Department' && (
                <div className="form-group">
                  <label>Select Target Department</label>
                  <select className="form-input" value={annDept} onChange={(e) => setAnnDept(e.target.value)}>
                    {['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Logistics'].map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Bulletin Description *</label>
                <textarea className="form-input" required value={annContent} onChange={(e) => setAnnContent(e.target.value)} rows="5" placeholder="Write bulletin details here..."></textarea>
              </div>

              <button type="submit" className="action-btn" style={{ width: '100%', background: 'var(--grad-primary)', border: 'none', color: '#fff', padding: '0.65rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Publish Broadcast
              </button>
            </form>
          </div>

          {/* Column 2: Announcements List */}
          <div className="announcements-list-container glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h3>Recent Bulletins</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Active company broadcasts and memo feeds</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No announcements published yet.</p>
              ) : (
                announcements.map(ann => (
                  <div key={ann._id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-purple)', background: 'rgba(0,0,0,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{ann.title}</h4>
                      <span className="detail-id" style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}>
                        Target: {ann.target === 'All' ? 'All Staff' : `Dept (${ann.department})`}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Published on {new Date(ann.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Confidential Chats Tab */}
      {primaryTab === 'chats' && (
        <div className="chats-tab-container glass-panel" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1px', background: 'var(--glass-border)', padding: 0, borderRadius: '16px', overflow: 'hidden', height: 'calc(100vh - 250px)', minHeight: '500px' }}>
          
          {/* Left Panel: Conversations Thread list */}
          <div className="chat-threads-sidebar" style={{ background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Employee Channels</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Private 1-to-1 secure query system</p>
            </div>
            <div className="threads-list" style={{ flexGrow: 1 }}>
              {threads.length === 0 ? (
                <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active chat channels.</p>
              ) : (
                threads.map(thread => (
                  <div 
                    key={thread.employee._id}
                    onClick={() => {
                      setActiveThreadId(thread.employee._id);
                      fetchChatMessages(thread.employee._id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      background: activeThreadId === thread.employee._id ? 'rgba(124, 58, 237, 0.05)' : 'transparent',
                      transition: 'background var(--transition-fast)'
                    }}
                  >
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      background: 'var(--grad-primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      {thread.employee.fullName.charAt(0)}
                    </div>
                    <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{thread.employee.fullName}</span>
                        {thread.unreadCount > 0 && (
                          <span style={{ background: 'var(--accent-rose)', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '0.1rem 0.35rem', borderRadius: '10px' }}>
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {thread.lastMessage ? thread.lastMessage.content : 'No messages yet'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Chat Thread Window */}
          <div className="chat-window" style={{ background: '#f9fafb', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {activeThreadId ? (
              <>
                {/* Chat Header */}
                <div className="chat-header" style={{ padding: '0.75rem 1.5rem', background: '#fff', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justify: 'center', color: '#fff', fontWeight: '600', justifyContent: 'center' }}>
                    {employees.find(e => e._id === activeThreadId)?.fullName?.charAt(0) || ''}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>
                      {employees.find(e => e._id === activeThreadId)?.fullName}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {employees.find(e => e._id === activeThreadId)?.designation} | {employees.find(e => e._id === activeThreadId)?.employeeId}
                    </p>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="chat-messages-body" style={{ flexGrow: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <p style={{ fontSize: '1.5rem' }}>💬</p>
                      <p style={{ fontSize: '0.85rem' }}>This is the beginning of your private secure chat channel.</p>
                    </div>
                  ) : (
                    chatMessages.map(msg => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div 
                          key={msg._id} 
                          style={{
                            maxWidth: '70%',
                            padding: '0.65rem 1rem',
                            fontSize: '0.85rem',
                            lineHeight: '1.4',
                            alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                            background: isAdmin ? 'var(--grad-primary)' : '#fff',
                            color: isAdmin ? '#fff' : 'var(--text-primary)',
                            boxShadow: 'var(--shadow-sm)',
                            border: isAdmin ? 'none' : '1px solid var(--glass-border)',
                            borderRadius: isAdmin ? '12px 12px 0 12px' : '12px 12px 12px 0'
                          }}
                        >
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                          <span style={{ display: 'block', textAlign: 'right', fontSize: '0.65rem', marginTop: '0.25rem', opacity: 0.7 }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef}></div>
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSendChatMessage} style={{ padding: '1rem', background: '#fff', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.75rem' }}>
                  <input 
                    type="text" 
                    placeholder="Type private message to employee..." 
                    className="form-input"
                    style={{ margin: 0, flexGrow: 1 }}
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                  />
                  <button type="submit" className="action-btn" style={{ margin: 0, background: 'var(--grad-primary)', border: 'none', color: '#fff', padding: '0 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '3rem' }}>💬</p>
                <h3>Private Secure Chat Workspace</h3>
                <p style={{ fontSize: '0.9rem', maxWidth: '300px', margin: 'auto' }}>Select an active employee channel from the list on the left to start corresponding.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

export default AdminPortal;
