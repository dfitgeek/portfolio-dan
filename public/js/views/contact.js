window.ContactView = {
  render: async (container, appState) => {
    try {
      const res = await fetch(`/api/contact?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error('Failed to load contact info');
      const data = await res.json();
      const contact = data.contact || {};
      const settings = appState.settings || {};

      document.title = `Contact — ${settings.siteName || 'Portfolio'}`;

      let directMethodsHtml = '';
      (contact.directMethods || []).forEach(method => {
        let valHtml = method.value;
        if (method.link) {
          valHtml = `<a href="${method.link}" ${method.link.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${method.value}</a>`;
        }
        directMethodsHtml += `
          <li class="contact-method-item">
            <strong>${method.label}:</strong> ${valHtml}
          </li>
        `;
      });

      let html = `
        <div class="contact-page">
          <div class="contact-container">
            <h1 class="page-main-heading">${contact.heading || 'Contact'}</h1>

            ${contact.intro ? `<p class="contact-intro-text">${contact.intro}</p>` : ''}

            ${directMethodsHtml ? `<ul class="contact-methods-list">${directMethodsHtml}</ul>` : ''}

            ${contact.formIntro ? `<p class="contact-form-intro">${contact.formIntro}</p>` : ''}

            <!-- Inline Alert Message -->
            <div id="contactAlert" class="form-alert" role="alert"></div>

            <!-- Contact Form -->
            <form id="contactForm" class="contact-form" novalidate>
              <!-- Honeypot anti-spam trap -->
              <input type="text" name="_honeypot" class="form-hp" tabindex="-1" autocomplete="off" aria-hidden="true">

              <div class="form-group">
                <label for="contactName" class="form-label">Name *</label>
                <input type="text" id="contactName" name="name" class="form-input" placeholder="Your Name..." required autocomplete="name">
              </div>

              <div class="form-group">
                <label for="contactEmail" class="form-label">Email Address *</label>
                <input type="email" id="contactEmail" name="email" class="form-input" placeholder="Your Email Address..." required autocomplete="email">
              </div>

              <div class="form-group">
                <label for="contactMessage" class="form-label">Message *</label>
                <textarea id="contactMessage" name="message" class="form-textarea" placeholder="Your Message..." required></textarea>
              </div>

              <button type="submit" id="contactSubmitBtn" class="btn-submit">
                Submit
              </button>
            </form>
          </div>

          <section class="page-footer-section" style="margin-top: 60px;">
            <button type="button" class="back-to-top-link" id="contactBackToTop" aria-label="Scroll back to top">
              ↑ Back to Top
            </button>
            <div class="site-footer-note">
              ${settings.footerText || 'Powered by Adobe Portfolio'}
            </div>
          </section>
        </div>
      `;

      container.innerHTML = html;

      // Back to top
      const topBtn = document.getElementById('contactBackToTop');
      if (topBtn) {
        topBtn.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      // Form submission handler
      const form = document.getElementById('contactForm');
      const alertBox = document.getElementById('contactAlert');
      const submitBtn = document.getElementById('contactSubmitBtn');

      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();

          alertBox.className = 'form-alert';
          alertBox.style.display = 'none';

          const name = form.elements['name'].value.trim();
          const email = form.elements['email'].value.trim();
          const message = form.elements['message'].value.trim();
          const _honeypot = form.elements['_honeypot'].value;

          if (!name) {
            alertBox.textContent = 'Please enter your name.';
            alertBox.className = 'form-alert error';
            alertBox.style.display = 'block';
            form.elements['name'].focus();
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!email || !emailRegex.test(email)) {
            alertBox.textContent = 'Please enter a valid email address.';
            alertBox.className = 'form-alert error';
            alertBox.style.display = 'block';
            form.elements['email'].focus();
            return;
          }

          if (!message) {
            alertBox.textContent = 'Please enter your message.';
            alertBox.className = 'form-alert error';
            alertBox.style.display = 'block';
            form.elements['message'].focus();
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';

          try {
            const sendRes = await fetch('/api/contact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, message, _honeypot })
            });

            const sendData = await sendRes.json();

            if (!sendRes.ok) {
              throw new Error(sendData.error || 'Failed to submit form');
            }

            alertBox.textContent = sendData.message || contact.successMessage || 'Thank you for your message!';
            alertBox.className = 'form-alert success';
            alertBox.style.display = 'block';
            form.reset();

          } catch (sendErr) {
            alertBox.textContent = sendErr.message || 'An error occurred. Please try again.';
            alertBox.className = 'form-alert error';
            alertBox.style.display = 'block';
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
          }
        });
      }

    } catch (err) {
      console.error('ContactView error:', err);
      container.innerHTML = `
        <div style="padding: 80px 20px; text-align: center; color: #888;">
          <p>Failed to load contact information.</p>
        </div>
      `;
    }
  }
};
