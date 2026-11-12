window.AboutView = {
  render: async (container, appState) => {
    try {
      const res = await fetch(`/api/about?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error('Failed to load about page');
      const data = await res.json();
      const about = data.about || {};
      const settings = appState.settings || {};

      document.title = `About me — ${settings.siteName || 'Portfolio'}`;

      let paragraphsHtml = '';
      (about.paragraphs || []).forEach(p => {
        paragraphsHtml += `<p>${p}</p>`;
      });

      let html = `
        <div class="about-page">
          <div class="about-container">
            <h1 class="page-main-heading">${about.heading || 'About me'}</h1>
            
            <div class="about-paragraphs">
              ${paragraphsHtml}
            </div>

            ${about.pullquote ? `
              <blockquote class="about-pullquote">
                ${about.pullquote}
              </blockquote>
            ` : ''}

            ${about.showPhoto && about.photoUrl ? `
              <div class="about-photo-wrapper">
                <img src="${about.photoUrl}" alt="Portrait" loading="lazy">
              </div>
            ` : ''}
          </div>

          <section class="page-footer-section" style="margin-top: 60px;">
            <button type="button" class="back-to-top-link" id="aboutBackToTop" aria-label="Scroll back to top">
              ↑ Back to Top
            </button>
            <div class="site-footer-note">
              ${settings.footerText || 'Powered by Adobe Portfolio'}
            </div>
          </section>
        </div>
      `;

      container.innerHTML = html;

      const topBtn = document.getElementById('aboutBackToTop');
      if (topBtn) {
        topBtn.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

    } catch (err) {
      console.error('AboutView error:', err);
      container.innerHTML = `
        <div style="padding: 80px 20px; text-align: center; color: #888;">
          <p>Failed to load about page.</p>
        </div>
      `;
    }
  }
};
