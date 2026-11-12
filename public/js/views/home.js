window.HomeView = {
  render: async (container, appState) => {
    try {
      const res = await fetch(`/api/projects?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      const projects = data.projects || [];
      const settings = appState.settings || {};

      let html = '<div class="projects-grid" id="projectsGrid">';
      
      projects.forEach((project, idx) => {
        const delay = idx * 50;
        const overlayColor = project.hoverOverlayColor || settings.accentColor || '#7ec8b8';
        html += `
          <a href="/project/${project.slug}" class="project-tile" data-nav style="animation-delay: ${delay}ms;" aria-label="${project.title}">
            <img src="${project.thumbnailUrl}" alt="${project.title}" class="tile-image" loading="lazy">
            <div class="tile-overlay" style="background-color: ${overlayColor};">
              <h2 class="tile-title">${project.title}</h2>
            </div>
          </a>
        `;
      });

      html += '</div>';

      // Bottom section
      html += `
        <section class="page-footer-section">
          <button type="button" class="back-to-top-link" id="homeBackToTop" aria-label="Scroll back to top">
            ↑ Back to Top
          </button>
          <div class="site-footer-note">
            ${settings.footerText || 'Powered by Adobe Portfolio'}
          </div>
        </section>
      `;

      container.innerHTML = html;

      // Event listener for bottom back to top
      const backToTopBtn = document.getElementById('homeBackToTop');
      if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      // Initialize mobile drag overlay interactive behavior
      if (window.HomeView.setupMobileDragOverlay) {
        window.HomeView.setupMobileDragOverlay(container);
      }

    } catch (err) {
      console.error('HomeView error:', err);
      container.innerHTML = `
        <div style="padding: 80px 20px; text-align: center; color: #888;">
          <p>Unable to load projects at this moment.</p>
        </div>
      `;
    }
  },

  setupMobileDragOverlay: (container) => {
    const grid = container.querySelector('.projects-grid');
    if (!grid) return;

    const tiles = Array.from(grid.querySelectorAll('.project-tile'));
    if (!tiles.length) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;
    let preventClickUntil = 0;
    let fadeTimer = null;
    let isTouchActive = false;
    let lastTouchTime = 0;

    const setActiveTile = (activeTile) => {
      tiles.forEach((tile) => {
        if (tile === activeTile) {
          tile.classList.add('drag-active');
        } else {
          tile.classList.remove('drag-active');
        }
      });
    };

    const clearActiveTiles = () => {
      tiles.forEach((tile) => tile.classList.remove('drag-active'));
    };

    const getCenterTile = () => {
      const centerY = window.innerHeight / 2;
      let closestTile = null;
      let minDistance = Infinity;

      tiles.forEach((tile) => {
        const rect = tile.getBoundingClientRect();
        // Only consider tiles partially or fully within viewport
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          const tileCenter = rect.top + rect.height / 2;
          const dist = Math.abs(tileCenter - centerY);
          if (dist < minDistance) {
            minDistance = dist;
            closestTile = tile;
          }
        }
      });

      return closestTile;
    };

    // Touch event listeners on grid
    grid.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      isTouchActive = true;
      lastTouchTime = Date.now();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging = false;
      clearTimeout(fadeTimer);
    }, { passive: true });

    grid.addEventListener('touchmove', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      isTouchActive = true;
      lastTouchTime = Date.now();

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const moveX = Math.abs(currentX - touchStartX);
      const moveY = Math.abs(currentY - touchStartY);

      // Threshold to distinguish deliberate drag from micro jitter
      if (moveX > 6 || moveY > 6) {
        isDragging = true;
      }

      if (isDragging) {
        clearTimeout(fadeTimer);

        // Find tile directly under finger
        const elUnderFinger = document.elementFromPoint(currentX, currentY);
        const tileUnderFinger = elUnderFinger ? elUnderFinger.closest('.project-tile') : null;

        if (tileUnderFinger) {
          setActiveTile(tileUnderFinger);
        } else {
          const centerTile = getCenterTile();
          if (centerTile) setActiveTile(centerTile);
        }
      }
    }, { passive: true });

    const handleTouchEnd = () => {
      isTouchActive = false;
      lastTouchTime = Date.now();

      if (isDragging) {
        // Suppress navigation click after dragging
        preventClickUntil = Date.now() + 400;
        isDragging = false;
      }

      // Smoothly fade out overlay after dragging stops
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(clearActiveTiles, 700);
    };

    grid.addEventListener('touchend', handleTouchEnd, { passive: true });
    grid.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Click suppression when recently dragged
    grid.addEventListener('click', (e) => {
      if (Date.now() < preventClickUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Scroll listener for momentum scroll following a swipe
    const handleScroll = () => {
      const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      if (!isMobile) return;

      if (isTouchActive || (Date.now() - lastTouchTime < 1500)) {
        const centerTile = getCenterTile();
        if (centerTile) {
          setActiveTile(centerTile);
          clearTimeout(fadeTimer);
          fadeTimer = setTimeout(clearActiveTiles, 700);
        }
      }
    };

    if (window.__homeMobileScrollHandler) {
      window.removeEventListener('scroll', window.__homeMobileScrollHandler, { passive: true });
    }
    window.__homeMobileScrollHandler = handleScroll;
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
};
