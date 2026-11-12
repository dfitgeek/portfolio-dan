// Admin Contact Messages / Inbox Controller
const AdminMessages = {
  messages: [],

  init() {
    // Loaded when tab switched
  },

  async load() {
    try {
      const res = await Admin.apiFetch('/admin/api/messages');
      const data = await res.json();
      this.messages = data.messages || [];

      // Update sidebar unread badge
      const unreadCount = this.messages.filter(m => !m.read).length;
      const badge = document.getElementById('badgeUnreadCount');
      if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
      }

      this.renderTable();
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  renderTable() {
    const tbody = document.getElementById('inboxTableBody');
    if (!tbody) return;

    if (this.messages.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">
            No messages received yet. Inquiries from the contact form will appear here.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.messages.map(msg => {
      const dateStr = new Date(msg.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <tr style="${!msg.read ? 'background-color: #f8fafc; font-weight: 600;' : ''}">
          <td style="font-size: 12px; color: #64748b;">${dateStr}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${!msg.read ? '<span style="width: 8px; height: 8px; background-color: #0ea5e9; border-radius: 50%; display: inline-block;"></span>' : ''}
              <span>${this.escape(msg.name)}</span>
            </div>
          </td>
          <td>
            <a href="mailto:${encodeURIComponent(msg.email)}" style="color: #0ea5e9; text-decoration: underline;">
              ${this.escape(msg.email)}
            </a>
          </td>
          <td style="max-width: 380px;">
            <div style="white-space: pre-wrap; word-break: break-word; font-size: 13px; line-height: 1.4; color: #334155;">
              ${this.escape(msg.message)}
            </div>
          </td>
          <td style="text-align: right;">
            <div class="btn-group" style="justify-content: flex-end;">
              <a href="mailto:${encodeURIComponent(msg.email)}?subject=Re:%20Portfolio%20Inquiry" class="btn btn-secondary btn-sm" title="Reply via Email">Reply</a>
              <button class="btn btn-secondary btn-sm toggle-read-btn" data-id="${msg.id}" data-read="${msg.read}">
                ${msg.read ? 'Mark Unread' : 'Mark Read'}
              </button>
              <button class="btn btn-danger btn-sm delete-msg-btn" data-id="${msg.id}" title="Delete Message">✕</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.attachEvents();
  },

  attachEvents() {
    const tbody = document.getElementById('inboxTableBody');
    if (!tbody) return;

    tbody.querySelectorAll('.toggle-read-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const currentRead = btn.getAttribute('data-read') === 'true';
        await this.toggleRead(id, !currentRead);
      });
    });

    tbody.querySelectorAll('.delete-msg-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await this.deleteMessage(id);
      });
    });
  },

  async toggleRead(id, readState) {
    try {
      const res = await Admin.apiFetch(`/admin/api/messages/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: readState })
      });
      if (!res.ok) throw new Error('Failed to update message');
      this.load();
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  async deleteMessage(id) {
    const confirmed = await Admin.confirm('Delete Message', 'Are you sure you want to delete this message?');
    if (!confirmed) return;

    try {
      const res = await Admin.apiFetch(`/admin/api/messages/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete message');
      Admin.toast('Message deleted', 'success');
      this.load();
    } catch (err) {
      Admin.toast(err.message, 'error');
    }
  },

  escape(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
