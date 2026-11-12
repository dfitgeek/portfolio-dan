// Admin Project Editor & Content Builder Controller
const AdminBuilder = {
  currentProjectId: null,
  blocks: [],
  isDirty: false,

  init() {
    this.setupEvents();
    this.setupUnsavedWarning();
  },

  setupEvents() {
    // Back button
    document.getElementById('backToProjectsBtn')?.addEventListener('click', () => {
      if (this.isDirty) {
        if (!confirm('You have unsaved changes. Discard and return to projects?')) return;
      }
      this.isDirty = false;
      Admin.switchTab('projects');
    });

    // Auto slug generator on title input (only for new projects)
    document.getElementById('projTitle')?.addEventListener('input', (e) => {
      this.isDirty = true;
      if (!this.currentProjectId) {
        const slugInput = document.getElementById('projSlug');
        slugInput.value = e.target.value
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '');
      }
    });

    // Form inputs dirty state
    ['projSlug', 'projYear', 'projDesc', 'projHoverColor', 'projSeoTitle', 'projSeoDesc'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => { this.isDirty = true; });
    });

    // Published toggle label
    document.getElementById('projPublished')?.addEventListener('change', (e) => {
      this.isDirty = true;
      document.getElementById('projPublishedLabel').textContent = e.target.checked ? 'Published' : 'Draft';
    });

    // Color swatch & hex synchronization
    const colorPicker = document.getElementById('projHoverColor');
    const colorHex = document.getElementById('projHoverColorHex');
    colorPicker?.addEventListener('input', (e) => {
      colorHex.value = e.target.value;
      this.isDirty = true;
    });
    colorHex?.addEventListener('input', (e) => {
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        colorPicker.value = e.target.value;
        this.isDirty = true;
      }
    });

    // Thumbnail upload & remove
    const thumbFileInput = document.getElementById('thumbFileInput');
    document.getElementById('uploadThumbBtn')?.addEventListener('click', () => {
      thumbFileInput?.click();
    });

    thumbFileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await this.uploadThumbnail(file);
    });

    document.getElementById('removeThumbBtn')?.addEventListener('click', () => {
      this.setThumbnail('');
      this.isDirty = true;
    });

    // Add block menu toggle
    const addBlockBtn = document.getElementById('addBlockMenuBtn');
    const addBlockMenu = document.getElementById('addBlockDropdown');
    addBlockBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      addBlockMenu?.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      addBlockMenu?.classList.remove('show');
    });

    // Add block items
    addBlockMenu?.querySelectorAll('.dropdown-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = btn.getAttribute('data-type');
        this.addBlock(type);
        addBlockMenu.classList.remove('show');
      });
    });

    // Quick dropzone for multi-image upload
    const quickDropzone = document.getElementById('builderQuickDropzone');
    const quickDropInput = document.getElementById('quickDropInput');

    quickDropzone?.addEventListener('click', () => quickDropInput?.click());

    quickDropInput?.addEventListener('change', (e) => {
      if (e.target.files?.length) {
        this.handleMultiImageUpload(Array.from(e.target.files));
      }
    });

    quickDropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      quickDropzone.classList.add('dragover');
    });

    quickDropzone?.addEventListener('dragleave', () => {
      quickDropzone.classList.remove('dragover');
    });

    quickDropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      quickDropzone.classList.remove('dragover');
      if (e.dataTransfer.files?.length) {
        this.handleMultiImageUpload(Array.from(e.dataTransfer.files));
      }
    });

    // Save buttons
    document.getElementById('saveProjectBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.save(false);
    });

    document.getElementById('saveAndViewProjectBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.save(true);
    });

    // Project Social Media Links
    document.getElementById('projShowSocial')?.addEventListener('change', (e) => {
      this.isDirty = true;
      const label = document.getElementById('projShowSocialLabel');
      const container = document.getElementById('projSocialContainer');
      if (label) {
        label.textContent = e.target.checked ? 'Show social icons on this project' : 'Social icons disabled (hidden)';
      }
      if (container) {
        container.style.opacity = e.target.checked ? '1' : '0.4';
        container.style.pointerEvents = e.target.checked ? 'auto' : 'none';
      }
    });

    document.getElementById('projAddSocialBtn')?.addEventListener('click', () => {
      this.isDirty = true;
      this.addProjectSocialRow({ id: 'social_' + Date.now(), name: 'Custom Link', icon: 'link', url: '', visible: true });
    });

    document.getElementById('projResetSocialBtn')?.addEventListener('click', () => {
      if (confirm('Reset social icons for this project to standard share defaults?')) {
        this.isDirty = true;
        this.renderProjectSocialLinks(this.getDefaultSocialLinks(), true);
      }
    });
  },

  setupUnsavedWarning() {
    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  },

  openNew() {
    this.currentProjectId = null;
    this.blocks = [];
    this.isDirty = false;

    document.getElementById('editorTitle').textContent = 'Add New Project';
    document.getElementById('projTitle').value = '';
    document.getElementById('projSlug').value = '';
    document.getElementById('projYear').value = new Date().getFullYear();
    document.getElementById('projDesc').value = '';
    document.getElementById('projPublished').checked = true;
    document.getElementById('projPublishedLabel').textContent = 'Published';
    document.getElementById('projHoverColor').value = '#7ec8b8';
    document.getElementById('projHoverColorHex').value = '#7ec8b8';
    document.getElementById('projSeoTitle').value = '';
    document.getElementById('projSeoDesc').value = '';

    this.setThumbnail('');
    this.renderBlocks();
    this.renderProjectSocialLinks(this.getDefaultSocialLinks(), true);

    this.showEditorPane();
  },

  async openEdit(projectId) {
    try {
      const res = await Admin.apiFetch(`/admin/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to load project details');
      const data = await res.json();
      const p = data.project;

      this.currentProjectId = p.id;
      this.blocks = Array.isArray(p.blocks) ? JSON.parse(JSON.stringify(p.blocks)) : [];
      this.isDirty = false;

      document.getElementById('editorTitle').textContent = `Edit Project — ${p.title}`;
      document.getElementById('projTitle').value = p.title || '';
      document.getElementById('projSlug').value = p.slug || '';
      document.getElementById('projYear').value = p.year || '';
      document.getElementById('projDesc').value = p.shortDescription || '';
      document.getElementById('projPublished').checked = p.published !== false;
      document.getElementById('projPublishedLabel').textContent = p.published !== false ? 'Published' : 'Draft';
      
      const hoverColor = p.hoverOverlayColor || '#7ec8b8';
      document.getElementById('projHoverColor').value = hoverColor;
      document.getElementById('projHoverColorHex').value = hoverColor;

      document.getElementById('projSeoTitle').value = p.seo?.metaTitle || '';
      document.getElementById('projSeoDesc').value = p.seo?.metaDescription || '';

      this.setThumbnail(p.thumbnailUrl || '');
      this.renderBlocks();

      const showSocial = p.showSocialLinks !== false;
      const socialLinks = Array.isArray(p.socialLinks) ? p.socialLinks : this.getDefaultSocialLinks();
      this.renderProjectSocialLinks(socialLinks, showSocial);

      this.showEditorPane();
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  showEditorPane() {
    document.querySelectorAll('.admin-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('pane-project-editor')?.classList.add('active');
  },

  getDefaultSocialLinks() {
    return [
      { id: 'pinterest', name: 'Pinterest', icon: 'pinterest', url: 'https://pinterest.com/pin/create/button/?url={url}&description={title}', visible: true },
      { id: 'twitter', name: 'Twitter / X', icon: 'twitter', url: 'https://twitter.com/intent/tweet?url={url}&text={title}', visible: true },
      { id: 'facebook', name: 'Facebook', icon: 'facebook', url: 'https://www.facebook.com/sharer/sharer.php?u={url}', visible: true },
      { id: 'tumblr', name: 'Tumblr', icon: 'tumblr', url: 'https://www.tumblr.com/widgets/share/tool?canonicalUrl={url}&title={title}', visible: true }
    ];
  },

  getAvailablePlatforms() {
    return [
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
  },

  renderProjectSocialLinks(links, show = true) {
    const showToggle = document.getElementById('projShowSocial');
    const showLabel = document.getElementById('projShowSocialLabel');
    const container = document.getElementById('projSocialContainer');
    const list = document.getElementById('projSocialList');

    if (showToggle) {
      showToggle.checked = show !== false;
      if (showLabel) {
        showLabel.textContent = show !== false ? 'Show social icons on this project' : 'Social icons disabled (hidden)';
      }
    }
    if (container) {
      container.style.opacity = show !== false ? '1' : '0.4';
      container.style.pointerEvents = show !== false ? 'auto' : 'none';
    }

    if (!list) return;
    list.innerHTML = '';

    const items = (Array.isArray(links) && links.length > 0) ? links : this.getDefaultSocialLinks();
    items.forEach(item => this.addProjectSocialRow(item));
  },

  addProjectSocialRow(item = {}) {
    const list = document.getElementById('projSocialList');
    if (!list) return;

    const row = document.createElement('div');
    row.className = 'proj-social-item-row';

    const platforms = this.getAvailablePlatforms();
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
      <button type="button" class="btn btn-danger btn-sm remove-proj-social-btn" title="Remove icon" style="padding: 2px 8px; font-size: 11px;">✕</button>
    `;

    const iconSelect = row.querySelector('.proj-social-icon');
    const nameInput = row.querySelector('.proj-social-name');
    const urlInput = row.querySelector('.proj-social-url');
    const iconPreview = row.querySelector('.proj-social-icon-preview');

    iconSelect?.addEventListener('change', () => {
      this.isDirty = true;
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

    row.querySelector('.proj-social-name')?.addEventListener('input', () => { this.isDirty = true; });
    row.querySelector('.proj-social-url')?.addEventListener('input', () => { this.isDirty = true; });
    row.querySelector('.proj-social-visible')?.addEventListener('change', () => { this.isDirty = true; });

    row.querySelector('.remove-proj-social-btn')?.addEventListener('click', () => {
      this.isDirty = true;
      row.remove();
    });

    list.appendChild(row);
  },

  setThumbnail(url) {
    const previewBox = document.getElementById('thumbPreviewBox');
    const previewImg = document.getElementById('thumbPreviewImg');
    const placeholder = previewBox.querySelector('.thumb-placeholder');
    const hiddenInput = document.getElementById('projThumbUrl');
    const removeBtn = document.getElementById('removeThumbBtn');

    hiddenInput.value = url;
    if (url) {
      previewImg.src = url;
      previewImg.style.display = 'block';
      placeholder.style.display = 'none';
      removeBtn.style.display = 'inline-flex';
    } else {
      previewImg.src = '';
      previewImg.style.display = 'none';
      placeholder.style.display = 'block';
      removeBtn.style.display = 'none';
    }
  },

  async uploadThumbnail(file) {
    const formData = new FormData();
    formData.append('images', file);

    try {
      Admin.toast('Uploading thumbnail...', 'info', 1500);
      const res = await Admin.apiFetch('/admin/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      this.setThumbnail(data.url);
      this.isDirty = true;
      Admin.toast('Thumbnail uploaded', 'success');
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  async handleMultiImageUpload(files) {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));

    try {
      Admin.toast(`Uploading ${files.length} images...`, 'info', 2000);
      const res = await Admin.apiFetch('/admin/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Add each uploaded file as an image block
      data.files.forEach(f => {
        this.blocks.push({
          id: 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          type: 'image',
          url: f.url,
          alt: '',
          caption: ''
        });
      });

      this.isDirty = true;
      this.renderBlocks();
      Admin.toast(`Added ${data.files.length} image blocks`, 'success');
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  addBlock(type) {
    const id = 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    let newBlock = { id, type };

    if (type === 'image' || type === 'wide_image') {
      newBlock.url = '';
      newBlock.alt = '';
      newBlock.caption = '';
    } else if (type === 'two_image') {
      newBlock.images = [
        { url: '', alt: '', caption: '' },
        { url: '', alt: '', caption: '' }
      ];
    } else if (type === 'text') {
      newBlock.content = '<p>Write your project narrative or design process insights here...</p>';
    } else if (type === 'video') {
      newBlock.url = '';
      newBlock.caption = '';
    } else if (type === 'spacer') {
      newBlock.height = 40;
    }

    this.blocks.push(newBlock);
    this.isDirty = true;
    this.renderBlocks();

    // Scroll to new block
    const newEl = document.getElementById(`block-${id}`);
    newEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  deleteBlock(id) {
    this.blocks = this.blocks.filter(b => b.id !== id);
    this.isDirty = true;
    this.renderBlocks();
  },

  moveBlock(id, direction) {
    const index = this.blocks.findIndex(b => b.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = this.blocks[index];
      this.blocks[index] = this.blocks[index - 1];
      this.blocks[index - 1] = temp;
    } else if (direction === 'down' && index < this.blocks.length - 1) {
      const temp = this.blocks[index];
      this.blocks[index] = this.blocks[index + 1];
      this.blocks[index + 1] = temp;
    }

    this.isDirty = true;
    this.renderBlocks();
  },

  renderBlocks() {
    const container = document.getElementById('blocksContainer');
    if (!container) return;

    if (this.blocks.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 6px;">
          No content blocks added yet. Click "+ Add Block" or drag image files onto the dropzone above.
        </div>
      `;
      return;
    }

    container.innerHTML = this.blocks.map((block, idx) => {
      let bodyHtml = '';

      if (block.type === 'image' || block.type === 'wide_image') {
        bodyHtml = `
          <div class="grid grid-2 gap-3 mb-3">
            <div>
              <label class="form-label">Image Source</label>
              <div style="display: flex; gap: 8px;">
                <input type="text" class="form-control block-field" data-id="${block.id}" data-prop="url" value="${block.url || ''}" placeholder="/uploads/example.jpg">
                <button type="button" class="btn btn-secondary btn-sm block-upload-btn" data-id="${block.id}" data-prop="url">Upload</button>
              </div>
            </div>
            <div>
              <label class="form-label">Alt Text (Accessibility)</label>
              <input type="text" class="form-control block-field" data-id="${block.id}" data-prop="alt" value="${block.alt || ''}" placeholder="Image description">
            </div>
          </div>
          <div>
            <label class="form-label">Caption (Optional)</label>
            <input type="text" class="form-control block-field" data-id="${block.id}" data-prop="caption" value="${block.caption || ''}" placeholder="Caption displayed beneath image">
          </div>
          ${block.url ? `
            <div style="margin-top: 10px; max-height: 140px; overflow: hidden; border-radius: 4px; border: 1px solid #e2e8f0;">
              <img src="${block.url}" style="width: 100%; height: 140px; object-fit: cover;">
            </div>
          ` : ''}
        `;
      } else if (block.type === 'two_image') {
        const img1 = block.images?.[0] || {};
        const img2 = block.images?.[1] || {};
        bodyHtml = `
          <div class="grid grid-2 gap-4">
            <!-- Left Image -->
            <div style="border: 1px solid #f1f5f9; padding: 12px; border-radius: 4px;">
              <span class="font-semibold text-xs text-slate-500 mb-2 block">Left Image</span>
              <div style="display: flex; gap: 6px; margin-bottom: 8px;">
                <input type="text" class="form-control block-multi-field" data-id="${block.id}" data-img-idx="0" data-prop="url" value="${img1.url || ''}" placeholder="Image 1 URL">
                <button type="button" class="btn btn-secondary btn-sm block-two-upload-btn" data-id="${block.id}" data-img-idx="0">Upload</button>
              </div>
              <input type="text" class="form-control block-multi-field mb-2" data-id="${block.id}" data-img-idx="0" data-prop="alt" value="${img1.alt || ''}" placeholder="Alt text">
              <input type="text" class="form-control block-multi-field" data-id="${block.id}" data-img-idx="0" data-prop="caption" value="${img1.caption || ''}" placeholder="Caption">
              ${img1.url ? `<img src="${img1.url}" style="margin-top: 8px; width: 100%; height: 80px; object-fit: cover; border-radius: 4px;">` : ''}
            </div>
            <!-- Right Image -->
            <div style="border: 1px solid #f1f5f9; padding: 12px; border-radius: 4px;">
              <span class="font-semibold text-xs text-slate-500 mb-2 block">Right Image</span>
              <div style="display: flex; gap: 6px; margin-bottom: 8px;">
                <input type="text" class="form-control block-multi-field" data-id="${block.id}" data-img-idx="1" data-prop="url" value="${img2.url || ''}" placeholder="Image 2 URL">
                <button type="button" class="btn btn-secondary btn-sm block-two-upload-btn" data-id="${block.id}" data-img-idx="1">Upload</button>
              </div>
              <input type="text" class="form-control block-multi-field mb-2" data-id="${block.id}" data-img-idx="1" data-prop="alt" value="${img2.alt || ''}" placeholder="Alt text">
              <input type="text" class="form-control block-multi-field" data-id="${block.id}" data-img-idx="1" data-prop="caption" value="${img2.caption || ''}" placeholder="Caption">
              ${img2.url ? `<img src="${img2.url}" style="margin-top: 8px; width: 100%; height: 80px; object-fit: cover; border-radius: 4px;">` : ''}
            </div>
          </div>
        `;
      } else if (block.type === 'text') {
        bodyHtml = `
          <label class="form-label">Paragraph Content (HTML / Rich Text supported)</label>
          <textarea class="form-control block-field" data-id="${block.id}" data-prop="content" rows="4">${block.content || ''}</textarea>
        `;
      } else if (block.type === 'video') {
        bodyHtml = `
          <div class="mb-3">
            <label class="form-label">Video URL (YouTube, Vimeo, or MP4)</label>
            <input type="text" class="form-control block-field" data-id="${block.id}" data-prop="url" value="${block.url || ''}" placeholder="https://www.youtube.com/watch?v=... or /uploads/video.mp4">
          </div>
          <div>
            <label class="form-label">Caption (Optional)</label>
            <input type="text" class="form-control block-field" data-id="${block.id}" data-prop="caption" value="${block.caption || ''}" placeholder="Video caption">
          </div>
        `;
      } else if (block.type === 'spacer') {
        bodyHtml = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <label class="form-label" style="margin-bottom: 0;">Spacer Height (px):</label>
            <input type="number" class="form-control block-field" data-id="${block.id}" data-prop="height" value="${block.height || 40}" min="10" max="200" style="max-width: 100px;">
          </div>
        `;
      }

      const typeLabel = {
        image: 'Standard Image',
        wide_image: 'Full-Width (Wide) Image',
        two_image: 'Two-Image Row',
        text: 'Text Block',
        video: 'Video Embed',
        spacer: 'Spacer'
      }[block.type] || block.type;

      return `
        <div class="block-card" id="block-${block.id}">
          <div class="block-card-header">
            <div class="block-card-title">
              <span class="badge" style="background-color: #f1f5f9; color: #475569;">#${idx + 1}</span>
              ${typeLabel}
            </div>
            <div class="block-card-actions">
              <button type="button" class="block-action-btn move-up" data-id="${block.id}" title="Move Up" ${idx === 0 ? 'disabled' : ''}>↑</button>
              <button type="button" class="block-action-btn move-down" data-id="${block.id}" title="Move Down" ${idx === this.blocks.length - 1 ? 'disabled' : ''}>↓</button>
              <button type="button" class="block-action-btn delete" data-id="${block.id}" title="Delete Block">✕</button>
            </div>
          </div>
          <div class="block-card-body">
            ${bodyHtml}
          </div>
        </div>
      `;
    }).join('');

    this.attachBlockEvents();
  },

  attachBlockEvents() {
    const container = document.getElementById('blocksContainer');
    if (!container) return;

    // Move & Delete
    container.querySelectorAll('.block-action-btn.move-up').forEach(btn => {
      btn.addEventListener('click', () => this.moveBlock(btn.getAttribute('data-id'), 'up'));
    });

    container.querySelectorAll('.block-action-btn.move-down').forEach(btn => {
      btn.addEventListener('click', () => this.moveBlock(btn.getAttribute('data-id'), 'down'));
    });

    container.querySelectorAll('.block-action-btn.delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteBlock(btn.getAttribute('data-id')));
    });

    // Inputs update
    container.querySelectorAll('.block-field').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = input.getAttribute('data-id');
        const prop = input.getAttribute('data-prop');
        const block = this.blocks.find(b => b.id === id);
        if (block) {
          block[prop] = prop === 'height' ? parseInt(e.target.value, 10) || 40 : e.target.value;
          this.isDirty = true;
        }
      });
    });

    // Two-image sub-inputs
    container.querySelectorAll('.block-multi-field').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = input.getAttribute('data-id');
        const imgIdx = parseInt(input.getAttribute('data-img-idx'), 10);
        const prop = input.getAttribute('data-prop');
        const block = this.blocks.find(b => b.id === id);
        if (block && block.images && block.images[imgIdx]) {
          block.images[imgIdx][prop] = e.target.value;
          this.isDirty = true;
        }
      });
    });

    // Block file upload buttons
    container.querySelectorAll('.block-upload-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prop = btn.getAttribute('data-prop');
        this.triggerBlockUpload(fileUrl => {
          const block = this.blocks.find(b => b.id === id);
          if (block) {
            block[prop] = fileUrl;
            this.isDirty = true;
            this.renderBlocks();
          }
        });
      });
    });

    container.querySelectorAll('.block-two-upload-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const imgIdx = parseInt(btn.getAttribute('data-img-idx'), 10);
        this.triggerBlockUpload(fileUrl => {
          const block = this.blocks.find(b => b.id === id);
          if (block && block.images && block.images[imgIdx]) {
            block.images[imgIdx].url = fileUrl;
            this.isDirty = true;
            this.renderBlocks();
          }
        });
      });
    });
  },

  triggerBlockUpload(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('images', file);

      try {
        Admin.toast('Uploading image...', 'info', 1500);
        const res = await Admin.apiFetch('/admin/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        callback(data.url);
        Admin.toast('Image attached', 'success');
      } catch (err) {
        Admin.toast(err.message, 'error');
      } finally {
        input.remove();
      }
    });

    input.click();
  },

  harvestBlockValues() {
    const container = document.getElementById('blocksContainer');
    if (!container) return;

    container.querySelectorAll('.block-field').forEach(input => {
      const id = input.getAttribute('data-id');
      const prop = input.getAttribute('data-prop');
      const block = this.blocks.find(b => b.id === id);
      if (block) {
        block[prop] = prop === 'height' ? parseInt(input.value, 10) || 40 : input.value;
      }
    });

    container.querySelectorAll('.block-multi-field').forEach(input => {
      const id = input.getAttribute('data-id');
      const imgIdx = parseInt(input.getAttribute('data-img-idx'), 10);
      const prop = input.getAttribute('data-prop');
      const block = this.blocks.find(b => b.id === id);
      if (block && block.images && block.images[imgIdx]) {
        block.images[imgIdx][prop] = input.value;
      }
    });
  },

  async save(viewAfter = false) {
    this.harvestBlockValues();
    const title = document.getElementById('projTitle').value.trim();
    if (!title) {
      Admin.toast('Project title is required', 'error');
      document.getElementById('projTitle').focus();
      return;
    }

    const showSocialLinks = !!document.getElementById('projShowSocial')?.checked;
    const socialLinks = Array.from(document.querySelectorAll('#projSocialList .proj-social-item-row')).map((row, idx) => {
      const icon = row.querySelector('.proj-social-icon')?.value || 'link';
      const name = row.querySelector('.proj-social-name')?.value.trim() || '';
      const url = row.querySelector('.proj-social-url')?.value.trim() || '';
      const visible = !!row.querySelector('.proj-social-visible')?.checked;
      return {
        id: 'share_' + icon + '_' + idx,
        name,
        icon,
        url,
        visible
      };
    }).filter(s => s.name && s.url);

    const payload = {
      title,
      slug: document.getElementById('projSlug').value.trim(),
      year: document.getElementById('projYear').value.trim(),
      shortDescription: document.getElementById('projDesc').value.trim(),
      published: document.getElementById('projPublished').checked,
      thumbnailUrl: document.getElementById('projThumbUrl').value,
      hoverOverlayColor: document.getElementById('projHoverColor').value,
      showSocialLinks,
      socialLinks,
      seo: {
        metaTitle: document.getElementById('projSeoTitle').value.trim(),
        metaDescription: document.getElementById('projSeoDesc').value.trim()
      },
      blocks: this.blocks
    };

    const isNew = !this.currentProjectId;
    const url = isNew ? '/admin/api/projects' : `/admin/api/projects/${this.currentProjectId}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      Admin.toast('Saving project...', 'info', 1500);
      const res = await Admin.apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save project');

      this.isDirty = false;
      this.currentProjectId = data.project.id;
      Admin.toast('Project saved successfully', 'success');

      if (viewAfter) {
        window.open(`/project/${data.project.slug}`, '_blank');
      } else {
        Admin.switchTab('projects');
      }
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  }
};
