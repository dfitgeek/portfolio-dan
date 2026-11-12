window.ProjectView = {
  render: async (container, appState, params) => {
    try {
      const slug = params.slug;
      const res = await fetch(`/api/projects/${encodeURIComponent(slug)}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) {
        if (res.status === 404) {
          container.innerHTML = `
            <div style="padding: 100px 20px; text-align: center;">
              <h1 style="font-family: var(--font-heading); font-size: 32px; margin-bottom: 16px;">Project Not Found</h1>
              <p style="color: #888; margin-bottom: 24px;">The project you are looking for does not exist or has been removed.</p>
              <a href="/" data-nav style="color: #111; text-decoration: underline;">Return to projects</a>
            </div>
          `;
          return;
        }
        throw new Error('Failed to load project');
      }

      const data = await res.json();
      const project = data.project;
      const prevProject = data.prevProject;
      const nextProject = data.nextProject;
      const settings = appState.settings || {};

      // Update page title
      document.title = `${project.title} — ${settings.siteName || 'Portfolio'}`;

      let html = `<article class="project-detail">`;

      // Header container
      html += `
        <div class="project-header-container">
          <h1 class="project-main-title">${project.title}</h1>
          ${project.shortDescription ? `<p class="project-description-text">${project.shortDescription}</p>` : ''}
          ${project.year ? `<div class="project-year-label">${project.year}</div>` : ''}
        </div>
      `;

      // Content blocks stack
      html += `<div class="project-blocks-stack">`;

      (project.blocks || []).forEach(block => {
        if (block.type === 'wide_image') {
          html += `
            <div class="block-wide-image">
              <img src="${block.url}" alt="${block.alt || project.title}" loading="lazy" onload="this.classList.add('loaded')">
              ${block.caption ? `<div class="image-caption block-image-contained">${block.caption}</div>` : ''}
            </div>
          `;
        } else if (block.type === 'image') {
          html += `
            <div class="block-image-contained">
              <img src="${block.url}" alt="${block.alt || project.title}" loading="lazy" onload="this.classList.add('loaded')">
              ${block.caption ? `<div class="image-caption">${block.caption}</div>` : ''}
            </div>
          `;
        } else if (block.type === 'two_image') {
          const img1 = block.images?.[0] || {};
          const img2 = block.images?.[1] || {};
          html += `
            <div class="block-two-image">
              <div>
                ${img1.url ? `<img src="${img1.url}" alt="${img1.alt || ''}" loading="lazy" onload="this.classList.add('loaded')">` : ''}
                ${img1.caption ? `<div class="image-caption">${img1.caption}</div>` : ''}
              </div>
              <div>
                ${img2.url ? `<img src="${img2.url}" alt="${img2.alt || ''}" loading="lazy" onload="this.classList.add('loaded')">` : ''}
                ${img2.caption ? `<div class="image-caption">${img2.caption}</div>` : ''}
              </div>
            </div>
          `;
        } else if (block.type === 'text') {
          html += `<div class="block-text">${block.content || ''}</div>`;
        } else if (block.type === 'video') {
          let embedHtml = '';
          const url = (block.url || '').trim();
          if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const vidIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
            const vidId = vidIdMatch ? vidIdMatch[1] : '';
            embedHtml = `<iframe src="https://www.youtube.com/embed/${vidId}" title="${block.title || 'Video'}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
          } else if (url.includes('vimeo.com')) {
            const vidIdMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
            const vidId = vidIdMatch ? vidIdMatch[3] : '';
            embedHtml = `<iframe src="https://player.vimeo.com/video/${vidId}" title="${block.title || 'Video'}" allowfullscreen></iframe>`;
          } else if (url.endsWith('.mp4') || url.endsWith('.webm')) {
            embedHtml = `<video controls playsinline><source src="${url}" type="video/mp4"></video>`;
          } else {
            embedHtml = `<iframe src="${url}" title="Video embed" allowfullscreen></iframe>`;
          }
          html += `
            <div class="block-video">
              <div class="video-responsive-wrapper">${embedHtml}</div>
              ${block.caption ? `<div class="image-caption">${block.caption}</div>` : ''}
            </div>
          `;
        } else if (block.type === 'spacer') {
          html += `<div style="height: ${block.height || 40}px;"></div>`;
        }
      });

      html += `</div>`; // end blocks-stack

      // Social Media / Share Icons Row
      if (project.showSocialLinks !== false) {
        let socialLinks = project.socialLinks;
        if (!Array.isArray(socialLinks) && appState.settings && Array.isArray(appState.settings.projectSocialLinks)) {
          socialLinks = appState.settings.projectSocialLinks;
        }
        if (!Array.isArray(socialLinks)) {
          socialLinks = [
            { id: 'pinterest', name: 'Pinterest', icon: 'pinterest', url: 'https://pinterest.com/pin/create/button/?url={url}&description={title}', visible: true },
            { id: 'twitter', name: 'Twitter / X', icon: 'twitter', url: 'https://twitter.com/intent/tweet?url={url}&text={title}', visible: true },
            { id: 'facebook', name: 'Facebook', icon: 'facebook', url: 'https://www.facebook.com/sharer/sharer.php?u={url}', visible: true },
            { id: 'tumblr', name: 'Tumblr', icon: 'tumblr', url: 'https://www.tumblr.com/widgets/share/tool?canonicalUrl={url}&title={title}', visible: true }
          ];
        }

        const activeLinks = socialLinks.filter(item => item && item.visible !== false && item.url);
        if (activeLinks.length > 0) {
          const currentUrl = encodeURIComponent(window.location.href);
          const shareTitle = encodeURIComponent(project.title || '');

          html += `<div class="project-share-row">`;
          activeLinks.forEach(item => {
            const finalUrl = item.url
              .replace(/\{url\}/g, currentUrl)
              .replace(/\{title\}/g, shareTitle);
            const iconSvg = Icons[item.icon] || Icons.link || Icons.twitter;
            html += `
              <a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="share-btn" aria-label="${item.name || 'Social Link'}" title="${item.name || ''}">
                ${iconSvg}
              </a>
            `;
          });
          html += `</div>`;
        }
      }

      // Previous / Next Project Pagination
      html += `
        <nav class="project-pagination" aria-label="Project pagination">
          <div>
            ${prevProject ? `<a href="/project/${prevProject.slug}" data-nav class="pagination-link">← ${prevProject.title}</a>` : ''}
          </div>
          <div>
            ${nextProject ? `<a href="/project/${nextProject.slug}" data-nav class="pagination-link">${nextProject.title} →</a>` : ''}
          </div>
        </nav>
      `;

      // Bottom back to top & footer
      html += `
        <section class="page-footer-section">
          <button type="button" class="back-to-top-link" id="projectBackToTop" aria-label="Scroll back to top">
            ↑ Back to Top
          </button>
          <div class="site-footer-note">
            ${settings.footerText || 'Powered by Adobe Portfolio'}
          </div>
        </section>
      `;

      html += `</article>`;

      container.innerHTML = html;

      // Ensure cached images that didn't fire onload are visible immediately
      container.querySelectorAll('img').forEach(img => {
        if (img.complete) {
          img.classList.add('loaded');
        } else {
          img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
        }
      });

      // Back to top listener
      const topBtn = document.getElementById('projectBackToTop');
      if (topBtn) {
        topBtn.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

    } catch (err) {
      console.error('ProjectView error:', err);
      container.innerHTML = `
        <div style="padding: 80px 20px; text-align: center; color: #888;">
          <p>Failed to load project details.</p>
        </div>
      `;
    }
  }
};
