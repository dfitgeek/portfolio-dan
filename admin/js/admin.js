// Admin Core Controller
const Admin = {
  csrfToken: null,
  currentUser: null,
  activeTab: 'projects',

  /**
   * Initialize admin application
   */
  async init() {
    // Check session
    const authOk = await this.checkSession();
    if (!authOk) return;

    this.setupNavigation();
    this.setupLogout();
    this.setupResponsiveSidebar();

    // Initialize modules
    AdminProjects.init();
    AdminBuilder.init();
    AdminPages.init();
    AdminMessages.init();
    AdminSettings.init();
    AdminMedia.init();
    AdminAccount.init();

    // Default tab
    this.switchTab('projects');
  },

  /**
   * Verify session with backend
   */
  async checkSession() {
    try {
      const res = await fetch('/admin/api/me');
      if (!res.ok) {
        window.location.href = '/admin/login';
        return false;
      }
      const data = await res.json();
      this.currentUser = data.user;
      this.csrfToken = data.csrfToken;

      if (data.user.mustChangePassword) {
        window.location.href = '/admin/login';
        return false;
      }

      document.getElementById('topbarUsername').textContent = data.user.username;
      return true;
    } catch (err) {
      window.location.href = '/admin/login';
      return false;
    }
  },

  /**
   * Authenticated fetch wrapper injecting CSRF token
   */
  async apiFetch(url, options = {}) {
    options.headers = options.headers || {};
    options.cache = 'no-store';
    options.headers['Cache-Control'] = 'no-cache';
    options.headers['Pragma'] = 'no-cache';
    if (this.csrfToken) {
      options.headers['x-csrf-token'] = this.csrfToken;
    }

    const res = await fetch(url, options);

    if (res.status === 401) {
      window.location.href = '/admin/login';
      throw new Error('Session expired. Please log in again.');
    }

    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      if (data.code === 'MUST_CHANGE_PASSWORD') {
        window.location.href = '/admin/login';
      }
      throw new Error(data.error || 'Access forbidden or invalid CSRF token.');
    }

    return res;
  },

  /**
   * Tab Navigation
   */
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });
  },

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update sidebar nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
    });

    // Update panes
    document.querySelectorAll('.admin-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    const targetPane = document.getElementById(`pane-${tabName}`);
    if (targetPane) {
      targetPane.classList.add('active');
    }

    // Trigger module tab loads
    if (tabName === 'projects') AdminProjects.load();
    if (tabName === 'about') AdminPages.loadAbout();
    if (tabName === 'contact') AdminPages.loadContact();
    if (tabName === 'messages') AdminMessages.load();
    if (tabName === 'settings') AdminSettings.load();
    if (tabName === 'media') AdminMedia.load();

    // Close mobile sidebar if open
    document.getElementById('adminSidebar')?.classList.remove('open');
  },

  /**
   * Toast notification helper
   */
  toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;

    container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'all 0.2s ease';
      setTimeout(() => el.remove(), 200);
    }, duration);
  },

  /**
   * Modal confirmation helper
   */
  confirm(title, message, confirmText = 'Confirm', isDanger = true) {
    return new Promise(resolve => {
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmModalTitle');
      const msgEl = document.getElementById('confirmModalMessage');
      const okBtn = document.getElementById('confirmModalOkBtn');
      const cancelBtn = document.getElementById('confirmModalCancelBtn');

      titleEl.textContent = title;
      msgEl.textContent = message;
      okBtn.textContent = confirmText;
      okBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';

      modal.classList.add('show');

      const cleanup = (confirmed) => {
        modal.classList.remove('show');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(confirmed);
      };

      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
    });
  },

  /**
   * Logout handler
   */
  setupLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      const confirmed = await this.confirm('Sign Out', 'Are you sure you want to log out of the admin panel?', 'Sign Out', false);
      if (!confirmed) return;

      try {
        await this.apiFetch('/admin/api/logout', { method: 'POST' });
        window.location.href = '/admin/login';
      } catch (err) {
        window.location.href = '/admin/login';
      }
    });
  },

  /**
   * Mobile sidebar toggle
   */
  setupResponsiveSidebar() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
});
