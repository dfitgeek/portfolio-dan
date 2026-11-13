/* window.AboutView = {
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
}; */


window.AboutView = {
  render: async (container, appState) => {
    try {

      // Professional headshot image location
      const professionalHeadshotSrc = '../uploads/544637b2-ac6a-424b-ad1d-18f4c356cca2.png';

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

            <h1 class="page-main-heading">
              ${about.heading || 'About me'}
            </h1>

           <div class="about-paragraphs">
  <p>I'm Daniel, a multidisciplinary creative with a passion for turning ideas into meaningful digital experiences and solutions.</p>

  <p>My work sits at the intersection of design, technology and business. I enjoy exploring ideas, understanding problems and creating solutions that are not only visually engaging but also practical and impactful.</p>

  <p>Over the years, I've worked with brands and businesses across different industries, contributing to brand identity, graphic design, social media management, print and packaging design, and digital product experiences.</p>

  <p>Beyond design, my background in Economics has shaped how I approach problems, think strategically and understand the bigger picture behind businesses.</p>

  <p>I'm always curious, eager to learn and excited about opportunities to collaborate, experiment and create work that makes a difference.</p>
</div>

            <!-- Professional Headshot -->
            <div class="professional-headshot-wrapper">
              <img
                src="${professionalHeadshotSrc}"
                alt="Professional headshot"
                class="professional-headshot"
                loading="lazy"
              >
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
            <button
              type="button"
              class="back-to-top-link"
              id="aboutBackToTop"
              aria-label="Scroll back to top"
            >
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

