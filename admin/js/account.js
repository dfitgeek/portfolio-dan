// Admin Account & Backups Controller
const AdminAccount = {
  init() {
    this.setupPasswordChange();
    this.setupBackupImport();
  },

  setupPasswordChange() {
    const form = document.getElementById('accountPasswordForm');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById('accountCurrentPass').value;
      const newPassword = document.getElementById('accountNewPass').value;
      const confirmPassword = document.getElementById('accountConfirmPass').value;
      const submitBtn = document.getElementById('updatePasswordBtn');

      if (newPassword.length < 8) {
        Admin.toast('New password must be at least 8 characters', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        Admin.toast('New passwords do not match', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Updating...';

      try {
        const res = await Admin.apiFetch('/admin/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update password');

        Admin.toast('Password updated successfully', 'success');
        form.reset();
      } catch (err) {
        Admin.toast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Password';
      }
    });
  },

  setupBackupImport() {
    const form = document.getElementById('importBackupForm');
    const input = document.getElementById('backupZipInput');
    const submitBtn = document.getElementById('importBackupBtn');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = input?.files[0];
      if (!file) {
        Admin.toast('Please select a backup zip file', 'error');
        return;
      }

      const confirmed = await Admin.confirm(
        'Restore Backup',
        'Restoring will overwrite the current database and unpack uploaded media from the backup archive. Are you sure you wish to continue?',
        'Restore Now',
        true
      );
      if (!confirmed) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Restoring...';

      const formData = new FormData();
      formData.append('backup', file);

      try {
        Admin.toast('Importing backup archive...', 'info', 3000);
        const res = await Admin.apiFetch('/admin/api/backup/import', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to import backup');

        Admin.toast('Backup restored successfully! Reloading...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        Admin.toast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Restore from Backup';
      }
    });
  }
};
