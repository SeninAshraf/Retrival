// Work Log Database
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

// DOM Elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const quickTagsContainer = document.getElementById('quickTagsContainer');
const logGrid = document.getElementById('logGrid');
const noResultsPanel = document.getElementById('noResultsPanel');
const searchedTerm = document.getElementById('searchedTerm');
const resetSearchBtn = document.getElementById('resetSearchBtn');
const resultsTitle = document.getElementById('resultsTitle');

// Stats DOM Elements
const valTotal = document.getElementById('valTotal');
const valShifts = document.getElementById('valShifts');
const valMatches = document.getElementById('valMatches');
const valMatchesLabel = document.getElementById('valMatchesLabel');

// Detail Focus DOM Element
const detailFocusSection = document.getElementById('detailFocusSection');

// Helper: Format Date from YYYY-MM-DD to Month DD, YYYY
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

// Helper: Escape HTML to prevent XSS
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

// Initialize Statistics
function initStats() {
  const logs = database.work_log;
  valTotal.textContent = logs.length;

  // Get unique shifts and sort them
  const shifts = [...new Set(logs.map(item => item.shift))].sort();
  valShifts.textContent = shifts.join(', ');
}

// Generate Quick Search Tags
function renderQuickTags() {
  quickTagsContainer.innerHTML = '';
  database.work_log.forEach(person => {
    const tag = document.createElement('button');
    tag.className = 'quick-tag';
    tag.textContent = person.name;
    tag.addEventListener('click', () => {
      searchInput.value = person.name;
      handleSearch();
      searchInput.focus();
    });
    quickTagsContainer.appendChild(tag);
  });
}

// Render the Log Grid
function renderGrid(filteredLogs) {
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
    card.setAttribute('data-name', person.name);
    
    // Highlight if search has single match or exact text match
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
          View Details
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
    `;

    // Click handler to view full profile details
    card.addEventListener('click', () => {
      searchInput.value = person.name;
      handleSearch();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    logGrid.appendChild(card);
  });
}

// Render Focused Detail Profile View
function renderDetailFocus(person) {
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

// Search Logic Handler
function handleSearch() {
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

  // Update Statistics and Results Title
  if (query.length === 0) {
    resultsTitle.textContent = "All Roster Logs";
    valMatches.textContent = "All";
    valMatchesLabel.textContent = "Showing all records";
    renderDetailFocus(null);
    renderGrid(logs);
  } else {
    resultsTitle.textContent = `Search Results (${filtered.length})`;
    valMatches.textContent = filtered.length;
    valMatchesLabel.textContent = `Matches for "${escapeHTML(searchInput.value)}"`;
    searchedTerm.textContent = searchInput.value;

    if (filtered.length === 0) {
      renderDetailFocus(null);
      renderGrid([]);
    } else if (filtered.length === 1) {
      // Single person found - retrieve and showcase full profile details
      renderDetailFocus(filtered[0]);
      renderGrid(filtered);
    } else {
      // Multiple matches - show cards but don't focus a single one unless an exact name match exists
      const exactMatch = filtered.find(p => p.name.toLowerCase() === query);
      if (exactMatch) {
        renderDetailFocus(exactMatch);
      } else {
        renderDetailFocus(null);
      }
      renderGrid(filtered);
    }
  }
}

// Event Listeners
searchInput.addEventListener('input', handleSearch);

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  handleSearch();
  searchInput.focus();
});

resetSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  handleSearch();
  searchInput.focus();
});

// App Bootstrap
function init() {
  initStats();
  renderQuickTags();
  renderGrid(database.work_log);
}

document.addEventListener('DOMContentLoaded', init);
