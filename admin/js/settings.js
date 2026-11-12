// Admin Site Settings Controller
const AdminSettings = {
  settings: null,
  loadedPreviewFonts: new Set(['Bricolage Grotesque', 'Bitter', 'Source Sans 3']),

  init() {
    this.setupEvents();
  },

  setupEvents() {
    // Color synchronization helper
    const syncColor = (pickerId, hexId) => {
      const picker = document.getElementById(pickerId);
      const hex = document.getElementById(hexId);
      picker?.addEventListener('input', (e) => {
        hex.value = e.target.value;
        this.updateLivePreview();
      });
      hex?.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
          picker.value = e.target.value;
          this.updateLivePreview();
        }
      });
    };

    syncColor('settingAccentColor', 'settingAccentColorHex');
    syncColor('settingBgColor', 'settingBgColorHex');
    syncColor('settingTextColor', 'settingTextColorHex');

    // Preset color chips
    document.querySelectorAll('.color-preset-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const hexVal = btn.getAttribute('data-hex');
        const picker = document.getElementById(targetId);
        const hex = document.getElementById(targetId + 'Hex');
        if (picker && hex && hexVal) {
          picker.value = hexVal;
          hex.value = hexVal;
          this.updateLivePreview();
        }
      });
    });

    // Font selects & custom input toggles
    const setupFontSelect = (selectId, customInputId) => {
      const select = document.getElementById(selectId);
      const customInput = document.getElementById(customInputId);
      select?.addEventListener('change', () => {
        if (select.value === '__custom__') {
          customInput.style.display = 'block';
          customInput.focus();
        } else {
          customInput.style.display = 'none';
        }
        this.updateLivePreview();
      });
      customInput?.addEventListener('input', () => {
        this.updateLivePreview();
      });
    };

    setupFontSelect('settingFontHeading', 'settingFontHeadingCustom');
    setupFontSelect('settingFontBody', 'settingFontBodyCustom');

    // Social links
    document.getElementById('addCustomSocialBtn')?.addEventListener('click', () => {
      this.addSocialRow({ id: 'custom_' + Date.now(), name: 'Custom Link', url: '', icon: 'twitter', visible: true });
    });

    // Navigation links
    document.getElementById('addNavLinkBtn')?.addEventListener('click', () => {
      this.addNavLinkRow({ id: 'nav_' + Date.now(), label: '', url: '', isExternal: false, visible: true });
    });

    document.getElementById('addCvLinkBtn')?.addEventListener('click', () => {
      this.addNavLinkRow({ id: 'nav_cv', label: 'CV', url: 'https://drive.google.com/file/d/1PoWmevqumr3x-EKZphgGT5j6aZaCZYdD/view', isExternal: true, visible: true });
    });

    // Project page default social links
    document.getElementById('settingShowProjectSocial')?.addEventListener('change', (e) => {
      const label = document.getElementById('settingShowProjectSocialLabel');
      const container = document.getElementById('defaultProjectSocialLinksManager');
      if (label) {
        label.textContent = e.target.checked ? 'Show social icons on project pages by default' : 'Social icons disabled on project pages by default';
      }
      if (container) {
        container.style.opacity = e.target.checked ? '1' : '0.4';
        container.style.pointerEvents = e.target.checked ? 'auto' : 'none';
      }
    });

    document.getElementById('addDefaultProjectSocialBtn')?.addEventListener('click', () => {
      this.addProjectSocialRow({ id: 'proj_social_' + Date.now(), name: 'Custom Link', icon: 'link', url: '', visible: true });
    });

    document.getElementById('resetDefaultProjectSocialBtn')?.addEventListener('click', () => {
      if (confirm('Reset default project social links to standard share buttons?')) {
        this.renderDefaultProjectSocialLinks(this.getDefaultProjectSocialLinks(), true);
      }
    });

    // Save button
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
      this.save();
    });
  },

  getEffectiveFont(selectId, customInputId, defaultFont = 'Bricolage Grotesque') {
    const select = document.getElementById(selectId);
    const custom = document.getElementById(customInputId);
    if (!select) return defaultFont;
    if (select.value === '__custom__') {
      return (custom?.value.trim()) || defaultFont;
    }
    return select.value || defaultFont;
  },

  loadFontIntoPage(fontName) {
    if (!fontName || this.loadedPreviewFonts.has(fontName)) return;
    this.loadedPreviewFonts.add(fontName);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName.trim().replace(/\s+/g, '+'))}:wght@400;600;700;800&display=swap`;
    document.head.appendChild(link);
  },

  updateLivePreview() {
    const headingFont = this.getEffectiveFont('settingFontHeading', 'settingFontHeadingCustom', 'Bricolage Grotesque');
    const bodyFont = this.getEffectiveFont('settingFontBody', 'settingFontBodyCustom', 'Bricolage Grotesque');
    const accent = document.getElementById('settingAccentColor')?.value || '#9900ff';
    const bg = document.getElementById('settingBgColor')?.value || '#ffffff';
    const text = document.getElementById('settingTextColor')?.value || '#111111';

    this.loadFontIntoPage(headingFont);
    this.loadFontIntoPage(bodyFont);

    const previewBox = document.getElementById('themePreviewBox');
    const previewHeading = document.getElementById('previewHeading');
    const previewBody = document.getElementById('previewBody');
    const previewBtn = document.getElementById('previewAccentBtn');

    if (previewBox) {
      previewBox.style.backgroundColor = bg;
      previewBox.style.color = text;
    }
    if (previewHeading) {
      previewHeading.style.fontFamily = `'${headingFont}', sans-serif`;
      previewHeading.textContent = `${headingFont} Heading`;
      previewHeading.style.color = text;
    }
    if (previewBody) {
      previewBody.style.fontFamily = `'${bodyFont}', sans-serif`;
      previewBody.textContent = `This live preview demonstrates your body text rendered in ${bodyFont} over the ${bg} background.`;
      previewBody.style.color = text;
    }
    if (previewBtn) {
      previewBtn.style.backgroundColor = accent;
    }
  },

  async load() {
    try {
      const res = await Admin.apiFetch('/admin/api/settings');
      const data = await res.json();
      this.settings = data.settings || {};

      document.getElementById('settingSiteName').value = this.settings.siteName || 'DANIEL OLUSANYA';

      // Colors
      const accent = this.settings.accentColor || '#9900ff';
      document.getElementById('settingAccentColor').value = accent;
      document.getElementById('settingAccentColorHex').value = accent;

      const bg = this.settings.backgroundColor || '#ffffff';
      document.getElementById('settingBgColor').value = bg;
      document.getElementById('settingBgColorHex').value = bg;

      const text = this.settings.textColor || '#111111';
      document.getElementById('settingTextColor').value = text;
      document.getElementById('settingTextColorHex').value = text;

      // Fonts
      const setFontValue = (selectId, customId, val, defaultVal) => {
        const select = document.getElementById(selectId);
        const custom = document.getElementById(customId);
        const target = val || defaultVal;
        const exists = Array.from(select.options).some(o => o.value === target);
        if (exists) {
          select.value = target;
          custom.style.display = 'none';
        } else {
          select.value = '__custom__';
          custom.value = target;
          custom.style.display = 'block';
        }
      };

      setFontValue('settingFontHeading', 'settingFontHeadingCustom', this.settings.fontHeading, 'Bricolage Grotesque');
      setFontValue('settingFontBody', 'settingFontBodyCustom', this.settings.fontBody, 'Bricolage Grotesque');

      // Update Preview
      this.updateLivePreview();

      // Navigation links
      this.renderNavLinks(this.settings.navLinks);

      // Footer
      document.getElementById('settingFooterText').value = this.settings.footerText || 'Powered by Olusanya Daniel';

      // SEO
      const seo = this.settings.seo || {};
      document.getElementById('settingMetaTitle').value = seo.metaTitle || '';
      document.getElementById('settingMetaDesc').value = seo.metaDescription || '';

      // Social links (Header)
      const container = document.getElementById('socialLinksManager');
      container.innerHTML = '';
      (this.settings.socialLinks || []).forEach(item => this.addSocialRow(item));

      // Project Page Default Social Links
      const showProjSocial = this.settings.showProjectSocialLinks !== false;
      const projSocial = Array.isArray(this.settings.projectSocialLinks) ? this.settings.projectSocialLinks : this.getDefaultProjectSocialLinks();
      this.renderDefaultProjectSocialLinks(projSocial, showProjSocial);
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  getDefaultProjectSocialLinks() {
    return [
      { id: 'pinterest', name: 'Pinterest', icon: 'pinterest', url: 'https://pinterest.com/pin/create/button/?url={url}&description={title}', visible: true },
      { id: 'twitter', name: 'Twitter / X', icon: 'twitter', url: 'https://twitter.com/intent/tweet?url={url}&text={title}', visible: true },
      { id: 'facebook', name: 'Facebook', icon: 'facebook', url: 'https://www.facebook.com/sharer/sharer.php?u={url}', visible: true },
      { id: 'tumblr', name: 'Tumblr', icon: 'tumblr', url: 'https://www.tumblr.com/widgets/share/tool?canonicalUrl={url}&title={title}', visible: true }
    ];
  },

  renderDefaultProjectSocialLinks(links, show = true) {
    const showToggle = document.getElementById('settingShowProjectSocial');
    const showLabel = document.getElementById('settingShowProjectSocialLabel');
    const container = document.getElementById('defaultProjectSocialLinksManager');

    if (showToggle) {
      showToggle.checked = show !== false;
      if (showLabel) {
        showLabel.textContent = show !== false ? 'Show social icons on project pages by default' : 'Social icons disabled on project pages by default';
      }
    }
    if (container) {
      container.style.opacity = show !== false ? '1' : '0.4';
      container.style.pointerEvents = show !== false ? 'auto' : 'none';
      container.innerHTML = '';
    }

    const items = (Array.isArray(links) && links.length > 0) ? links : this.getDefaultProjectSocialLinks();
    items.forEach(item => this.addProjectSocialRow(item));
  },

  addProjectSocialRow(item = {}) {
    const container = document.getElementById('defaultProjectSocialLinksManager');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'proj-social-item-row';

    const platforms = [
      { id: 'pinterest', name: 'Pinterest', defaultUrl: 'https://pinterest.com/pin/create/button/?url={url}&description={title}' },
      { id: 'twitter', name: 'Twitter / X', defaultUrl: 'https://twitter.com/intent/tweet?url={url}&text={title}' },
      { id: 'facebook', name: 'Facebook', defaultUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}' },
      { id: 'tumblr', name: 'Tumblr', defaultUrl: 'https://www.tumblr.com/widgets/share/tool?canonicalUrl={url}&title={title}' },
      { id: 'linkedin', name: 'LinkedIn', defaultUrl: 'https://www.linkedin.com/sharing/share-offsite/?url={url}' },
      { id: 'instagram', name: 'Instagram', defaultUrl: 'https://instagram.com/' },
      { id: 'whatsapp', name: 'WhatsApp', defaultUrl: 'https://api.whatsapp.com/send?text={title}%20{url}' },
      { id: 'threads', name: 'Threads', defaultUrl: 'https://threads.net/' },
      { id: 'reddit', name: 'Reddit', defaultUrl: 'https://reddit.com/submit?url={url}&title={title}' },
      { id: 'youtube', name: 'YouTube', defaultUrl: 'https://youtube.com/' },
      { id: 'behance', name: 'Behance', defaultUrl: 'https://behance.net/' },
      { id: 'dribbble', name: 'Dribbble', defaultUrl: 'https://dribbble.com/' },
      { id: 'github', name: 'GitHub', defaultUrl: 'https://github.com/' },
      { id: 'mail', name: 'Email', defaultUrl: 'mailto:?subject={title}&body={url}' },
      { id: 'link', name: 'Custom Link', defaultUrl: '' }
    ];

    const currentIcon = item.icon || 'link';
    const currentName = item.name || 'Social Link';
    const currentUrl = item.url || '';
    const isVisible = item.visible !== false;

    const escapeAttr = (s) => String(s || '').replace(/"/g, '&quot;');
    const selectOptions = platforms.map(p => 
      `<option value="${p.id}" ${p.id === currentIcon ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    const iconSvg = (typeof Icons !== 'undefined' && Icons[currentIcon]) ? Icons[currentIcon] : '';

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span class="proj-social-icon-preview">${iconSvg}</span>
        <select class="form-control proj-social-icon" style="font-size: 12px; padding: 4px 6px;">
          ${selectOptions}
        </select>
      </div>
      <input type="text" class="form-control proj-social-name" value="${escapeAttr(currentName)}" placeholder="Platform name" style="font-size: 12px;">
      <input type="text" class="form-control proj-social-url" value="${escapeAttr(currentUrl)}" placeholder="Share or profile URL ({url}, {title})" style="font-size: 12px;">
      <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; white-space: nowrap;">
        <input type="checkbox" class="proj-social-visible" ${isVisible ? 'checked' : ''}>
        Visible
      </label>
      <button type="button" class="btn btn-danger btn-sm remove-proj-social-btn" title="Remove" style="padding: 2px 8px; font-size: 11px;">✕</button>
    `;

    const iconSelect = row.querySelector('.proj-social-icon');
    const nameInput = row.querySelector('.proj-social-name');
    const urlInput = row.querySelector('.proj-social-url');
    const iconPreview = row.querySelector('.proj-social-icon-preview');

    iconSelect?.addEventListener('change', () => {
      const val = iconSelect.value;
      const found = platforms.find(p => p.id === val);
      if (found) {
        if (!nameInput.value || platforms.some(p => p.name === nameInput.value)) {
          nameInput.value = found.name;
        }
        if (!urlInput.value || platforms.some(p => p.defaultUrl === urlInput.value)) {
          urlInput.value = found.defaultUrl;
        }
      }
      if (typeof Icons !== 'undefined' && Icons[val]) {
        iconPreview.innerHTML = Icons[val];
      }
    });

    row.querySelector('.remove-proj-social-btn')?.addEventListener('click', () => row.remove());
    container.appendChild(row);
  },

  renderNavLinks(links) {
    const container = document.getElementById('navLinksManager');
    if (!container) return;
    container.innerHTML = '';
    const items = (Array.isArray(links) && links.length > 0) ? links : [
      { id: 'nav_projects', label: 'PROJECTS', url: '/', isExternal: false, visible: true },
      { id: 'nav_about', label: 'ABOUT ME', url: '/about', isExternal: false, visible: true },
      { id: 'nav_contact', label: 'CONTACT', url: '/contact', isExternal: false, visible: true },
      { id: 'nav_cv', label: 'CV', url: 'https://drive.google.com/file/d/1PoWmevqumr3x-EKZphgGT5j6aZaCZYdD/view', isExternal: true, visible: true }
    ];
    items.forEach(link => this.addNavLinkRow(link));
  },

  addNavLinkRow(link = {}) {
    const container = document.getElementById('navLinksManager');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'nav-link-row mb-2';

    const escapeAttr = (s) => String(s || '').replace(/"/g, '&quot;');

    row.innerHTML = `
      <input type="text" class="form-control nav-item-label" value="${escapeAttr(link.label || '')}" placeholder="Label (e.g. CV)">
      <input type="text" class="form-control nav-item-url" value="${escapeAttr(link.url || '')}" placeholder="URL (e.g. /about or /uploads/cv.pdf)">
      <input type="file" class="nav-file-input" accept=".pdf,.doc,.docx,application/pdf" style="display:none;">
      <button type="button" class="btn btn-secondary btn-sm upload-nav-file-btn" title="Upload CV or document (PDF)">Upload File</button>
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; white-space: nowrap;">
        <input type="checkbox" class="nav-item-target" ${link.isExternal ? 'checked' : ''}>
        New Tab
      </label>
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; white-space: nowrap;">
        <input type="checkbox" class="nav-item-visible" ${link.visible !== false ? 'checked' : ''}>
        Visible
      </label>
      <button type="button" class="btn btn-danger btn-sm remove-nav-btn" title="Remove link">✕</button>
    `;

    const fileInput = row.querySelector('.nav-file-input');
    const uploadBtn = row.querySelector('.upload-nav-file-btn');
    const urlInput = row.querySelector('.nav-item-url');
    const labelInput = row.querySelector('.nav-item-label');
    const targetCheckbox = row.querySelector('.nav-item-target');

    uploadBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('images', file);

      try {
        Admin.toast('Uploading file...', 'info', 1500);
        const res = await Admin.apiFetch('/admin/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        urlInput.value = data.url || data.files?.[0]?.url || '';
        targetCheckbox.checked = true;
        if (!labelInput.value.trim()) {
          labelInput.value = 'CV';
        }
        Admin.toast('File uploaded and linked successfully!', 'success');
      } catch (err) {
        Admin.toast(err.message, 'error');
      } finally {
        fileInput.value = '';
      }
    });

    row.querySelector('.remove-nav-btn')?.addEventListener('click', () => {
      row.remove();
    });

    container.appendChild(row);
  },

  addSocialRow(item) {
    const container = document.getElementById('socialLinksManager');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'social-item-row mb-2';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '140px 1fr 100px 36px';
    row.style.gap = '8px';
    row.style.alignItems = 'center';

    row.innerHTML = `
      <input type="text" class="form-control social-name" value="${item.name || ''}" placeholder="Platform">
      <input type="text" class="form-control social-url" value="${item.url || ''}" placeholder="https://...">
      <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
        <input type="checkbox" class="social-visible" ${item.visible !== false ? 'checked' : ''}>
        Visible
      </label>
      <button type="button" class="btn btn-danger btn-sm remove-social-btn" title="Remove">✕</button>
    `;

    row.querySelector('.remove-social-btn')?.addEventListener('click', () => row.remove());
    container.appendChild(row);
  },

  async save() {
    const siteName = document.getElementById('settingSiteName').value.trim();
    const accentColor = document.getElementById('settingAccentColor').value;
    const backgroundColor = document.getElementById('settingBgColor').value;
    const textColor = document.getElementById('settingTextColor').value;

    const fontHeading = this.getEffectiveFont('settingFontHeading', 'settingFontHeadingCustom', 'Bricolage Grotesque');
    const fontBody = this.getEffectiveFont('settingFontBody', 'settingFontBodyCustom', 'Bricolage Grotesque');

    const navLinks = Array.from(document.querySelectorAll('#navLinksManager .nav-link-row')).map((row, idx) => {
      const label = row.querySelector('.nav-item-label')?.value.trim() || '';
      const url = row.querySelector('.nav-item-url')?.value.trim() || '';
      const isExternal = !!row.querySelector('.nav-item-target')?.checked;
      const visible = !!row.querySelector('.nav-item-visible')?.checked;
      return {
        id: 'nav_' + (label.toLowerCase().replace(/[^a-z0-9]/g, '_') || idx),
        label,
        url,
        isExternal,
        visible
      };
    }).filter(l => l.label && l.url);

    const navLabels = {
      projects: navLinks.find(l => l.url === '/' || l.id === 'nav_projects')?.label || 'PROJECTS',
      about: navLinks.find(l => l.url === '/about' || l.id === 'nav_about')?.label || 'ABOUT ME',
      contact: navLinks.find(l => l.url === '/contact' || l.id === 'nav_contact')?.label || 'CONTACT'
    };
    const footerText = document.getElementById('settingFooterText').value.trim();
    const seo = {
      metaTitle: document.getElementById('settingMetaTitle').value.trim(),
      metaDescription: document.getElementById('settingMetaDesc').value.trim()
    };

    const socialLinks = Array.from(document.querySelectorAll('#socialLinksManager .social-item-row')).map(row => {
      const name = row.querySelector('.social-name').value.trim();
      const url = row.querySelector('.social-url').value.trim();
      const visible = row.querySelector('.social-visible').checked;
      const lower = name.toLowerCase();
      let icon = 'twitter';
      if (lower.includes('behance')) icon = 'behance';
      else if (lower.includes('linkedin')) icon = 'linkedin';
      else if (lower.includes('dribbble')) icon = 'dribbble';
      else if (lower.includes('facebook')) icon = 'facebook';
      else if (lower.includes('pinterest')) icon = 'pinterest';
      else if (lower.includes('tumblr')) icon = 'tumblr';

      return { id: name.toLowerCase().replace(/\s+/g, '_'), name, url, icon, visible };
    }).filter(s => s.name && s.url);

    const showProjectSocialLinks = !!document.getElementById('settingShowProjectSocial')?.checked;
    const projectSocialLinks = Array.from(document.querySelectorAll('#defaultProjectSocialLinksManager .proj-social-item-row')).map((row, idx) => {
      const icon = row.querySelector('.proj-social-icon')?.value || 'link';
      const name = row.querySelector('.proj-social-name')?.value.trim() || '';
      const url = row.querySelector('.proj-social-url')?.value.trim() || '';
      const visible = !!row.querySelector('.proj-social-visible')?.checked;
      return { id: 'default_share_' + icon + '_' + idx, name, icon, url, visible };
    }).filter(s => s.name && s.url);

    try {
      Admin.toast('Saving settings...', 'info', 1500);
      const res = await Admin.apiFetch('/admin/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName,
          accentColor,
          backgroundColor,
          textColor,
          fontHeading,
          fontBody,
          navLabels,
          navLinks,
          footerText,
          seo,
          socialLinks,
          showProjectSocialLinks,
          projectSocialLinks
        })
      });

      if (!res.ok) throw new Error('Failed to update settings');
      Admin.toast('Settings saved successfully', 'success');
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  }
};
