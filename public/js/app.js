(function() {
  'use strict';

  const appState = {
    settings: null,
    currentPath: window.location.pathname
  };

  const appContainer = document.getElementById('app');
  const floatingTopBtn = document.getElementById('floatingTopBtn');
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');

  /**
   * Fetches latest application settings and refreshes header branding
   */
  async function fetchSettings() {
    try {
      const res = await fetch(`/api/settings?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        appState.settings = data.settings || {};
        applySettings(appState.settings);
      }
    } catch (err) {
      console.warn('Failed to fetch settings, using defaults', err);
      if (!appState.settings) appState.settings = {};
    }
  }

  /**
   * Initializes application settings and header branding
   */
  async function initApp() {
    await fetchSettings();
    setupNavigationEvents();
    setupScrollListeners();
    handleRoute(window.location.pathname, false);
  }

  const loadedFonts = new Set(['Bricolage Grotesque', 'Bitter', 'Source Sans 3']);
  function loadGoogleFont(fontName) {
    if (!fontName || loadedFonts.has(fontName)) return;
    loadedFonts.add(fontName);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName.trim().replace(/\s+/g, '+'))}:ital,wght@0,300..800;1,300..800&display=swap`;
    document.head.appendChild(link);
  }

  /**
   * Applies site settings (branding, typography, colors, nav labels, social icons)
   */
  function applySettings(settings) {
    if (!settings) return;

    // Typography
    const fontHeading = settings.fontHeading || 'Bricolage Grotesque';
    const fontBody = settings.fontBody || 'Bricolage Grotesque';
    loadGoogleFont(fontHeading);
    loadGoogleFont(fontBody);
    document.documentElement.style.setProperty('--font-heading', `'${fontHeading}', sans-serif`);
    document.documentElement.style.setProperty('--font-body', `'${fontBody}', sans-serif`);

    // Colors
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--color-accent', settings.accentColor);
    }
    if (settings.backgroundColor) {
      document.documentElement.style.setProperty('--color-bg', settings.backgroundColor);
    }
    if (settings.textColor) {
      document.documentElement.style.setProperty('--color-text-title', settings.textColor);
    }

    // Site Logo / Name
    const logoEl = document.getElementById('siteLogo');
    if (logoEl && settings.siteName) {
      logoEl.textContent = settings.siteName;
    }

    // Default Page Title & Meta
    if (settings.seo && settings.seo.metaTitle) {
      document.title = settings.seo.metaTitle;
    }

    // Dynamic Header Navigation Links
    const navContainer = document.getElementById('siteNavLinks');
    if (navContainer) {
      let navItems = settings.navLinks;
      if (!Array.isArray(navItems) || navItems.length === 0) {
        const labels = settings.navLabels || {};
        navItems = [
          { id: 'projects', label: labels.projects || 'PROJECTS', url: '/', isExternal: false, visible: true },
          { id: 'about', label: labels.about || 'ABOUT ME', url: '/about', isExternal: false, visible: true },
          { id: 'contact', label: labels.contact || 'CONTACT', url: '/contact', isExternal: false, visible: true }
        ];
      }

      navContainer.innerHTML = navItems
        .filter(item => item.visible !== false && item.label)
        .map(item => {
          const isExt = item.isExternal || (item.url && (item.url.startsWith('http') || item.url.endsWith('.pdf')));
          const targetAttr = isExt ? 'target="_blank" rel="noopener noreferrer"' : '';
          const navAttr = isExt ? '' : 'data-nav';
          return `
            <li>
              <a href="${item.url || '#'}" class="nav-link" data-url="${item.url || ''}" ${targetAttr} ${navAttr}>
                ${item.label}
              </a>
            </li>
          `;
        }).join('');

      updateNavActiveState(appState.currentPath);
    }

    // Accent Color Override
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--color-accent', settings.accentColor);
    }

    // Social Links in Header
    const socialContainer = document.getElementById('socialLinks');
    if (socialContainer && Array.isArray(settings.socialLinks)) {
      let socialHtml = '';
      settings.socialLinks.forEach(item => {
        if (item.visible !== false && item.url) {
          const iconSvg = Icons[item.icon] || Icons.twitter;
          socialHtml += `
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="${item.name || 'Social Link'}" title="${item.name || ''}">
              ${iconSvg}
            </a>
          `;
        }
      });
      socialContainer.innerHTML = socialHtml;
    }
  }

  /**
   * Updates active state in header navigation
   */
  function updateNavActiveState(path) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href') || link.getAttribute('data-url');
      if (href === '/' && (path === '/' || path === '/projects' || path.startsWith('/project/'))) {
        link.classList.add('active');
      } else if (href && href !== '/' && !href.startsWith('http') && path === href) {
        link.classList.add('active');
      }
    });

    // Close mobile nav on route change
    if (siteNav) {
      siteNav.classList.remove('open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * SPA Route Handler with smooth fade transitions
   */
  async function handleRoute(path, pushState = true) {
    if (pushState) {
      window.history.pushState({}, '', path);
    }
    appState.currentPath = path;
    updateNavActiveState(path);

    // Refresh settings so branding and accent color are always fresh
    await fetchSettings();

    // Fade out main view
    appContainer.classList.add('fade-out');

    // Slight delay for fade transition
    await new Promise(resolve => setTimeout(resolve, 180));
    window.scrollTo(0, 0);

    // Match route
    if (path === '/' || path === '/projects') {
      document.title = (appState.settings?.siteName || 'Thomas Moeller') + ' — Projects';
      await window.HomeView.render(appContainer, appState);
    } else if (path.startsWith('/project/')) {
      const slug = path.replace('/project/', '').split('?')[0].split('#')[0];
      await window.ProjectView.render(appContainer, appState, { slug });
    } else if (path === '/about') {
      await window.AboutView.render(appContainer, appState);
    } else if (path === '/contact') {
      await window.ContactView.render(appContainer, appState);
    } else {
      // 404 Fallback
      appContainer.innerHTML = `
        <div style="padding: 100px 20px; text-align: center;">
          <h1 style="font-family: var(--font-heading); font-size: 36px; margin-bottom: 16px;">Page Not Found</h1>
          <p style="color: #888; margin-bottom: 24px;">The page you requested could not be found.</p>
          <a href="/" data-nav style="color: #111; text-decoration: underline;">Return to Home</a>
        </div>
      `;
    }

    // Fade in
    appContainer.classList.remove('fade-out');
  }

  /**
   * Sets up link interception and popstate events
   */
  function setupNavigationEvents() {
    // Intercept clicks on links
    document.addEventListener('click', e => {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Check if external or anchor or special protocol
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        href.startsWith('/uploads/') ||
        href.endsWith('.pdf') ||
        anchor.getAttribute('target') === '_blank'
      ) {
        return;
      }

      // If it's an internal route
      e.preventDefault();
      handleRoute(href, true);
    });

    // History popstate listener
    window.addEventListener('popstate', () => {
      handleRoute(window.location.pathname, false);
    });

    // Mobile menu toggle
    if (menuToggle && siteNav) {
      menuToggle.addEventListener('click', () => {
        const isOpen = siteNav.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }
  }

  /**
   * Floating back to top visibility handler
   */
  function setupScrollListeners() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 300) {
            floatingTopBtn?.classList.add('visible');
          } else {
            floatingTopBtn?.classList.remove('visible');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    if (floatingTopBtn) {
      floatingTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // Start app
  document.addEventListener('DOMContentLoaded', initApp);
})();
