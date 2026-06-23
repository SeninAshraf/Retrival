// Roster Database (Stored in-memory)
const database = {
  "work_log": [
    {
      "date": "2026-01-04",
      "shift": "A",
      "name": "Shanmugam",
      "id": "A131",
      "work_description": "Electrical maintenance in production area"
    },
    {
      "date": "2026-01-06",
      "shift": "A",
      "name": "Desai",
      "id": "D500",
      "work_description": "Machine inspection and servicing"
    },
    {
      "date": "2026-01-08",
      "shift": "A",
      "name": "Arun",
      "id": "C301",
      "work_description": "Material loading and unloading"
    },
    {
      "date": "2026-01-11",
      "shift": "B",
      "name": "Rajesh",
      "id": "R701",
      "work_description": "Welding work in fabrication section"
    },
    {
      "date": "2026-01-15",
      "shift": "C",
      "name": "Praveen",
      "id": "P802",
      "work_description": "General maintenance and cleaning"
    }
  ]
};

// Global App State
let appSessionState = {
  role: null, // 'admin' or 'employee'
};

// ==================== DOM ELEMENTS BINDINGS ====================

// Login Elements
const loginWrapper = document.getElementById('loginWrapper');
const loginForm = document.getElementById('loginForm');
const loginRole = document.getElementById('loginRole');
const loginPassword = document.getElementById('loginPassword');
const loginErrorMsg = document.getElementById('loginErrorMsg');
const appContainer = document.getElementById('appContainer');

// Roster Shell Elements
const portalSubTitle = document.getElementById('portalSubTitle');
const roleBadge = document.getElementById('roleBadge');
const logoutBtn = document.getElementById('logoutBtn');
const adminPortalArea = document.getElementById('adminPortalArea');
const employeePortalArea = document.getElementById('employeePortalArea');

// Admin Portal Specific Elements
const addLogForm = document.getElementById('addLogForm');
const addDate = document.getElementById('addDate');
const addShift = document.getElementById('addShift');
const addName = document.getElementById('addName');
const addId = document.getElementById('addId');
const addDescription = document.getElementById('addDescription');
const addSuccessMsg = document.getElementById('addSuccessMsg');

// Admin Dashboard & Search Elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const quickTagsContainer = document.getElementById('quickTagsContainer');
const logGrid = document.getElementById('logGrid');
const noResultsPanel = document.getElementById('noResultsPanel');
const searchedTerm = document.getElementById('searchedTerm');
const resetSearchBtn = document.getElementById('resetSearchBtn');
const resultsTitle = document.getElementById('resultsTitle');
const detailFocusSection = document.getElementById('detailFocusSection');

// Stats Elements
const valTotal = document.getElementById('valTotal');
const valShifts = document.getElementById('valShifts');
const valMatches = document.getElementById('valMatches');
const valMatchesLabel = document.getElementById('valMatchesLabel');

// Employee Portal Specific Elements
const employeeNameInput = document.getElementById('employeeNameInput');
const retrieveBtn = document.getElementById('retrieveBtn');
const employeeLogsViewer = document.getElementById('employeeLogsViewer');
const employeeNoResults = document.getElementById('employeeNoResults');
const searchedEmployeeName = document.getElementById('searchedEmployeeName');
const employeeQuickTags = document.getElementById('employeeQuickTags');

// ==================== HELPER UTILITIES ====================

// Format Date from YYYY-MM-DD to Month DD, YYYY
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

// Escape HTML characters
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Shake Login Card on Validation Failure
function shakeLoginCard() {
  const card = document.querySelector('.login-card');
  card.classList.add('shake');
  setTimeout(() => card.classList.remove('shake'), 400);
}

// Set Today's Date in Date Inputs by Default
function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  addDate.value = today;
}

// ==================== AUTHORIZATION LOGIC ====================

// Login Submit Handler
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const role = loginRole.value;
  const password = loginPassword.value;
  
  loginErrorMsg.textContent = '';

  if (role === 'admin') {
    if (password === '123') {
      authorizeSession('admin');
    } else {
      loginErrorMsg.textContent = 'Invalid administrator security password.';
      shakeLoginCard();
    }
  } else if (role === 'employee') {
    if (password === '321') {
      authorizeSession('employee');
    } else {
      loginErrorMsg.textContent = 'Invalid employee portal security password.';
      shakeLoginCard();
    }
  }
});

// Configure Session View on Success
function authorizeSession(role) {
  appSessionState.role = role;
  
  // Hide Login gate, show App workspace
  loginWrapper.style.display = 'none';
  appContainer.style.display = 'flex';
  
  // Clear password input
  loginPassword.value = '';

  if (role === 'admin') {
    // Show Admin UI
    adminPortalArea.style.display = 'block';
    employeePortalArea.style.display = 'none';
    
    roleBadge.textContent = 'Administrator Portal';
    roleBadge.className = 'badge-text';
    document.querySelector('.header-badge').style.borderColor = 'rgba(139, 92, 246, 0.3)';
    document.querySelector('.pulse-indicator').style.backgroundColor = 'var(--accent-purple)';
    document.querySelector('.pulse-indicator').style.boxShadow = '0 0 10px var(--accent-purple)';
    portalSubTitle.textContent = 'ShiftSync Master Database & Control Center';

    // Bootstrap Admin UI
    setDefaultDate();
    refreshAdminDashboard();
  } else {
    // Show Employee UI
    adminPortalArea.style.display = 'none';
    employeePortalArea.style.display = 'block';
    
    roleBadge.textContent = 'Employee Portal';
    roleBadge.className = 'badge-text';
    document.querySelector('.header-badge').style.borderColor = 'rgba(16, 185, 129, 0.3)';
    document.querySelector('.pulse-indicator').style.backgroundColor = 'var(--accent-emerald)';
    document.querySelector('.pulse-indicator').style.boxShadow = '0 0 10px var(--accent-emerald)';
    portalSubTitle.textContent = 'Personal Roster & Duty Logs Retrieval';

    // Bootstrap Employee UI
    employeeNameInput.value = '';
    employeeLogsViewer.style.display = 'none';
    employeeNoResults.style.display = 'none';
    renderEmployeeQuickTags();
  }
}

// Logout Handler
logoutBtn.addEventListener('click', () => {
  appSessionState.role = null;
  
  // Hide workspace, show Login wrapper
  appContainer.style.display = 'none';
  loginWrapper.style.display = 'flex';
  
  loginPassword.focus();
});


// ==================== ADMINISTRATOR PORTAL LOGIC ====================

// Add New Log Form Submit
addLogForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newLog = {
    date: addDate.value,
    shift: addShift.value,
    name: addName.value.trim(),
    id: addId.value.trim(),
    work_description: addDescription.value.trim()
  };

  // Push new log to database
  database.work_log.push(newLog);

  // Clear name, id, description inputs
  addName.value = '';
  addId.value = '';
  addDescription.value = '';
  setDefaultDate();

  // Show dynamic success text for 3 seconds
  addSuccessMsg.style.display = 'block';
  setTimeout(() => addSuccessMsg.style.display = 'none', 3000);

  // Refresh Roster View & Dashboard Stats
  refreshAdminDashboard();
});

// Refresh Admin Statistics, Tags, and Table Grid
function refreshAdminDashboard() {
  // Recalculate statistics
  const logs = database.work_log;
  valTotal.textContent = logs.length;
  const shifts = [...new Set(logs.map(item => item.shift))].sort();
  valShifts.textContent = shifts.join(', ');

  // Refresh quick search tags
  renderAdminQuickTags();

  // Handle current search query
  handleAdminSearch();
}

// Render Quick Search Tags in Admin Panel
function renderAdminQuickTags() {
  quickTagsContainer.innerHTML = '';
  // Get unique list of employees currently in database
  const uniqueNames = [...new Set(database.work_log.map(item => item.name))];
  
  uniqueNames.forEach(name => {
    const tag = document.createElement('button');
    tag.className = 'quick-tag';
    tag.textContent = name;
    tag.type = 'button';
    tag.addEventListener('click', () => {
      searchInput.value = name;
      handleAdminSearch();
      searchInput.focus();
    });
    quickTagsContainer.appendChild(tag);
  });
}

// Render Admin Logs Card Grid
function renderAdminGrid(filteredLogs) {
  logGrid.innerHTML = '';
  
  if (filteredLogs.length === 0) {
    logGrid.style.display = 'none';
    noResultsPanel.style.display = 'flex';
    return;
  }

  logGrid.style.display = 'grid';
  noResultsPanel.style.display = 'none';

  filteredLogs.forEach(person => {
    const shiftClass = person.shift.toLowerCase();
    const formattedDate = formatDate(person.date);
    
    const card = document.createElement('div');
    card.className = `person-card glass-panel`;
    
    const isExactMatch = searchInput.value.trim().toLowerCase() === person.name.toLowerCase();
    if (isExactMatch) {
      card.classList.add('active-match');
    }

    card.innerHTML = `
      <div class="card-top">
        <div class="person-identity">
          <div class="avatar avatar-${shiftClass}">${person.name.charAt(0)}</div>
          <div>
            <h3 class="person-name">${escapeHTML(person.name)}</h3>
            <span class="person-id">${escapeHTML(person.id)}</span>
          </div>
        </div>
        <span class="shift-badge badge-${shiftClass}">Shift ${escapeHTML(person.shift)}</span>
      </div>
      <div class="card-middle">
        <div class="log-date">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>${formattedDate}</span>
        </div>
        <p class="work-desc">${escapeHTML(person.work_description)}</p>
      </div>
      <div class="card-footer">
        <span>
          Focus Log Details
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
    `;

    // Click handler to focus detailed profile
    card.addEventListener('click', () => {
      searchInput.value = person.name;
      handleAdminSearch();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    logGrid.appendChild(card);
  });
}

// Render Focused Detail Profile View in Admin Panel
function renderAdminDetailFocus(person) {
  if (!person) {
    detailFocusSection.innerHTML = '';
    detailFocusSection.style.display = 'none';
    return;
  }

  const shiftClass = person.shift.toLowerCase();
  const formattedDate = formatDate(person.date);

  detailFocusSection.innerHTML = `
    <div class="detail-focus-card glass-panel">
      <span class="detail-focus-badge">Retrieved Profile</span>
      
      <div class="detail-profile-header">
        <div class="detail-avatar avatar-${shiftClass}">${person.name.charAt(0)}</div>
        <div class="detail-info">
          <h3>${escapeHTML(person.name)}</h3>
          <div class="detail-meta">
            <span class="detail-id">ID: ${escapeHTML(person.id)}</span>
            <span class="shift-badge badge-${shiftClass}">Shift ${escapeHTML(person.shift)} Roster</span>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-grid-item">
          <span class="label">Date Logged</span>
          <span class="val">${formattedDate}</span>
        </div>
        <div class="detail-grid-item">
          <span class="label">Duty Shift Code</span>
          <span class="val">Shift ${escapeHTML(person.shift)} (Rotational)</span>
        </div>
        <div class="detail-grid-item">
          <span class="label">Staff Reference</span>
          <span class="val">REF-${escapeHTML(person.id)}-2026</span>
        </div>
      </div>

      <div class="detail-description">
        <h4>Task & Work Description Log</h4>
        <p>${escapeHTML(person.work_description)}</p>
      </div>
    </div>
  `;
  detailFocusSection.style.display = 'block';
}

// Search Logic in Admin Panel
function handleAdminSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const logs = database.work_log;

  // Toggle Clear Button
  if (query.length > 0) {
    clearSearchBtn.style.display = 'flex';
  } else {
    clearSearchBtn.style.display = 'none';
  }

  // Filter logs by name match
  const filtered = logs.filter(log => log.name.toLowerCase().includes(query));

  if (query.length === 0) {
    resultsTitle.textContent = "All Roster Logs";
    valMatches.textContent = "All";
    valMatchesLabel.textContent = "Showing all records";
    renderAdminDetailFocus(null);
    renderAdminGrid(logs);
  } else {
    resultsTitle.textContent = `Search Results (${filtered.length})`;
    valMatches.textContent = filtered.length;
    valMatchesLabel.textContent = `Matches for "${escapeHTML(searchInput.value)}"`;
    searchedTerm.textContent = searchInput.value;

    if (filtered.length === 0) {
      renderAdminDetailFocus(null);
      renderAdminGrid([]);
    } else if (filtered.length === 1) {
      renderAdminDetailFocus(filtered[0]);
      renderAdminGrid(filtered);
    } else {
      const exactMatch = filtered.find(p => p.name.toLowerCase() === query);
      if (exactMatch) {
        renderAdminDetailFocus(exactMatch);
      } else {
        renderAdminDetailFocus(null);
      }
      renderAdminGrid(filtered);
    }
  }
}

// Bind Admin Search Event Listeners
searchInput.addEventListener('input', handleAdminSearch);
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  handleAdminSearch();
  searchInput.focus();
});
resetSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  handleAdminSearch();
  searchInput.focus();
});


// ==================== EMPLOYEE PORTAL LOGIC ====================

// Render Quick Helper Tags for Active Employees
function renderEmployeeQuickTags() {
  employeeQuickTags.innerHTML = '';
  // Get unique list of employees currently in database
  const uniqueNames = [...new Set(database.work_log.map(item => item.name))];
  
  uniqueNames.forEach(name => {
    const tag = document.createElement('button');
    tag.className = 'quick-tag';
    tag.textContent = name;
    tag.type = 'button';
    tag.addEventListener('click', () => {
      employeeNameInput.value = name;
      retrieveEmployeeLogs();
    });
    employeeQuickTags.appendChild(tag);
  });
}

// Fetch logs for specific employee
function retrieveEmployeeLogs() {
  const query = employeeNameInput.value.trim().toLowerCase();
  employeeLogsViewer.innerHTML = '';
  employeeLogsViewer.style.display = 'none';
  employeeNoResults.style.display = 'none';

  if (query.length === 0) return;

  // Filter logs where name matches query exactly or starts with query
  const matches = database.work_log.filter(log => log.name.toLowerCase() === query || log.name.toLowerCase().startsWith(query));

  if (matches.length === 0) {
    searchedEmployeeName.textContent = employeeNameInput.value;
    employeeNoResults.style.display = 'flex';
  } else {
    // Show verified logs
    employeeLogsViewer.innerHTML = `<h4 class="employee-log-header">Active Shift Entries (${matches.length})</h4>`;
    
    matches.forEach(person => {
      const shiftClass = person.shift.toLowerCase();
      const formattedDate = formatDate(person.date);
      
      const logBlock = document.createElement('div');
      logBlock.className = 'detail-focus-card glass-panel';
      logBlock.innerHTML = `
        <span class="detail-focus-badge">Verified Record</span>
        <div class="detail-profile-header">
          <div class="detail-avatar avatar-${shiftClass}">${person.name.charAt(0)}</div>
          <div class="detail-info">
            <h3>${escapeHTML(person.name)}</h3>
            <div class="detail-meta">
              <span class="detail-id">Staff ID: ${escapeHTML(person.id)}</span>
              <span class="shift-badge badge-${shiftClass}">Shift ${escapeHTML(person.shift)}</span>
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-grid-item">
            <span class="label">Duty Date</span>
            <span class="val">${formattedDate}</span>
          </div>
          <div class="detail-grid-item">
            <span class="label">Roster Rota Code</span>
            <span class="val">Shift ${escapeHTML(person.shift)} (Standard Hours)</span>
          </div>
          <div class="detail-grid-item">
            <span class="label">Staff Reference</span>
            <span class="val">REF-${escapeHTML(person.id)}-2026</span>
          </div>
        </div>

        <div class="detail-description">
          <h4>Shift Duty Tasks Performed</h4>
          <p>${escapeHTML(person.work_description)}</p>
        </div>
      `;
      employeeLogsViewer.appendChild(logBlock);
    });

    employeeLogsViewer.style.display = 'flex';
  }
}

// Bind Retrieve Button Listeners
retrieveBtn.addEventListener('click', retrieveEmployeeLogs);
employeeNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    retrieveEmployeeLogs();
  }
});
