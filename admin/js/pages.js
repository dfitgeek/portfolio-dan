// Admin Pages Controller (About & Contact Editors)
const AdminPages = {
  aboutData: null,
  contactData: null,

  init() {
    this.setupAboutEvents();
    this.setupContactEvents();
  },

  /* ================= ABOUT PAGE ================= */

  setupAboutEvents() {
    document.getElementById('saveAboutBtn')?.addEventListener('click', () => {
      this.saveAbout();
    });

    document.getElementById('addAboutParagraphBtn')?.addEventListener('click', () => {
      this.addAboutParagraph('');
    });

    // About photo upload & remove
    const photoInput = document.getElementById('aboutPhotoFileInput');
    document.getElementById('uploadAboutPhotoBtn')?.addEventListener('click', () => {
      photoInput?.click();
    });

    photoInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('images', file);

      try {
        Admin.toast('Uploading portrait...', 'info', 1500);
        const res = await Admin.apiFetch('/admin/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        this.setAboutPhoto(data.url);
        Admin.toast('Portrait uploaded', 'success');
      } catch (err) {
        Admin.toast(err.message, 'error');
      }
    });

    document.getElementById('removeAboutPhotoBtn')?.addEventListener('click', () => {
      this.setAboutPhoto('');
    });
  },

  async loadAbout() {
    try {
      const res = await Admin.apiFetch('/admin/api/pages/about');
      const data = await res.json();
      this.aboutData = data.about || {};

      document.getElementById('aboutHeading').value = this.aboutData.heading || 'About me';
      document.getElementById('aboutPullquote').value = this.aboutData.pullquote || '';
      document.getElementById('aboutShowPhoto').checked = !!this.aboutData.showPhoto;

      this.setAboutPhoto(this.aboutData.photoUrl || '');

      // Render paragraphs
      const pContainer = document.getElementById('aboutParagraphsList');
      pContainer.innerHTML = '';
      (this.aboutData.paragraphs || []).forEach(p => this.addAboutParagraph(p));
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  addAboutParagraph(text = '') {
    const container = document.getElementById('aboutParagraphsList');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'paragraph-item mb-2';
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.alignItems = 'flex-start';

    row.innerHTML = `
      <textarea class="form-control about-paragraph-input" rows="3" placeholder="Paragraph copy...">${text}</textarea>
      <button type="button" class="btn btn-danger btn-sm remove-p-btn" title="Remove Paragraph" style="margin-top: 2px;">✕</button>
    `;

    row.querySelector('.remove-p-btn')?.addEventListener('click', () => row.remove());
    container.appendChild(row);
  },

  setAboutPhoto(url) {
    const previewBox = document.getElementById('aboutPhotoPreviewBox');
    const previewImg = document.getElementById('aboutPhotoImg');
    const placeholder = previewBox.querySelector('.thumb-placeholder');
    const removeBtn = document.getElementById('removeAboutPhotoBtn');

    if (!this.aboutData) this.aboutData = {};
    this.aboutData.photoUrl = url;

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

  async saveAbout() {
    const heading = document.getElementById('aboutHeading').value.trim();
    const pullquote = document.getElementById('aboutPullquote').value.trim();
    const showPhoto = document.getElementById('aboutShowPhoto').checked;
    const photoUrl = this.aboutData?.photoUrl || '';

    const paragraphs = Array.from(document.querySelectorAll('.about-paragraph-input'))
      .map(input => input.value.trim())
      .filter(Boolean);

    try {
      Admin.toast('Saving About page...', 'info', 1500);
      const res = await Admin.apiFetch('/admin/api/pages/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heading,
          paragraphs,
          pullquote,
          showPhoto,
          photoUrl
        })
      });

      if (!res.ok) throw new Error('Failed to save about page');
      Admin.toast('About page updated successfully', 'success');
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  /* ================= CONTACT PAGE ================= */

  setupContactEvents() {
    document.getElementById('saveContactBtn')?.addEventListener('click', () => {
      this.saveContact();
    });

    document.getElementById('addContactMethodBtn')?.addEventListener('click', () => {
      this.addContactMethod('Channel', 'value', '');
    });
  },

  async loadContact() {
    try {
      const res = await Admin.apiFetch('/admin/api/pages/contact');
      const data = await res.json();
      this.contactData = data.contact || {};

      document.getElementById('contactHeading').value = this.contactData.heading || 'Contact';
      document.getElementById('contactIntro').value = this.contactData.intro || '';
      document.getElementById('contactFormIntro').value = this.contactData.formIntro || '';
      document.getElementById('contactSuccessMessage').value = this.contactData.successMessage || '';
      document.getElementById('contactEmail').value = this.contactData.contactEmail || '';

      const mContainer = document.getElementById('contactMethodsList');
      mContainer.innerHTML = '';
      (this.contactData.directMethods || []).forEach(m => {
        this.addContactMethod(m.label, m.value, m.link);
      });
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  addContactMethod(label = '', value = '', link = '') {
    const container = document.getElementById('contactMethodsList');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'method-item mb-2';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '120px 1fr 1fr 36px';
    row.style.gap = '8px';
    row.style.alignItems = 'center';

    row.innerHTML = `
      <input type="text" class="form-control method-label" placeholder="Label (e.g. Phone)" value="${label}">
      <input type="text" class="form-control method-val" placeholder="Display Text" value="${value}">
      <input type="text" class="form-control method-link" placeholder="Link / URL (optional)" value="${link || ''}">
      <button type="button" class="btn btn-danger btn-sm remove-m-btn" title="Remove">✕</button>
    `;

    row.querySelector('.remove-m-btn')?.addEventListener('click', () => row.remove());
    container.appendChild(row);
  },

  async saveContact() {
    const heading = document.getElementById('contactHeading').value.trim();
    const intro = document.getElementById('contactIntro').value.trim();
    const formIntro = document.getElementById('contactFormIntro').value.trim();
    const successMessage = document.getElementById('contactSuccessMessage').value.trim();
    const contactEmail = document.getElementById('contactEmail').value.trim();

    const directMethods = Array.from(document.querySelectorAll('#contactMethodsList .method-item')).map(row => ({
      label: row.querySelector('.method-label').value.trim(),
      value: row.querySelector('.method-val').value.trim(),
      link: row.querySelector('.method-link').value.trim()
    })).filter(m => m.label && m.value);

    try {
      Admin.toast('Saving Contact page...', 'info', 1500);
      const res = await Admin.apiFetch('/admin/api/pages/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heading,
          intro,
          formIntro,
          successMessage,
          contactEmail,
          directMethods
        })
      });

      if (!res.ok) throw new Error('Failed to save contact settings');
      Admin.toast('Contact page updated successfully', 'success');
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  }
};
