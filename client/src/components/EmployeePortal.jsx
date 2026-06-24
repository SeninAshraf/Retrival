import React, { useState, useEffect, useRef } from 'react';

function EmployeePortal({ token, empId }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'roster', 'salary', 'chat'

  // Employee State Data
  const [profile, setProfile] = useState(null);
  const [rosterLogs, setRosterLogs] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const chatEndRef = useRef(null);

  // Edit Profile States
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Modal State for Payslip
  const [activePayslip, setActivePayslip] = useState(null);

  // Headers helper
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Load employee profile and initial feeds on mount
  useEffect(() => {
    fetchProfile();
    fetchRoster();
    fetchSalaryHistory();
    fetchAnnouncements();
    fetchUnreadChatCount();
  }, [empId]);

  // Tab switching triggers
  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatMessages(empId);
      setUnreadChatCount(0);
    }
  }, [activeTab]);

  // Polling for chat messages and notifications
  useEffect(() => {
    let interval;
    if (activeTab === 'chat') {
      interval = setInterval(() => {
        fetchChatMessages(empId, false);
      }, 5000);
    } else {
      interval = setInterval(() => {
        fetchUnreadChatCount();
      }, 7000);
    }
    return () => clearInterval(interval);
  }, [activeTab, empId]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/employees/me', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setEditEmail(data.data.email || '');
        setEditMobile(data.data.mobileNumber || '');
        setEditPhoto(data.data.profilePhoto || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoster = async () => {
    try {
      // Fetch all logs, then filter by employee's unique staff reference ID
      const res = await fetch('/api/logs', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const filtered = data.data.filter(log => 
          String(log.id).trim().toLowerCase() === String(empId).trim().toLowerCase()
        );
        setRosterLogs(filtered);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalaryHistory = async () => {
    try {
      const res = await fetch('/api/salary/me', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setSalaryHistory(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements/me', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatMessages = async (employeeId, markRead = true) => {
    try {
      if (!profile) return;
      const res = await fetch(`/api/chats/thread/${profile._id}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data);
        
        if (markRead) {
          await fetch('/api/chats/read', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ employeeId: profile._id })
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnreadChatCount = async () => {
    try {
      if (!profile) return;
      const res = await fetch(`/api/chats/thread/${profile._id}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const unread = data.data.filter(msg => msg.sender === 'admin' && !msg.readByEmployee).length;
        setUnreadChatCount(unread);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees/me', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          email: editEmail,
          mobileNumber: editMobile,
          profilePhoto: editPhoto
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !profile) return;

    try {
      const res = await fetch('/api/chats/message', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          employee: profile._id,
          content: chatInputText.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatInputText('');
        fetchChatMessages(profile._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  if (!profile) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
        <p>Loading personal workspace profile...</p>
      </div>
    );
  }

  // Attendance metrics
  const attendanceTotal = rosterLogs.length;
  const shiftACount = rosterLogs.filter(l => l.shift === 'A').length;
  const shiftBCount = rosterLogs.filter(l => l.shift === 'B').length;
  const shiftCCount = rosterLogs.filter(l => l.shift === 'C').length;

  return (
    <div id="employeePortalArea">
      
      {/* Tab Navigation header */}
      <nav className="dashboard-nav glass-panel" style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        padding: '0.75rem 1.5rem', 
        marginBottom: '2rem', 
        borderRadius: '12px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'dashboard', label: 'My Dashboard', icon: '👤' },
          { id: 'roster', label: 'My Duty Roster', icon: '📅' },
          { id: 'salary', label: 'My Payslips', icon: '💰' },
          { id: 'chat', label: 'Helpdesk & Query Chat', icon: '💬', badge: unreadChatCount }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--grad-primary)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              position: 'relative',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: 'var(--accent-rose)', color: '#fff',
                fontSize: '0.65rem', fontWeight: '700',
                padding: '0.1rem 0.35rem', borderRadius: '10px',
                border: '2px solid #fff'
              }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Workspace Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* Column 1: Profile Summary Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel profile-card" style={{ padding: '2rem 1.5rem', borderRadius: '16px', textAlign: 'center', position: 'relative' }}>
              <button 
                type="button" 
                onClick={() => setIsEditing(!isEditing)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
              >
                {isEditing ? 'Cancel' : '✍️ Edit Info'}
              </button>

              <div style={{ 
                width: '90px', 
                height: '90px', 
                borderRadius: '28px', 
                overflow: 'hidden', 
                background: 'var(--grad-primary)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '700',
                fontSize: '2.5rem',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                {profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile.fullName.charAt(0)
                )}
              </div>
              
              <h3>{profile.fullName}</h3>
              <p style={{ color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.95rem' }}>{profile.designation}</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                <span className="detail-id" style={{ fontSize: '0.85rem' }}>{profile.employeeId}</span>
                <span style={{ color: 'var(--text-muted)' }}>|</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-purple)' }}>{profile.department}</span>
              </div>

              {!isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Mobile:</span>
                    <span style={{ fontWeight: '600' }}>{profile.mobileNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                    <span style={{ fontWeight: '600' }}>{profile.email || 'Not configured'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Date Joined:</span>
                    <span style={{ fontWeight: '600' }}>{formatDate(profile.joiningDate)}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', textAlign: 'left' }}>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.8rem' }}>Change Email</label>
                    <input type="email" className="form-input" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.8rem' }}>Change Mobile</label>
                    <input type="text" className="form-input" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} value={editMobile} onChange={(e) => setEditMobile(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem' }}>Upload Profile Picture</label>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: '0.8rem' }} />
                  </div>
                  <button type="submit" className="action-btn" style={{ width: '100%', padding: '0.5rem', background: 'var(--grad-primary)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                    Save Info
                  </button>
                </form>
              )}
            </div>

            {/* Attendance Analytics Metrics */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <h4 style={{ marginBottom: '1rem' }}>Attendance Analytics Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Roster Shifts</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>{attendanceTotal}</p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated Worked Hours</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{attendanceTotal * 8}h</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[['A', shiftACount], ['B', shiftBCount], ['C', shiftCCount]].map(([shift, count]) => (
                  <div key={shift} style={{ flexGrow: 1, textAlign: 'center', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--glass-border)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <span>Shift {shift}</span>
                    <p style={{ fontWeight: '700' }}>{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Announcements Feed and Admin Communication */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Announcements Board */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <h3 style={{ marginBottom: '1rem' }}>📢 Company Bulletins Feed</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
                {announcements.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No company announcements published.</p>
                ) : (
                  announcements.map(ann => (
                    <div key={ann._id} style={{ padding: '1rem', borderLeft: '3px solid var(--accent-purple)', background: 'rgba(0,0,0,0.01)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{ann.title}</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Admin shared private notes */}
            {profile.companyNotes && (
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: '4px solid var(--accent-cyan)' }}>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📌</span> Shared Administrator Notes
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {profile.companyNotes}
                </p>
              </div>
            )}

            {/* Recent Duty Shifts Box */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <h3 style={{ marginBottom: '1rem' }}>📅 Next Shift Roster Schedules</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rosterLogs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No logged shift roster records found.</p>
                ) : (
                  rosterLogs.slice(0, 3).map(log => {
                    const shiftClass = log.shift.toLowerCase();
                    return (
                      <div key={log._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem' }}>{formatDate(log.date)}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.work_description.slice(0, 45)}...</p>
                        </div>
                        <span className={`shift-badge badge-${shiftClass}`}>Shift {log.shift}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Duty Roster Tab */}
      {activeTab === 'roster' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          <h2>My Duty Roster Logs ({rosterLogs.length})</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Historical catalog of shift details and tasks performed</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rosterLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No shift logs registered under your employee profile.</p>
            ) : (
              rosterLogs.map(log => {
                const shiftClass = log.shift.toLowerCase();
                return (
                  <div key={log._id} style={{ display: 'flex', gap: '1.5rem', padding: '1.25rem', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>
                        {new Date(log.date).getDate()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                    
                    <div style={{ flexGrow: 1, borderLeft: '1px solid var(--glass-border)', paddingLeft: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span className={`shift-badge badge-${shiftClass}`}>Shift {log.shift}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {log.id}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{log.work_description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Salary Tab */}
      {activeTab === 'salary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* Base Compensation Info Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h3>Compensation Contract</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Registered employee compensation packages</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Monthly Base Salary</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>{formatCurrency(profile.monthlySalary)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Estimated Yearly CTC</span>
                <strong style={{ fontSize: '1.1rem' }}>{formatCurrency(profile.monthlySalary * 12)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bank Settlement</span>
                <strong>Direct Deposit (INR)</strong>
              </div>
            </div>
          </div>

          {/* Salary statements / slips List */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h3>Monthly Payslip Registers</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Download and view generated monthly statements</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {salaryHistory.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No salary logs published yet for this account.</p>
              ) : (
                salaryHistory.map(sal => (
                  <div 
                    key={sal._id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem 1rem', 
                      background: 'rgba(0,0,0,0.01)', 
                      border: '1px solid var(--glass-border)', 
                      borderRadius: '8px' 
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{sal.month}</span>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Net Payout: {formatCurrency(sal.netSalary)} | <span style={{ color: sal.paymentStatus === 'Paid' ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: '600' }}>{sal.paymentStatus}</span>
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActivePayslip(sal)}
                      style={{ 
                        background: 'none', 
                        border: '1px solid var(--accent-purple)', 
                        color: 'var(--accent-purple)', 
                        padding: '0.35rem 0.75rem', 
                        borderRadius: '6px', 
                        fontSize: '0.8rem', 
                        fontWeight: '600', 
                        cursor: 'pointer' 
                      }}
                    >
                      📄 View Slip
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payslip View Print Modal */}
          {activePayslip && (
            <div className="modal-backdrop" style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div className="glass-panel payslip-modal-container" style={{
                background: '#fff', width: '90%', maxWidth: '650px', borderRadius: '16px',
                padding: '2rem', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto'
              }}>
                {/* Modal actions */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={() => window.print()}
                    style={{ background: 'var(--grad-primary)', border: 'none', color: '#fff', padding: '0.45rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    🖨️ Print / Download PDF
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setActivePayslip(null)} 
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    &times; Close
                  </button>
                </div>

                {/* Printable Payslip Invoice Layout */}
                <div className="printable-payslip" style={{ fontFamily: 'monospace', color: '#000', padding: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ margin: 0, letterSpacing: '-0.02em' }}>SHIFTSYNC LOGISTICS INC.</h2>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>Workforce & Roster Management System</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h3 style={{ margin: 0 }}>PAYSLIP STATEMENT</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>Statement Month: <strong>{activePayslip.month}</strong></p>
                    </div>
                  </div>

                  {/* Info table */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <div>
                      <p style={{ margin: '0.2rem 0' }}><strong>Employee Name:</strong> {activePayslip.employee?.fullName}</p>
                      <p style={{ margin: '0.2rem 0' }}><strong>Employee ID:</strong> {activePayslip.employee?.employeeId}</p>
                      <p style={{ margin: '0.2rem 0' }}><strong>Department:</strong> {activePayslip.employee?.department}</p>
                      <p style={{ margin: '0.2rem 0' }}><strong>Designation:</strong> {activePayslip.employee?.designation}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0.2rem 0' }}><strong>Joining Date:</strong> {new Date(activePayslip.employee?.joiningDate).toLocaleDateString()}</p>
                      <p style={{ margin: '0.2rem 0' }}><strong>Payment Status:</strong> {activePayslip.paymentStatus}</p>
                      <p style={{ margin: '0.2rem 0' }}><strong>Settlement Date:</strong> {activePayslip.paymentDate ? new Date(activePayslip.paymentDate).toLocaleDateString() : 'Pending'}</p>
                      <p style={{ margin: '0.2rem 0' }}><strong>Statement ID:</strong> ST-{activePayslip._id.slice(-8).toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Calculations Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', background: 'rgba(0,0,0,0.02)' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Earnings Component</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px dotted #ccc' }}>
                        <td style={{ padding: '0.5rem' }}>Base Salary / Contract Fee</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(activePayslip.baseSalary)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px dotted #ccc' }}>
                        <td style={{ padding: '0.5rem' }}>Monthly Performance Bonuses</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: activePayslip.bonus > 0 ? '#059669' : 'inherit' }}>
                          {activePayslip.bonus > 0 ? `+${formatCurrency(activePayslip.bonus)}` : '—'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px dotted #ccc' }}>
                        <td style={{ padding: '0.5rem' }}>Deductions (Unpaid Leave / Penalty)</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: activePayslip.deductions > 0 ? '#e11d48' : 'inherit' }}>
                          {activePayslip.deductions > 0 ? `-${formatCurrency(activePayslip.deductions)}` : '—'}
                        </td>
                      </tr>
                      <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', fontWeight: 'bold', fontSize: '1rem' }}>
                        <td style={{ padding: '0.5rem' }}>NET PAYABLE OUTSTANDING</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(activePayslip.netSalary)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {activePayslip.remarks && (
                    <p style={{ fontSize: '0.85rem', borderLeft: '2px solid #000', paddingLeft: '0.5rem', fontStyle: 'italic', marginBottom: '2rem' }}>
                      <strong>Remarks:</strong> {activePayslip.remarks}
                    </p>
                  )}

                  {/* Print signature footer */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '4rem', fontSize: '0.85rem' }}>
                    <div style={{ borderTop: '1px solid #000', textAlign: 'center', paddingTop: '0.5rem' }}>
                      Employee Signature
                    </div>
                    <div style={{ borderTop: '1px solid #000', textAlign: 'center', paddingTop: '0.5rem' }}>
                      Authorized Admin Seal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Helpdesk Query Chat Tab */}
      {activeTab === 'chat' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)', minHeight: '500px', padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
          
          {/* Chat Header */}
          <div style={{ padding: '1rem 1.5rem', background: '#fff', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>💬</span>
            <div>
              <h4 style={{ margin: 0 }}>Workforce Helpdesk</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidential secure communication direct to Administration</p>
            </div>
          </div>

          {/* Messages body list */}
          <div style={{ flexGrow: 1, padding: '1.5rem', background: '#f9fafb', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chatMessages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem' }}>💬</p>
                <h3>Have questions about roster schedules or payroll?</h3>
                <p style={{ fontSize: '0.85rem' }}>Send a confidential message directly to Admin below.</p>
              </div>
            ) : (
              chatMessages.map(msg => {
                const isEmployee = msg.sender === 'employee';
                return (
                  <div
                    key={msg._id}
                    style={{
                      maxWidth: '70%',
                      padding: '0.65rem 1rem',
                      fontSize: '0.85rem',
                      lineHeight: '1.4',
                      alignSelf: isEmployee ? 'flex-end' : 'flex-start',
                      background: isEmployee ? 'var(--grad-primary)' : '#fff',
                      color: isEmployee ? '#fff' : 'var(--text-primary)',
                      boxShadow: 'var(--shadow-sm)',
                      border: isEmployee ? 'none' : '1px solid var(--glass-border)',
                      borderRadius: isEmployee ? '12px 12px 0 12px' : '12px 12px 12px 0'
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

          {/* Chat input footer */}
          <form onSubmit={handleSendChatMessage} style={{ padding: '1rem', background: '#fff', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.75rem' }}>
            <input 
              type="text" 
              placeholder="Type your message direct to Admin..." 
              className="form-input"
              style={{ margin: 0, flexGrow: 1 }}
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
            />
            <button type="submit" className="action-btn" style={{ margin: 0, background: 'var(--grad-primary)', border: 'none', color: '#fff', padding: '0 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Send
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

export default EmployeePortal;
