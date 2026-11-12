// Admin Media Library Controller
const AdminMedia = {
  files: [],

  init() {
    this.setupEvents();
  },

  setupEvents() {
    const uploadBtn = document.getElementById('uploadMediaBtn');
    const fileInput = document.getElementById('mediaFileInput');
    const dropzone = document.getElementById('mediaDropzone');

    uploadBtn?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files?.length) {
        this.uploadFiles(Array.from(e.target.files));
      }
    });

    // Dropzone drag-and-drop
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone?.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files?.length) {
        this.uploadFiles(Array.from(e.dataTransfer.files));
      }
    });
  },

  async load() {
    try {
      const res = await Admin.apiFetch('/admin/api/media');
      const data = await res.json();
      this.files = data.files || [];
      this.renderGrid();
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  async uploadFiles(fileList) {
    const formData = new FormData();
    fileList.forEach(file => formData.append('images', file));

    try {
      Admin.toast(`Uploading ${fileList.length} file(s)...`, 'info', 2000);
      const res = await Admin.apiFetch('/admin/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      Admin.toast(`Successfully uploaded ${data.files.length} image(s)`, 'success');
      this.load();
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  renderGrid() {
    const grid = document.getElementById('mediaGrid');
    if (!grid) return;

    if (this.files.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">
          No images uploaded yet. Drag and drop image files above to populate your library.
        </div>
      `;
      return;
    }

    grid.innerHTML = this.files.map(file => {
      const sizeKb = Math.round(file.size / 1024);
      const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      return `
        <div class="media-card">
          <div class="media-thumb-wrap">
            <img src="${file.url}" alt="${file.filename}" loading="lazy">
          </div>
          <div class="media-info">
            <span class="media-name" title="${file.filename}">${file.filename}</span>
            <span class="media-size">${sizeStr}</span>
            <div class="media-actions">
              <button class="btn btn-secondary btn-sm copy-url-btn" data-url="${file.url}" style="flex: 1;">Copy URL</button>
              <button class="btn btn-danger btn-sm delete-media-btn" data-filename="${file.filename}" title="Delete Image">✕</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.attachGridEvents();
  },

  attachGridEvents() {
    const grid = document.getElementById('mediaGrid');
    if (!grid) return;

    grid.querySelectorAll('.copy-url-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        navigator.clipboard.writeText(url).then(() => {
          Admin.toast('Copied URL to clipboard: ' + url, 'success');
        }).catch(() => {
          prompt('Copy image URL:', url);
        });
      });
    });

    grid.querySelectorAll('.delete-media-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const filename = btn.getAttribute('data-filename');
        const confirmed = await Admin.confirm('Delete Image', `Delete "${filename}"? Any project block referencing this URL will stop displaying it.`);
        if (!confirmed) return;

        try {
          const res = await Admin.apiFetch(`/admin/api/media/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error('Failed to delete image');
          Admin.toast('Image deleted', 'success');
          this.load();
        } catch (err) {
          Admin.toast(err.message, 'error');
        }
      });
    });
  }
};
