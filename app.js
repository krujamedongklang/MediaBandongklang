// ==========================================================================
// CONSTANTS & MAPS
// ==========================================================================
const SUBJECT_COLORS = {
  'คณิตศาสตร์': '#3b82f6', // Blue
  'วิทยาศาสตร์และเทคโนโลยี': '#8b5cf6', // Violet/Purple
  'ภาษาไทย': '#f97316', // Orange
  'ภาษาต่างประเทศ': '#ec4899', // Pink
  'สังคมศึกษา ศาสนา และวัฒนธรรม': '#0d9488', // Teal
  'สุขศึกษาและพลศึกษา': '#10b981', // Emerald/Green
  'ศิลปะ': '#d97706', // Amber/Yellow
  'การงานอาชีพ': '#78350f' // Brown
};

const DEFAULT_COLOR = '#4b5563'; // Slate gray

function getTypeIcon(type) {
  const size = 32;
  const stroke = 2;
  switch (type) {
    case 'แผนการสอน':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`;
    case 'ใบงาน':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
    case 'รูปภาพ':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    case 'วิดีโอ':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
    case 'เสียง':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;
    case 'Quiz':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`;
    case 'E-Book':
    case 'E-book':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
    case 'เกม':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"></path></svg>`;
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;
  }
}

// ==========================================================================
// APPLICATION STATE
// ==========================================================================
let state = {
  media: [],
  subjects: [],
  levels: [],
  types: [],
  teachers: [], // Used by admin
  filters: {
    search: '',
    subject: '',
    level: '',
    type: ''
  },
  sortBy: 'newest',
  currentView: 'home', // 'home' or 'admin'
  currentDashboardTab: 'media', // 'media' or 'teachers'
  selectedMediaId: null,
  currentUser: null // { username, fullName, role, token }
};

// ==========================================================================
// SESSION MANAGEMENT Helpers
// ==========================================================================
function saveUserSession(user) {
  state.currentUser = user;
  localStorage.setItem('userSession', JSON.stringify(user));
}

function loadUserSession() {
  const session = localStorage.getItem('userSession');
  if (session) {
    try {
      state.currentUser = JSON.parse(session);
    } catch (e) {
      localStorage.removeItem('userSession');
    }
  }
}

function clearUserSession() {
  state.currentUser = null;
  localStorage.removeItem('userSession');
}

function isLoggedIn() {
  return state.currentUser !== null;
}

function isUserAdmin() {
  return isLoggedIn() && state.currentUser.role === 'admin';
}

// ==========================================================================
// SOCKET.IO INITIALIZATION (REAL-TIME UPDATES)
// ==========================================================================
let socket;
try {
  socket = io({ path: '/educational-bandongklang/socket.io' });
  
  socket.on('connect', () => {
    updateConnectionStatus(true);
  });
  
  socket.on('disconnect', () => {
    updateConnectionStatus(false);
  });
  
  socket.on('media-updated', (update) => {
    console.log('Realtime Media Update:', update);
    if (update.db) {
      state.media = update.db.media;
      state.subjects = update.db.subjects;
      state.levels = update.db.levels;
      state.types = update.db.types;
      
      // Update teachers if admin received DB
      if (isUserAdmin() && update.db.users) {
        state.teachers = update.db.users.filter(u => u.role === 'teacher');
      }
    }
    
    renderStats();
    renderCatalog();
    renderAdminTable();
    if (isUserAdmin()) {
      renderTeachersTable();
      updatePendingBadge();
    }
    
    if (state.selectedMediaId && (state.selectedMediaId === update.id || (update.data && state.selectedMediaId === update.data.id))) {
      if (update.action === 'delete') {
        closeDetailModal();
        alert('สื่อการสอนชิ้นนี้ถูกลบเรียบร้อยแล้ว');
      } else {
        renderDetailModalContent(state.selectedMediaId);
      }
    }
  });

  socket.on('teacher-registration', (newReq) => {
    console.log('New teacher registration request:', newReq);
    if (isUserAdmin()) {
      fetchTeachersData(); // Reload teacher list
      alert(`มีคำขอสมัครใช้งานใหม่จาก คุณครู: ${newReq.fullName}`);
    }
  });

  socket.on('teacher-updated', (update) => {
    console.log('Teacher state updated:', update);
    if (update.db) {
      state.teachers = update.db.users.filter(u => u.role === 'teacher');
    }
    if (isUserAdmin()) {
      renderTeachersTable();
      updatePendingBadge();
    }
    
    // If currently logged-in teacher account gets deleted/disabled, log them out
    if (isLoggedIn() && state.currentUser.role === 'teacher') {
      const dbUsers = update.db ? update.db.users : [];
      const currentExists = dbUsers.some(u => u.username === state.currentUser.username && u.status === 'approved');
      if (!currentExists && update.username === state.currentUser.username) {
        alert('บัญชีของคุณได้รับการปรับเปลี่ยนสถานะโดยแอดมิน กรุณาล็อกอินใหม่อีกครั้ง');
        handleLogout();
      }
    }
  });
} catch (e) {
  console.warn('Real-time connection not available.');
}

function updateConnectionStatus(isOnline) {
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-text');
  if (dot && txt) {
    if (isOnline) {
      dot.className = 'status-dot online';
      txt.innerText = 'เชื่อมต่อเรียลไทม์แล้ว';
    } else {
      dot.className = 'status-dot offline';
      txt.innerText = 'ออฟไลน์ (กำลังพยายามเชื่อมต่อใหม่...)';
    }
  }
}

// ==========================================================================
// DOM ELEMENTS & EVENT LISTENERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Load session
  loadUserSession();
  updateHeaderLoginStatus();
  
  // Fetch initial data
  fetchMediaData();
  
  // Setup view routing events
  document.getElementById('logo-btn').addEventListener('click', () => switchView('home'));
  document.getElementById('home-view-btn').addEventListener('click', () => switchView('home'));
  document.getElementById('admin-view-btn').addEventListener('click', () => switchView('admin'));
  document.getElementById('mobile-home-btn').addEventListener('click', () => { switchView('home'); closeMobileDrawer(); });
  document.getElementById('mobile-admin-btn').addEventListener('click', () => { switchView('admin'); closeMobileDrawer(); });
  
  // Tab toggles inside Login Wrapper (Login vs Register)
  document.getElementById('tab-login-btn').addEventListener('click', () => toggleAuthTab('login'));
  document.getElementById('tab-register-btn').addEventListener('click', () => toggleAuthTab('register'));
  
  // Search inputs
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  
  searchInput.addEventListener('input', (e) => {
    state.filters.search = e.target.value.trim();
    if (state.filters.search.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    renderCatalog();
  });
  
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.filters.search = '';
    clearSearchBtn.classList.add('hidden');
    renderCatalog();
  });
  
  // Sort selector
  document.getElementById('sort-select').addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderCatalog();
  });
  
  // Reset filters
  document.getElementById('reset-filters-btn').addEventListener('click', () => {
    state.filters.subject = '';
    state.filters.level = '';
    state.filters.type = '';
    renderFilters();
    renderCatalog();
  });
  
  // Mobile drawer trigger
  document.getElementById('mobile-menu-toggle').addEventListener('click', openMobileDrawer);
  document.getElementById('close-drawer-btn').addEventListener('click', closeMobileDrawer);
  document.getElementById('drawer-overlay').addEventListener('click', closeMobileDrawer);
  
  // Modals closing
  document.getElementById('close-detail-modal').addEventListener('click', closeDetailModal);
  document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('detail-modal')) closeDetailModal();
  });
  
  document.getElementById('close-form-modal').addEventListener('click', closeFormModal);
  document.getElementById('cancel-form-btn').addEventListener('click', closeFormModal);
  document.getElementById('form-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('form-modal')) closeFormModal();
  });
  
  // Forms submissions
  document.getElementById('login-form').addEventListener('submit', handleLoginSubmit);
  document.getElementById('register-form').addEventListener('submit', handleRegisterSubmit);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Dashboard Sub-Tabs
  document.getElementById('dash-tab-media').addEventListener('click', () => switchDashboardTab('media'));
  document.getElementById('dash-tab-teachers').addEventListener('click', () => switchDashboardTab('teachers'));
  
  // Add media button
  document.getElementById('add-media-btn').addEventListener('click', () => openFormModal());
  
  // Admin table search
  document.getElementById('admin-table-search').addEventListener('input', (e) => {
    renderAdminTable(e.target.value.trim());
  });
  
  // Media source radio toggles
  document.getElementById('radio-source-link').addEventListener('change', toggleSourceFields);
  document.getElementById('radio-source-upload').addEventListener('change', toggleSourceFields);
  
  // Form submission
  document.getElementById('media-upload-form').addEventListener('submit', handleFormSubmit);

  // File labels helpers
  setupFileLabelHelper('form-cover-file', 'cover-file-name-indicator', 'เลือกภาพหน้าปก (.jpg, .png)');
  setupFileLabelHelper('form-media-file', 'media-file-name-indicator', 'เลือกไฟล์สื่อการสอน');
});

// File upload custom labels helper
function setupFileLabelHelper(inputId, labelId, defaultText) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (input && label) {
    input.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        label.innerText = `ไฟล์ที่เลือก: ${e.target.files[0].name}`;
      } else {
        label.innerText = defaultText;
      }
    });
  }
}

// Toggle URL vs File upload form fields
function toggleSourceFields() {
  const isUpload = document.getElementById('radio-source-upload').checked;
  const urlGroup = document.getElementById('url-input-group');
  const fileGroup = document.getElementById('file-upload-group');
  
  const fileUrlInput = document.getElementById('form-file-url');
  const mediaFileInput = document.getElementById('form-media-file');
  
  if (isUpload) {
    urlGroup.classList.add('hidden');
    fileGroup.classList.remove('hidden');
    fileUrlInput.removeAttribute('required');
    if (!document.getElementById('form-media-id').value) {
      mediaFileInput.setAttribute('required', 'required');
    }
  } else {
    urlGroup.classList.remove('hidden');
    fileGroup.classList.add('hidden');
    fileUrlInput.setAttribute('required', 'required');
    mediaFileInput.removeAttribute('required');
  }
}

// ==========================================================================
// ROUTING & AUTH VISIBILITY CONTROL
// ==========================================================================
function switchView(view) {
  state.currentView = view;
  
  const homeBtn = document.getElementById('home-view-btn');
  const adminBtn = document.getElementById('admin-view-btn');
  const homeMobileBtn = document.getElementById('mobile-home-btn');
  const adminMobileBtn = document.getElementById('mobile-admin-btn');
  
  const homeSection = document.getElementById('home-view');
  const adminSection = document.getElementById('admin-view');
  
  homeBtn.classList.remove('active');
  adminBtn.classList.remove('active');
  homeMobileBtn.classList.remove('active');
  adminMobileBtn.classList.remove('active');
  homeSection.classList.remove('active');
  adminSection.classList.remove('active');
  
  if (view === 'home') {
    homeBtn.classList.add('active');
    homeMobileBtn.classList.add('active');
    homeSection.classList.add('active');
  } else {
    adminBtn.classList.add('active');
    adminMobileBtn.classList.add('active');
    adminSection.classList.add('active');
    
    checkDashboardView();
  }
}

// Handle displaying login card vs Dashboard
function checkDashboardView() {
  const loginWrapper = document.getElementById('login-wrapper');
  const dashboardContainer = document.getElementById('admin-dashboard');
  
  if (isLoggedIn()) {
    loginWrapper.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    
    // Set up user profile headers
    const title = document.getElementById('dashboard-user-title');
    const desc = document.getElementById('dashboard-user-desc');
    const tabsNav = document.getElementById('dashboard-tabs-nav');
    
    if (state.currentUser.role === 'admin') {
      title.innerText = 'ระบบหลังบ้านผู้ดูแลระบบ (Admin Control)';
      desc.innerText = `ยินดีต้อนรับ แอดมิน: ${state.currentUser.fullName}`;
      tabsNav.classList.remove('hidden'); // Show Admin sub tabs
      
      // Fetch latest teachers list
      fetchTeachersData();
    } else {
      title.innerText = 'ระบบอัปโหลดสื่อสำหรับคุณครู (Teacher Panel)';
      desc.innerText = `ยินดีต้อนรับ คุณครู: ${state.currentUser.fullName}`;
      tabsNav.classList.add('hidden'); // Hide Admin sub tabs for teachers
      switchDashboardTab('media');
    }
    
    renderAdminTable();
  } else {
    loginWrapper.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
    toggleAuthTab('login'); // Default back to login tab
  }
}

// Update header button status texts
function updateHeaderLoginStatus() {
  const navText = document.getElementById('nav-login-status-text');
  const mobileText = document.querySelectorAll('#mobile-login-status-text');
  
  if (isLoggedIn()) {
    const displayName = state.currentUser.fullName.split(' ')[0]; // Show first name only
    const roleText = state.currentUser.role === 'admin' ? 'แอดมิน' : 'ครู';
    const statusStr = `${displayName} (${roleText})`;
    
    if (navText) navText.innerText = statusStr;
    mobileText.forEach(el => el.innerText = statusStr);
  } else {
    if (navText) navText.innerText = 'เข้าสู่ระบบ / สมัครครู';
    mobileText.forEach(el => el.innerText = 'เข้าสู่ระบบ / สมัครครู');
  }
}

// Toggle between Login tab and Register tab
function toggleAuthTab(tab) {
  const loginBtn = document.getElementById('tab-login-btn');
  const registerBtn = document.getElementById('tab-register-btn');
  const loginForm = document.getElementById('login-form-container');
  const registerForm = document.getElementById('register-form-container');
  
  // Clear forms
  document.getElementById('login-form').reset();
  document.getElementById('register-form').reset();
  document.getElementById('login-error-msg').classList.add('hidden');
  document.getElementById('register-error-msg').classList.add('hidden');
  document.getElementById('register-success-msg').classList.add('hidden');
  
  if (tab === 'login') {
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    loginBtn.classList.remove('active');
    registerBtn.classList.add('active');
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  }
}

// Toggle between Media Table and Teachers List inside Admin Dashboard
window.switchDashboardTab = function(tab) {
  state.currentDashboardTab = tab;
  
  const mediaTabBtn = document.getElementById('dash-tab-media');
  const teachersTabBtn = document.getElementById('dash-tab-teachers');
  const mediaSection = document.getElementById('dashboard-media-section');
  const teachersSection = document.getElementById('dashboard-teachers-section');
  
  mediaTabBtn.classList.remove('active');
  teachersTabBtn.classList.remove('active');
  mediaSection.classList.add('hidden');
  teachersSection.classList.add('hidden');
  
  if (tab === 'media') {
    mediaTabBtn.classList.add('active');
    mediaSection.classList.remove('hidden');
    renderAdminTable();
  } else {
    teachersTabBtn.classList.add('active');
    teachersSection.classList.remove('hidden');
    renderTeachersTable();
  }
};

// Mobile drawer triggers
function openMobileDrawer() {
  document.getElementById('mobile-nav-drawer').classList.add('open');
}

function closeMobileDrawer() {
  document.getElementById('mobile-nav-drawer').classList.remove('open');
}

// ==========================================================================
// DATA FETCHING (REST APIS)
// ==========================================================================
async function fetchMediaData() {
  try {
    const response = await fetch('/educational-bandongklang/api/media');
    const data = await response.json();
    
    state.media = data.media || [];
    state.subjects = data.subjects || [];
    state.levels = data.levels || [];
    state.types = data.types || [];
    
    populateFormSelects();
    renderStats();
    renderFilters();
    renderCatalog();
    renderAdminTable();
  } catch (err) {
    console.error('Error fetching media data:', err);
  }
}

async function fetchTeachersData() {
  if (!isUserAdmin()) return;
  try {
    const response = await fetch('/educational-bandongklang/api/admin/teachers');
    const data = await response.json();
    state.teachers = data || [];
    renderTeachersTable();
    updatePendingBadge();
  } catch (err) {
    console.error('Error fetching teachers list:', err);
  }
}

function populateFormSelects() {
  const subjectSelect = document.getElementById('form-subject');
  const levelSelect = document.getElementById('form-level');
  const typeSelect = document.getElementById('form-type');
  
  if (subjectSelect) subjectSelect.innerHTML = state.subjects.map(s => `<option value="${s}">${s}</option>`).join('');
  if (levelSelect) levelSelect.innerHTML = state.levels.map(l => `<option value="${l}">${l}</option>`).join('');
  if (typeSelect) typeSelect.innerHTML = state.types.map(t => `<option value="${t}">${t}</option>`).join('');
}

function updatePendingBadge() {
  const badge = document.getElementById('pending-teachers-badge');
  if (badge) {
    const pendingCount = state.teachers.filter(t => t.status === 'pending').length;
    badge.innerText = pendingCount;
  }
}

// ==========================================================================
// PORTAL PUBLIC FRONT PAGE RENDERING
// ==========================================================================
function renderStats() {
  const totalMedia = state.media.length;
  const totalViews = state.media.reduce((acc, item) => acc + (item.views || 0), 0);
  const totalDownloads = state.media.reduce((acc, item) => acc + (item.downloads || 0), 0);
  
  const m = document.getElementById('stat-total-media');
  const v = document.getElementById('stat-total-views');
  const d = document.getElementById('stat-total-downloads');
  if (m) m.innerText = totalMedia.toLocaleString();
  if (v) v.innerText = totalViews.toLocaleString();
  if (d) d.innerText = totalDownloads.toLocaleString();
}

function renderFilters() {
  const subjectContainer = document.getElementById('filter-subject-container');
  const levelContainer = document.getElementById('filter-level-container');
  const typeContainer = document.getElementById('filter-type-container');
  
  if (typeContainer) {
    typeContainer.innerHTML = state.types.map(type => {
      const activeClass = state.filters.type === type ? 'active' : '';
      const icon = getTypeIcon(type);
      return `
        <button class="type-filter-btn ${activeClass}" onclick="toggleTypeFilter('${type}')">
          ${icon}
          <span>${type}</span>
        </button>
      `;
    }).join('');
  }
  
  if (subjectContainer) {
    subjectContainer.innerHTML = state.subjects.map(sub => {
      const activeClass = state.filters.subject === sub ? 'active' : '';
      const color = SUBJECT_COLORS[sub] || DEFAULT_COLOR;
      return `
        <button class="filter-item ${activeClass}" onclick="toggleSubjectFilter('${sub}')">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${color}; margin-right:8px;"></span>
          ${sub}
        </button>
      `;
    }).join('');
  }
  
  if (levelContainer) {
    levelContainer.innerHTML = state.levels.map(lvl => {
      const activeClass = state.filters.level === lvl ? 'active' : '';
      return `
        <button class="filter-item ${activeClass}" onclick="toggleLevelFilter('${lvl}')">
          ${lvl}
        </button>
      `;
    }).join('');
  }
  
  renderActiveChips();
}

window.toggleTypeFilter = function(type) {
  state.filters.type = state.filters.type === type ? '' : type;
  renderFilters();
  renderCatalog();
};

window.toggleSubjectFilter = function(sub) {
  state.filters.subject = state.filters.subject === sub ? '' : sub;
  renderFilters();
  renderCatalog();
};

window.toggleLevelFilter = function(lvl) {
  state.filters.level = state.filters.level === lvl ? '' : lvl;
  renderFilters();
  renderCatalog();
};

function renderActiveChips() {
  const chipsBar = document.getElementById('active-chips-bar');
  if (!chipsBar) return;
  
  let chipsHtml = [];
  if (state.filters.type) {
    chipsHtml.push(`
      <div class="chip">
        <span>ประเภท: ${state.filters.type}</span>
        <button onclick="toggleTypeFilter('${state.filters.type}')">&times;</button>
      </div>
    `);
  }
  
  if (state.filters.subject) {
    chipsHtml.push(`
      <div class="chip">
        <span>วิชา: ${state.filters.subject}</span>
        <button onclick="toggleSubjectFilter('${state.filters.subject}')">&times;</button>
      </div>
    `);
  }
  
  if (state.filters.level) {
    chipsHtml.push(`
      <div class="chip">
        <span>ระดับชั้น: ${state.filters.level}</span>
        <button onclick="toggleLevelFilter('${state.filters.level}')">&times;</button>
      </div>
    `);
  }
  
  chipsBar.innerHTML = chipsHtml.join('');
}

function renderCatalog() {
  const catalogGrid = document.getElementById('media-grid');
  if (!catalogGrid) return;
  
  let filtered = state.media.filter(item => {
    if (state.filters.search) {
      const q = state.filters.search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchAuthor = item.author.toLowerCase().includes(q);
      const matchSubject = item.subject.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAuthor && !matchSubject) return false;
    }
    if (state.filters.type && item.type !== state.filters.type) return false;
    if (state.filters.subject && item.subject !== state.filters.subject) return false;
    if (state.filters.level && item.level !== state.filters.level) return false;
    return true;
  });
  
  const countLabel = document.getElementById('results-count');
  if (countLabel) countLabel.innerText = `พบสื่อทั้งหมด ${filtered.length} รายการ`;
  
  filtered.sort((a, b) => {
    if (state.sortBy === 'views') {
      return (b.views || 0) - (a.views || 0);
    } else if (state.sortBy === 'downloads') {
      return (b.downloads || 0) - (a.downloads || 0);
    } else if (state.sortBy === 'alphabetical') {
      return a.title.localeCompare(b.title, 'th');
    } else {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });
  
  if (filtered.length === 0) {
    catalogGrid.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        <h3>ไม่พบผลการค้นหา</h3>
        <p>ลองปรับฟิลเตอร์ตัวกรอง หรือตรวจสอบคำค้นหาใหม่อีกครั้ง</p>
      </div>
    `;
    return;
  }
  
  catalogGrid.innerHTML = filtered.map(item => {
    const color = SUBJECT_COLORS[item.subject] || DEFAULT_COLOR;
    const coverHtml = getCoverHtml(item);
    
    return `
      <article class="media-card" onclick="openDetailModal('${item.id}')">
        <div class="media-card-cover-wrapper">
          ${coverHtml}
          <div class="media-card-badges">
            <span class="badge" style="background-color: ${color}">${item.subject}</span>
            <span class="badge badge-level">${item.level}</span>
          </div>
          <span class="badge-type">${item.type}</span>
        </div>
        <div class="media-card-content">
          <h3 class="media-card-title">${escapeHtml(item.title)}</h3>
          <p class="media-card-description">${escapeHtml(item.description || 'ไม่มีคำอธิบายเพิ่มเติม')}</p>
          <div class="media-card-author">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>${escapeHtml(item.author)}</span>
          </div>
        </div>
        <div class="media-card-stats">
          <div class="stat-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>${item.views || 0} เข้าชม</span>
          </div>
          <div class="stat-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>${item.downloads || 0} โหลด</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function getCoverHtml(item) {
  if (item.coverUrl) {
    return `<img class="media-card-cover" src="${item.coverUrl}" alt="${escapeHtml(item.title)}">`;
  }
  
  const color = SUBJECT_COLORS[item.subject] || DEFAULT_COLOR;
  const icon = getTypeIcon(item.type);
  
  return `
    <div class="media-card-cover" style="background: linear-gradient(135deg, ${color}dd, ${color}); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; padding: 1.5rem; text-align: center; gap: 0.5rem; height: 100%; width: 100%;">
      <div class="media-card-placeholder-icon" style="color: white; opacity: 0.9;">
        ${icon}
      </div>
      <span style="font-size: 0.8rem; font-weight: 500; opacity: 0.9;">${item.type}</span>
    </div>
  `;
}

// ==========================================================================
// MEDIA DETAIL MODAL VIEW
// ==========================================================================
window.openDetailModal = function(mediaId) {
  state.selectedMediaId = mediaId;
  renderDetailModalContent(mediaId);
  document.getElementById('detail-modal').classList.add('open');
  incrementViewCount(mediaId);
};

function closeDetailModal() {
  state.selectedMediaId = null;
  document.getElementById('detail-modal').classList.remove('open');
}

async function incrementViewCount(mediaId) {
  try {
    const res = await fetch(`/educational-bandongklang/api/media/${mediaId}/view`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      const item = state.media.find(m => m.id === mediaId);
      if (item) {
        item.views = data.views;
        renderStats();
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function incrementDownloadCount(mediaId) {
  try {
    const res = await fetch(`/educational-bandongklang/api/media/${mediaId}/download`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      const item = state.media.find(m => m.id === mediaId);
      if (item) {
        item.downloads = data.downloads;
        renderStats();
        renderDetailModalContent(mediaId);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function renderDetailModalContent(mediaId) {
  const container = document.getElementById('detail-modal-body');
  const item = state.media.find(m => m.id === mediaId);
  
  if (!item) {
    container.innerHTML = `<p>ไม่พบข้อมูลสื่อการสอน</p>`;
    return;
  }
  
  const color = SUBJECT_COLORS[item.subject] || DEFAULT_COLOR;
  const coverHtml = getCoverHtml(item);
  const downloadText = item.sourceType === 'upload' ? 'ดาวน์โหลดสื่อ (.pdf/.mp4...)' : 'ไปยังลิงก์ปลายทางสื่อ';
  
  container.innerHTML = `
    <div class="detail-grid">
      <div class="detail-cover-wrapper">
        ${coverHtml}
      </div>
      <div class="detail-info">
        <div class="detail-meta-badges">
          <span class="badge" style="background-color: ${color}">${item.subject}</span>
          <span class="badge badge-level">${item.level}</span>
          <span class="badge" style="background-color: #374151">${item.type}</span>
        </div>
        
        <h2 class="detail-title">${escapeHtml(item.title)}</h2>
        
        <div class="detail-author">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>ผู้ผลิตผลงาน: <strong>${escapeHtml(item.author)}</strong></span>
        </div>
        
        <div class="detail-stats-bar">
          <div class="stat-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>ยอดเปิดชม: ${item.views || 0} ครั้ง</span>
          </div>
          <div class="stat-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>ดาวน์โหลด: ${item.downloads || 0} ครั้ง</span>
          </div>
        </div>

        <p style="font-size:0.8rem; font-weight:600; color:var(--color-text-muted); margin-bottom:-0.25rem;">รายละเอียดสื่อการสอน:</p>
        <div class="detail-description-box">
          ${escapeHtml(item.description || 'ไม่มีคำอธิบายเพิ่มเติมเกี่ยวกับสื่อการเรียนรู้นี้')}
        </div>

        <div class="detail-actions">
          <a href="${item.fileUrl}" target="_blank" class="primary-btn" onclick="incrementDownloadCount('${item.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>${downloadText}</span>
          </a>
          ${item.sourceType === 'upload' && item.fileUrl.endsWith('.pdf') ? `
            <a href="${item.fileUrl}" target="_blank" class="secondary-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              <span>เปิดดูไฟล์ (Preview)</span>
            </a>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// REGISTRATION AND LOGIN HANDLERS
// ==========================================================================
async function handleLoginSubmit(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginErrorMsg = document.getElementById('login-error-msg');
  
  try {
    const response = await fetch('/educational-bandongklang/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value.trim()
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      saveUserSession(data);
      loginErrorMsg.classList.add('hidden');
      usernameInput.value = '';
      passwordInput.value = '';
      
      updateHeaderLoginStatus();
      checkDashboardView();
    } else {
      loginErrorMsg.innerText = data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      loginErrorMsg.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Login error:', err);
    loginErrorMsg.innerText = 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
    loginErrorMsg.classList.remove('hidden');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('reg-fullname').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  
  const errBox = document.getElementById('register-error-msg');
  const successBox = document.getElementById('register-success-msg');
  
  errBox.classList.add('hidden');
  successBox.classList.add('hidden');
  
  try {
    const response = await fetch('/educational-bandongklang/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, fullName })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      successBox.innerText = data.message || 'ส่งคำขอสมัครเรียบร้อยแล้ว กรุณารอแอดมินอนุมัติ';
      successBox.classList.remove('hidden');
      document.getElementById('register-form').reset();
    } else {
      errBox.innerText = data.error || 'เกิดข้อผิดพลาดในการลงทะเบียน';
      errBox.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Register error:', err);
    errBox.innerText = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
    errBox.classList.remove('hidden');
  }
}

function handleLogout() {
  clearUserSession();
  updateHeaderLoginStatus();
  switchView('home');
}

// ==========================================================================
// ADMIN/TEACHER DASHBOARD RENDERING
// ==========================================================================
function renderAdminTable(searchQuery = '') {
  if (!isLoggedIn()) return;
  
  const tbody = document.getElementById('admin-media-tbody');
  if (!tbody) return;
  
  // Filter media safely
  let filtered = (state.media || []).filter(item => item);
  
  // 1. Scoped view: Teachers only see their own media
  if (state.currentUser.role === 'teacher') {
    filtered = filtered.filter(item => item.creatorUsername === state.currentUser.username);
  }
  
  const titleText = state.currentUser.role === 'teacher' ? 'รายการสื่อการสอนของคุณ' : 'รายการสื่อการสอนทั้งหมดในระบบ';
  
  // 2. Toolbar search query filter (Extremely robust & case-insensitive)
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(item => 
      (item.title || '').toLowerCase().includes(q) ||
      (item.author || '').toLowerCase().includes(q) ||
      (item.subject || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.level || '').toLowerCase().includes(q) ||
      (item.type || '').toLowerCase().includes(q)
    );
  }
  
  const titleEl = document.getElementById('table-media-title');
  if (titleEl) {
    titleEl.innerHTML = `${titleText} (<span id="admin-media-count">${filtered.length}</span> รายการ)`;
  }
  
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
          ไม่พบรายการสื่อการสอนที่นี่
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filtered.map(item => {
    const coverUrl = item.coverUrl || '';
    const subject = item.subject || '';
    const type = item.type || '';
    const level = item.level || '';
    const author = item.author || '';
    
    const imgHtml = coverUrl 
      ? `<img class="admin-table-cover" src="${coverUrl}" alt="">`
      : `<div class="admin-table-cover" style="background-color: ${SUBJECT_COLORS[subject] || DEFAULT_COLOR}; opacity: 0.8; display:flex; align-items:center; justify-content:center; color:white; font-size:9px; font-weight:bold;">${type}</div>`;
      
    // Permission check for actions (teachers can only edit/delete their own)
    const canManage = state.currentUser.role === 'admin' || item.creatorUsername === state.currentUser.username;
    
    const actionsHtml = canManage ? `
      <div class="actions-cell">
        <button class="action-icon-btn edit" onclick="openFormModal('${item.id}')" title="แก้ไขสื่อการสอน">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="action-icon-btn delete" onclick="handleDeleteMedia('${item.id}')" title="ลบสื่อการสอน">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
      </div>
    ` : `<span style="font-size:0.75rem; color:var(--color-text-light);">ไม่มีสิทธิ์จัดการ</span>`;
      
    return `
      <tr>
        <td>${imgHtml}</td>
        <td>
          <div class="admin-table-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
        </td>
        <td><span class="badge" style="background-color: ${SUBJECT_COLORS[subject] || DEFAULT_COLOR}; opacity: 0.85;">${subject}</span></td>
        <td>${level}</td>
        <td><strong>${type}</strong></td>
        <td>${escapeHtml(author)}</td>
        <td>${item.views || 0} ชม / ${item.downloads || 0} โหลด</td>
        <td>${actionsHtml}</td>
      </tr>
    `;
  }).join('');
}

window.handleDeleteMedia = async function(mediaId) {
  const item = state.media.find(m => m.id === mediaId);
  if (!item) return;
  
  if (confirm(`คุณต้องการลบสื่อการสอนเรื่อง "${item.title}" ออกจากคลังใช่หรือไม่?`)) {
    try {
      const response = await fetch(`/educational-bandongklang/api/media/${mediaId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        state.media = state.media.filter(m => m.id !== mediaId);
        renderStats();
        renderCatalog();
        renderAdminTable();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบสื่อ');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อลบข้อมูล');
    }
  }
};

// ==========================================================================
// ADMIN ONLY: TEACHER ACCOUNT APPROVAL TABLE RENDER
// ==========================================================================
function renderTeachersTable() {
  if (!isUserAdmin()) return;
  const tbody = document.getElementById('admin-teachers-tbody');
  if (!tbody) return;
  
  if (state.teachers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
          ไม่มีบัญชีคุณครูในระบบ
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = state.teachers.map(user => {
    const regDate = new Date(user.createdAt).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const statusClass = user.status === 'approved' ? 'approved' : 'pending';
    const statusText = user.status === 'approved' ? 'อนุมัติแล้ว' : 'รอการอนุมัติ';
    
    // Actions
    const approveBtn = user.status === 'pending' 
      ? `<button class="primary-btn" onclick="approveTeacherAccount('${user.username}')" style="padding: 0.3rem 0.75rem; font-size: 0.8rem;">อนุมัติสิทธิ์</button>`
      : `<span style="font-size:0.8rem; color:var(--color-text-light); font-weight:600;">อนุญาตแล้ว</span>`;
      
    const deleteBtn = `<button class="secondary-btn text-red" onclick="deleteTeacherAccount('${user.username}')" style="padding: 0.3rem 0.75rem; font-size: 0.8rem; border-color:rgba(239, 68, 68, 0.2);">ลบบัญชี</button>`;
    
    return `
      <tr>
        <td><strong>${escapeHtml(user.fullName)}</strong></td>
        <td><code>${escapeHtml(user.username)}</code></td>
        <td>${regDate}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <div class="actions-cell" style="gap:0.4rem;">
            ${approveBtn}
            ${deleteBtn}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.approveTeacherAccount = async function(username) {
  if (!confirm(`คุณต้องการอนุมัติสิทธิ์ให้ คุณครูผู้ใช้ "${username}" สามารถเข้าระบบเพื่ออัปโหลดสื่อได้ใช่หรือไม่?`)) return;
  try {
    const res = await fetch(`/educational-bandongklang/api/admin/teachers/${username}/approve`, {
      method: 'PUT'
    });
    const data = await res.json();
    if (res.ok && data.success) {
      fetchTeachersData(); // Refresh list
    } else {
      alert(data.error || 'เกิดข้อผิดพลาด');
    }
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }
};

window.deleteTeacherAccount = async function(username) {
  if (!confirm(`คุณต้องการลบหรือปฏิเสธคำขอบัญชีคุณครู "${username}" ออกจากระบบถาวรใช่หรือไม่?`)) return;
  try {
    const res = await fetch(`/educational-bandongklang/api/admin/teachers/${username}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (res.ok && data.success) {
      fetchTeachersData(); // Refresh list
    } else {
      alert(data.error || 'เกิดข้อผิดพลาด');
    }
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }
};

// ==========================================================================
// MEDIA UPLOAD FORMS CONTROLLER
// ==========================================================================
window.openFormModal = function(mediaId = null) {
  const form = document.getElementById('media-upload-form');
  form.reset();
  
  document.getElementById('cover-file-name-indicator').innerText = '';
  document.getElementById('media-file-name-indicator').innerText = '';
  
  // Set default Author name as logged in user's full name
  document.getElementById('form-author').value = state.currentUser.fullName;
  
  if (mediaId) {
    document.getElementById('form-modal-title').innerText = 'แก้ไขรายละเอียดสื่อการสอน';
    const item = state.media.find(m => m.id === mediaId);
    if (!item) return;
    
    document.getElementById('form-media-id').value = item.id;
    document.getElementById('form-title').value = item.title;
    document.getElementById('form-author').value = item.author;
    document.getElementById('form-description').value = item.description || '';
    document.getElementById('form-subject').value = item.subject;
    document.getElementById('form-level').value = item.level;
    document.getElementById('form-type').value = item.type;
    
    if (item.sourceType === 'upload') {
      document.getElementById('radio-source-upload').checked = true;
    } else {
      document.getElementById('radio-source-link').checked = true;
      document.getElementById('form-file-url').value = item.fileUrl;
    }
  } else {
    document.getElementById('form-modal-title').innerText = 'เพิ่มสื่อการสอนเข้าระบบคลัง';
    document.getElementById('form-media-id').value = '';
    document.getElementById('radio-source-link').checked = true;
  }
  
  toggleSourceFields();
  document.getElementById('form-modal').classList.add('open');
};

function closeFormModal() {
  document.getElementById('form-modal').classList.remove('open');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submit-form-btn');
  const originalText = submitBtn.innerText;
  submitBtn.innerText = 'กำลังบันทึกข้อมูล...';
  submitBtn.disabled = true;
  
  const mediaId = document.getElementById('form-media-id').value;
  const isEdit = mediaId !== '';
  
  const formData = new FormData();
  formData.append('title', document.getElementById('form-title').value.trim());
  formData.append('author', document.getElementById('form-author').value.trim());
  formData.append('description', document.getElementById('form-description').value.trim());
  formData.append('subject', document.getElementById('form-subject').value);
  formData.append('level', document.getElementById('form-level').value);
  formData.append('type', document.getElementById('form-type').value);
  
  // Track creator username on backend
  formData.append('creatorUsername', state.currentUser.username);
  
  const sourceType = document.querySelector('input[name="form-source-type"]:checked').value;
  formData.append('sourceType', sourceType);
  
  if (sourceType === 'link') {
    formData.append('fileUrl', document.getElementById('form-file-url').value.trim());
  } else {
    const fileInput = document.getElementById('form-media-file');
    if (fileInput.files.length > 0) {
      formData.append('mediaFile', fileInput.files[0]);
    }
  }
  
  const coverInput = document.getElementById('form-cover-file');
  if (coverInput.files.length > 0) {
    formData.append('coverImage', coverInput.files[0]);
  }
  
  const url = isEdit ? `/educational-bandongklang/api/media/${mediaId}` : '/educational-bandongklang/api/media';
  const method = isEdit ? 'PUT' : 'POST';
  
  try {
    const response = await fetch(url, {
      method: method,
      body: formData
    });
    
    if (response.ok) {
      const savedMedia = await response.json();
      closeFormModal();
    } else {
      const errData = await response.json();
      alert(errData.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  } catch (err) {
    console.error('Error submitting form:', err);
    alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อบันทึกข้อมูล');
  } finally {
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
  }
}

// ==========================================================================
// STRING ESCAPING (PREVENT XSS)
// ==========================================================================
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
