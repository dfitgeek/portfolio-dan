// Admin Projects List Controller
const AdminProjects = {
  projects: [],

  init() {
    document.getElementById('addProjectBtn')?.addEventListener('click', () => {
      AdminBuilder.openNew();
    });

    document.getElementById('projectSearchInput')?.addEventListener('input', (e) => {
      this.filterProjects(e.target.value.toLowerCase().trim());
    });
  },

  async load() {
    try {
      const res = await Admin.apiFetch('/admin/api/projects');
      const data = await res.json();
      this.projects = data.projects || [];

      // Update badge count
      const badge = document.getElementById('badgeProjectCount');
      if (badge) badge.textContent = this.projects.length;

      this.renderTable(this.projects);
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  filterProjects(query) {
    if (!query) {
      this.renderTable(this.projects);
      return;
    }
    const filtered = this.projects.filter(p => 
      (p.title && p.title.toLowerCase().includes(query)) ||
      (p.year && p.year.toLowerCase().includes(query)) ||
      (p.slug && p.slug.toLowerCase().includes(query))
    );
    this.renderTable(filtered);
  },

  renderTable(list) {
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">
            No projects found. Click "+ Add New Project" to create one.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((project, index) => `
      <tr data-id="${project.id}" draggable="true" class="project-table-row">
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="drag-handle" title="Drag to reorder">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </span>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">#${index + 1}</span>
          </div>
        </td>
        <td>
          <img src="${project.thumbnailUrl || 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 80\" fill=\"%23e2e8f0\"/>'}" alt="${project.title}" class="table-thumb">
        </td>
        <td>
          <div style="font-weight: 600; color: #0f172a;">${project.title}</div>
          <div style="font-size: 11px; color: #94a3b8;">/project/${project.slug}</div>
        </td>
        <td>${project.year || '—'}</td>
        <td>
          <span class="status-pill ${project.published ? 'published' : 'draft'}">
            ${project.published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td style="text-align: right;">
          <div class="btn-group" style="justify-content: flex-end;">
            <a href="/project/${project.slug}" target="_blank" class="btn btn-secondary btn-sm" title="Preview on site">View</a>
            <button class="btn btn-secondary btn-sm edit-proj-btn" data-id="${project.id}">Edit</button>
            <button class="btn btn-secondary btn-sm dup-proj-btn" data-id="${project.id}" title="Duplicate">Copy</button>
            <button class="btn btn-danger btn-sm del-proj-btn" data-id="${project.id}" title="Delete">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    this.attachTableEvents();
  },

  attachTableEvents() {
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    // Action buttons
    tbody.querySelectorAll('.edit-proj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AdminBuilder.openEdit(btn.getAttribute('data-id'));
      });
    });

    tbody.querySelectorAll('.dup-proj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.duplicateProject(btn.getAttribute('data-id'));
      });
    });

    tbody.querySelectorAll('.del-proj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deleteProject(btn.getAttribute('data-id'));
      });
    });

    // Drag-and-drop rows
    let draggedRow = null;

    tbody.querySelectorAll('.project-table-row').forEach(row => {
      row.addEventListener('dragstart', (e) => {
        draggedRow = row;
        row.style.opacity = '0.4';
      });

      row.addEventListener('dragend', () => {
        if (draggedRow) draggedRow.style.opacity = '1';
        draggedRow = null;
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        if (!draggedRow || draggedRow === row) return;

        const allRows = Array.from(tbody.querySelectorAll('.project-table-row'));
        const draggedIndex = allRows.indexOf(draggedRow);
        const targetIndex = allRows.indexOf(row);

        if (draggedIndex < targetIndex) {
          row.after(draggedRow);
        } else {
          row.before(draggedRow);
        }

        // Gather new order
        const newOrder = Array.from(tbody.querySelectorAll('.project-table-row'))
          .map(r => r.getAttribute('data-id'));

        await this.saveReorder(newOrder);
      });
    });
  },

  async saveReorder(orderIds) {
    try {
      const res = await Admin.apiFetch('/admin/api/projects-reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderIds })
      });
      if (!res.ok) throw new Error('Failed to update project order');
      Admin.toast('Project order updated', 'success');
      this.load();
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  async duplicateProject(id) {
    try {
      const res = await Admin.apiFetch(`/admin/api/projects/${id}/duplicate`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to duplicate project');
      Admin.toast('Project duplicated as draft', 'success');
      this.load();
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  async deleteProject(id) {
    const project = this.projects.find(p => p.id === id);
    const confirmed = await Admin.confirm(
      'Delete Project',
      `Are you sure you want to permanently delete "${project?.title || 'this project'}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await Admin.apiFetch(`/admin/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete project');
      Admin.toast('Project deleted successfully', 'success');
      this.load();
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  }
};
