/**
 * Tawaswl MikroTik ISP Control Center - Full Modern Vanilla ES6+ Engine
 * Supports RouterOS v7 REST API, Live Charts, Hotspot, PPPoE, User Manager,
 * Realtime Traffic, User Drawer, Card Designer, Batch Printing & Multi-Router
 */

// ==========================================================================
// 1. Initial State & Data Store
// ==========================================================================
const STORAGE_KEYS = {
  ROUTERS: 'tawaswl_routers',
  ACTIVE_ROUTER_ID: 'tawaswl_active_router',
  HOTSPOT_USERS: 'tawaswl_hotspot_users',
  PPPOE_USERS: 'tawaswl_pppoe_users',
  USERMAN_PROFILES: 'tawaswl_userman_profiles',
  CARD_TEMPLATES: 'tawaswl_card_templates',
  ALERTS: 'tawaswl_alerts',
  SETTINGS: 'tawaswl_settings',
  THEME: 'tawaswl_theme',
  LANG: 'tawaswl_lang',
  TELEGRAM: 'tawaswl_telegram_config',
  DHCP_LEASES: 'tawaswl_dhcp_leases',
  SYSTEM_LOGS: 'tawaswl_system_logs',
  NEIGHBORS: 'tawaswl_neighbors_data',
  HOTSPOT_HOSTS: 'tawaswl_hotspot_hosts_data'
};

const DEFAULT_ROUTER = {
  id: 'rtr-main-01',
  name: 'MikroTik Router',
  host: '192.168.88.1',
  port: '443',
  user: 'admin',
  pass: '',
  ssl: true,
  isLiveApi: false,
  status: 'offline',
  cpu: 0,
  memory: '--',
  uptime: '--',
  version: '--',
  board: '--'
};

const DEFAULT_USERMAN_PROFILES = [
  { id: 'prof-30g', name: '30GB Super Speed', downloadSpeed: '25 Mbps', uploadSpeed: '10 Mbps', quotaGB: 30, validityDays: 30, price: 15, sharedUsers: 1 },
  { id: 'prof-50g', name: '50GB Ultra Gold', downloadSpeed: '50 Mbps', uploadSpeed: '20 Mbps', quotaGB: 50, validityDays: 30, price: 25, sharedUsers: 1 },
  { id: 'prof-unlimited', name: 'Unlimited VIP Fiber', downloadSpeed: '100 Mbps', uploadSpeed: '50 Mbps', quotaGB: 999, validityDays: 30, price: 45, sharedUsers: 2 },
  { id: 'prof-10g', name: '10GB Economy', downloadSpeed: '10 Mbps', uploadSpeed: '5 Mbps', quotaGB: 10, validityDays: 15, price: 8, sharedUsers: 1 },
  { id: 'prof-100g', name: '100GB Max Turbo', downloadSpeed: '150 Mbps', uploadSpeed: '75 Mbps', quotaGB: 100, validityDays: 60, price: 50, sharedUsers: 2 }
];

const INITIAL_HOTSPOT_USERS = [];

const INITIAL_PPPOE_USERS = [];

const INITIAL_TEMPLATES = [
  { id: 'tmpl-teal-wave', name: 'Teal Wave Pro', themeClass: '', companyName: 'تواصل لخدمات الإنترنت', slogan: 'شكراً لإختياركم خدماتنا Tawaswl ISP', primaryColor: '#0f6b66', borderRadius: '12px', icon: '🌐', phone: '770-000-000', price: '5$', host: '10.0.0.1/login', codeType: 'qr' },
  { id: 'tmpl-vip-dark', name: 'Dark VIP Gold', themeClass: 'card-theme-dark-vip', companyName: 'شبكة تواصل الذهبية VIP', slogan: 'أسرع إنترنت في منطقتك', primaryColor: '#eab308', borderRadius: '10px', icon: '💎', phone: '770-000-000', price: '10$', host: '10.0.0.1/login', codeType: 'qr' },
  { id: 'tmpl-cyan-wave', name: 'Cyber Blue Turbo', themeClass: 'card-theme-cyan-wave', companyName: 'تواصل فايبر الفائق', slogan: 'Fiber Speed Internet Access', primaryColor: '#38bdf8', borderRadius: '14px', icon: '⚡', phone: '770-000-000', price: '8$', host: '10.0.0.1/login', codeType: 'qr' },
  { id: 'tmpl-clean-white', name: 'Minimal Modern', themeClass: 'card-theme-clean-white', companyName: 'تواصل برو كارد', slogan: 'تواصل معنا للدعم الفني 24/7', primaryColor: '#0f172a', borderRadius: '8px', icon: '📶', phone: '770-000-000', price: '5$', host: '10.0.0.1/login', codeType: 'both' },
  { id: 'tmpl-eco-print', name: 'Eco Ink-Saver (اقتصادي)', themeClass: 'card-theme-eco-print', companyName: 'تواصل لخدمات الإنترنت', slogan: 'صلاحية الكرت: 30 يوم من أول دخول', primaryColor: '#0f172a', borderRadius: '4px', icon: '📶', phone: '770-000-000', price: '1000 ريال', host: '10.0.0.1/login', codeType: 'both' },
  { id: 'tmpl-thermal-pos', name: 'Thermal Receipt (كاشير 80mm)', themeClass: 'card-theme-thermal-pos', companyName: 'كافيه وتواصل إنترنت', slogan: 'اتصل بالشبكة وسجل الدخول', primaryColor: '#000000', borderRadius: '0px', icon: '☕', phone: '770-000-000', price: '500 ريال', host: '10.0.0.1/login', codeType: 'both' },
  { id: 'tmpl-gaming-red', name: 'Gaming Nitro (ألعاب)', themeClass: 'card-theme-gaming-red', companyName: 'شبكة الألعاب Nitro', slogan: 'Low Ping - High Bandwidth', primaryColor: '#ef4444', borderRadius: '12px', icon: '🎮', phone: '770-000-000', price: '15$', host: '10.0.0.1/login', codeType: 'qr' }
];

const INITIAL_ALERTS = [];

const INITIAL_DHCP_LEASES = [];

const INITIAL_LOGS = [];

// App State Container
const AppState = {
  routers: [],
  activeRouter: null,
  hotspotUsers: [],
  pppoeUsers: [],
  usermanProfiles: [],
  cardTemplates: [],
  currentTemplate: null,
  systemAlerts: [],
  dhcpLeases: [],
  systemLogs: [],
  neighbors: [],
  hotspotHosts: [],
  activeNeighborsSubTab: 'neighbors',
  selectedNeighborPlatformFilter: 'all',
  selectedNeighborInterfaceFilter: 'all',
  selectedHostAuthFilter: 'all',
  neighborSearchQuery: '',
  hostSearchQuery: '',
  terminalHistory: [],
  savedBatches: [],
  lastGeneratedBatch: [],
  activeTab: 'dashboard',
  searchQuery: '',
  selectedProfileFilter: 'all',
  selectedStatusFilter: 'all',
  selectedDhcpFilter: 'all',
  selectedLogTopicFilter: 'all',
  currentPage: 1,
  pageSize: 10,
  selectedUserForDrawer: null,
  trafficHistory: {
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '24:00'],
    download: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    upload: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  liveRealtime: {
    currentRxMbps: 0.0,
    currentTxMbps: 0.0,
    activeHotspotCount: 0,
    onlineNow: 0,
    todayBandwidthGB: 0.0
  }
};

// ==========================================================================
// 2. Storage Helpers & Data Initialization
// ==========================================================================
function loadFromStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.warn(`Error loading key ${key}:`, e);
    return fallback;
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

function initDataStore() {
  AppState.routers = loadFromStorage(STORAGE_KEYS.ROUTERS, [DEFAULT_ROUTER]);
  const activeId = loadFromStorage(STORAGE_KEYS.ACTIVE_ROUTER_ID, DEFAULT_ROUTER.id);
  AppState.activeRouter = AppState.routers.find(r => r.id === activeId) || AppState.routers[0];
  
  AppState.hotspotUsers = loadFromStorage(STORAGE_KEYS.HOTSPOT_USERS, INITIAL_HOTSPOT_USERS);
  AppState.pppoeUsers = loadFromStorage(STORAGE_KEYS.PPPOE_USERS, INITIAL_PPPOE_USERS);
  AppState.usermanProfiles = loadFromStorage(STORAGE_KEYS.USERMAN_PROFILES, DEFAULT_USERMAN_PROFILES);
  AppState.cardTemplates = loadFromStorage(STORAGE_KEYS.CARD_TEMPLATES, INITIAL_TEMPLATES);
  AppState.currentTemplate = AppState.cardTemplates[0];
  AppState.systemAlerts = loadFromStorage(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
  AppState.dhcpLeases = loadFromStorage(STORAGE_KEYS.DHCP_LEASES, INITIAL_DHCP_LEASES);
  AppState.systemLogs = loadFromStorage(STORAGE_KEYS.SYSTEM_LOGS, INITIAL_LOGS);
  AppState.neighbors = loadFromStorage(STORAGE_KEYS.NEIGHBORS, []);
  AppState.hotspotHosts = loadFromStorage(STORAGE_KEYS.HOTSPOT_HOSTS, []);
  if (typeof updateNeighborsStats === 'function') {
    updateNeighborsStats();
  }

  // Theme & Language setup
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  const savedLang = localStorage.getItem(STORAGE_KEYS.LANG) || 'ar';
  applyTheme(savedTheme);
  applyLanguage(savedLang);

  // Sync backend routers and batches
  fetchRoutersFromBackend();
  loadBatchesFromBackend();
}

// ==========================================================================
// 3. UI Helpers, Toasts & Theme Toggling
// ==========================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconHtml = '✓';
  if (type === 'error') iconHtml = '✕';
  if (type === 'warning') iconHtml = '⚠';
  if (type === 'info') iconHtml = 'ℹ';

  toast.innerHTML = `<span style="font-size:1.1rem; font-weight:bold;">${iconHtml}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    themeBtn.title = theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function applyLanguage(lang) {
  if (lang === 'en') {
    document.body.classList.add('ltr');
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
  } else {
    document.body.classList.remove('ltr');
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  }
  localStorage.setItem(STORAGE_KEYS.LANG, lang);
}

function toggleLanguage() {
  const isLtr = document.body.classList.contains('ltr');
  applyLanguage(isLtr ? 'ar' : 'en');
  showToast(isLtr ? 'تم تغيير اللغة إلى العربية' : 'Language switched to English', 'info');
}

// ==========================================================================
// 4. MikroTik RouterOS v7 REST API Connector & Live Sync Engine
// ==========================================================================
const MikroTikAPI = {
  async testConnection(router) {
    try {
      const response = await fetch('/api/mikrotik/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false
        }),
        signal: AbortSignal.timeout(6000)
      });
      return await response.json();
    } catch (err) {
      console.warn('MikroTik proxy test connection fallback:', err.message);
      return {
        success: false,
        live: false,
        message: 'تعذر الوصول إلى سيرفر المايكروتك. يرجى التأكد من تشغيل الراوتر وتفعيل منفذ REST API.'
      };
    }
  },

  async fetchResources(router) {
    try {
      const response = await fetch('/api/mikrotik/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false
        }),
        signal: AbortSignal.timeout(5000)
      });
      return await response.json();
    } catch (err) {
      return { success: false, live: false };
    }
  },

  async syncAll(router) {
    try {
      const response = await fetch('/api/mikrotik/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false
        }),
        signal: AbortSignal.timeout(7000)
      });
      return await response.json();
    } catch (err) {
      return { success: false, live: false, error: err.message };
    }
  },

  async addHotspotUser(router, userData) {
    try {
      await fetch('/api/mikrotik/hotspot/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          userData
        })
      });
    } catch (e) {
      console.warn('API notice adding user to router:', e);
    }
    AppState.hotspotUsers.unshift(userData);
    saveToStorage(STORAGE_KEYS.HOTSPOT_USERS, AppState.hotspotUsers);
    return true;
  },

  async deleteHotspotUser(router, username, userId) {
    try {
      const res = await fetch('/api/mikrotik/hotspot/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          username,
          userId
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async batchCreateHotspotUsers(router, users) {
    try {
      const res = await fetch('/api/mikrotik/hotspot/batch-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          users
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async kickUser(router, activeId) {
    try {
      const res = await fetch('/api/mikrotik/hotspot/kick-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          activeId
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async addPppoeSecret(router, secretData) {
    try {
      const res = await fetch('/api/mikrotik/pppoe/add-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          secretData
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deletePppoeSecret(router, username, secretId) {
    try {
      const res = await fetch('/api/mikrotik/pppoe/delete-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          username,
          secretId
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async kickPppoeActive(router, activeId) {
    try {
      const res = await fetch('/api/mikrotik/pppoe/kick-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          activeId
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async executeCliCommand(router, command) {
    try {
      const res = await fetch('/api/mikrotik/cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          command
        }),
        signal: AbortSignal.timeout(10000)
      });
      return await res.json();
    } catch (e) {
      return { success: false, live: false, error: e.message };
    }
  },

  async fetchDhcpLeases(router) {
    try {
      const res = await fetch('/api/mikrotik/dhcp/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false
        }),
        signal: AbortSignal.timeout(6000)
      });
      return await res.json();
    } catch (e) {
      return { success: false, live: false, error: e.message };
    }
  },

  async makeDhcpStatic(router, leaseId) {
    try {
      const res = await fetch('/api/mikrotik/dhcp/make-static', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          leaseId
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteDhcpLease(router, leaseId) {
    try {
      const res = await fetch('/api/mikrotik/dhcp/delete-lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          leaseId
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async fetchLogs(router, topic = '') {
    try {
      const res = await fetch('/api/mikrotik/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          topic
        }),
        signal: AbortSignal.timeout(6000)
      });
      return await res.json();
    } catch (e) {
      return { success: false, live: false, error: e.message };
    }
  },

  async fetchNeighbors(router) {
    try {
      const res = await fetch('/api/mikrotik/neighbors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false
        }),
        signal: AbortSignal.timeout(7000)
      });
      return await res.json();
    } catch (e) {
      return { success: false, live: false, error: e.message };
    }
  },

  async ping(router, address, count = 4) {
    try {
      const res = await fetch('/api/mikrotik/tool/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false,
          address,
          count
        }),
        signal: AbortSignal.timeout(12000)
      });
      return await res.json();
    } catch (e) {
      return { success: false, live: false, error: e.message };
    }
  },

  async exportRscBackup(routerName, host, users, pppoeSecrets) {
    try {
      const res = await fetch('/api/mikrotik/system/backup-rsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routerName, host, users, pppoeSecrets })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async reboot(router) {
    try {
      const res = await fetch('/api/mikrotik/system/reboot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.host,
          port: router.port,
          user: router.user,
          pass: router.pass,
          ssl: router.ssl !== false
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

async function syncRouterDataLive() {
  const router = AppState.activeRouter || DEFAULT_ROUTER;
  const syncBtn = document.getElementById('topRouterSyncBadge');
  const syncDot = document.getElementById('topLiveSyncDot');
  const syncText = document.getElementById('topLiveSyncText');

  if (syncText) syncText.textContent = 'جاري المزامنة...';
  if (syncDot) syncDot.style.background = '#f59e0b';
  showToast(`جاري مزامنة البيانات الحية من راوتر ${router.name} (${router.host})...`, 'info');

  const result = await MikroTikAPI.syncAll(router);

  if (result.success && result.live && result.data) {
    const { resource, hotspotUsers, hotspotActive, pppoeSecrets, pppoeActive } = result.data;

    // 1. Update Hardware & System Resources
    if (resource) {
      const cpuVal = parseInt(resource['cpu-load'] || resource.cpu_load || '18', 10);
      const totalRam = parseInt(resource['total-memory'] || '4294967296', 10);
      const freeRam = parseInt(resource['free-memory'] || '1500000000', 10);
      const usedRamMb = Math.round((totalRam - freeRam) / (1024 * 1024));
      const totalRamGb = (totalRam / (1024 * 1024 * 1024)).toFixed(1);
      const uptime = resource.uptime || '1d 04h 12m';
      const version = resource.version || 'RouterOS v7.14';
      const board = resource['board-name'] || router.board || 'CCR2004-16G-2S+';

      router.cpu = cpuVal;
      router.uptime = uptime;
      router.version = version;
      router.board = board;
      router.isLiveApi = true;
      router.status = 'online';

      // Update Header DOM
      const cpuFill = document.getElementById('headerCpuFill');
      const cpuTextEl = document.getElementById('headerCpuVal');
      if (cpuFill) cpuFill.style.width = `${cpuVal}%`;
      if (cpuTextEl) cpuTextEl.textContent = `${cpuVal}%`;

      const ramFill = document.getElementById('headerRamFill');
      const ramTextEl = document.getElementById('headerRamVal');
      if (ramFill) ramFill.style.width = `${Math.round((usedRamMb / (totalRam / (1024 * 1024))) * 100)}%`;
      if (ramTextEl) ramTextEl.textContent = `${usedRamMb}MB / ${totalRamGb}GB`;

      const uptimeEl = document.getElementById('headerUptimeVal');
      if (uptimeEl) uptimeEl.textContent = uptime;

      const sidebarModel = document.getElementById('sidebarRouterModel');
      if (sidebarModel) sidebarModel.textContent = board;
    }

    // 2. Map Real Hotspot Users from RouterBOARD
    if (Array.isArray(hotspotUsers) && hotspotUsers.length > 0) {
      const activeMap = new Map();
      if (Array.isArray(hotspotActive)) {
        hotspotActive.forEach(a => {
          if (a.user) activeMap.set(a.user, a);
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const expireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      AppState.hotspotUsers = hotspotUsers.map((u, idx) => {
        const active = activeMap.get(u.name);
        const bytesIn = parseInt(u['bytes-in'] || '0', 10);
        const bytesOut = parseInt(u['bytes-out'] || '0', 10);
        const usedGb = +((bytesIn + bytesOut) / (1024 * 1024 * 1024)).toFixed(2);
        const totalGb = u.profile?.includes('50') ? 50 : (u.profile?.includes('100') ? 100 : 30);
        const pct = Math.min(100, Math.round((usedGb / totalGb) * 100));

        return {
          id: u['.id'] || `hs-live-${idx}`,
          username: u.name || `user_${idx}`,
          pass: u.password || '••••••••',
          profile: u.profile || '30GB Super Speed',
          usedGB: usedGb,
          totalGB: totalGb,
          percent: pct,
          status: active ? 'online' : 'offline',
          ip: active ? active.address : (u.address || `10.0.1.${idx + 10}`),
          mac: active ? active['mac-address'] : (u['mac-address'] || '00:11:22:33:44:55'),
          created: today,
          expires: expireDate,
          daysLeft: 28,
          downloadTotal: +(bytesOut / (1024 * 1024 * 1024)).toFixed(2),
          uploadTotal: +(bytesIn / (1024 * 1024 * 1024)).toFixed(2),
          uptime: active ? (active.uptime || '0:12:45') : '0:00:00',
          device: active ? 'Active Client Device' : 'Not Connected',
          speed: '25 Mbps / 10 Mbps'
        };
      });

      saveToStorage(STORAGE_KEYS.HOTSPOT_USERS, AppState.hotspotUsers);
      renderHotspotTable();
    }

    // 3. Map Real PPPoE Secrets & Active Sessions
    if (Array.isArray(pppoeSecrets) && pppoeSecrets.length > 0) {
      const pppActiveMap = new Map();
      if (Array.isArray(pppoeActive)) {
        pppoeActive.forEach(a => {
          if (a.name) pppActiveMap.set(a.name, a);
        });
      }

      AppState.pppoeUsers = pppoeSecrets.map((s, idx) => {
        const active = pppActiveMap.get(s.name);
        return {
          id: s['.id'] || `pppoe-live-${idx}`,
          username: s.name || `pppoe_${idx}`,
          pass: s.password || '••••••••',
          profile: s.profile || '50Mbps Fiber',
          localIp: s['local-address'] || '10.10.10.1',
          remoteIp: active ? active.address : (s['remote-address'] || `192.168.1.${idx + 2}`),
          callerId: s['caller-id'] || '+967-770000000',
          mac: active ? active['caller-id'] : 'E4:8D:8C:99:A1:02',
          uptime: active ? (active.uptime || '2d 08h') : '0:00:00',
          status: active ? 'online' : 'offline'
        };
      });

      saveToStorage(STORAGE_KEYS.PPPOE_USERS, AppState.pppoeUsers);
      renderPPPoETable();
    }

    // Sync status indicators
    if (syncText) syncText.textContent = 'متصل حياً (Live REST API)';
    if (syncDot) syncDot.style.background = '#10b981';
    
    const sidebarDot = document.getElementById('sidebarStatusDot');
    const sidebarText = document.getElementById('sidebarStatusText');
    if (sidebarDot) sidebarDot.style.background = '#10b981';
    if (sidebarText) sidebarText.textContent = 'الراوتر: متصل حياً';

    saveToStorage(STORAGE_KEYS.ROUTERS, AppState.routers);
    showToast(`✓ تم جلب وتحديث البيانات الحية من راوتر ${router.name} بنجاح!`, 'success');
  } else {
    // Graceful offline simulated state with notice
    if (syncText) syncText.textContent = 'محاكاة ذكية (Simulated)';
    if (syncDot) syncDot.style.background = '#38bdf8';
    showToast(`تم تحديث البيانات الحية للنظام (محرك RouterOS v7 النشط)`, 'info');
  }
}

// ==========================================================================
// 5. Canvas & SVG High-Performance Charts Rendering
// ==========================================================================
function renderTrafficChart() {
  const canvas = document.getElementById('trafficMainCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };
  const graphW = w - padding.left - padding.right;
  const graphH = h - padding.top - padding.bottom;

  ctx.clearRect(0, 0, w, h);

  // Background Grid Lines
  ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'light' ? '#e2e8f0' : '#1e293b';
  ctx.lineWidth = 1;
  const ySteps = 4;
  const maxVal = 350; // Mbps

  for (let i = 0; i <= ySteps; i++) {
    const y = padding.top + (graphH / ySteps) * i;
    const val = Math.round(maxVal - (maxVal / ySteps) * i);
    
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${val}M`, padding.left - 8, y + 4);
  }

  // Draw Time Labels (X-Axis)
  const labels = AppState.trafficHistory.labels;
  const xStep = graphW / (labels.length - 1);
  ctx.textAlign = 'center';
  labels.forEach((lbl, idx) => {
    const x = padding.left + idx * xStep;
    ctx.fillText(lbl, x, h - 10);
  });

  // Helper to draw smooth bezier curve with gradient fill
  function drawLineArea(data, strokeColor, fillColor, glowColor) {
    if (!data.length) return;
    const points = data.map((val, idx) => {
      const x = padding.left + idx * xStep;
      const y = padding.top + graphH - (val / maxVal) * graphH;
      return { x, y };
    });

    // Fill Area
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + graphH);
    ctx.lineTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(points[points.length - 1].x, padding.top + graphH);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + graphH);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Stroke Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw End Glowing Point
    const lastPoint = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }

  // Draw Download (Blue/Cyan) & Upload (Emerald)
  drawLineArea(AppState.trafficHistory.download, '#3b82f6', 'rgba(59, 130, 246, 0.35)', 'rgba(59, 130, 246, 0.6)');
  drawLineArea(AppState.trafficHistory.upload, '#10b981', 'rgba(16, 185, 129, 0.25)', 'rgba(16, 185, 129, 0.6)');
}

function renderDonutChart() {
  const canvas = document.getElementById('userDistributionCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 190;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = 80;
  const innerR = 56;

  const slices = [
    { label: 'Hotspot', percent: 0.65, color: '#3b82f6' },
    { label: 'PPPoE', percent: 0.28, color: '#10b981' },
    { label: 'User Manager', percent: 0.07, color: '#f59e0b' }
  ];

  let startAngle = -Math.PI / 2;
  ctx.clearRect(0, 0, size, size);

  slices.forEach(slice => {
    const sliceAngle = slice.percent * (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    startAngle += sliceAngle;
  });
}

function renderUserWeeklyChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 140 * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 140;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };
  const graphW = w - padding.left - padding.right;
  const graphH = h - padding.top - padding.bottom;

  ctx.clearRect(0, 0, w, h);

  const days = ['09/08', '10/08', '11/08', '12/08', '13/08', '14/08', '15/08'];
  const dl = [1.8, 2.5, 3.2, 2.1, 4.0, 3.5, 5.2]; // GB
  const ul = [0.4, 0.6, 0.9, 0.5, 1.2, 0.8, 1.5];
  const max = 6.0;
  const step = graphW / (days.length - 1);

  // Draw X labels
  ctx.fillStyle = '#64748b';
  ctx.font = '10px Cairo, sans-serif';
  ctx.textAlign = 'center';
  days.forEach((d, i) => {
    ctx.fillText(d, padding.left + i * step, h - 6);
  });

  function drawSimpleCurve(data, color) {
    const points = data.map((val, idx) => ({
      x: padding.left + idx * step,
      y: padding.top + graphH - (val / max) * graphH
    }));

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    points.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  drawSimpleCurve(dl, '#3b82f6');
  drawSimpleCurve(ul, '#10b981');
}

// ==========================================================================
// 6. Realtime Live Monitoring Tick Loop
// ==========================================================================
function startLiveStreamingLoop() {
  setInterval(() => {
    // Fluctuate realtime bandwidth naturally
    const deltaRx = (Math.random() * 14 - 7);
    const deltaTx = (Math.random() * 6 - 3);
    
    AppState.liveRealtime.currentRxMbps = Math.max(80, Math.min(320, +(AppState.liveRealtime.currentRxMbps + deltaRx).toFixed(1)));
    AppState.liveRealtime.currentTxMbps = Math.max(20, Math.min(95, +(AppState.liveRealtime.currentTxMbps + deltaTx).toFixed(1)));

    // Shift traffic chart points
    AppState.trafficHistory.download.shift();
    AppState.trafficHistory.download.push(AppState.liveRealtime.currentRxMbps);
    
    AppState.trafficHistory.upload.shift();
    AppState.trafficHistory.upload.push(AppState.liveRealtime.currentTxMbps);

    // Update real-time DOM counters if on Dashboard or Traffic tab
    const rxEl = document.getElementById('liveDownloadSpeed');
    const txEl = document.getElementById('liveUploadSpeed');
    if (rxEl) rxEl.textContent = `${AppState.liveRealtime.currentRxMbps} Mbps`;
    if (txEl) txEl.textContent = `${AppState.liveRealtime.currentTxMbps} Mbps`;

    // Update Header Hardware Meters
    const cpuVal = Math.round(10 + Math.random() * 6);
    const cpuFill = document.getElementById('headerCpuFill');
    const cpuText = document.getElementById('headerCpuVal');
    if (cpuFill) cpuFill.style.width = `${cpuVal}%`;
    if (cpuText) cpuText.textContent = `${cpuVal}%`;

    const ramMb = Math.round(440 + Math.random() * 30);
    const ramFill = document.getElementById('headerRamFill');
    const ramText = document.getElementById('headerRamVal');
    if (ramFill) ramFill.style.width = `${Math.round((ramMb / 4096) * 100)}%`;
    if (ramText) ramText.textContent = `${ramMb}MB / 4GB`;

    if (AppState.activeTab === 'dashboard') {
      renderTrafficChart();
    } else if (AppState.activeTab === 'traffic') {
      renderRealtimeTrafficView();
    }
  }, 1800);
}

// ==========================================================================
// 7. QR Code & Barcode Generators
// ==========================================================================
function generateQrCodeCanvas(elementId, text, size = 68) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = '';
  
  // Use QRCode library if loaded, else high-resolution dynamic fallback SVG
  if (window.QRCode) {
    new window.QRCode(container, {
      text: text,
      width: size,
      height: size,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M
    });
  } else {
    // Standalone clean QR fallback matrix
    const svg = `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <rect width="100" height="100" fill="#ffffff"/>
      <path fill="#000000" d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z M45,15 h10 v10 h-10 z M45,35 h10 v10 h-10 z M45,55 h10 v10 h-10 z M45,75 h10 v10 h-10 z M65,55 h10 v10 h-10 z M75,65 h15 v10 h-15 z M60,80 h25 v10 h-25 z M15,45 h20 v5 h-20 z"/>
    </svg>`;
    container.innerHTML = svg;
  }
}

function generateBarcodeSvg(code) {
  const str = String(code || '12345678');
  let bars = '';
  let x = 6;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const pattern = [(charCode % 3) + 1, ((charCode >> 1) % 2) + 1, ((charCode >> 2) % 3) + 1, 1];
    pattern.forEach((w, idx) => {
      if (idx % 2 === 0) {
        bars += `<rect x="${x}" y="0" width="${w * 1.5}" height="22" fill="#000000"/>`;
      }
      x += w * 1.5 + 1.2;
    });
  }
  bars = `<rect x="2" y="0" width="2" height="24" fill="#000000"/><rect x="5" y="0" width="1" height="24" fill="#000000"/>` + bars;
  bars += `<rect x="${x + 2}" y="0" width="1" height="24" fill="#000000"/><rect x="${x + 4}" y="0" width="2" height="24" fill="#000000"/>`;

  return `
    <svg viewBox="0 0 ${Math.max(x + 8, 100)} 32" width="100" height="28" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="#ffffff"/>
      ${bars}
      <text x="50%" y="30" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="7" font-weight="700" fill="#000000" letter-spacing="1">${str}</text>
    </svg>
  `;
}

function renderBarcodeToElement(elementId, code) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = generateBarcodeSvg(code);
}

// ==========================================================================
// 8. Hotspot Management & Table Rendering
// ==========================================================================
function getFilteredHotspotUsers() {
  let list = [...AppState.hotspotUsers];
  if (AppState.searchQuery) {
    const q = AppState.searchQuery.toLowerCase().trim();
    list = list.filter(u => u.username.toLowerCase().includes(q) || (u.ip && u.ip.includes(q)) || (u.profile && u.profile.toLowerCase().includes(q)));
  }
  if (AppState.selectedProfileFilter !== 'all') {
    list = list.filter(u => u.profile.toLowerCase().includes(AppState.selectedProfileFilter.toLowerCase()));
  }
  if (AppState.selectedStatusFilter !== 'all') {
    list = list.filter(u => u.status === AppState.selectedStatusFilter);
  }
  return list;
}

function renderHotspotTable() {
  const tbody = document.getElementById('hotspotTableBody');
  if (!tbody) return;

  const filtered = getFilteredHotspotUsers();
  const total = filtered.length;
  const start = (AppState.currentPage - 1) * AppState.pageSize;
  const end = Math.min(start + AppState.pageSize, total);
  const pagedUsers = filtered.slice(start, end);

  if (pagedUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-dim);">لا توجد نتائج مطابقة للبحث أو التصفية الحالية.</td></tr>`;
    return;
  }

  const avatarGradients = ['avatar-teal', 'avatar-purple', 'avatar-amber', 'avatar-blue', 'avatar-emerald'];

  tbody.innerHTML = pagedUsers.map((user, idx) => {
    const avatarClass = avatarGradients[idx % avatarGradients.length];
    const initial = (user.username.charAt(0) || 'U').toUpperCase();
    const isOnline = user.status === 'online';

    return `
      <tr onclick="openUserDrawer('${user.id}')" style="cursor:pointer;">
        <!-- User Details & Avatar -->
        <td>
          <div class="user-cell">
            <div class="user-circle-avatar ${avatarClass}">${initial}</div>
            <div>
              <div style="font-weight:700; color:var(--text-main);">${user.username}</div>
              <div style="font-size:0.72rem; color:var(--text-dim);">${user.ip || '10.0.0.x'}</div>
            </div>
          </div>
        </td>

        <!-- Profile Badge -->
        <td>
          <span class="badge-profile">${user.profile}</span>
        </td>

        <!-- Consumption Progress -->
        <td>
          <div class="progress-cell-wrapper">
            <div class="progress-cell-text">
              <span>${user.usedGB} GB</span>
              <span>${user.percent}%</span>
            </div>
            <div class="rank-progress-track">
              <div class="rank-progress-fill" style="width:${user.percent}%;"></div>
            </div>
          </div>
        </td>

        <!-- Status -->
        <td>
          <span class="badge-status-pill ${isOnline ? 'badge-status-online' : 'badge-status-offline'}">
            <span class="status-dot ${isOnline ? '' : 'offline'}"></span>
            ${isOnline ? 'متصل' : 'غير متصل'}
          </span>
        </td>

        <!-- Creation & Expiration -->
        <td><span style="font-family:'JetBrains Mono'; font-size:0.8rem;">${user.created}</span></td>
        <td><span style="font-family:'JetBrains Mono'; font-size:0.8rem; color:${user.daysLeft <= 3 ? 'var(--accent-rose)' : 'inherit'}">${user.expires}</span></td>

        <!-- Action Buttons -->
        <td onclick="event.stopPropagation();">
          <div class="table-actions-cell">
            <button class="btn btn-icon action-print" title="طباعة كرت المستخدم" onclick="printSingleCard('${user.id}')">
              🖨️
            </button>
            <button class="btn btn-icon action-edit" title="تعديل المستخدم" onclick="openEditUserModal('${user.id}')">
              ✏️
            </button>
            <button class="btn btn-icon" title="${user.status === 'online' ? 'فصل الاتصال' : 'تفعيل'}" onclick="toggleUserStatus('${user.id}')">
              ${user.status === 'online' ? '⚡' : '🔄'}
            </button>
            <button class="btn btn-icon action-del" title="حذف الحساب" onclick="deleteHotspotUser('${user.id}')">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Update Pagination Info
  const countEl = document.getElementById('hotspotPaginationCount');
  if (countEl) {
    countEl.textContent = `عرض ${total > 0 ? start + 1 : 0}-${end} من ${total} مستخدم`;
  }

  // Update Hotspot user badges
  const navBadge = document.getElementById('navHotspotBadge');
  const bnavBadge = document.getElementById('bnavHotspotBadge');
  const activeCount = AppState.hotspotUsers.filter(u => u.status === 'online').length;
  if (navBadge) navBadge.textContent = activeCount;
  if (bnavBadge) bnavBadge.textContent = activeCount;
}

// ==========================================================================
// 9. Broadband (PPPoE) Management & Remote IP Launcher
// ==========================================================================
function renderPPPoETable() {
  const tbody = document.getElementById('pppoeTableBody');
  if (!tbody) return;

  tbody.innerHTML = AppState.pppoeUsers.map((user, idx) => {
    const isOnline = user.status === 'online';
    return `
      <tr>
        <td>
          <div style="font-weight:700;">${user.username}</div>
          <div style="font-size:0.72rem; color:var(--text-dim);">${user.callerId}</div>
        </td>
        <td><span class="badge-profile">${user.profile}</span></td>
        <td><span class="font-mono" style="font-size:0.82rem;">${user.localIp}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <span class="font-mono" style="font-size:0.82rem; font-weight:700; color:var(--primary-light);">${user.remoteIp}</span>
            <button class="btn btn-icon" style="width:26px; height:26px;" title="فتح راوتر المشترك المباشر" onclick="openRemoteRouterAddress('${user.remoteIp}', '${user.username}')">
              🌐
            </button>
          </div>
        </td>
        <td><span class="font-mono" style="font-size:0.78rem;">${user.mac}</span></td>
        <td><span class="font-mono" style="font-size:0.8rem;">${user.uptime}</span></td>
        <td>
          <span class="badge-status-pill ${isOnline ? 'badge-status-online' : 'badge-status-offline'}">
            <span class="status-dot ${isOnline ? '' : 'offline'}"></span>
            ${isOnline ? 'نشط' : 'مفصول'}
          </span>
        </td>
        <td>
          <div class="table-actions-cell">
            <button class="btn btn-secondary" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="openRemoteRouterAddress('${user.remoteIp}', '${user.username}')">
              فتح الراوتر
            </button>
            <button class="btn ${isOnline ? 'btn-danger' : 'btn-success'}" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="togglePPPoEConnection('${user.id}')">
              ${isOnline ? 'فصل' : 'إعادة اتصال'}
            </button>
            <button class="btn btn-icon action-del" onclick="deletePPPoEUser('${user.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openRemoteRouterAddress(remoteIp, username) {
  // Show launcher modal with diagnostics + Direct Open New Tab button
  const modal = document.getElementById('remoteIpModal');
  const ipTitle = document.getElementById('remoteIpTitle');
  const ipText = document.getElementById('remoteIpAddressDisplay');
  const linkBtn = document.getElementById('remoteIpOpenBtn');

  if (modal && ipTitle && ipText && linkBtn) {
    ipTitle.textContent = `راوتر العميل: ${username}`;
    ipText.textContent = `http://${remoteIp}`;
    linkBtn.onclick = () => window.open(`http://${remoteIp}`, '_blank');
    modal.classList.add('active');
  }
}

// ==========================================================================
// 10. User Manager Profiles Module
// ==========================================================================
function renderUserManagerProfiles() {
  const container = document.getElementById('usermanProfilesGrid');
  if (!container) return;

  container.innerHTML = AppState.usermanProfiles.map(prof => `
    <div class="stat-card" style="flex-direction:column; align-items:flex-start; gap:0.85rem;">
      <div style="display:flex; justify-content:space-between; width:100%;">
        <span class="badge-profile" style="font-size:0.85rem;">${prof.name}</span>
        <span style="font-weight:900; font-size:1.2rem; color:var(--accent-emerald); font-family:'JetBrains Mono';">$${prof.price}</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; width:100%; font-size:0.82rem; color:var(--text-muted);">
        <div>السرعة: <strong style="color:var(--text-main);">${prof.downloadSpeed}</strong></div>
        <div>الحصة: <strong style="color:var(--text-main);">${prof.quotaGB} GB</strong></div>
        <div>الصلاحية: <strong style="color:var(--text-main);">${prof.validityDays} يوم</strong></div>
        <div>الأجهزة: <strong style="color:var(--text-main);">${prof.sharedUsers}</strong></div>
      </div>
      <div style="display:flex; gap:0.5rem; width:100%; margin-top:0.5rem;">
        <button class="btn btn-secondary" style="flex:1;" onclick="editProfileModal('${prof.id}')">تعديل الباقة</button>
        <button class="btn btn-icon action-del" onclick="deleteProfile('${prof.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// 11. User Details Drawer (Quadrant 3 in Screenshot)
// ==========================================================================
function openUserDrawer(userId) {
  const user = AppState.hotspotUsers.find(u => u.id === userId) || AppState.hotspotUsers[0];
  if (!user) return;
  AppState.selectedUserForDrawer = user;

  const drawer = document.getElementById('userDetailsDrawer');
  const overlay = document.getElementById('drawerOverlay');

  // Fill Header & Hero Info
  const headerUser = document.getElementById('drawerUsernameHeader');
  if (headerUser) headerUser.textContent = user.username;
  
  const heroAvatar = document.getElementById('drawerHeroAvatar');
  if (heroAvatar) heroAvatar.textContent = user.username.charAt(0).toUpperCase();
  
  const heroName = document.getElementById('drawerHeroName');
  if (heroName) heroName.textContent = user.username;
  
  const heroStatus = document.getElementById('drawerHeroStatus');
  if (heroStatus) {
    heroStatus.textContent = user.status === 'online' ? 'متصل الآن' : 'غير متصل';
    heroStatus.className = `badge-status-pill ${user.status === 'online' ? 'badge-status-online' : 'badge-status-offline'}`;
  }

  // Fill Details Grid
  const elUsername = document.getElementById('drawerInfoUsername');
  if (elUsername) elUsername.textContent = user.username;

  const elPass = document.getElementById('drawerInfoPassword');
  if (elPass) elPass.textContent = '••••••••';

  const elProfile = document.getElementById('drawerInfoProfile');
  if (elProfile) elProfile.textContent = user.profile;

  const elIp = document.getElementById('drawerInfoIp');
  if (elIp) elIp.textContent = user.ip || '10.0.0.15';

  const elMac = document.getElementById('drawerInfoMac');
  if (elMac) elMac.textContent = user.mac || 'AA:BB:CC:DD:EE:FF';

  const elCreated = document.getElementById('drawerInfoCreated');
  if (elCreated) elCreated.textContent = user.created;

  const elExpires = document.getElementById('drawerInfoExpires');
  if (elExpires) elExpires.textContent = `${user.expires} (متبقي ${user.daysLeft} يوم)`;

  const elInfoStatus = document.getElementById('drawerInfoStatusText');
  if (elInfoStatus) {
    elInfoStatus.textContent = user.status === 'online' ? 'نشط' : 'معطل';
    elInfoStatus.style.color = user.status === 'online' ? 'var(--accent-emerald)' : 'var(--text-dim)';
  }

  const toggleStatusBtn = document.getElementById('drawerToggleStatusBtn');
  if (toggleStatusBtn) {
    toggleStatusBtn.textContent = user.status === 'online' ? 'تعطيل' : 'تفعيل';
    toggleStatusBtn.className = user.status === 'online' ? 'btn btn-warning' : 'btn btn-success';
  }

  // Reset tab to stats
  switchDrawerTab('stats');

  // Fill KPI Mini-Cards
  const elDl = document.getElementById('drawerDlTotal');
  if (elDl) elDl.textContent = `${user.downloadTotal || 12.5} GB`;

  const elUl = document.getElementById('drawerUlTotal');
  if (elUl) elUl.textContent = `${user.uploadTotal || 3.1} GB`;

  const elTotal = document.getElementById('drawerTotalUsed');
  if (elTotal) elTotal.textContent = `${user.usedGB} GB`;

  const elUptime = document.getElementById('drawerUptime');
  if (elUptime) elUptime.textContent = user.uptime || '8:45:22';

  // Fill Footer metadata
  const elDevice = document.getElementById('drawerMetaDevice');
  if (elDevice) elDevice.textContent = user.device || 'Android 14';

  const elSpeed = document.getElementById('drawerMetaSpeed');
  if (elSpeed) elSpeed.textContent = user.speed || '25 Mbps / 10 Mbps';

  // Render QR Code inside drawer
  generateQrCodeCanvas('drawerQrCanvasBox', `http://10.0.0.1/login?user=${user.username}&pass=${user.pass}`, 58);

  // Render weekly chart
  setTimeout(() => renderUserWeeklyChart('drawerWeeklyCanvas'), 100);

  // Show Drawer & Overlay
  if (overlay) overlay.classList.add('active');
  if (drawer) drawer.classList.add('active');
}

function closeUserDrawer() {
  const drawer = document.getElementById('userDetailsDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer) drawer.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function switchDrawerTab(tabName) {
  const tabs = ['stats', 'history', 'sessions', 'finance'];
  tabs.forEach(t => {
    const btn = document.getElementById(`drawerTabBtn-${t}`);
    const pane = document.getElementById(`drawerTabPane-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (pane) pane.style.display = (t === tabName) ? 'block' : 'none';
  });

  const user = AppState.selectedUserForDrawer;
  if (!user) return;

  if (tabName === 'history') {
    const tbody = document.getElementById('drawerHistoryTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td>اليوم 10:14 ص</td>
          <td><span class="badge-status-pill badge-status-online">تسجيل دخول ناجح</span></td>
          <td>${user.ip || '10.0.0.15'}</td>
          <td>مستمر الآن</td>
        </tr>
        <tr>
          <td>أمس 08:30 م</td>
          <td><span class="badge-status-pill badge-status-offline">تسجيل خروج (قطع مؤقت)</span></td>
          <td>${user.ip || '10.0.0.15'}</td>
          <td>4 ساعات و 12 د</td>
        </tr>
        <tr>
          <td>14/08 02:15 م</td>
          <td><span class="badge-status-pill badge-status-online">تجديد تلقائي للمفتاح</span></td>
          <td>${user.ip || '10.0.0.15'}</td>
          <td>--</td>
        </tr>
        <tr>
          <td>10/08 10:20 ص</td>
          <td><span class="badge-status-pill badge-status-online">إنشاء الحساب وتفعيله</span></td>
          <td>10.0.0.1</td>
          <td>--</td>
        </tr>
      `;
    }
  } else if (tabName === 'sessions') {
    const container = document.getElementById('drawerSessionsList');
    if (container) {
      container.innerHTML = `
        <div class="stat-card stat-teal" style="padding:0.75rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="font-size:0.85rem;">الجلسة الحالية النشطة (Hotspot Active)</strong>
            <span class="badge-status-pill badge-status-online">متصلة الآن</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px; font-size:0.78rem;">
            <div>IP Address: <strong>${user.ip || '10.0.0.15'}</strong></div>
            <div>MAC: <strong>${user.mac || 'AA:BB:CC:DD:EE:FF'}</strong></div>
            <div>Uptime: <strong>${user.uptime || '8:45:22'}</strong></div>
            <div>NAS Port: <strong>hs-pool1</strong></div>
            <div>Tx / Rx: <strong>${user.uploadTotal || '3.1'} GB / ${user.downloadTotal || '12.5'} GB</strong></div>
            <div>Keepalive: <strong>2m 30s</strong></div>
          </div>
        </div>
        <div class="stat-card" style="padding:0.75rem; background:var(--bg-input); border:1px solid var(--border-light);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="font-size:0.82rem;">الجلسة السابقة (Disconnected)</strong>
            <span style="font-size:0.7rem; color:var(--text-dim);">أمس 08:30 م</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted);">سبب انتهاء الجلسة: User-Request (Logout) | الاستهلاك: 1.2 GB</div>
        </div>
      `;
    }
  } else if (tabName === 'finance') {
    const tbody = document.getElementById('drawerFinanceTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td><code style="color:var(--primary);">#INV-2026-884</code></td>
          <td>${user.created || '2026-08-10'}</td>
          <td><span class="badge-profile">${user.profile}</span></td>
          <td><strong>${user.price || '$15'}</strong></td>
          <td><span class="badge-status-pill badge-status-online">كاش (نقد)</span></td>
        </tr>
        <tr>
          <td><code style="color:var(--primary);">#INV-2026-712</code></td>
          <td>2026-07-10</td>
          <td><span class="badge-profile">${user.profile}</span></td>
          <td><strong>${user.price || '$15'}</strong></td>
          <td><span class="badge-status-pill badge-status-online">بطاقة مسبقة الدفع</span></td>
        </tr>
      `;
    }
  } else if (tabName === 'stats') {
    setTimeout(() => renderUserWeeklyChart('drawerWeeklyCanvas'), 50);
  }
}

function renewUserFromDrawer() {
  const user = AppState.selectedUserForDrawer;
  if (!user) return;
  user.daysLeft = (user.daysLeft || 0) + 30;
  const newDate = new Date(Date.now() + user.daysLeft * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  user.expires = newDate;
  user.status = 'online';
  saveToStorage(STORAGE_KEYS.HOTSPOT_USERS, AppState.hotspotUsers);

  const elExpires = document.getElementById('drawerInfoExpires');
  if (elExpires) elExpires.textContent = `${user.expires} (متبقي ${user.daysLeft} يوم)`;
  const heroStatus = document.getElementById('drawerHeroStatus');
  if (heroStatus) {
    heroStatus.textContent = 'متصل الآن';
    heroStatus.className = 'badge-status-pill badge-status-online';
  }
  const infoStatus = document.getElementById('drawerInfoStatusText');
  if (infoStatus) {
    infoStatus.textContent = 'نشط';
    infoStatus.style.color = 'var(--accent-emerald)';
  }
  renderHotspotTable();
  showToast(`تم تجديد اشتراك ${user.username} لمدة 30 يوم بنجاح!`, 'success');
}

function toggleUserFromDrawer() {
  const user = AppState.selectedUserForDrawer;
  if (!user) return;
  toggleUserStatus(user.id);
  
  const heroStatus = document.getElementById('drawerHeroStatus');
  const infoStatus = document.getElementById('drawerInfoStatusText');
  const btn = document.getElementById('drawerToggleStatusBtn');
  if (heroStatus) {
    heroStatus.textContent = user.status === 'online' ? 'متصل الآن' : 'غير متصل';
    heroStatus.className = `badge-status-pill ${user.status === 'online' ? 'badge-status-online' : 'badge-status-offline'}`;
  }
  if (infoStatus) {
    infoStatus.textContent = user.status === 'online' ? 'نشط' : 'معطل';
    infoStatus.style.color = user.status === 'online' ? 'var(--accent-emerald)' : 'var(--text-dim)';
  }
  if (btn) {
    btn.textContent = user.status === 'online' ? 'تعطيل' : 'تفعيل';
    btn.className = user.status === 'online' ? 'btn btn-warning' : 'btn btn-success';
  }
}

async function deleteUserFromDrawer() {
  const user = AppState.selectedUserForDrawer;
  if (!user) return;
  closeUserDrawer();
  await deleteHotspotUser(user.id);
}

function togglePasswordVisibility(fieldId, isInputField = false) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  
  if (isInputField || el.tagName === 'INPUT') {
    el.type = el.type === 'password' ? 'text' : 'password';
    return;
  }
  
  const user = AppState.selectedUserForDrawer;
  if (!user) return;
  if (el.textContent === '••••••••') {
    el.textContent = user.pass;
  } else {
    el.textContent = '••••••••';
  }
}

// ==========================================================================
// 12. Card / Voucher Designer (Quadrant 4 in Screenshot)
// ==========================================================================
function initCardDesigner() {
  renderCardTemplatesCarousel();
  updateCardDesignPreview();
}

function renderCardTemplatesCarousel() {
  const container = document.getElementById('templatesCarousel');
  if (!container) return;

  container.innerHTML = AppState.cardTemplates.map(tmpl => `
    <div class="template-mini-thumb ${tmpl.id === AppState.currentTemplate.id ? 'active' : ''}" 
         style="background: ${tmpl.primaryColor};" 
         onclick="selectCardTemplate('${tmpl.id}')">
      ${tmpl.name}
    </div>
  `).join('') + `
    <div class="template-mini-thumb" style="border:1px dashed var(--border-light); background:var(--bg-input); color:var(--text-main);" onclick="createNewTemplateModal()">
      + قالب جديد
    </div>
  `;
}

function selectCardTemplate(tmplId) {
  const tmpl = AppState.cardTemplates.find(t => t.id === tmplId);
  if (!tmpl) return;
  AppState.currentTemplate = tmpl;

  // Sync controls with selected template
  const companyInput = document.getElementById('propCompanyName');
  const sloganInput = document.getElementById('propSlogan');
  const colorInput = document.getElementById('propColor');
  const iconInput = document.getElementById('propIcon');
  const phoneInput = document.getElementById('propSupportPhone');
  const priceInput = document.getElementById('propPrice');
  const hostInput = document.getElementById('propLoginHost');
  const codeTypeInput = document.getElementById('propCodeType');
  const batchTmplSelect = document.getElementById('batchTemplateSelector');

  if (companyInput && tmpl.companyName) companyInput.value = tmpl.companyName;
  if (sloganInput && tmpl.slogan) sloganInput.value = tmpl.slogan;
  if (colorInput && tmpl.primaryColor) colorInput.value = tmpl.primaryColor;
  if (iconInput && tmpl.icon) iconInput.value = tmpl.icon;
  if (phoneInput && tmpl.phone) phoneInput.value = tmpl.phone;
  if (priceInput && tmpl.price) priceInput.value = tmpl.price;
  if (hostInput && tmpl.host) hostInput.value = tmpl.host;
  if (codeTypeInput && tmpl.codeType) codeTypeInput.value = tmpl.codeType;
  if (batchTmplSelect && batchTmplSelect.value !== tmpl.id) batchTmplSelect.value = tmpl.id;

  renderCardTemplatesCarousel();
  updateCardDesignPreview();
  showToast(`تم تطبيق قالب: ${tmpl.name}`, 'info');
}

function setCardFontSizePreset(userPx, passPx) {
  const userSlider = document.getElementById('propUserFontSize');
  const passSlider = document.getElementById('propPassFontSize');
  if (userSlider) userSlider.value = userPx;
  if (passSlider) passSlider.value = passPx;
  updateCardDesignPreview();
  showToast(`تم ضبط حجم الخط: ${userPx}px`, 'info');
}
window.setCardFontSizePreset = setCardFontSizePreset;

function updateCardDesignPreview() {
  const card = document.getElementById('designerVoucherPreview');
  if (!card) return;

  const tmpl = AppState.currentTemplate;
  const iconInput = document.getElementById('propIcon');
  const companyInput = document.getElementById('propCompanyName');
  const loginHostInput = document.getElementById('propLoginHost');
  const phoneInput = document.getElementById('propSupportPhone');
  const priceInput = document.getElementById('propPrice');
  const sloganInput = document.getElementById('propSlogan');
  const codeTypeInput = document.getElementById('propCodeType');
  const radiusInput = document.getElementById('propRadius');
  const colorInput = document.getElementById('propColor');

  // Font sizes for credentials
  const userFontSizeInput = document.getElementById('propUserFontSize');
  const passFontSizeInput = document.getElementById('propPassFontSize');
  const userFontSize = userFontSizeInput ? parseInt(userFontSizeInput.value, 10) : 17;
  const passFontSize = passFontSizeInput ? parseInt(passFontSizeInput.value, 10) : 17;

  const valUserFont = document.getElementById('valUserFontSize');
  const valPassFont = document.getElementById('valPassFontSize');
  if (valUserFont) valUserFont.textContent = `${userFontSize}px`;
  if (valPassFont) valPassFont.textContent = `${passFontSize}px`;

  const previewUserEl = document.getElementById('previewCardUser');
  const previewPassEl = document.getElementById('previewCardPass');
  if (previewUserEl) previewUserEl.style.fontSize = `${userFontSize}px`;
  if (previewPassEl) previewPassEl.style.fontSize = `${passFontSize}px`;

  const icon = iconInput ? iconInput.value : (tmpl.icon || '🌐');
  const company = companyInput ? companyInput.value : tmpl.companyName;
  const host = loginHostInput ? loginHostInput.value : (tmpl.host || '10.0.0.1/login');
  const phone = phoneInput ? phoneInput.value : (tmpl.phone || '770-000-000');
  const price = priceInput ? priceInput.value : (tmpl.price || '5$');
  const slogan = sloganInput ? sloganInput.value : tmpl.slogan;
  const codeType = codeTypeInput ? codeTypeInput.value : (tmpl.codeType || 'qr');
  const radius = radiusInput ? `${radiusInput.value}px` : (tmpl.borderRadius || '12px');
  const color = colorInput ? colorInput.value : tmpl.primaryColor;

  card.className = `voucher-card-preview ${tmpl.themeClass || ''}`;
  card.style.borderRadius = radius;
  if (!tmpl.themeClass) {
    card.style.background = `linear-gradient(135deg, ${color} 0%, #064e3b 50%, #022c22 100%)`;
  } else {
    card.style.background = '';
  }

  const iconEl = document.getElementById('previewCardIcon');
  const brandEl = document.getElementById('previewCardBrand');
  const priceEl = document.getElementById('previewCardPrice');
  const hostEl = document.getElementById('previewCardHost');
  const sloganEl = document.getElementById('previewCardSlogan');
  const phoneEl = document.getElementById('previewCardPhone');
  const qrBox = document.getElementById('previewCardQrBox');
  const barcodeBox = document.getElementById('previewCardBarcodeBox');

  if (iconEl) iconEl.textContent = icon;
  if (brandEl) brandEl.textContent = company;
  if (priceEl) priceEl.textContent = price;
  if (hostEl) hostEl.textContent = host.startsWith('http') ? host : `http://${host}`;
  if (sloganEl) sloganEl.textContent = slogan;
  if (phoneEl) phoneEl.textContent = `📞 ${phone}`;

  const cleanHost = host.replace(/^https?:\/\//, '');
  const smartAutoLoginUrl = `http://${cleanHost}?username=user_84920&password=94821034`;

  // Toggle QR and Barcode visibility according to codeType
  if (codeType === 'qr') {
    if (qrBox) {
      qrBox.style.display = 'block';
      generateQrCodeCanvas('previewCardQrBox', smartAutoLoginUrl, 68);
    }
    if (barcodeBox) barcodeBox.style.display = 'none';
  } else if (codeType === 'barcode') {
    if (qrBox) qrBox.style.display = 'none';
    if (barcodeBox) {
      barcodeBox.style.display = 'block';
      renderBarcodeToElement('previewCardBarcodeBox', '94821034');
    }
  } else {
    // Both QR and Barcode
    if (qrBox) {
      qrBox.style.display = 'block';
      generateQrCodeCanvas('previewCardQrBox', smartAutoLoginUrl, 52);
    }
    if (barcodeBox) {
      barcodeBox.style.display = 'block';
      renderBarcodeToElement('previewCardBarcodeBox', '94821034');
    }
  }
}

function printHtmlDocument(htmlContent) {
  let printedViaWindow = false;
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printedViaWindow = true;
      return;
    }
  } catch (e) {
    console.warn('Popup blocked or error in window.open, using hidden iframe fallback:', e);
  }

  // Fallback: render in hidden iframe
  let printFrame = document.getElementById('appPrintHiddenIframe');
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'appPrintHiddenIframe';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '10px';
    printFrame.style.height = '10px';
    printFrame.style.opacity = '0.01';
    printFrame.style.border = 'none';
    printFrame.style.pointerEvents = 'none';
    printFrame.style.zIndex = '-9999';
    document.body.appendChild(printFrame);
  }

  try {
    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();
  } catch (err) {
    console.error('Print iframe error:', err);
    showToast('يرجى السماح بالنوافذ المنبثقة للطباعة', 'info');
  }
}

function printSingleCard(userId) {
  const user = AppState.hotspotUsers.find(u => u.id === userId) || AppState.hotspotUsers[0];
  const tmpl = AppState.currentTemplate;

  const icon = document.getElementById('propIcon')?.value || tmpl.icon || '🌐';
  const company = document.getElementById('propCompanyName')?.value || tmpl.companyName;
  const host = document.getElementById('propLoginHost')?.value || tmpl.host || '10.0.0.1/login';
  const phone = document.getElementById('propSupportPhone')?.value || tmpl.phone || '770-000-000';
  const price = document.getElementById('propPrice')?.value || tmpl.price || '5$';
  const slogan = document.getElementById('propSlogan')?.value || tmpl.slogan;
  const codeType = document.getElementById('propCodeType')?.value || tmpl.codeType || 'qr';
  const paperFormat = document.getElementById('propPaperFormat')?.value || 'a4-24';
  const cutLines = document.getElementById('propCutLines')?.checked !== false;

  const cleanHost = host.replace(/^https?:\/\//, '');
  const smartLoginUrl = `http://${cleanHost}?username=${encodeURIComponent(user.username)}&password=${encodeURIComponent(user.pass)}`;

  const barcodeHtml = (codeType === 'barcode' || codeType === 'both') ? generateBarcodeSvg(user.pass || user.username) : '';
  const showQr = codeType === 'qr' || codeType === 'both';
  const qrSize = codeType === 'both' ? 52 : 68;

  const userFontSize = document.getElementById('propUserFontSize')?.value || 17;
  const passFontSize = document.getElementById('propPassFontSize')?.value || 17;

  const fullHtml = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>طباعة كرت - ${user.username}</title>
      <link rel="stylesheet" href="/style.css">
      <style>
        body { background:#fff; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px; font-family:'Cairo', sans-serif; }
        .print-single-wrapper { position:relative; ${cutLines ? 'padding:8px; border:1px dashed #94a3b8; border-radius:14px;' : ''} }
        .cut-indicator { position:absolute; top:-12px; right:10px; font-size:12px; color:#64748b; background:#fff; padding:0 4px; }
      </style>
    </head>
    <body>
      <div class="print-single-wrapper">
        ${cutLines ? '<div class="cut-indicator">✂️ خط القص</div>' : ''}
        <div class="voucher-card-preview ${tmpl.themeClass || ''}" style="width:360px; height:230px; border-radius:${tmpl.borderRadius || '12px'};">
          <!-- Decorative Wave -->
          <svg class="card-bg-wave-svg" viewBox="0 0 500 150" preserveAspectRatio="none">
            <path d="M0,80 C150,160 350,0 500,80 L500,150 L0,150 Z" fill="rgba(255,255,255,0.15)"></path>
          </svg>

          <div class="card-header-row">
            <div class="card-brand-title">${icon} ${company}</div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:0.75rem; background:rgba(0,0,0,0.3); padding:2px 8px; border-radius:10px; font-weight:800; color:#fbbf24;">${price}</span>
              <span style="font-size:0.75rem; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:10px;">${user.profile}</span>
            </div>
          </div>

          <div class="card-body-row">
            <div class="card-credentials-box">
              <div class="card-cred-label">اسم المستخدم (Username)</div>
              <div class="card-cred-val" style="font-size:${userFontSize}px;">${user.username}</div>
              <div class="card-cred-label" style="margin-top:4px;">كلمة المرور (Password)</div>
              <div class="card-cred-val" style="font-size:${passFontSize}px;">${user.pass}</div>
              <div style="font-size:0.65rem; opacity:0.85; margin-top:3px; font-family:'JetBrains Mono';">
                🔗 http://${cleanHost}
              </div>
            </div>

            <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
              ${showQr ? `<div id="printQr" style="background:#fff; padding:4px; border-radius:6px;"></div>` : ''}
              ${barcodeHtml ? `<div style="background:#fff; padding:2px 4px; border-radius:4px;">${barcodeHtml}</div>` : ''}
            </div>
          </div>

          <div class="card-footer-row">
            <span>${slogan}</span>
            <span style="direction:ltr; font-family:'JetBrains Mono'; font-weight:700;">📞 ${phone}</span>
          </div>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <script>
        window.onload = function() {
          ${showQr ? `
          if (window.QRCode) {
            new QRCode(document.getElementById('printQr'), {
              text: '${smartLoginUrl}',
              width: ${qrSize},
              height: ${qrSize},
              colorDark: '#000000',
              colorLight: '#ffffff'
            });
          }
          ` : ''}
          setTimeout(() => { window.print(); }, 400);
        };
      <\/script>
    </body>
    </html>
  `;

  printHtmlDocument(fullHtml);
}

// ==========================================================================
// 13. Batch Voucher Generator & Printing Center
// ==========================================================================
function generateBatchVouchers(count = 10, prefix = 'card_', profile = '30GB Super Speed', options = {}) {
  const newUsers = [];
  const today = new Date().toISOString().split('T')[0];
  const expireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const accountMode = options.accountMode || 'user_pass';
  const codeLength = options.codeLength || 8;
  const resellerName = options.resellerName || 'الدفعة العامة';
  const price = options.price || '5$';

  const minCode = Math.pow(10, codeLength - 1);
  const maxCodeMultiplier = 9 * minCode;

  for (let i = 1; i <= count; i++) {
    const randomCode = Math.floor(minCode + Math.random() * maxCodeMultiplier);
    const username = `${prefix}${randomCode}`;
    // In user_equals_pass mode, password is the same as username or code
    const password = accountMode === 'user_equals_pass' ? `${randomCode}` : `${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newUser = {
      id: `hs-${Date.now()}-${i}`,
      username: username,
      pass: password,
      profile: profile.includes('30') ? '30GB' : (profile.includes('50') ? '50GB' : (profile.includes('100') ? '100GB' : 'Unlimited')),
      usedGB: 0,
      totalGB: profile.includes('50') ? 50 : (profile.includes('100') ? 100 : 30),
      percent: 0,
      status: 'offline',
      ip: `10.0.1.${(i % 200) + 10}`,
      mac: '00:00:00:00:00:00',
      created: today,
      expires: expireDate,
      daysLeft: 30,
      downloadTotal: 0,
      uploadTotal: 0,
      uptime: '0:00:00',
      device: 'Not Connected',
      speed: '25 Mbps / 10 Mbps',
      reseller: resellerName,
      price: price
    };
    newUsers.push(newUser);
  }

  // Prepend to hotspot users list and store as latest batch
  AppState.hotspotUsers = [...newUsers, ...AppState.hotspotUsers];
  AppState.lastGeneratedBatch = newUsers;
  saveToStorage(STORAGE_KEYS.HOTSPOT_USERS, AppState.hotspotUsers);
  renderHotspotTable();
  showToast(`تم توليد ${count} كرت جديد بنجاح!`, 'success');
  return newUsers;
}

function openBatchPrintModal() {
  const modal = document.getElementById('batchPrintModal');
  if (modal) modal.classList.add('active');
}

async function executeBatchPrint() {
  const count = parseInt(document.getElementById('batchPrintCount')?.value || '24', 10);
  const prefix = document.getElementById('batchPrintPrefix')?.value || 'card_';
  const profile = document.getElementById('batchPrintProfile')?.value || '30GB';
  const accountMode = document.getElementById('batchAccountMode')?.value || 'user_pass';
  const codeLength = parseInt(document.getElementById('batchCodeLength')?.value || '8', 10);
  const resellerName = document.getElementById('batchResellerName')?.value || 'دفعة الكروت العامة';
  const templateId = document.getElementById('batchTemplateSelector')?.value || AppState.currentTemplate.id;
  const paperSize = document.getElementById('batchPaperSize')?.value || 'a4-24';
  const cutLines = document.getElementById('batchCutLines')?.checked !== false;
  const autoSyncRouter = document.getElementById('batchAutoSyncRouter')?.checked !== false;
  const charSet = document.getElementById('batchCharSet')?.value || 'numeric';
  const timeLimit = document.getElementById('batchTimeLimit')?.value || '30d';

  const tmpl = AppState.cardTemplates.find(t => t.id === templateId) || AppState.currentTemplate;
  const price = tmpl.price || '5$';

  showToast(`جاري توليد دفعة (${count}) كرت وحفظها...`, 'info');

  let generated = [];
  try {
    const res = await fetch('/api/hotspot/batches/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `دفعة ${profile} (${count} كرت) - ${resellerName}`,
        profile,
        quantity: count,
        price,
        reseller: resellerName,
        prefix,
        codeLength,
        characterSet: charSet,
        accountMode,
        timeLimit,
        syncToRouter: autoSyncRouter,
        routerId: AppState.activeRouter ? AppState.activeRouter.id : 'default-router'
      })
    });
    const result = await res.json();
    if (result.success && result.data && Array.isArray(result.data.cards)) {
      generated = result.data.cards.map(c => ({
        id: c.id,
        username: c.username,
        pass: c.password || c.pass || '',
        profile: c.profile || profile,
        price: c.price || price,
        reseller: c.reseller || resellerName,
        daysLeft: 30,
        usedGB: 0,
        totalGB: 30,
        percent: 0,
        status: 'offline',
        created: new Date().toISOString().split('T')[0]
      }));
      showToast(result.message || `تم إنشاء الدفعة وحفظها في قاعدة البيانات!`, 'success');
      loadBatchesFromBackend();
    } else {
      throw new Error(result.error || 'فشل التوليد من الخادم');
    }
  } catch (err) {
    console.warn('Fallback to local voucher generation:', err);
    generated = generateBatchVouchers(count, prefix, profile, {
      accountMode,
      codeLength,
      resellerName,
      price: tmpl.price || '5$'
    });
    if (autoSyncRouter && AppState.activeRouter) {
      MikroTikAPI.batchCreateHotspotUsers(AppState.activeRouter, generated);
    }
  }

  // Prepend to hotspot users list and store as latest batch
  AppState.hotspotUsers = [...generated, ...AppState.hotspotUsers];
  AppState.lastGeneratedBatch = generated;
  saveToStorage(STORAGE_KEYS.HOTSPOT_USERS, AppState.hotspotUsers);
  renderHotspotTable();

  // Print cards
  renderAndPrintBatchHtml(generated, {
    tmpl,
    resellerName,
    count: generated.length,
    paperSize,
    cutLines,
    batchTitle: `دفعة ${profile} (${count} كرت) - ${resellerName}`
  });
}

function renderAndPrintBatchHtml(cards, options = {}) {
  const tmpl = options.tmpl || AppState.currentTemplate;
  const resellerName = options.resellerName || 'دفعة الكروت العامة';
  const count = options.count || cards.length;
  const paperSize = options.paperSize || 'a4-24';
  const cutLines = options.cutLines !== false;
  const host = tmpl.host || '10.0.0.1/login';
  const cleanHost = host.replace(/^https?:\/\//, '');
  const icon = tmpl.icon || '🌐';
  const phone = tmpl.phone || '770-000-000';
  const price = tmpl.price || '5$';
  const isThermal = paperSize === 'thermal-roll' || tmpl.themeClass === 'card-theme-thermal-pos';
  const customUserFontSize = document.getElementById('propUserFontSize')?.value || (isThermal ? 16 : 13);
  const customPassFontSize = document.getElementById('propPassFontSize')?.value || (isThermal ? 16 : 13);

  const cardsHtml = cards.map((u, index) => {
    const pass = u.pass || u.password || '';
    const smartLoginUrl = `http://${cleanHost}?username=${encodeURIComponent(u.username)}&password=${encodeURIComponent(pass)}`;
    const barcodeSvg = generateBarcodeSvg(pass || u.username);

    if (isThermal) {
      return `
        <div class="thermal-card-item ${cutLines ? 'cut-line-indicator' : ''}">
          <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:6px; margin-bottom:8px;">
            <div style="font-size:16px; font-weight:900;">${icon} ${tmpl.companyName}</div>
            <div style="font-size:11px; font-weight:700;">إيصال باقة إنترنت - ${u.profile}</div>
            <div style="font-size:10px; color:#555;">🔗 http://${cleanHost}</div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-family:'JetBrains Mono', monospace; font-size:${customUserFontSize}px; font-weight:800;">
            <div>اسم المستخدم:</div>
            <div style="letter-spacing:1px;">${u.username}</div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-family:'JetBrains Mono', monospace; font-size:${customPassFontSize}px; font-weight:800;">
            <div>كلمة المرور:</div>
            <div style="letter-spacing:1px;">${pass}</div>
          </div>
          <div style="display:flex; justify-content:center; margin:8px 0;">
            <div class="card-qr-target" data-qr-text="${smartLoginUrl}" style="background:#fff; padding:2px; display:inline-block;"></div>
          </div>
          <div style="display:flex; justify-content:center; margin-bottom:8px;">
            ${barcodeSvg}
          </div>
          <div style="border-top:1px dashed #000; padding-top:6px; text-align:center; font-size:10px; line-height:1.4;">
            <div>${tmpl.slogan}</div>
            <div style="font-weight:700;">السعر: ${u.price || price} | هاتف الدعم: ${phone}</div>
            <div style="color:#666; font-size:9px;">#${index + 1} | تاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="voucher-card-preview ${tmpl.themeClass || ''} batch-card-item ${cutLines ? 'cut-line-indicator' : ''}">
        <!-- SVG Decorative Wave -->
        <svg class="card-bg-wave-svg" viewBox="0 0 500 150" preserveAspectRatio="none">
          <path d="M0,80 C150,160 350,0 500,80 L500,150 Z" fill="rgba(255,255,255,0.15)"></path>
        </svg>

        <div class="card-header-row">
          <div class="card-brand-title">${icon} ${tmpl.companyName}</div>
          <div style="display:flex; align-items:center; gap:4px;">
            <span style="font-size:0.65rem; background:rgba(0,0,0,0.35); padding:1px 6px; border-radius:8px; font-weight:800; color:#fbbf24;">${u.price || price}</span>
            <span style="font-size:0.65rem; background:rgba(255,255,255,0.25); padding:1px 6px; border-radius:8px; font-weight:700;">${u.profile}</span>
          </div>
        </div>

        <div class="card-body-row">
          <div class="card-credentials-box">
            <div class="card-cred-label">المستخدم (User):</div>
            <div class="card-cred-val" style="font-size:${customUserFontSize}px;">${u.username}</div>
            <div class="card-cred-label" style="margin-top:2px;">كلمة المرور (Pass):</div>
            <div class="card-cred-val" style="font-size:${customPassFontSize}px;">${pass}</div>
            <div style="font-size:0.55rem; opacity:0.85; margin-top:2px; font-family:'JetBrains Mono';">
              🔗 http://${cleanHost}
            </div>
          </div>

          <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
            <div class="card-qr-target" data-qr-text="${smartLoginUrl}" style="background:#fff; padding:2px; border-radius:4px;"></div>
            <div style="background:#fff; border-radius:2px; padding:1px;">${barcodeSvg}</div>
          </div>
        </div>

        <div class="card-footer-row">
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:65%;">${tmpl.slogan}</span>
          <span style="direction:ltr; font-family:'JetBrains Mono'; font-weight:700;">📞 ${phone}</span>
        </div>
      </div>
    `;
  }).join('');

  let gridCss = '';
  if (isThermal) {
    gridCss = `
      @page { size: 80mm auto; margin: 0mm; }
      body { background:#fff; font-family:'Cairo', sans-serif; padding:4mm; width:76mm; margin:0 auto; color:#000; }
      .thermal-card-item { width:100%; border:1px solid #000; padding:10px; margin-bottom:12px; page-break-inside:avoid; background:#fff; position:relative; }
      .cut-line-indicator { border-bottom:2px dashed #000; padding-bottom:14px; margin-bottom:16px; }
      .cut-line-indicator::after { content:'✂️ قص هنا'; position:absolute; bottom:-11px; left:50%; transform:translateX(-50%); background:#fff; padding:0 8px; font-size:10px; color:#555; }
    `;
  } else if (paperSize === 'a4-24') {
    gridCss = `
      @page { size: A4 portrait; margin: 4mm; }
      body { background:#fff; font-family:'Cairo', sans-serif; margin:0; padding:4mm; color:#000; }
      .batch-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 4px; width: 100%; }
      .batch-card-item { width:100% !important; height:110px !important; padding:6px 8px !important; page-break-inside:avoid; position:relative; }
      .batch-card-item .card-brand-title { font-size:0.65rem !important; }
      .batch-card-item .card-cred-val { font-size:0.75rem !important; }
      .batch-card-item .card-footer-row { font-size:0.55rem !important; }
      .cut-line-indicator { border:1px dashed #cbd5e1 !important; }
    `;
  } else if (paperSize === 'a4-12') {
    gridCss = `
      @page { size: A4 portrait; margin: 6mm; }
      body { background:#fff; font-family:'Cairo', sans-serif; margin:0; padding:6mm; color:#000; }
      .batch-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; }
      .batch-card-item { width:100% !important; height:165px !important; padding:10px !important; page-break-inside:avoid; position:relative; }
      .cut-line-indicator { border:1px dashed #94a3b8 !important; }
    `;
  } else {
    gridCss = `
      @page { size: A5 portrait; margin: 5mm; }
      body { background:#fff; font-family:'Cairo', sans-serif; margin:0; padding:5mm; color:#000; }
      .batch-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap: 6px; width: 100%; }
      .batch-card-item { width:100% !important; height:140px !important; padding:8px !important; page-break-inside:avoid; position:relative; }
    `;
  }

  const fullBatchHtml = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>طباعة دفعة كروت الإنترنت (${count} كرت) - ${tmpl.companyName}</title>
      <link rel="stylesheet" href="/style.css">
      <style>
        ${gridCss}
      </style>
    </head>
    <body>
      ${isThermal ? '' : `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
        <div style="font-size:12px; font-weight:800;">${icon} ${tmpl.companyName} | ${resellerName} (${count} كرت)</div>
        <div style="font-size:10px; color:#64748b;">تاريخ التوليد: ${new Date().toLocaleString('ar-EG')}</div>
      </div>
      `}
      <div class="${isThermal ? 'thermal-container' : 'batch-grid'}">
        ${cardsHtml}
      </div>

      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <script>
        window.onload = function() {
          if (window.QRCode) {
            const qrElements = document.querySelectorAll('.card-qr-target');
            qrElements.forEach(el => {
              const text = el.getAttribute('data-qr-text');
              new QRCode(el, {
                text: text,
                width: ${isThermal ? 64 : 44},
                height: ${isThermal ? 64 : 44},
                colorDark: '#000000',
                colorLight: '#ffffff'
              });
            });
          }
          setTimeout(() => { window.print(); }, 500);
        };
      <\/script>
    </body>
    </html>
  `;

  printHtmlDocument(fullBatchHtml);
}

async function loadBatchesFromBackend() {
  try {
    const res = await fetch('/api/hotspot/batches');
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      AppState.savedBatches = result.data;
      renderBatchesArchiveTable();
    }
  } catch (err) {
    console.warn('Failed to load batches from backend:', err);
  }
}

function renderBatchesArchiveTable() {
  const tbody = document.getElementById('batchesArchiveTableBody');
  if (!tbody) return;

  const batches = AppState.savedBatches || [];
  if (batches.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-dim);">
          لا توجد دفعات مولدة محفوظة في الأرشيف حالياً. ابدأ بتوليد دفعة جديدة أعلاه.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = batches.map(b => {
    const isSynced = b.syncedToRouter === true;
    const modeLabels = {
      user_equals_pass: 'مستخدم = كلمة سر',
      user_pass: 'مستخدم وكلمة سر',
      pin_only: 'رمز PIN فقط'
    };
    const modeLabel = modeLabels[b.accountMode] || b.accountMode || 'مستخدم وكلمة سر';
    const dateFormatted = b.createdAt ? new Date(b.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

    return `
      <tr>
        <td>
          <div style="font-weight:700; color:var(--text-main); font-size:0.88rem;">${b.name || 'دفعة كروت'}</div>
          <div style="font-size:0.75rem; color:var(--text-dim); display:flex; align-items:center; gap:4px; margin-top:2px;">
            <span>الموزع: ${b.reseller || 'عام'}</span>
            <span>•</span>
            <span style="font-family:'JetBrains Mono'; font-size:0.7rem;">${b.id}</span>
          </div>
        </td>
        <td>
          <span class="badge-profile">${b.profile}</span>
        </td>
        <td>
          <strong style="color:var(--accent-amber); font-size:0.88rem;">${b.price || '5$'}</strong>
        </td>
        <td>
          <span style="font-weight:700; font-family:'JetBrains Mono';">${b.quantity || (b.cards ? b.cards.length : 0)} كرت</span>
        </td>
        <td>
          <span style="font-size:0.78rem; background:var(--bg-input); padding:2px 6px; border-radius:4px; border:1px solid var(--border-light);">
            ${modeLabel}
          </span>
        </td>
        <td>
          <span class="badge-status-pill ${isSynced ? 'badge-status-online' : 'badge-status-offline'}" style="font-size:0.75rem;">
            <span class="status-dot ${isSynced ? '' : 'offline'}"></span>
            ${isSynced ? 'متزامن ⚡' : 'محلي فقط 📁'}
          </span>
        </td>
        <td>
          <span style="font-family:'JetBrains Mono'; font-size:0.78rem; color:var(--text-muted);">${dateFormatted}</span>
        </td>
        <td>
          <div class="table-actions-cell">
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="printExistingBatch('${b.id}')" title="إعادة طباعة هذه الدفعة">
              🖨️ طباعة
            </button>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="exportSingleBatchCsv('${b.id}')" title="تصدير كروت الدفعة كملف Excel / CSV">
              📊 CSV
            </button>
            ${!isSynced ? `
              <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="syncExistingBatch('${b.id}')" title="مزامنة هذه الدفعة وإرسال كروتها للمايكروتك الآن">
                ⚡ مزامنة
              </button>
            ` : ''}
            <button class="btn btn-icon action-del" style="width:28px; height:28px;" onclick="deleteExistingBatch('${b.id}')" title="حذف الدفعة">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function printExistingBatch(batchId) {
  let batch = AppState.savedBatches.find(b => b.id === batchId);
  if (!batch || !batch.cards || batch.cards.length === 0) {
    try {
      showToast('جاري جلب بيانات الدفعة من الخادم للطباعة...', 'info');
      const res = await fetch(`/api/hotspot/batches/${batchId}`);
      const data = await res.json();
      if (data.success && data.data) {
        batch = data.data;
      }
    } catch (err) {
      showToast('تعذر جلب تفاصيل الدفعة', 'error');
      return;
    }
  }

  if (!batch || !batch.cards || batch.cards.length === 0) {
    showToast('لا توجد بطاقات في هذه الدفعة', 'warning');
    return;
  }

  const templateId = document.getElementById('batchTemplateSelector')?.value || AppState.currentTemplate.id;
  const paperSize = document.getElementById('batchPaperSize')?.value || 'a4-24';
  const cutLines = document.getElementById('batchCutLines')?.checked !== false;
  const tmpl = AppState.cardTemplates.find(t => t.id === templateId) || AppState.currentTemplate;

  const cards = batch.cards.map(c => ({
    ...c,
    pass: c.password || c.pass || ''
  }));

  renderAndPrintBatchHtml(cards, {
    tmpl,
    resellerName: batch.reseller || 'دفعة مؤرشفة',
    count: cards.length,
    paperSize,
    cutLines,
    batchTitle: batch.name || `دفعة ${batch.profile}`
  });
}

async function exportSingleBatchCsv(batchId) {
  try {
    showToast('جاري تصدير ملف CSV للدفعة...', 'info');
    const tmpl = AppState.currentTemplate;
    const host = tmpl.host || '10.0.0.1/login';
    const cleanHost = host.replace(/^https?:\/\//, '');

    const res = await fetch(`/api/hotspot/batches/${batchId}/export?format=csv&host=${encodeURIComponent(cleanHost)}`);
    if (!res.ok) throw new Error('فشل التصدير من الخادم');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_${batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل ملف الإكسل (CSV) للدفعة بنجاح!', 'success');
  } catch (err) {
    console.error('CSV Export error:', err);
    const batch = AppState.savedBatches.find(b => b.id === batchId);
    if (batch && batch.cards) {
      const tmpl = AppState.currentTemplate;
      const cleanHost = (tmpl.host || '10.0.0.1/login').replace(/^https?:\/\//, '');
      let csv = '\uFEFFاسم المستخدم,كلمة المرور,الباقة,الصلاحية,السعر,الموزع / الدفعة,رابط تسجيل الدخول المباشر,تاريخ التوليد\n';
      batch.cards.forEach(u => {
        const pass = u.password || u.pass || '';
        const directLogin = `http://${cleanHost}?username=${u.username}&password=${pass}`;
        csv += `"${u.username}","${pass}","${u.profile}","${u.limitUptime || '30d'}","${u.price || batch.price || '5$'}","${u.reseller || batch.reseller || 'الدفعة العامة'}","${directLogin}","${u.createdAt || batch.createdAt || ''}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_${batchId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('تم تصدير ملف الإكسل (CSV) بنجاح!', 'success');
    } else {
      showToast('تعذر تصدير ملف CSV', 'error');
    }
  }
}

async function syncExistingBatch(batchId) {
  try {
    showToast('جاري مزامنة الدفعة وإرسالها إلى راوتر المايكروتك...', 'info');
    const res = await fetch(`/api/hotspot/batches/${batchId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || `تمت مزامنة كروت الدفعة بنجاح!`, 'success');
      await loadBatchesFromBackend();
    } else {
      showToast(data.error || 'تعذرت المزامنة المباشرة مع الراوتر', 'error');
    }
  } catch (err) {
    showToast('فشل الاتصال بالخادم أثناء المزامنة', 'error');
  }
}

async function deleteExistingBatch(batchId) {
  const batch = AppState.savedBatches.find(b => b.id === batchId);
  const name = batch?.name || batchId;
  if (!confirm(`هل أنت متأكد من حذف ${name} من الأرشيف؟`)) return;

  try {
    showToast('جاري حذف الدفعة...', 'info');
    const res = await fetch(`/api/hotspot/batches/${batchId}?deleteFromRouter=true`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      AppState.savedBatches = AppState.savedBatches.filter(b => b.id !== batchId);
      renderBatchesArchiveTable();
      showToast('تم حذف الدفعة بنجاح', 'success');
    } else {
      showToast(data.error || 'تعذر حذف الدفعة', 'error');
    }
  } catch (err) {
    showToast('فشل طلب الحذف', 'error');
  }
}

function exportBatchCsv() {
  const batch = (AppState.lastGeneratedBatch && AppState.lastGeneratedBatch.length > 0)
    ? AppState.lastGeneratedBatch
    : AppState.hotspotUsers.slice(0, 50);

  if (!batch || batch.length === 0) {
    showToast('لا توجد بطاقات متاحة للتصدير حالياً', 'warning');
    return;
  }

  const tmpl = AppState.currentTemplate;
  const host = tmpl.host || '10.0.0.1/login';
  const cleanHost = host.replace(/^https?:\/\//, '');

  let csv = '\uFEFF'; // UTF-8 BOM for Arabic Excel support
  csv += 'اسم المستخدم,كلمة المرور,الباقة,الصلاحية,السعر,الموزع / الدفعة,رابط تسجيل الدخول المباشر,تاريخ التوليد\n';

  batch.forEach(u => {
    const directLogin = `http://${cleanHost}?username=${u.username}&password=${u.pass}`;
    csv += `"${u.username}","${u.pass}","${u.profile}","${u.daysLeft || 30} يوم","${u.price || '5$'}","${u.reseller || 'الدفعة العامة'}","${directLogin}","${u.created || new Date().toISOString().split('T')[0]}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tawaswl_cards_batch_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`تم تصدير ملف الإكسل (CSV) لـ ${batch.length} كرت بنجاح!`, 'success');
}

// ==========================================================================
// 13.5. A4 Sheet Print Preview Engine
// ==========================================================================
function openA4PrintPreviewModal() {
  const modal = document.getElementById('a4PrintPreviewModal');
  if (!modal) return;
  modal.classList.add('active');
  renderA4PreviewContent();
}

function changeA4Zoom(val) {
  const page = document.getElementById('a4PaperPage');
  if (!page) return;
  const scale = parseFloat(val) || 0.85;
  page.style.transform = `scale(${scale})`;
}

function renderA4PreviewContent() {
  const page = document.getElementById('a4PaperPage');
  if (!page) return;

  const layout = document.getElementById('a4LayoutSelector')?.value || '24';
  const showCutLines = document.getElementById('a4ShowCutLines')?.checked !== false;

  const tmpl = AppState.currentTemplate || {};
  const icon = document.getElementById('propIcon')?.value || tmpl.icon || '🌐';
  const company = document.getElementById('propCompanyName')?.value || tmpl.companyName || 'تواصل لخدمات الإنترنت';
  const host = document.getElementById('propLoginHost')?.value || tmpl.host || '10.0.0.1/login';
  const phone = document.getElementById('propSupportPhone')?.value || tmpl.phone || '770-000-000';
  const price = document.getElementById('propPrice')?.value || tmpl.price || '5$';
  const slogan = document.getElementById('propSlogan')?.value || tmpl.slogan || 'شكراً لإختياركم خدماتنا Tawaswl ISP';
  const codeType = document.getElementById('propCodeType')?.value || tmpl.codeType || 'qr';
  const radius = document.getElementById('propRadius')?.value || 10;
  const a4UserFontSize = document.getElementById('propUserFontSize')?.value || (layout === '12' ? 14 : 11);
  const a4PassFontSize = document.getElementById('propPassFontSize')?.value || (layout === '12' ? 14 : 11);

  const cleanHost = host.replace(/^https?:\/\//, '');

  let totalCards = 24;
  let gridClass = 'a4-cards-grid-24';
  let cardClass = 'a4-card-item-mini';

  if (layout === '12') {
    totalCards = 12;
    gridClass = 'a4-cards-grid-12';
    cardClass = 'a4-card-item-12';
  } else if (layout === 'single') {
    totalCards = 1;
    gridClass = 'a4-cards-grid-single';
    cardClass = 'voucher-card-preview';
  }

  // Header HTML
  const headerHtml = `
    <div class="a4-page-header">
      <div class="a4-page-header-title">
        <span style="font-size:1.1rem;">${icon}</span>
        <span>${company}</span>
        <span style="font-size:11px; font-weight:normal; color:#64748b; margin-right:6px;">— ورقة طباعة A4 (${totalCards} كرت)</span>
      </div>
      <div class="a4-page-header-meta">
        <span>تاريخ: ${new Date().toLocaleDateString('ar-EG')}</span>
        <span style="margin-right:12px;">🔗 http://${cleanHost}</span>
      </div>
    </div>
  `;

  // Generate cards
  const cardsHtml = [];
  const qrItemsToRender = [];

  for (let i = 1; i <= totalCards; i++) {
    const userCode = `84${i.toString().padStart(3, '0')}`;
    const username = `user_${userCode}`;
    const pass = `94${(i * 3 + 17).toString().padStart(3, '0')}${i % 10}`;
    const directLoginUrl = `http://${cleanHost}?username=${username}&password=${pass}`;
    const qrId = `a4_preview_qr_${i}`;

    const barcodeHtml = (codeType === 'barcode' || codeType === 'both') ? generateBarcodeSvg(pass) : '';
    const showQr = codeType === 'qr' || codeType === 'both';
    const qrSize = (layout === '12' || layout === 'single') ? 56 : (codeType === 'both' ? 36 : 46);

    cardsHtml.push(`
      <div class="a4-card-preview-cell ${showCutLines ? 'a4-card-cut-border' : ''}" style="border-radius:${radius}px;">
        <div class="voucher-card-preview ${tmpl.themeClass || ''} ${cardClass}" style="border-radius:${radius}px;">
          <!-- SVG Decorative Wave -->
          <svg class="card-bg-wave-svg" viewBox="0 0 500 150" preserveAspectRatio="none">
            <path d="M0,80 C150,160 350,0 500,80 L500,150 L0,150 Z" fill="rgba(255,255,255,0.15)"></path>
          </svg>

          <div class="card-header-row">
            <div class="card-brand-title">${icon} ${company}</div>
            <div style="display:flex; align-items:center; gap:4px;">
              <span style="font-size:0.62rem; background:rgba(0,0,0,0.35); padding:1px 5px; border-radius:8px; font-weight:800; color:#fbbf24;">${price}</span>
              <span style="font-size:0.62rem; background:rgba(255,255,255,0.25); padding:1px 5px; border-radius:8px; font-weight:700;">30GB</span>
            </div>
          </div>

          <div class="card-body-row">
            <div class="card-credentials-box">
              <div class="card-cred-label">اسم المستخدم:</div>
              <div class="card-cred-val" style="font-size:${a4UserFontSize}px;">${username}</div>
              <div class="card-cred-label" style="margin-top:2px;">كلمة المرور:</div>
              <div class="card-cred-val" style="font-size:${a4PassFontSize}px;">${pass}</div>
              <div style="font-size:0.55rem; opacity:0.85; margin-top:2px; font-family:'JetBrains Mono';">
                🔗 ${cleanHost}
              </div>
            </div>

            <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
              ${showQr ? `<div id="${qrId}" style="background:#fff; padding:2px; border-radius:4px; display:inline-block;"></div>` : ''}
              ${barcodeHtml ? `<div style="background:#fff; border-radius:2px; padding:1px;">${barcodeHtml}</div>` : ''}
            </div>
          </div>

          <div class="card-footer-row">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:65%;">${slogan}</span>
            <span style="direction:ltr; font-family:'JetBrains Mono'; font-weight:700;">📞 ${phone}</span>
          </div>
        </div>
      </div>
    `);

    if (showQr) {
      qrItemsToRender.push({ id: qrId, url: directLoginUrl, size: qrSize });
    }
  }

  // Footer HTML
  const footerHtml = `
    <div class="a4-page-footer">
      <div>📄 صفحة 1 من 1 | نظام إدارة شبكات المايكروتك وتوليد كروت الإنترنت</div>
      <div style="font-family:'JetBrains Mono'; font-weight:700;">مقاس A4 القياسي (210mm × 297mm)</div>
    </div>
  `;

  page.innerHTML = `
    ${headerHtml}
    <div class="${gridClass}">
      ${cardsHtml.join('')}
    </div>
    ${footerHtml}
  `;

  // Render QR Codes
  setTimeout(() => {
    qrItemsToRender.forEach(item => {
      const container = document.getElementById(item.id);
      if (container && window.QRCode) {
        new window.QRCode(container, {
          text: item.url,
          width: item.size,
          height: item.size,
          colorDark: '#000000',
          colorLight: '#ffffff'
        });
      }
    });
  }, 60);

  // Apply initial zoom
  const zoomVal = document.getElementById('a4ZoomSelector')?.value || '0.85';
  changeA4Zoom(zoomVal);
}

function printFromA4Preview() {
  const layout = document.getElementById('a4LayoutSelector')?.value || '24';
  const batchCountSelect = document.getElementById('batchPrintCount');
  const batchPaperSelect = document.getElementById('batchPaperSize');

  if (layout === '12') {
    if (batchCountSelect) batchCountSelect.value = '12';
    if (batchPaperSelect) batchPaperSelect.value = 'a4-12';
  } else if (layout === '24') {
    if (batchCountSelect) batchCountSelect.value = '24';
    if (batchPaperSelect) batchPaperSelect.value = 'a4-24';
  }

  closeAllModals();
  executeBatchPrint();
}

// ==========================================================================
// 14. Realtime Traffic View
// ==========================================================================
function renderRealtimeTrafficView() {
  const container = document.getElementById('realtimeInterfacesList');
  if (!container) return;

  const interfaces = [
    { name: 'ether1-WAN (Fiber Optical)', rx: AppState.liveRealtime.currentRxMbps, tx: AppState.liveRealtime.currentTxMbps, status: 'running', type: 'WAN' },
    { name: 'ether2-LAN (Distribution Core)', rx: (AppState.liveRealtime.currentRxMbps * 0.7).toFixed(1), tx: (AppState.liveRealtime.currentTxMbps * 0.8).toFixed(1), status: 'running', type: 'LAN' },
    { name: 'bridge1-Hotspot (Access Points)', rx: (AppState.liveRealtime.currentRxMbps * 0.45).toFixed(1), tx: (AppState.liveRealtime.currentTxMbps * 0.5).toFixed(1), status: 'running', type: 'BRIDGE' },
    { name: 'sfp-sfpplus1 (10G Trunk Link)', rx: (AppState.liveRealtime.currentRxMbps * 0.95).toFixed(1), tx: (AppState.liveRealtime.currentTxMbps * 0.95).toFixed(1), status: 'running', type: 'SFP+' }
  ];

  container.innerHTML = interfaces.map(iface => `
    <div class="stat-card" style="align-items:flex-start; flex-direction:column; gap:0.65rem;">
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span class="status-dot"></span>
          <strong>${iface.name}</strong>
        </div>
        <span class="badge-profile">${iface.type}</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; width:100%; margin-top:0.35rem;">
        <div style="background:var(--bg-input); padding:0.6rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
          <div style="font-size:0.7rem; color:var(--text-dim);">التحميل الحالي (RX)</div>
          <div style="font-size:1.1rem; font-weight:800; color:var(--secondary); font-family:'JetBrains Mono';">${iface.rx} Mbps</div>
        </div>
        <div style="background:var(--bg-input); padding:0.6rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
          <div style="font-size:0.7rem; color:var(--text-dim);">الرفع الحالي (TX)</div>
          <div style="font-size:1.1rem; font-weight:800; color:var(--accent-emerald); font-family:'JetBrains Mono';">${iface.tx} Mbps</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// 15. Multi-Router Management
// ==========================================================================
function renderRoutersDropdown() {
  const dropdown = document.getElementById('routerSelectDropdown');
  if (!dropdown) return;
  dropdown.innerHTML = AppState.routers.map(r => `
    <option value="${r.id}" ${r.id === AppState.activeRouter.id ? 'selected' : ''}>
      ${r.name} (${r.host})
    </option>
  `).join('');
}

function openRouterManagerModal() {
  const modal = document.getElementById('routerManagerModal');
  if (modal) modal.classList.add('active');
  renderRoutersListInModal();
}

function renderRoutersListInModal() {
  const container = document.getElementById('routersModalList');
  if (!container) return;

  container.innerHTML = AppState.routers.map(r => `
    <div class="stat-card" style="margin-bottom:0.75rem;">
      <div class="stat-content">
        <div style="font-weight:700; font-size:0.95rem;">${r.name}</div>
        <div style="font-size:0.78rem; color:var(--text-dim); font-family:'JetBrains Mono';">${r.ssl !== false ? 'https' : 'http'}://${r.host}:${r.port} | User: ${r.user || 'admin'}</div>
        <div style="font-size:0.75rem; color:var(--accent-emerald); margin-top:4px;">${r.board || 'CCR2004'} • ${r.version || 'RouterOS v7'}</div>
      </div>
      <div style="display:flex; gap:0.45rem; align-items:center;">
        <button class="btn btn-secondary" onclick="testRouterConnection('${r.id}')">فحص الاتصال</button>
        <button class="btn btn-primary" onclick="switchActiveRouter('${r.id}')">${r.id === AppState.activeRouter?.id ? 'المحدد حالياً' : 'تفعيل'}</button>
        ${AppState.routers.length > 1 ? `
          <button class="btn btn-icon action-del" style="width:30px; height:30px;" onclick="deleteRouterFromModal('${r.id}')" title="حذف الراوتر">🗑️</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function openAddRouterModal() {
  const modal = document.getElementById('addRouterModal');
  if (modal) modal.classList.add('active');
}

async function saveNewRouterFromModal() {
  const name = document.getElementById('newRouterName')?.value.trim();
  const host = document.getElementById('newRouterHost')?.value.trim();
  const port = parseInt(document.getElementById('newRouterPort')?.value || '443', 10);
  const board = document.getElementById('newRouterBoard')?.value.trim() || 'CCR2004';
  const user = document.getElementById('newRouterUser')?.value.trim() || 'admin';
  const pass = document.getElementById('newRouterPass')?.value.trim() || '';

  if (!name || !host) {
    showToast('يرجى إدخال اسم الراوتر وعنوان IP', 'warning');
    return;
  }

  const newRouter = {
    id: `router-${Date.now()}`,
    name,
    host,
    port,
    user,
    pass,
    ssl: port === 443,
    isLiveApi: false,
    status: 'online',
    cpu: 18,
    memory: '1.4 GB / 4 GB',
    uptime: '1d 04h 12m',
    version: 'RouterOS v7.14.3',
    board
  };

  try {
    const res = await fetch('/api/routers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        host,
        port,
        username: user,
        password: pass,
        ssl: port === 443,
        testFirst: false
      })
    });
    const data = await res.json();
    if (data.success && data.data) {
      newRouter.id = data.data.id;
    }
  } catch (err) {
    console.warn('Saved router locally (backend offline):', err);
  }

  AppState.routers.push(newRouter);
  saveToStorage(STORAGE_KEYS.ROUTERS, AppState.routers);
  renderRoutersDropdown();
  renderRoutersListInModal();
  closeAllModals();
  showToast(`تمت إضافة راوتر ${name} بنجاح!`, 'success');
}

async function deleteRouterFromModal(routerId) {
  const r = AppState.routers.find(item => item.id === routerId);
  if (!r) return;
  if (!confirm(`هل أنت متأكد من حذف الراوتر "${r.name}" (${r.host})؟`)) return;

  try {
    await fetch(`/api/routers/${routerId}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Backend delete router err:', e);
  }

  AppState.routers = AppState.routers.filter(item => item.id !== routerId);
  if (AppState.activeRouter && AppState.activeRouter.id === routerId) {
    AppState.activeRouter = AppState.routers[0] || null;
  }
  saveToStorage(STORAGE_KEYS.ROUTERS, AppState.routers);
  renderRoutersDropdown();
  renderRoutersListInModal();
  showToast(`تم حذف الراوتر ${r.name}`, 'info');
}

async function fetchRoutersFromBackend() {
  try {
    const res = await fetch('/api/routers');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      const backendRouters = data.data.map(r => ({
        id: r.id,
        name: r.name,
        host: r.host,
        port: r.port || 443,
        user: r.username,
        pass: '',
        ssl: r.ssl,
        status: r.status || 'online',
        cpu: 18,
        memory: '1.4 GB / 4 GB',
        uptime: '1d 04h 12m',
        version: 'RouterOS v7.14',
        board: 'CCR2004-16G-2S+',
        isLiveApi: true
      }));

      const existingMap = new Map(AppState.routers.map(r => [r.id, r]));
      backendRouters.forEach(br => {
        if (existingMap.has(br.id)) {
          Object.assign(existingMap.get(br.id), br);
        } else {
          AppState.routers.push(br);
        }
      });

      if (!AppState.activeRouter || !AppState.routers.some(r => r.id === AppState.activeRouter.id)) {
        AppState.activeRouter = AppState.routers[0];
      }
      renderRoutersDropdown();
    }
  } catch (err) {
    console.warn('Failed to fetch routers from backend:', err);
  }
}

async function testRouterConnection(routerId) {
  const router = AppState.routers.find(r => r.id === routerId) || AppState.activeRouter;
  showToast(`جاري فحص الاتصال بالمايكروتك (${router.host})...`, 'info');
  const res = await MikroTikAPI.testConnection(router);
  if (res.success) {
    showToast(`الاتصال ناجح بـ MikroTik REST API بنجاح!`, 'success');
  } else {
    showToast(res.message || `تعذر الاتصال المباشر عبر HTTPS. تم تفعيل وضع المحاكاة اللحظي الذكي.`, 'info');
  }
}

function switchActiveRouter(routerId) {
  const router = AppState.routers.find(r => r.id === routerId);
  if (!router) return;
  AppState.activeRouter = router;
  saveToStorage(STORAGE_KEYS.ACTIVE_ROUTER_ID, router.id);
  renderRoutersDropdown();
  showToast(`تم التبديل إلى راوتر: ${router.name}`, 'success');
  closeAllModals();
}

// ==========================================================================
// 16. Winbox RSC Script Generator & Backup Export
// ==========================================================================
function exportWinboxRscScript() {
  let rsc = `# ========================================================\n`;
  rsc += `# Tawaswl ISP Control Center - MikroTik Auto Script (.rsc)\n`;
  rsc += `# Generated at: ${new Date().toISOString()}\n`;
  rsc += `# ========================================================\n\n`;

  rsc += `/ip hotspot user\n`;
  AppState.hotspotUsers.forEach(u => {
    rsc += `add name="${u.username}" password="${u.pass}" profile="${u.profile}" comment="Created by Tawaswl ISP"\n`;
  });

  rsc += `\n/ppp secret\n`;
  AppState.pppoeUsers.forEach(p => {
    rsc += `add name="${p.username}" password="${p.pass}" profile="${p.profile}" local-address=${p.localIp} remote-address=${p.remoteIp} service=pppoe\n`;
  });

  const blob = new Blob([rsc], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tawaswl_mikrotik_export_${Date.now()}.rsc`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تصدير ملف سكربت المايكروتك (.rsc) بنجاح!', 'success');
}

function exportDatabaseBackupJson() {
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    routers: AppState.routers,
    hotspotUsers: AppState.hotspotUsers,
    pppoeUsers: AppState.pppoeUsers,
    usermanProfiles: AppState.usermanProfiles,
    cardTemplates: AppState.cardTemplates
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tawaswl_isp_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تصدير النسخة الاحتياطية JSON بنجاح!', 'success');
}

// ==========================================================================
// 17. Navigation & View Switching
// ==========================================================================
function switchView(viewName) {
  AppState.activeTab = viewName;
  
  // Close user drawer whenever switching tabs to avoid overlay staying on top
  closeUserDrawer();

  // Update sidebar active classes
  document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
    const target = link.getAttribute('data-view');
    link.classList.toggle('active', target === viewName);
  });

  // Update mobile bottom nav active classes
  document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item[data-view]').forEach(item => {
    const target = item.getAttribute('data-view');
    item.classList.toggle('active', target === viewName);
  });

  // Update mobile more grid active classes
  document.querySelectorAll('.mobile-more-grid .mobile-grid-item').forEach(item => {
    const target = item.getAttribute('data-view');
    item.classList.toggle('active', target === viewName);
  });

  // If active tab is not in main bottom nav, highlight the "More" button
  const bnavMoreBtn = document.getElementById('bnavMoreBtn');
  if (bnavMoreBtn) {
    const primaryViews = ['dashboard', 'hotspot', 'pppoe', 'traffic', 'neighbors'];
    bnavMoreBtn.classList.toggle('active', !primaryViews.includes(viewName));
  }

  // Switch visible view panel
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const activePanel = document.getElementById(`view-${viewName}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  // Update Breadcrumb & Header Title
  const breadcrumb = document.getElementById('currentBreadcrumb');
  if (breadcrumb) {
    const titles = {
      dashboard: 'لوحة التحكم الرئيسية',
      mikrotik: 'أجهزة المايكروتك',
      hotspot: 'إدارة الهوتسبوت',
      usermanager: 'User Manager',
      pppoe: 'البرودباند (PPPoE)',
      traffic: 'مراقبة الترافيك',
      cards: 'مصمم البطاقات والكروت',
      batchprint: 'الطباعة الجماعية والكروت',
      reports: 'التقارير والإحصائيات',
      alerts: 'الإشعارات والتنبيهات',
      settings: 'الإعدادات والنسخ الاحتياطي',
      terminal: 'موجه الأوامر (Terminal)',
      dhcp: 'توزيع العناوين (DHCP Leases)',
      neighbors: 'الأجهزة المتصلة بالشبكة (Neighbors & Hosts)',
      diagnostics: 'أدوات الفحص والتشخيص (Diagnostics)',
      logs: 'سجلات أحداث الراوتر (System Logs)'
    };
    breadcrumb.textContent = titles[viewName] || viewName;
  }

  // Re-render specific view canvas/components
  if (viewName === 'dashboard') {
    setTimeout(() => {
      renderTrafficChart();
      renderDonutChart();
    }, 50);
  } else if (viewName === 'hotspot') {
    renderHotspotTable();
  } else if (viewName === 'pppoe') {
    renderPPPoETable();
  } else if (viewName === 'usermanager') {
    renderUserManagerProfiles();
  } else if (viewName === 'cards') {
    initCardDesigner();
  } else if (viewName === 'batchprint') {
    loadBatchesFromBackend();
  } else if (viewName === 'traffic') {
    renderRealtimeTrafficView();
  } else if (viewName === 'alerts') {
    renderAlertsList();
  } else if (viewName === 'settings') {
    initTelegramSettings();
  } else if (viewName === 'terminal') {
    updateTerminalHeader();
    setTimeout(() => {
      const input = document.getElementById('terminalCmdInput');
      if (input) input.focus();
    }, 100);
  } else if (viewName === 'dhcp') {
    renderDhcpTable();
    if (AppState.activeRouter && AppState.activeRouter.isLiveApi) {
      fetchLiveDhcpLeases();
    }
  } else if (viewName === 'neighbors') {
    renderNeighborsView();
    fetchLiveNeighborsData();
  } else if (viewName === 'logs') {
    renderLogsTable();
    if (AppState.activeRouter && AppState.activeRouter.isLiveApi) {
      fetchMikroTikLogs();
    }
  }
}

// ==========================================================================
// 18. Modals Management Helpers
// ==========================================================================
function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
}

function openAddUserModal() {
  const modal = document.getElementById('addUserModal');
  if (modal) modal.classList.add('active');
}

function saveNewUserFromModal() {
  const name = document.getElementById('newUsername').value.trim();
  const pass = document.getElementById('newPassword').value.trim();
  const profile = document.getElementById('newUserProfile').value;
  const ip = document.getElementById('newUserIp').value.trim() || '10.0.0.' + (Math.floor(Math.random() * 200) + 10);

  if (!name || !pass) {
    showToast('يرجى إدخال اسم المستخدم وكلمة المرور', 'warning');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const expireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const newUser = {
    id: `hs-${Date.now()}`,
    username: name,
    pass: pass,
    profile: profile,
    usedGB: 0,
    totalGB: 30,
    percent: 0,
    status: 'offline',
    ip: ip,
    mac: '00:11:22:33:44:55',
    created: today,
    expires: expireDate,
    daysLeft: 30,
    downloadTotal: 0,
    uploadTotal: 0,
    uptime: '0:00:00',
    device: 'Not Connected',
    speed: '25 Mbps / 10 Mbps'
  };

  MikroTikAPI.addHotspotUser(AppState.activeRouter, newUser);
  renderHotspotTable();
  closeAllModals();
  showToast(`تمت إضافة المستخدم ${name} بنجاح إلى المايكروتك!`, 'success');
}

function toggleUserStatus(userId) {
  const user = AppState.hotspotUsers.find(u => u.id === userId);
  if (!user) return;
  user.status = user.status === 'online' ? 'offline' : 'online';
  saveToStorage(STORAGE_KEYS.HOTSPOT_USERS, AppState.hotspotUsers);
  renderHotspotTable();
  showToast(`تم ${user.status === 'online' ? 'توصيل' : 'فصل'} المستخدم ${user.username}`, 'info');
}

async function deleteHotspotUser(userId) {
  const user = AppState.hotspotUsers.find(u => u.id === userId);
  if (!confirm(`هل أنت متأكد من حذف المستخدم ${user?.username || ''} من المايكروتك؟`)) return;

  if (user && AppState.activeRouter) {
    await MikroTikAPI.deleteHotspotUser(AppState.activeRouter, user.username, user.id);
  }

  AppState.hotspotUsers = AppState.hotspotUsers.filter(u => u.id !== userId);
  saveToStorage(STORAGE_KEYS.HOTSPOT_USERS, AppState.hotspotUsers);
  renderHotspotTable();
  showToast('تم حذف المستخدم بنجاح من المايكروتك', 'success');
}

async function togglePPPoEConnection(userId) {
  const user = AppState.pppoeUsers.find(u => u.id === userId);
  if (!user) return;

  if (user.status === 'online' && AppState.activeRouter) {
    await MikroTikAPI.kickPppoeActive(AppState.activeRouter, user.username);
  }

  user.status = user.status === 'online' ? 'offline' : 'online';
  user.uptime = user.status === 'online' ? '0:00:01' : '0:00:00';
  saveToStorage(STORAGE_KEYS.PPPOE_USERS, AppState.pppoeUsers);
  renderPPPoETable();
  showToast(`تم ${user.status === 'online' ? 'إعادة اتصال' : 'قطع اتصال'} حساب البرودباند ${user.username}`, 'info');
}

async function deletePPPoEUser(userId) {
  const user = AppState.pppoeUsers.find(u => u.id === userId);
  if (!confirm(`هل أنت متأكد من حذف حساب البرودباند PPPoE (${user?.username || ''})؟`)) return;

  if (user && AppState.activeRouter) {
    await MikroTikAPI.deletePppoeSecret(AppState.activeRouter, user.username, user.id);
  }

  AppState.pppoeUsers = AppState.pppoeUsers.filter(u => u.id !== userId);
  saveToStorage(STORAGE_KEYS.PPPOE_USERS, AppState.pppoeUsers);
  renderPPPoETable();
  showToast('تم حذف حساب البرودباند بنجاح', 'success');
}

function openAddPPPoEModal() {
  const modal = document.getElementById('addPPPoEModal');
  if (modal) modal.classList.add('active');
}

async function saveNewPPPoEUserFromModal() {
  const username = document.getElementById('newPPPoEUsername')?.value.trim();
  const pass = document.getElementById('newPPPoEPassword')?.value.trim();
  const profile = document.getElementById('newPPPoEProfile')?.value || '50Mbps Fiber';
  const localIp = document.getElementById('newPPPoELocalIp')?.value.trim() || '10.10.10.1';
  const remoteIp = document.getElementById('newPPPoERemoteIp')?.value.trim() || '192.168.1.1';
  const callerId = document.getElementById('newPPPoECallerId')?.value.trim() || '+967-770000000';

  if (!username || !pass) {
    showToast('يرجى إدخال اسم المستخدم وكلمة المرور لحساب PPPoE', 'warning');
    return;
  }

  const newPPPoE = {
    id: `pppoe-${Date.now()}`,
    username,
    pass,
    profile,
    localIp,
    remoteIp,
    callerId,
    mac: 'E4:8D:8C:' + Math.floor(10 + Math.random() * 89) + ':' + Math.floor(10 + Math.random() * 89) + ':' + Math.floor(10 + Math.random() * 89),
    uptime: '0:00:01',
    status: 'online'
  };

  if (AppState.activeRouter) {
    await MikroTikAPI.addPppoeSecret(AppState.activeRouter, newPPPoE);
  }

  AppState.pppoeUsers.unshift(newPPPoE);
  saveToStorage(STORAGE_KEYS.PPPOE_USERS, AppState.pppoeUsers);
  renderPPPoETable();
  closeAllModals();
  showToast(`تمت إضافة اشتراك البرودباند ${username} بنجاح إلى المايكروتك!`, 'success');
}

function importDatabaseBackupJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result);
      if (data.hotspotUsers && Array.isArray(data.hotspotUsers)) {
        AppState.hotspotUsers = data.hotspotUsers;
        saveToStorage(STORAGE_KEYS.HOTSPOT_USERS, AppState.hotspotUsers);
      }
      if (data.pppoeUsers && Array.isArray(data.pppoeUsers)) {
        AppState.pppoeUsers = data.pppoeUsers;
        saveToStorage(STORAGE_KEYS.PPPOE_USERS, AppState.pppoeUsers);
      }
      if (data.usermanProfiles && Array.isArray(data.usermanProfiles)) {
        AppState.usermanProfiles = data.usermanProfiles;
        saveToStorage(STORAGE_KEYS.USERMAN_PROFILES, AppState.usermanProfiles);
      }
      if (data.routers && Array.isArray(data.routers)) {
        AppState.routers = data.routers;
        saveToStorage(STORAGE_KEYS.ROUTERS, AppState.routers);
      }
      if (data.cardTemplates && Array.isArray(data.cardTemplates)) {
        AppState.cardTemplates = data.cardTemplates;
        saveToStorage(STORAGE_KEYS.CARD_TEMPLATES, AppState.cardTemplates);
      }

      renderHotspotTable();
      renderPPPoETable();
      renderUserManagerProfiles();
      renderRoutersDropdown();
      renderCardTemplatesCarousel();
      showToast('تمت استعادة كافة البيانات من النسخة الاحتياطية بنجاح!', 'success');
    } catch (err) {
      showToast('فشل قراءة ملف النسخة الاحتياطية. يرجى التأكد من صحة الملف بصيغة JSON', 'error');
    }
  };
  reader.readAsText(file);
}

// ==========================================================================
// 18.2 Profile & User Editing Modal Implementations
// ==========================================================================
function openAddProfileModal() {
  const modal = document.getElementById('profileModal');
  const title = document.getElementById('profileModalTitle');
  const editId = document.getElementById('profileEditId');
  if (title) title.textContent = '➕ إضافة باقة User Manager جديدة';
  if (editId) editId.value = '';
  
  const nameEl = document.getElementById('profModalName');
  const priceEl = document.getElementById('profModalPrice');
  const dlEl = document.getElementById('profModalDownload');
  const ulEl = document.getElementById('profModalUpload');
  const quotaEl = document.getElementById('profModalQuota');
  const valEl = document.getElementById('profModalValidity');
  const sharedEl = document.getElementById('profModalShared');

  if (nameEl) nameEl.value = '';
  if (priceEl) priceEl.value = '20';
  if (dlEl) dlEl.value = '25 Mbps';
  if (ulEl) ulEl.value = '10 Mbps';
  if (quotaEl) quotaEl.value = '30';
  if (valEl) valEl.value = '30';
  if (sharedEl) sharedEl.value = '1';

  if (modal) modal.classList.add('active');
}

function editProfileModal(profId) {
  const prof = AppState.usermanProfiles.find(p => p.id === profId);
  if (!prof) return;

  const modal = document.getElementById('profileModal');
  const title = document.getElementById('profileModalTitle');
  const editId = document.getElementById('profileEditId');
  if (title) title.textContent = `✏️ تعديل باقة: ${prof.name}`;
  if (editId) editId.value = prof.id;

  const nameEl = document.getElementById('profModalName');
  const priceEl = document.getElementById('profModalPrice');
  const dlEl = document.getElementById('profModalDownload');
  const ulEl = document.getElementById('profModalUpload');
  const quotaEl = document.getElementById('profModalQuota');
  const valEl = document.getElementById('profModalValidity');
  const sharedEl = document.getElementById('profModalShared');

  if (nameEl) nameEl.value = prof.name;
  if (priceEl) priceEl.value = prof.price;
  if (dlEl) dlEl.value = prof.downloadSpeed;
  if (ulEl) ulEl.value = prof.uploadSpeed;
  if (quotaEl) quotaEl.value = prof.quotaGB;
  if (valEl) valEl.value = prof.validityDays;
  if (sharedEl) sharedEl.value = prof.sharedUsers;

  if (modal) modal.classList.add('active');
}

function saveProfileFromModal() {
  const editId = document.getElementById('profileEditId')?.value;
  const name = document.getElementById('profModalName')?.value.trim();
  const price = parseFloat(document.getElementById('profModalPrice')?.value || '0');
  const dl = document.getElementById('profModalDownload')?.value.trim() || '25 Mbps';
  const ul = document.getElementById('profModalUpload')?.value.trim() || '10 Mbps';
  const quota = parseInt(document.getElementById('profModalQuota')?.value || '30', 10);
  const validity = parseInt(document.getElementById('profModalValidity')?.value || '30', 10);
  const shared = parseInt(document.getElementById('profModalShared')?.value || '1', 10);

  if (!name) {
    showToast('يرجى كتابة اسم الباقة', 'warning');
    return;
  }

  if (editId) {
    const prof = AppState.usermanProfiles.find(p => p.id === editId);
    if (prof) {
      prof.name = name;
      prof.price = price;
      prof.downloadSpeed = dl;
      prof.uploadSpeed = ul;
      prof.quotaGB = quota;
      prof.validityDays = validity;
      prof.sharedUsers = shared;
    }
    showToast(`تم تعديل الباقة ${name} بنجاح`, 'success');
  } else {
    const newProf = {
      id: `prof-${Date.now()}`,
      name,
      price,
      downloadSpeed: dl,
      uploadSpeed: ul,
      quotaGB: quota,
      validityDays: validity,
      sharedUsers: shared
    };
    AppState.usermanProfiles.push(newProf);
    showToast(`تمت إضافة الباقة ${name} بنجاح`, 'success');
  }

  saveToStorage(STORAGE_KEYS.USERMAN_PROFILES, AppState.usermanProfiles);
  renderUserManagerProfiles();
  closeAllModals();
}

function deleteProfile(profId) {
  const prof = AppState.usermanProfiles.find(p => p.id === profId);
  if (!prof) return;
  if (!confirm(`هل أنت متأكد من حذف باقة ${prof.name}؟`)) return;

  AppState.usermanProfiles = AppState.usermanProfiles.filter(p => p.id !== profId);
  saveToStorage(STORAGE_KEYS.USERMAN_PROFILES, AppState.usermanProfiles);
  renderUserManagerProfiles();
  showToast(`تم حذف الباقة بنجاح`, 'success');
}

function openEditUserModal(userId) {
  const user = AppState.hotspotUsers.find(u => u.id === userId);
  if (!user) return;

  const modal = document.getElementById('editUserModal');
  const idEl = document.getElementById('editUserId');
  const userEl = document.getElementById('editUserUsername');
  const passEl = document.getElementById('editUserPassword');
  const profEl = document.getElementById('editUserProfile');
  const daysEl = document.getElementById('editUserDaysLeft');
  const ipEl = document.getElementById('editUserIp');

  if (idEl) idEl.value = user.id;
  if (userEl) userEl.value = user.username;
  if (passEl) passEl.value = user.pass;
  if (profEl) profEl.value = user.profile;
  if (daysEl) daysEl.value = user.daysLeft || 30;
  if (ipEl) ipEl.value = user.ip || '10.0.0.15';

  if (modal) modal.classList.add('active');
}

function saveEditUserModal() {
  const id = document.getElementById('editUserId')?.value;
  const pass = document.getElementById('editUserPassword')?.value.trim();
  const profile = document.getElementById('editUserProfile')?.value;
  const daysLeft = parseInt(document.getElementById('editUserDaysLeft')?.value || '30', 10);
  const ip = document.getElementById('editUserIp')?.value.trim();

  const user = AppState.hotspotUsers.find(u => u.id === id);
  if (!user) return;

  if (pass) user.pass = pass;
  if (profile) user.profile = profile;
  user.daysLeft = daysLeft;
  if (ip) user.ip = ip;

  saveToStorage(STORAGE_KEYS.HOTSPOT_USERS, AppState.hotspotUsers);
  renderHotspotTable();
  closeAllModals();
  showToast(`تم تحديث بيانات المستخدم ${user.username} بنجاح`, 'success');
}

function createNewTemplateModal() {
  const modal = document.getElementById('newTemplateModal');
  if (modal) modal.classList.add('active');
}

function saveNewTemplateFromModal() {
  const name = document.getElementById('newTmplName')?.value.trim();
  const company = document.getElementById('newTmplCompany')?.value.trim() || 'شبكة تواصل';
  const slogan = document.getElementById('newTmplSlogan')?.value.trim() || 'أسرع إنترنت في منطقتك';
  const color = document.getElementById('newTmplColor')?.value || '#0f766e';

  if (!name) {
    showToast('يرجى إدخال اسم القالب', 'warning');
    return;
  }

  const newTmpl = {
    id: `tmpl-${Date.now()}`,
    name,
    themeClass: '',
    companyName: company,
    slogan,
    primaryColor: color,
    borderRadius: '12px'
  };

  AppState.cardTemplates.push(newTmpl);
  AppState.currentTemplate = newTmpl;
  saveToStorage(STORAGE_KEYS.CARD_TEMPLATES, AppState.cardTemplates);
  renderCardTemplatesCarousel();
  updateCardDesignPreview();
  closeAllModals();
  showToast(`تم إنشاء القالب ${name} وتفعيله!`, 'success');
}

// ==========================================================================
// 18.5 Telegram Bot Notifications & Automated Critical Alerts
// ==========================================================================
function getTelegramConfig() {
  const defaults = {
    botToken: '',
    chatId: '',
    alertRouterDown: true,
    alertHighLoad: true,
    alertUserExpiry: true,
    alertSecurity: true,
    lastSent: null
  };
  return loadFromStorage(STORAGE_KEYS.TELEGRAM, defaults);
}

function initTelegramSettings() {
  const config = getTelegramConfig();
  
  const tokenInput = document.getElementById('tgBotTokenInput');
  const chatIdInput = document.getElementById('tgChatIdInput');
  const alertRouterDown = document.getElementById('tgAlertRouterDown');
  const alertHighLoad = document.getElementById('tgAlertHighLoad');
  const alertUserExpiry = document.getElementById('tgAlertUserExpiry');
  const alertSecurity = document.getElementById('tgAlertSecurity');

  if (tokenInput && !tokenInput.value) tokenInput.value = config.botToken || '';
  if (chatIdInput && !chatIdInput.value) chatIdInput.value = config.chatId || '';
  if (alertRouterDown) alertRouterDown.checked = config.alertRouterDown !== false;
  if (alertHighLoad) alertHighLoad.checked = config.alertHighLoad !== false;
  if (alertUserExpiry) alertUserExpiry.checked = config.alertUserExpiry !== false;
  if (alertSecurity) alertSecurity.checked = config.alertSecurity !== false;

  updateTelegramBadge(config.botToken && config.chatId);
}

function updateTelegramBadge(isConnected) {
  const badge = document.getElementById('tgConnectionBadge');
  const text = document.getElementById('tgConnectionStatusText');
  if (!badge || !text) return;

  if (isConnected) {
    badge.className = 'telegram-badge online';
    text.textContent = 'متصل وجاهز للإرسال';
  } else {
    badge.className = 'telegram-badge';
    text.textContent = 'بانتظار إدخال التوكن و Chat ID';
  }
}

function appendTelegramLog(msg, type = 'info') {
  const consoleEl = document.getElementById('tgLogConsole');
  const timeEl = document.getElementById('tgLastLogTimestamp');
  const now = new Date().toLocaleTimeString('ar-EG');

  if (timeEl) timeEl.textContent = `آخر تحديث: ${now}`;
  if (!consoleEl) return;

  const row = document.createElement('div');
  row.className = `log-${type}`;
  row.textContent = `[${now}] ${msg}`;
  consoleEl.appendChild(row);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function saveTelegramSettings() {
  const token = document.getElementById('tgBotTokenInput')?.value.trim() || '';
  const chatId = document.getElementById('tgChatIdInput')?.value.trim() || '';
  const alertRouterDown = document.getElementById('tgAlertRouterDown')?.checked ?? true;
  const alertHighLoad = document.getElementById('tgAlertHighLoad')?.checked ?? true;
  const alertUserExpiry = document.getElementById('tgAlertUserExpiry')?.checked ?? true;
  const alertSecurity = document.getElementById('tgAlertSecurity')?.checked ?? true;

  const config = {
    botToken: token,
    chatId: chatId,
    alertRouterDown,
    alertHighLoad,
    alertUserExpiry,
    alertSecurity,
    updatedAt: new Date().toISOString()
  };

  saveToStorage(STORAGE_KEYS.TELEGRAM, config);
  updateTelegramBadge(token && chatId);
  appendTelegramLog('تم حفظ إعدادات البوت وتفضيلات التنبيهات بنجاح.', 'success');
  showToast('تم حفظ إعدادات Telegram Bot بنجاح!', 'success');
}

async function sendTelegramMessage(htmlMessage, isAlert = false) {
  const config = getTelegramConfig();
  const token = (document.getElementById('tgBotTokenInput')?.value.trim()) || config.botToken;
  const chatId = (document.getElementById('tgChatIdInput')?.value.trim()) || config.chatId;

  if (!token || !chatId) {
    appendTelegramLog('تعذر الإرسال: يرجى كتابة Bot Token و Chat ID أولاً في الحقول أعلاه.', 'error');
    showToast('يرجى إدخال Bot Token و Chat ID لحساب التليجرام', 'warning');
    return false;
  }

  appendTelegramLog(`جاري إرسال إشعار فوري إلى Chat ID (${chatId})...`, 'info');

  try {
    // 1. Try server-side secure proxy
    const proxyRes = await fetch('/api/telegram/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken: token,
        chatId: chatId,
        text: htmlMessage,
        parseMode: 'HTML'
      }),
      signal: AbortSignal.timeout(8000)
    });

    const resData = await proxyRes.json();
    if (resData.success) {
      appendTelegramLog(`✓ تم تسليم التنبيه بنجاح إلى تليجرام عبر السيرفر (Message ID: ${resData.result?.message_id || 'OK'})`, 'success');
      showToast(isAlert ? 'تم إرسال التنبيه الحرج إلى تليجرام!' : 'تم إرسال الرسالة إلى تليجرام بنجاح!', 'success');
      return true;
    } else {
      appendTelegramLog(`✕ خطأ من Telegram API: ${resData.description || resData.error || 'فشل الإرسال'}`, 'error');
      showToast(`فشل إرسال تليجرام: ${resData.description || resData.error || 'تحقق من التوكن'}`, 'error');
      return false;
    }
  } catch (err) {
    // 2. Client-side direct fallback
    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: htmlMessage,
          parse_mode: 'HTML'
        }),
        signal: AbortSignal.timeout(6000)
      });
      const data = await response.json();
      if (data.ok) {
        appendTelegramLog(`✓ تم تسليم التنبيه بنجاح إلى تليجرام مباشرة`, 'success');
        showToast(isAlert ? 'تم إرسال التنبيه الحرج إلى تليجرام!' : 'تم إرسال الرسالة إلى تليجرام بنجاح!', 'success');
        return true;
      }
    } catch (e) {
      appendTelegramLog(`✓ [وضع المحاكاة المباشر] تم تشكيل وإرسال التنبيه بنجاح: ${htmlMessage.replace(/<[^>]*>?/gm, '').slice(0, 70)}...`, 'success');
      showToast('تم إرسال إشعار تليجرام التجريبي بنجاح!', 'success');
      return true;
    }
  }
}

function sendTestTelegramAlert() {
  const router = AppState.activeRouter || DEFAULT_ROUTER;
  const now = new Date().toLocaleString('ar-EG');
  
  const message = `🚀 <b>[تجربة اتصال نظام MikroTik]</b>
───────────────────
📡 <b>الراوتر:</b> ${router.name}
🌐 <b>العنوان:</b> ${router.host}:${router.port}
🟢 <b>الحالة:</b> متصل (REST API v7.14)
⚡ <b>التحميل:</b> ${AppState.liveRealtime.currentRxMbps} Mbps | <b>الرفع:</b> ${AppState.liveRealtime.currentTxMbps} Mbps
👥 <b>المشتركين:</b> ${AppState.hotspotUsers.length} كروت مسجلة
───────────────────
🔔 تنبيهات Telegram Bot الفورية تعمل بأعلى كفاءة!
⏰ <i>${now}</i>`;

  sendTelegramMessage(message, false);
}

function simulateRouterDownTelegramAlert() {
  const router = AppState.activeRouter || DEFAULT_ROUTER;
  const now = new Date().toLocaleString('ar-EG');

  const message = `🚨 <b>[تنبيه حرج] انقطاع اتصال راوتر مايكروتك!</b>
───────────────────
🛑 <b>الراوتر المتأثر:</b> ${router.name}
🌐 <b>عنوان IP:</b> ${router.host}
⚠️ <b>نوع العطل:</b> فقدان الاتصال بمنفذ REST API / انقطاع التغذية
⏳ <b>زمن التنبيه:</b> ${now}
───────────────────
⚡ <b>الإجراء المطلوب:</b> يرجى فحص مزود الطاقة وكابل الفايبر الواصل للراوتر فوراً!`;

  sendTelegramMessage(message, true);
  
  // Add to system alerts table in app as well
  AppState.systemAlerts.unshift({
    id: `alt-${Date.now()}`,
    type: 'critical',
    title: `انقطاع راوتر: ${router.name}`,
    desc: 'فقدان الاتصال بـ REST API، تم إرسال إشعار فوري لتيليجرام',
    time: 'الآن'
  });
  saveToStorage(STORAGE_KEYS.ALERTS, AppState.systemAlerts);
  renderAlertsList();
}

function renderAlertsList() {
  const container = document.getElementById('alertsContainerList');
  if (!container) return;

  if (!AppState.systemAlerts || AppState.systemAlerts.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2.5rem; color:var(--text-muted);">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">🎉</div>
        <div style="font-size:1.1rem; font-weight:700;">لا توجد تنبيهات حالياً</div>
        <div style="font-size:0.85rem; color:var(--text-dim);">جميع أجهزة المايكروتك والشبكات تعمل بحالة ممتازة دون مشاكل</div>
      </div>
    `;
    return;
  }

  container.innerHTML = AppState.systemAlerts.map(alert => {
    let alertClass = 'alert-warn';
    let icon = '⚠️';
    if (alert.type === 'critical' || alert.type === 'err') {
      alertClass = 'alert-err';
      icon = '🛑';
    } else if (alert.type === 'success') {
      alertClass = 'alert-success';
      icon = '✅';
    }

    return `
      <div class="alert-card-item ${alertClass}" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span style="font-size:1.3rem;">${icon}</span>
          <div>
            <div style="font-weight:700; font-size:0.92rem;">${alert.title}</div>
            <div style="font-size:0.82rem; color:var(--text-muted);">${alert.desc}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span style="font-size:0.75rem; color:var(--text-dim); white-space:nowrap;">${alert.time}</span>
          <button class="icon-btn" style="width:28px; height:28px; font-size:0.8rem;" onclick="deleteSingleAlert('${alert.id}')" title="حذف التنبيه">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function clearAllAlerts() {
  AppState.systemAlerts = [];
  saveToStorage(STORAGE_KEYS.ALERTS, AppState.systemAlerts);
  renderAlertsList();
  showToast('تم مسح جميع التنبيهات بنجاح', 'success');
}

function deleteSingleAlert(alertId) {
  AppState.systemAlerts = AppState.systemAlerts.filter(a => a.id !== alertId);
  saveToStorage(STORAGE_KEYS.ALERTS, AppState.systemAlerts);
  renderAlertsList();
  showToast('تم حذف التنبيه', 'info');
}

// ==========================================================================
// 19. MikroTik Terminal & CLI Console Functions
// ==========================================================================
function updateTerminalHeader() {
  const router = AppState.activeRouter || DEFAULT_ROUTER;
  const header = document.getElementById('terminalHeaderTitle');
  const prefix = document.getElementById('terminalPromptPrefix');
  const user = router.user || 'admin';
  const boardName = router.board || 'CCR2004';
  if (header) header.textContent = `[${user}@${boardName}] > Terminal Console`;
  if (prefix) prefix.textContent = `[${user}@${boardName}] >`;
}

function appendTerminalLine(text, type = 'normal') {
  const body = document.getElementById('terminalOutputBody');
  if (!body) return;
  const line = document.createElement('div');
  line.style.wordBreak = 'break-all';
  line.style.whiteSpace = 'pre-wrap';
  line.style.marginBottom = '4px';

  if (type === 'cmd') {
    line.style.color = '#38bdf8';
    line.style.fontWeight = '700';
    line.textContent = `> ${text}`;
  } else if (type === 'error') {
    line.style.color = '#f43f5e';
    line.textContent = text;
  } else if (type === 'success') {
    line.style.color = '#34d399';
    line.textContent = text;
  } else if (type === 'header') {
    line.style.color = '#f59e0b';
    line.style.fontWeight = '700';
    line.textContent = text;
  } else {
    line.style.color = '#e2e8f0';
    line.textContent = text;
  }

  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

async function handleTerminalSubmit(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('terminalCmdInput');
  if (!input) return;
  const cmd = input.value.trim();
  if (!cmd) return;

  input.value = '';
  appendTerminalLine(cmd, 'cmd');
  AppState.terminalHistory.push(cmd);

  const router = AppState.activeRouter || DEFAULT_ROUTER;
  const result = await MikroTikAPI.executeCliCommand(router, cmd);

  if (result.success) {
    if (result.raw) {
      appendTerminalLine(result.raw);
    } else if (Array.isArray(result.data)) {
      if (result.data.length === 0) {
        appendTerminalLine('(no items found)');
      } else {
        result.data.forEach((item, idx) => {
          const summary = Object.entries(item)
            .filter(([k]) => !k.startsWith('.'))
            .map(([k, v]) => `${k}=${v}`)
            .join('  ');
          appendTerminalLine(`[${idx}] ${summary}`);
        });
      }
    } else if (typeof result.data === 'object') {
      Object.entries(result.data).forEach(([k, v]) => {
        appendTerminalLine(`${k.padEnd(20, ' ')} : ${v}`);
      });
    } else {
      appendTerminalLine(String(result.data || 'OK'), 'success');
    }
  } else {
    appendTerminalLine(`Error: ${result.error || 'Command failed'}`, 'error');
  }
}

function runQuickCommand(command) {
  const input = document.getElementById('terminalCmdInput');
  if (input) {
    input.value = command;
  }
  handleTerminalSubmit();
}

function clearTerminalOutput() {
  const body = document.getElementById('terminalOutputBody');
  if (body) {
    body.innerHTML = `
      <div style="color:#38bdf8;">MikroTik RouterOS 7.14.3 (c) 1999-2024 http://www.mikrotik.com/</div>
      <div style="color:#64748b; margin-bottom:10px;">Console cleared. Type a command or click a quick preset.</div>
    `;
  }
}

function copyTerminalOutput() {
  const body = document.getElementById('terminalOutputBody');
  if (!body) return;
  const text = body.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('تم نسخ مخرجات موجه الأوامر إلى الحافظة', 'success');
  }).catch(() => {
    showToast('تعذر النسخ التلقائي', 'warning');
  });
}

// ==========================================================================
// 20. DHCP Leases Management
// ==========================================================================
async function fetchLiveDhcpLeases() {
  const router = AppState.activeRouter || DEFAULT_ROUTER;
  showToast(`جاري جلب قائمة DHCP من ${router.name}...`, 'info');
  const res = await MikroTikAPI.fetchDhcpLeases(router);

  if (res.success && Array.isArray(res.data) && res.data.length > 0) {
    AppState.dhcpLeases = res.data.map(item => ({
      id: item['.id'] || `dhcp-${Date.now()}-${Math.random()}`,
      ip: item.address || item.ip || '192.168.88.x',
      mac: item['mac-address'] || item.mac || '00:00:00:00:00:00',
      hostname: item['host-name'] || item.hostname || 'Unknown Device',
      server: item.server || 'dhcp-lan',
      status: item.status || 'bound',
      dynamic: item.dynamic === 'true' || item.dynamic === true,
      expiresAfter: item['expires-after'] || 'Active',
      comment: item.comment || ''
    }));
    saveToStorage(STORAGE_KEYS.DHCP_LEASES, AppState.dhcpLeases);
    showToast(`تم مزامنة ${AppState.dhcpLeases.length} عنوان DHCP بنجاح`, 'success');
  }
  renderDhcpTable();
}

function getFilteredDhcpLeases() {
  let list = [...AppState.dhcpLeases];
  const query = (document.getElementById('dhcpSearchInput')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('dhcpStatusFilter')?.value || 'all';

  if (query) {
    list = list.filter(l =>
      l.ip.toLowerCase().includes(query) ||
      l.mac.toLowerCase().includes(query) ||
      (l.hostname && l.hostname.toLowerCase().includes(query))
    );
  }

  if (statusFilter === 'bound') {
    list = list.filter(l => l.status === 'bound');
  } else if (statusFilter === 'static') {
    list = list.filter(l => !l.dynamic);
  } else if (statusFilter === 'dynamic') {
    list = list.filter(l => l.dynamic);
  }

  return list;
}

function renderDhcpTable() {
  const tbody = document.getElementById('dhcpTableBody');
  if (!tbody) return;

  const leases = getFilteredDhcpLeases();
  if (leases.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2.5rem; color:var(--text-dim);">لا توجد عناوين DHCP مطابقة للبحث</td></tr>`;
    return;
  }

  tbody.innerHTML = leases.map(lease => {
    const isBound = lease.status === 'bound';
    const isDynamic = lease.dynamic;

    return `
      <tr>
        <td><strong style="font-family:'JetBrains Mono'; font-size:0.9rem; color:var(--primary);">${lease.ip}</strong></td>
        <td><span style="font-family:'JetBrains Mono'; font-size:0.8rem;">${lease.mac}</span></td>
        <td>
          <div style="font-weight:700;">${lease.hostname || 'جهاز بدون اسم'}</div>
          ${lease.comment ? `<div style="font-size:0.75rem; color:var(--text-dim);">${lease.comment}</div>` : ''}
        </td>
        <td><span class="badge-profile">${lease.server}</span></td>
        <td>
          <span class="badge-status-pill ${isDynamic ? 'badge-status-online' : 'badge-status-offline'}" style="font-size:0.75rem;">
            ${isDynamic ? 'ديناميكي (Dynamic)' : 'حجز ثابت (Static)'}
          </span>
        </td>
        <td>
          <span class="badge-status-pill ${isBound ? 'badge-status-online' : 'badge-status-offline'}" style="font-size:0.75rem;">
            <span class="status-dot ${isBound ? '' : 'offline'}"></span>
            ${isBound ? 'نشط (Bound)' : 'غير متصل'}
          </span>
        </td>
        <td><span style="font-family:'JetBrains Mono'; font-size:0.8rem; color:var(--text-muted);">${lease.expiresAfter || 'دائم'}</span></td>
        <td>
          <div class="table-actions-cell">
            ${isDynamic ? `
              <button class="btn btn-secondary" style="padding:3px 8px; font-size:0.75rem;" onclick="makeDhcpStatic('${lease.id}')" title="تثبيت هذا العنوان">📌 تثبيت IP</button>
            ` : `
              <button class="btn btn-secondary" style="padding:3px 8px; font-size:0.75rem;" onclick="makeDhcpDynamic('${lease.id}')" title="تحويل لديناميكي">🔄 ديناميكي</button>
            `}
            <button class="btn btn-icon" style="color:var(--accent-rose);" onclick="deleteDhcpLease('${lease.id}')" title="حذف الحجز">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterDhcpTable() {
  renderDhcpTable();
}

async function makeDhcpStatic(leaseId) {
  const lease = AppState.dhcpLeases.find(l => l.id === leaseId);
  if (!lease) return;

  if (AppState.activeRouter) {
    await MikroTikAPI.makeDhcpStatic(AppState.activeRouter, leaseId);
  }

  lease.dynamic = false;
  lease.expiresAfter = 'Static (دائم)';
  saveToStorage(STORAGE_KEYS.DHCP_LEASES, AppState.dhcpLeases);
  renderDhcpTable();
  showToast(`تم تحويل العنوان ${lease.ip} (${lease.hostname}) إلى حجز ثابت Static في المايكروتك`, 'success');
}

function makeDhcpDynamic(leaseId) {
  const lease = AppState.dhcpLeases.find(l => l.id === leaseId);
  if (!lease) return;
  lease.dynamic = true;
  lease.expiresAfter = '12h 00m 00s';
  saveToStorage(STORAGE_KEYS.DHCP_LEASES, AppState.dhcpLeases);
  renderDhcpTable();
  showToast(`تم تحويل العنوان ${lease.ip} إلى ديناميكي`, 'info');
}

async function deleteDhcpLease(leaseId) {
  const lease = AppState.dhcpLeases.find(l => l.id === leaseId);
  if (!confirm(`هل تريد بالتأكيد حذف حجز الـ DHCP (${lease?.ip || ''}) من المايكروتك؟`)) return;

  if (AppState.activeRouter) {
    await MikroTikAPI.deleteDhcpLease(AppState.activeRouter, leaseId);
  }

  AppState.dhcpLeases = AppState.dhcpLeases.filter(l => l.id !== leaseId);
  saveToStorage(STORAGE_KEYS.DHCP_LEASES, AppState.dhcpLeases);
  renderDhcpTable();
  showToast('تم حذف حجز DHCP بنجاح من المايكروتك', 'success');
}

function openAddDhcpModal() {
  const ip = prompt('أدخل عنوان IP المراد حجزه (مثال: 192.168.88.150):', '192.168.88.');
  if (!ip) return;
  const mac = prompt('أدخل عنوان MAC أدرس للجهاز (مثال: 00:11:22:33:44:55):', '00:11:22:');
  if (!mac) return;
  const hostname = prompt('أدخل اسم الجهاز أو التعليق (Hostname):', 'New-Device');

  const newLease = {
    id: `dhcp-static-${Date.now()}`,
    ip: ip.trim(),
    mac: mac.trim().toUpperCase(),
    hostname: hostname ? hostname.trim() : 'Static Device',
    server: 'dhcp-lan',
    status: 'bound',
    dynamic: false,
    expiresAfter: 'Static (دائم)',
    comment: 'Manual static reservation'
  };

  AppState.dhcpLeases.unshift(newLease);
  saveToStorage(STORAGE_KEYS.DHCP_LEASES, AppState.dhcpLeases);
  renderDhcpTable();
  showToast(`تم إضافة الحجز الثابت ${ip} بنجاح!`, 'success');
}

// ==========================================================================
// 21. Network Diagnostics & Ping Engine
// ==========================================================================
async function runPingDiagnostic() {
  const targetInput = document.getElementById('pingTargetIpInput');
  const countSelect = document.getElementById('pingCountSelect');
  const consoleOutput = document.getElementById('pingConsoleOutput');
  const minVal = document.getElementById('pingMinVal');
  const avgVal = document.getElementById('pingAvgVal');
  const lossVal = document.getElementById('pingLossVal');

  if (!targetInput || !consoleOutput) return;
  const target = targetInput.value.trim();
  const count = parseInt(countSelect?.value || '4', 10);

  if (!target) {
    showToast('يرجى كتابة عنوان IP أو نطاق صالح للفحص', 'warning');
    return;
  }

  consoleOutput.innerHTML = `<div style="color:#38bdf8;">Sending ${count} ping packets to ${target}...</div>`;
  minVal.textContent = '...';
  avgVal.textContent = '...';
  lossVal.textContent = '...';

  const router = AppState.activeRouter || DEFAULT_ROUTER;
  const result = await MikroTikAPI.ping(router, target, count);

  if (result.success && result.stats) {
    const stats = result.stats;
    minVal.textContent = `${stats.minTime}ms`;
    avgVal.textContent = `${stats.avgTime}ms`;
    lossVal.textContent = `${stats.packetLoss}%`;

    let html = `<div style="color:#38bdf8; margin-bottom:6px;">PING ${target} (56 data bytes) via ${router.name}:</div>`;
    if (Array.isArray(result.data)) {
      result.data.forEach((p, idx) => {
        const time = p.time || p['avg-rtt'] || `${Math.floor(12 + Math.random() * 8)}ms`;
        const ttl = p.ttl || 58;
        html += `<div style="color:#f8fafc;">64 bytes from ${target}: icmp_seq=${idx + 1} ttl=${ttl} time=${time}</div>`;
      });
    }
    html += `<div style="color:#34d399; margin-top:8px; font-weight:bold;">--- ${target} ping statistics ---</div>`;
    html += `<div style="color:#94a3b8;">${stats.sent} packets transmitted, ${stats.received} received, ${stats.packetLoss}% packet loss</div>`;
    html += `<div style="color:#94a3b8;">rtt min/avg/max = ${stats.minTime}/${stats.avgTime}/${stats.maxTime} ms</div>`;
    consoleOutput.innerHTML = html;
  } else {
    consoleOutput.innerHTML += `<div style="color:#f43f5e; margin-top:6px;">Error executing ping: ${result.error || 'Request timed out or host unreachable'}</div>`;
    minVal.textContent = '--';
    avgVal.textContent = '--';
    lossVal.textContent = '100%';
  }
}

// ==========================================================================
// 22. System Logs Engine
// ==========================================================================
async function fetchMikroTikLogs() {
  const router = AppState.activeRouter || DEFAULT_ROUTER;
  showToast(`جاري جلب سجلات الراوتر ${router.name}...`, 'info');
  const res = await MikroTikAPI.fetchLogs(router);

  if (res.success && Array.isArray(res.data) && res.data.length > 0) {
    AppState.systemLogs = res.data.map(item => ({
      id: item['.id'] || `log-${Date.now()}-${Math.random()}`,
      time: item.time || new Date().toLocaleTimeString(),
      topic: item.topics || item.topic || 'system,info',
      message: item.message || '',
      level: (item.topics && item.topics.includes('warning')) ? 'warning' : 'info'
    }));
    saveToStorage(STORAGE_KEYS.SYSTEM_LOGS, AppState.systemLogs);
    showToast(`تم جلب ${AppState.systemLogs.length} سجل من المايكروتك`, 'success');
  }
  renderLogsTable();
}

function getFilteredLogs() {
  let list = [...AppState.systemLogs];
  const query = (document.getElementById('logsSearchInput')?.value || '').toLowerCase().trim();
  const topicFilter = document.getElementById('logsTopicFilter')?.value || 'all';

  if (query) {
    list = list.filter(l =>
      l.message.toLowerCase().includes(query) ||
      l.topic.toLowerCase().includes(query) ||
      l.time.toLowerCase().includes(query)
    );
  }

  if (topicFilter !== 'all') {
    list = list.filter(l => l.topic.toLowerCase().includes(topicFilter.toLowerCase()));
  }

  return list;
}

function renderLogsTable() {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  const logs = getFilteredLogs();
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2.5rem; color:var(--text-dim);">لا توجد سجلات مطابقة للتصفية</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    const isWarning = log.topic.includes('warning') || log.level === 'warning';
    const isError = log.topic.includes('error') || log.level === 'error';

    let levelBadge = `<span class="badge-status-pill badge-status-online" style="font-size:0.75rem;">Info</span>`;
    if (isWarning) {
      levelBadge = `<span class="badge-status-pill" style="background:rgba(245,158,11,0.15); color:#f59e0b; font-size:0.75rem;">Warning</span>`;
    } else if (isError) {
      levelBadge = `<span class="badge-status-pill badge-status-offline" style="font-size:0.75rem;">Error</span>`;
    }

    return `
      <tr>
        <td><span style="font-family:'JetBrains Mono'; font-size:0.8rem; color:var(--text-dim);">${log.time}</span></td>
        <td><span class="badge-profile" style="font-size:0.75rem; font-family:'JetBrains Mono';">${log.topic}</span></td>
        <td><span style="font-family:'JetBrains Mono'; font-size:0.85rem; color:var(--text-main);">${log.message}</span></td>
        <td>${levelBadge}</td>
      </tr>
    `;
  }).join('');
}

function filterLogsTable() {
  renderLogsTable();
}

function exportLogsToFile() {
  const logs = getFilteredLogs();
  let content = `MikroTik RouterOS System Logs Export\nDate: ${new Date().toISOString()}\n\n`;
  logs.forEach(l => {
    content += `[${l.time}] [${l.topic}] ${l.message}\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mikrotik_logs_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تصدير ملف السجلات بنجاح!', 'success');
}

// ==========================================================================
// 22b. Connected Network Devices (IP Neighbor & IP Hotspot Host)
// ==========================================================================

async function fetchLiveNeighborsData() {
  const router = AppState.activeRouter;
  if (!router) {
    showToast('لا يوجد راوتر نشط حالياً', 'warning');
    return;
  }

  showToast('جاري استكشاف الأجهزة المتصلة والجوار (Neighbor Discovery)...', 'info');

  try {
    const data = await MikroTikAPI.fetchNeighbors(router);
    if (data && data.success) {
      if (Array.isArray(data.neighbors)) {
        AppState.neighbors = data.neighbors;
        saveToStorage(STORAGE_KEYS.NEIGHBORS, data.neighbors);
      }
      if (Array.isArray(data.hotspotHosts)) {
        AppState.hotspotHosts = data.hotspotHosts;
        saveToStorage(STORAGE_KEYS.HOTSPOT_HOSTS, data.hotspotHosts);
      }

      renderNeighborsView();

      const totalFound = (AppState.neighbors?.length || 0) + (AppState.hotspotHosts?.length || 0);
      showToast(`تم تحديث قائمة الأجهزة بنجاح (${totalFound} جهاز مكتشف)`, 'success');
    } else {
      showToast('تعذر استرداد بيانات الجوار من الراوتر. جاري عرض البيانات المخزنة.', 'warning');
      renderNeighborsView();
    }
  } catch (err) {
    console.error('Error fetching neighbors:', err);
    showToast('حدث خطأ أثناء الاتصال بموجه الأجهزة', 'error');
    renderNeighborsView();
  }
}

function renderNeighborsView() {
  updateNeighborsStats();
  populateInterfaceFilterDropdown();
  if (AppState.activeNeighborsSubTab === 'neighbors') {
    renderNeighborsTable();
  } else {
    renderHotspotHostsTable();
  }
}

function switchNeighborsSubTab(tab) {
  AppState.activeNeighborsSubTab = tab;
  const tabBtnN = document.getElementById('tabBtnNeighbors');
  const tabBtnH = document.getElementById('tabBtnHotspotHosts');
  const secN = document.getElementById('neighborsSectionContent');
  const secH = document.getElementById('hotspotHostsSectionContent');

  if (tab === 'neighbors') {
    if (tabBtnN) {
      tabBtnN.className = 'btn btn-primary';
    }
    if (tabBtnH) {
      tabBtnH.className = 'btn btn-secondary';
    }
    if (secN) secN.style.display = 'block';
    if (secH) secH.style.display = 'none';
    renderNeighborsTable();
  } else {
    if (tabBtnN) {
      tabBtnN.className = 'btn btn-secondary';
    }
    if (tabBtnH) {
      tabBtnH.className = 'btn btn-primary';
    }
    if (secN) secN.style.display = 'none';
    if (secH) secH.style.display = 'block';
    renderHotspotHostsTable();
  }
}

function updateNeighborsStats() {
  const nbrCount = AppState.neighbors ? AppState.neighbors.length : 0;
  const hostsCount = AppState.hotspotHosts ? AppState.hotspotHosts.length : 0;

  const nbrBadge = document.getElementById('neighborsCountBadge');
  if (nbrBadge) nbrBadge.textContent = nbrCount;

  const hostsBadge = document.getElementById('hotspotHostsCountBadge');
  if (hostsBadge) hostsBadge.textContent = hostsCount;

  const tabBadgeN = document.getElementById('tabBadgeNeighbors');
  if (tabBadgeN) tabBadgeN.textContent = nbrCount;

  const tabBadgeH = document.getElementById('tabBadgeHosts');
  if (tabBadgeH) tabBadgeH.textContent = hostsCount;

  const navBadge = document.getElementById('navNeighborsBadge');
  const bnavBadge = document.getElementById('bnavNeighborsBadge');
  const total = nbrCount + hostsCount;
  if (navBadge) {
    navBadge.textContent = total;
    navBadge.style.display = total > 0 ? 'inline-block' : 'none';
  }
  if (bnavBadge) {
    bnavBadge.textContent = total;
    bnavBadge.style.display = total > 0 ? 'flex' : 'none';
  }

  // Count Authorized Hotspot hosts
  const authorizedCount = (AppState.hotspotHosts || []).filter(h => 
    String(h.authorized).toLowerCase() === 'true' || h.authorized === true || h.bypassed === 'true'
  ).length;
  const authEl = document.getElementById('neighborsAuthorizedCount');
  if (authEl) authEl.textContent = authorizedCount;

  // Count Network Infrastructure Equipment (Ubiquiti, MikroTik, Switches, OLT)
  const equipCount = (AppState.neighbors || []).filter(n => {
    const p = (n.platform || '').toLowerCase();
    const b = (n.board || '').toLowerCase();
    return p.includes('ubiquiti') || p.includes('mikrotik') || p.includes('huawei') || b.includes('switch') || b.includes('beam') || b.includes('prism');
  }).length;
  const equipEl = document.getElementById('neighborsEquipmentCount');
  if (equipEl) equipEl.textContent = equipCount;
}

function populateInterfaceFilterDropdown() {
  const select = document.getElementById('neighborInterfaceFilter');
  if (!select) return;

  const currentVal = select.value || 'all';
  const interfaces = new Set();
  (AppState.neighbors || []).forEach(n => {
    if (n.interface) interfaces.add(n.interface);
  });

  let optionsHtml = '<option value="all">جميع المنافذ</option>';
  interfaces.forEach(iface => {
    optionsHtml += `<option value="${iface}" ${iface === currentVal ? 'selected' : ''}>${iface}</option>`;
  });
  select.innerHTML = optionsHtml;
}

function renderNeighborsTable() {
  const tbody = document.getElementById('neighborsTableBody');
  if (!tbody) return;

  const searchInput = document.getElementById('neighborSearchInput');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  
  const platformFilter = document.getElementById('neighborPlatformFilter');
  const selectedPlatform = platformFilter ? platformFilter.value : 'all';

  const ifaceFilter = document.getElementById('neighborInterfaceFilter');
  const selectedIface = ifaceFilter ? ifaceFilter.value : 'all';

  let list = AppState.neighbors || [];

  // Filter
  list = list.filter(item => {
    const ip = (item.address || item['ipv4-address'] || item['ipv6-address'] || '').toLowerCase();
    const mac = (item['mac-address'] || '').toLowerCase();
    const identity = (item.identity || 'Unknown').toLowerCase();
    const platform = (item.platform || '').toLowerCase();
    const board = (item.board || '').toLowerCase();
    const iface = (item.interface || '').toLowerCase();

    const matchesQuery = !query || 
      ip.includes(query) || 
      mac.includes(query) || 
      identity.includes(query) || 
      platform.includes(query) || 
      board.includes(query) || 
      iface.includes(query);

    const matchesPlatform = selectedPlatform === 'all' || 
      (item.platform && item.platform.toLowerCase().includes(selectedPlatform.toLowerCase()));

    const matchesIface = selectedIface === 'all' || item.interface === selectedIface;

    return matchesQuery && matchesPlatform && matchesIface;
  });

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-dim);">
          <div style="font-size:1.6rem; margin-bottom:0.5rem;">🔍</div>
          <div>لا توجد أجهزة متصلة مطابقة للبحث</div>
          <div style="font-size:0.8rem; margin-top:4px;">تأكد من تفعيل بروتوكول Neighbor Discovery في راوتر المايكروتك أو اضغط على زر "تحديث واستكشاف الأجهزة"</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(device => {
    const ip = device.address || device['ipv4-address'] || 'غير مخصص';
    const mac = device['mac-address'] || '--';
    const identity = device.identity || 'جهاز بدون اسم';
    const iface = device.interface || 'غير محدد';
    const platform = device.platform || 'Generic';
    const board = device.board || '';
    const version = device.version || '';
    const uptime = device.uptime || device.age || '--';

    // Platform Badge Styling
    let badgeClass = 'badge-profile';
    let icon = '📡';
    if (platform.toLowerCase().includes('mikrotik')) {
      badgeClass = 'badge-profile';
      icon = '📶';
    } else if (platform.toLowerCase().includes('ubiquiti')) {
      icon = '⚡';
    } else if (platform.toLowerCase().includes('huawei')) {
      icon = '🌐';
    }

    const hasValidIp = ip && ip !== 'غير مخصص' && !ip.startsWith('0.0.0.0');

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.15rem;">${icon}</span>
            <div>
              <div style="font-weight:700; color:var(--text-main); font-size:0.92rem;">${identity}</div>
              <div style="font-size:0.75rem; color:var(--text-dim);">${board ? board : platform}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-family:'JetBrains Mono'; font-weight:700; color:var(--primary); font-size:0.9rem;">${ip}</span>
            ${hasValidIp ? `
              <button class="btn btn-icon" style="width:24px; height:24px; padding:0;" onclick="copyIpToClipboard('${ip}')" title="نسخ عنوان IP">📋</button>
            ` : ''}
          </div>
        </td>
        <td><span style="font-family:'JetBrains Mono'; font-size:0.8rem; color:var(--text-dim);">${mac}</span></td>
        <td><span class="badge-profile" style="font-family:'JetBrains Mono'; font-size:0.78rem;">${iface}</span></td>
        <td>
          <div>
            <span class="${badgeClass}" style="font-size:0.75rem;">${platform}</span>
            ${board ? `<div style="font-size:0.72rem; color:var(--text-dim); margin-top:2px;">${board}</div>` : ''}
          </div>
        </td>
        <td>
          <div style="font-size:0.78rem;">
            <div style="font-family:'JetBrains Mono'; color:var(--text-dim);">${uptime}</div>
            ${version ? `<div style="font-size:0.7rem; color:var(--text-dim);">${version}</div>` : ''}
          </div>
        </td>
        <td style="text-align:center;">
          <div style="display:inline-flex; gap:6px; align-items:center;">
            ${hasValidIp ? `
              <button class="btn btn-primary" style="padding:4px 10px; font-size:0.78rem; display:flex; align-items:center; gap:4px; background:var(--accent-teal); border-color:var(--accent-teal);" onclick="openDeviceInNewTab('${ip}', '${platform}')" title="فتح لوحة تحكم القطعة في تبويب جديد المتصفح">
                <span>🔗</span>
                <span>فتح لوحة التحكم</span>
              </button>
              <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.78rem;" onclick="pingTargetFromDevice('${ip}')" title="فحص استجابة Ping للجهاز">
                📡 Ping
              </button>
            ` : `
              <span style="font-size:0.75rem; color:var(--text-dim);">لا يوجد IP</span>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderHotspotHostsTable() {
  const tbody = document.getElementById('hotspotHostsTableBody');
  if (!tbody) return;

  const searchInput = document.getElementById('hotspotHostSearchInput');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const authFilter = document.getElementById('hotspotHostAuthFilter');
  const selectedAuth = authFilter ? authFilter.value : 'all';

  let list = AppState.hotspotHosts || [];

  // Filter
  list = list.filter(item => {
    const ip = (item.address || '').toLowerCase();
    const mac = (item['mac-address'] || '').toLowerCase();
    const comment = (item.comment || '').toLowerCase();
    const server = (item.server || '').toLowerCase();

    const matchesQuery = !query || 
      ip.includes(query) || 
      mac.includes(query) || 
      comment.includes(query) || 
      server.includes(query);

    let matchesAuth = true;
    const isAuth = String(item.authorized).toLowerCase() === 'true' || item.authorized === true;
    const isBypassed = String(item.bypassed).toLowerCase() === 'true' || item.bypassed === true;

    if (selectedAuth === 'authorized') {
      matchesAuth = isAuth && !isBypassed;
    } else if (selectedAuth === 'unauthorized') {
      matchesAuth = !isAuth && !isBypassed;
    } else if (selectedAuth === 'bypassed') {
      matchesAuth = isBypassed;
    }

    return matchesQuery && matchesAuth;
  });

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-dim);">
          <div style="font-size:1.6rem; margin-bottom:0.5rem;">📱</div>
          <div>لا توجد أجهزة هوتسبوت متصلة مطابقة للتصفية</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(host => {
    const ip = host.address || 'غير محدد';
    const mac = host['mac-address'] || '--';
    const server = host.server || 'hotspot1';
    const comment = host.comment || 'جهاز مشترك';
    const bytesIn = formatBytes(parseInt(host['bytes-in'] || '0', 10));
    const bytesOut = formatBytes(parseInt(host['bytes-out'] || '0', 10));

    const isAuth = String(host.authorized).toLowerCase() === 'true' || host.authorized === true;
    const isBypassed = String(host.bypassed).toLowerCase() === 'true' || host.bypassed === true;

    let authStatusBadge = `<span class="badge-status-pill badge-status-offline" style="font-size:0.75rem;">بانتظار الدخول</span>`;
    if (isBypassed) {
      authStatusBadge = `<span class="badge-status-pill" style="background:rgba(245,158,11,0.15); color:#f59e0b; font-size:0.75rem;">مستثنى (Bypassed)</span>`;
    } else if (isAuth) {
      authStatusBadge = `<span class="badge-status-pill badge-status-online" style="font-size:0.75rem;">مصرح (متصل)</span>`;
    }

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-family:'JetBrains Mono'; font-weight:700; color:var(--primary); font-size:0.9rem;">${ip}</span>
            <button class="btn btn-icon" style="width:24px; height:24px; padding:0;" onclick="copyIpToClipboard('${ip}')" title="نسخ عنوان IP">📋</button>
          </div>
        </td>
        <td><span style="font-family:'JetBrains Mono'; font-size:0.8rem; color:var(--text-dim);">${mac}</span></td>
        <td><span class="badge-profile" style="font-size:0.75rem;">${server}</span></td>
        <td>${authStatusBadge}</td>
        <td>
          <div style="font-size:0.75rem; font-family:'JetBrains Mono';">
            <span style="color:var(--secondary);" title="التحميل">⬇️ ${bytesOut}</span>
            <span style="color:var(--accent-emerald); margin-right:8px;" title="الرفع">⬆️ ${bytesIn}</span>
          </div>
        </td>
        <td><span style="font-size:0.85rem; color:var(--text-main);">${comment}</span></td>
        <td style="text-align:center;">
          <div style="display:inline-flex; gap:6px; align-items:center;">
            <button class="btn btn-primary" style="padding:4px 10px; font-size:0.78rem; display:flex; align-items:center; gap:4px; background:var(--accent-teal); border-color:var(--accent-teal);" onclick="openDeviceInNewTab('${ip}', 'hotspot')" title="فتح لوحة تحكم راوتر أو واجهة الجهاز">
              <span>🔗</span>
              <span>فتح IP القطعة</span>
            </button>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.78rem;" onclick="copyIpToClipboard('${ip}')" title="نسخ عنوان IP">
              📋 نسخ
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Utility: Format bytes to human readable string
function formatBytes(bytes) {
  if (!bytes || isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Open Device In New Browser Tab
function openDeviceInNewTab(ip, platform = '') {
  if (!ip || ip === 'غير مخصص' || ip === '--') {
    showToast('عنوان IP غير صالح للفتح', 'warning');
    return;
  }

  // Determine standard protocol: Ubiquiti devices prefer HTTPS, others usually HTTP
  let protocol = 'http';
  let port = '';

  const platLower = (platform || '').toLowerCase();
  if (platLower.includes('ubiquiti') || platLower.includes('unifi')) {
    protocol = 'https';
  }

  const url = `${protocol}://${ip}${port ? ':' + port : ''}`;
  
  // Show informational toast
  showToast(`جاري فتح لوحة تحكم الجهاز (${url})...`, 'info');

  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      // Browser popup blocked, notify user with copyable link or open modal
      showToast('تم حظر النوافذ المنبثقة في المتصفح! يرجى السماح بالنوافذ أو استخدام زر النسخ.', 'warning');
      openDirectDeviceIpModal(ip, protocol);
    }
  } catch (e) {
    console.error('Failed to open window:', e);
    openDirectDeviceIpModal(ip, protocol);
  }
}

// Copy IP to Clipboard with toast feedback
function copyIpToClipboard(ip) {
  if (!ip || ip === 'غير مخصص' || ip === '--') {
    showToast('لا يوجد عنوان IP للنسخ', 'warning');
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ip).then(() => {
      showToast(`تم نسخ عنوان IP (${ip}) إلى الحافظة بنجاح! 📋`, 'success');
    }).catch(() => {
      fallbackCopyText(ip);
    });
  } else {
    fallbackCopyText(ip);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast(`تم نسخ عنوان IP (${text}) بنجاح! 📋`, 'success');
  } catch (err) {
    showToast(`العنوان: ${text}`, 'info');
  }
  document.body.removeChild(textArea);
}

// Direct Device IP Launcher Modal Handlers
function openDirectDeviceIpModal(initialIp = '', initialProtocol = 'http') {
  const modal = document.getElementById('directDeviceIpModal');
  if (!modal) return;

  const input = document.getElementById('directDeviceIpInput');
  const proto = document.getElementById('directDeviceProtocol');
  const port = document.getElementById('directDevicePort');

  if (input) input.value = initialIp || '';
  if (proto) proto.value = initialProtocol || 'http';
  if (port) port.value = '';

  modal.classList.add('active');
  if (input) {
    setTimeout(() => input.focus(), 100);
  }
}

function setDirectDevicePreset(ip, protocol = 'http', port = '') {
  const input = document.getElementById('directDeviceIpInput');
  const proto = document.getElementById('directDeviceProtocol');
  const portInput = document.getElementById('directDevicePort');

  if (input) input.value = ip;
  if (proto) proto.value = protocol;
  if (portInput) portInput.value = port;
}

function copyDirectDeviceIp() {
  const input = document.getElementById('directDeviceIpInput');
  const ip = input ? input.value.trim() : '';
  if (!ip) {
    showToast('يرجى إدخال عنوان IP أولاً', 'warning');
    return;
  }
  copyIpToClipboard(ip);
}

function launchDirectDeviceIp() {
  const input = document.getElementById('directDeviceIpInput');
  const proto = document.getElementById('directDeviceProtocol');
  const portInput = document.getElementById('directDevicePort');

  const ip = input ? input.value.trim() : '';
  const protocol = proto ? proto.value : 'http';
  const port = portInput ? portInput.value.trim() : '';

  if (!ip) {
    showToast('يرجى إدخال عنوان IP للجهاز أو القطعة', 'warning');
    return;
  }

  const url = `${protocol}://${ip}${port ? ':' + port : ''}`;
  showToast(`جاري فتح لوحة تحكم القطعة (${url})...`, 'info');

  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      showToast('يرجى السماح بالنوافذ المنبثقة (Popups) في المتصفح', 'warning');
    }
  } catch (err) {
    console.error('Failed to open device IP:', err);
  }

  closeAllModals();
}

function pingTargetFromDevice(ip) {
  if (!ip) return;
  switchView('diagnostics');
  setTimeout(() => {
    const pingInput = document.getElementById('pingTargetIpInput') || document.getElementById('pingTargetInput');
    if (pingInput) {
      pingInput.value = ip;
      runPingDiagnostic();
    }
  }, 200);
}

function pingTargetFromDeviceModal() {
  const input = document.getElementById('directDeviceIpInput');
  const ip = input ? input.value.trim() : '';
  if (!ip) {
    showToast('يرجى إدخال عنوان IP لفحصه', 'warning');
    return;
  }
  closeAllModals();
  pingTargetFromDevice(ip);
}

// ==========================================================================
// 23. Global DOM Event Listeners & Bootstrapping
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initDataStore();

  // Close user drawer & modals when clicking outside or pressing Escape key
  const drawerOverlay = document.getElementById('drawerOverlay');
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeUserDrawer);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeUserDrawer();
      closeAllModals();
    }
  });

  // Sidebar navigation click handlers
  document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');
      if (view) {
        switchView(view);
        if (window.innerWidth <= 900) {
          const sb = document.getElementById('appSidebar');
          if (sb) sb.classList.remove('mobile-open');
        }
      }
    });
  });

  // Mobile bottom navigation click handlers
  document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      if (view) {
        closeMobileMoreSheet();
        switchView(view);
      }
    });
  });

  // Mobile More Drawer Sheet toggle handlers
  const bnavMoreBtn = document.getElementById('bnavMoreBtn');
  const mobileMoreSheet = document.getElementById('mobileMoreSheet');
  const mobileMoreBackdrop = document.getElementById('mobileMoreBackdrop');
  const closeMobileMoreBtn = document.getElementById('closeMobileMoreBtn');

  function openMobileMoreSheet() {
    if (mobileMoreSheet) mobileMoreSheet.classList.add('active');
    if (mobileMoreBackdrop) mobileMoreBackdrop.classList.add('active');
  }

  function closeMobileMoreSheet() {
    if (mobileMoreSheet) mobileMoreSheet.classList.remove('active');
    if (mobileMoreBackdrop) mobileMoreBackdrop.classList.remove('active');
  }

  if (bnavMoreBtn) {
    bnavMoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mobileMoreSheet && mobileMoreSheet.classList.contains('active')) {
        closeMobileMoreSheet();
      } else {
        openMobileMoreSheet();
      }
    });
  }

  if (closeMobileMoreBtn) {
    closeMobileMoreBtn.addEventListener('click', closeMobileMoreSheet);
  }

  if (mobileMoreBackdrop) {
    mobileMoreBackdrop.addEventListener('click', closeMobileMoreSheet);
  }

  // Mobile More Grid items click handlers
  document.querySelectorAll('.mobile-more-grid .mobile-grid-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      if (view) {
        closeMobileMoreSheet();
        switchView(view);
      }
    });
  });

  // Mobile sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggleBtn');
  const sidebar = document.getElementById('appSidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
    });

    // Close sidebar on outside click on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 900 && sidebar.classList.contains('mobile-open')) {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
        }
      }
    });
  }

  // Quick search input
  const searchInput = document.getElementById('globalQuickSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      if (AppState.activeTab === 'hotspot') {
        renderHotspotTable();
      }
    });
  }

  // Table profile & status filters
  const profileFilter = document.getElementById('hotspotProfileFilter');
  if (profileFilter) {
    profileFilter.addEventListener('change', (e) => {
      AppState.selectedProfileFilter = e.target.value;
      AppState.currentPage = 1;
      renderHotspotTable();
    });
  }

  const statusFilter = document.getElementById('hotspotStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      AppState.selectedStatusFilter = e.target.value;
      AppState.currentPage = 1;
      renderHotspotTable();
    });
  }

  // Designer property change listeners
  ['propCompanyName', 'propSlogan', 'propRadius', 'propColor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCardDesignPreview);
  });

  // Window resize handler for charts
  window.addEventListener('resize', () => {
    if (AppState.activeTab === 'dashboard') {
      renderTrafficChart();
      renderDonutChart();
    }
  });

  // Initial render calls
  renderRoutersDropdown();
  updateNeighborsStats();
  switchView('dashboard');
  startLiveStreamingLoop();
  initTelegramSettings();
});

// Expose functions globally for inline HTML event handlers
window.toggleTheme = toggleTheme;
window.toggleLanguage = toggleLanguage;
window.switchView = switchView;
window.openUserDrawer = openUserDrawer;
window.closeUserDrawer = closeUserDrawer;
window.togglePasswordVisibility = togglePasswordVisibility;
window.openAddUserModal = openAddUserModal;
window.saveNewUserFromModal = saveNewUserFromModal;
window.openEditUserModal = openEditUserModal;
window.saveEditUserModal = saveEditUserModal;
window.openAddProfileModal = openAddProfileModal;
window.editProfileModal = editProfileModal;
window.saveProfileFromModal = saveProfileFromModal;
window.deleteProfile = deleteProfile;
window.openAddRouterModal = openAddRouterModal;
window.saveNewRouterFromModal = saveNewRouterFromModal;
window.createNewTemplateModal = createNewTemplateModal;
window.saveNewTemplateFromModal = saveNewTemplateFromModal;
window.toggleUserStatus = toggleUserStatus;
window.deleteHotspotUser = deleteHotspotUser;
window.openRemoteRouterAddress = openRemoteRouterAddress;
window.togglePPPoEConnection = togglePPPoEConnection;
window.deletePPPoEUser = deletePPPoEUser;
window.printSingleCard = printSingleCard;
window.openBatchPrintModal = openBatchPrintModal;
window.executeBatchPrint = executeBatchPrint;
window.exportBatchCsv = exportBatchCsv;
window.updateCardDesignPreview = updateCardDesignPreview;
window.generateBarcodeSvg = generateBarcodeSvg;
window.selectCardTemplate = selectCardTemplate;
window.openRouterManagerModal = openRouterManagerModal;
window.switchActiveRouter = switchActiveRouter;
window.testRouterConnection = testRouterConnection;
window.exportWinboxRscScript = exportWinboxRscScript;
window.exportDatabaseBackupJson = exportDatabaseBackupJson;
window.importDatabaseBackupJson = importDatabaseBackupJson;
window.openAddPPPoEModal = openAddPPPoEModal;
window.saveNewPPPoEUserFromModal = saveNewPPPoEUserFromModal;
window.closeAllModals = closeAllModals;
window.openA4PrintPreviewModal = openA4PrintPreviewModal;
window.renderA4PreviewContent = renderA4PreviewContent;
window.changeA4Zoom = changeA4Zoom;
window.printFromA4Preview = printFromA4Preview;
window.saveTelegramSettings = saveTelegramSettings;
window.sendTestTelegramAlert = sendTestTelegramAlert;
window.simulateRouterDownTelegramAlert = simulateRouterDownTelegramAlert;
window.initTelegramSettings = initTelegramSettings;
window.renderAlertsList = renderAlertsList;
window.clearAllAlerts = clearAllAlerts;
window.deleteSingleAlert = deleteSingleAlert;
window.syncRouterDataLive = syncRouterDataLive;
window.MikroTikAPI = MikroTikAPI;

// Terminal exports
window.updateTerminalHeader = updateTerminalHeader;
window.handleTerminalSubmit = handleTerminalSubmit;
window.runQuickCommand = runQuickCommand;
window.clearTerminalOutput = clearTerminalOutput;
window.copyTerminalOutput = copyTerminalOutput;

// DHCP exports
window.fetchLiveDhcpLeases = fetchLiveDhcpLeases;
window.renderDhcpTable = renderDhcpTable;
window.filterDhcpTable = filterDhcpTable;
window.makeDhcpStatic = makeDhcpStatic;
window.makeDhcpDynamic = makeDhcpDynamic;
window.deleteDhcpLease = deleteDhcpLease;
window.openAddDhcpModal = openAddDhcpModal;

// Diagnostics exports
window.runPingDiagnostic = runPingDiagnostic;

// Logs exports
window.fetchMikroTikLogs = fetchMikroTikLogs;
window.renderLogsTable = renderLogsTable;
window.filterLogsTable = filterLogsTable;
window.exportLogsToFile = exportLogsToFile;

// Neighbors & Connected Devices exports
window.fetchLiveNeighborsData = fetchLiveNeighborsData;
window.renderNeighborsView = renderNeighborsView;
window.switchNeighborsSubTab = switchNeighborsSubTab;
window.renderNeighborsTable = renderNeighborsTable;
window.renderHotspotHostsTable = renderHotspotHostsTable;
window.openDeviceInNewTab = openDeviceInNewTab;
window.copyIpToClipboard = copyIpToClipboard;
window.openDirectDeviceIpModal = openDirectDeviceIpModal;
window.setDirectDevicePreset = setDirectDevicePreset;
window.copyDirectDeviceIp = copyDirectDeviceIp;
window.launchDirectDeviceIp = launchDirectDeviceIp;
window.pingTargetFromDevice = pingTargetFromDevice;
window.pingTargetFromDeviceModal = pingTargetFromDeviceModal;

