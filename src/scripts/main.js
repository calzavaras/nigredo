/**
 * www.nigredo.ch - Main Script
 * Handles Navigation, Animations, Lightbox Gallery, and Spam Protection.
 */

const TIMING = {
  LIGHTBOX_INIT_DELAY:  100,
  MODAL_FOCUS_DELAY:    350,
  MODAL_CLOSE_DELAY:    380,
  CLOSE_OVERLAY_DELAY:  300,
  AUTO_CLOSE_DELAY:    5000,
  HERO_GLOW_DELAY:     1000,
  LIGHTBOX_FADE:        150,
  LIGHTBOX_OPEN_DELAY:   10,
};

// iOS Safari: body.overflow='hidden' verhindert Scrollen nicht zuverlässig.
// Lock-Depth-Counter macht die Funktionen re-entrant-safe (z.B. Nav + Modal gleichzeitig offen).
// Auf Desktop wird unlockScroll() zu einem No-op, da lockScroll() nie aufgerufen wird.
let _scrollLockY = 0;
let _lockDepth = 0;
function lockScroll() {
  if (_lockDepth === 0) {
    _scrollLockY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${_scrollLockY}px`;
  }
  _lockDepth++;
}
function unlockScroll() {
  if (_lockDepth <= 0) return;
  _lockDepth--;
  if (_lockDepth === 0) {
    document.body.style.position = '';
    document.body.style.top = '';
    window.scrollTo(0, _scrollLockY);
  }
}

let _closeModalTimer = 0;
let _lastModalTrigger = null;
const _modalBackground = [];

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initCardSpotlight();
  initReferencesPage();
  if (document.querySelector('.gradient-icon')) initGradientIcons();
  if (document.querySelector('#mailBtn, .reveal-mail')) initSpamProtection();
  if (document.getElementById('contact-modal')) initContactModal();
  if (document.querySelector('.accordion-header')) initAccordions();
  if (document.querySelector('.lightbox-trigger')) setTimeout(initLightbox, TIMING.LIGHTBOX_INIT_DELAY);
  setTimeout(() => {
    document.querySelectorAll('.hero-glow').forEach(el => el.classList.add('animated'));
  }, TIMING.HERO_GLOW_DELAY);
});

function initNavigation() {
  const menuBtn = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const header = document.querySelector('header');

  if (menuBtn && navLinks && header) {
    function closeNav() {
      navLinks.classList.remove('mobile-active');
      menuBtn.setAttribute('aria-expanded', 'false');
      unlockScroll();
      header.classList.remove('menu-open');
    }

    menuBtn.addEventListener('click', () => {
      if (navLinks.classList.contains('mobile-active')) {
        closeNav();
      } else {
        navLinks.classList.add('mobile-active');
        menuBtn.setAttribute('aria-expanded', 'true');
        lockScroll();
        header.classList.add('menu-open');
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });
  }
}

function initScrollAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
  }
}

function initCardSpotlight() {
  const cards = Array.from(document.querySelectorAll('.card, .contact-card, .case-feature'));
  if (cards.length === 0) return;

  cards.forEach((card) => {
    const randomAngle = `${Math.floor(Math.random() * 360)}deg`;
    card.style.setProperty('--start-angle', randomAngle);
  });

  const supportsInteractiveSpotlight =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!supportsInteractiveSpotlight) return;

  let rafPending = false;
  document.addEventListener('pointermove', (e) => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (
          rect.bottom < 0 ||
          rect.right < 0 ||
          rect.top > window.innerHeight ||
          rect.left > window.innerWidth
        ) {
          return;
        }
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
      rafPending = false;
    });
  }, { passive: true });
}

function initReferencesPage() {
  const gridEl = document.getElementById('refs-grid');
  const loadMoreEl = document.getElementById('refs-load-more');
  const paginationEl = document.getElementById('refs-pagination');

  if (!gridEl || !loadMoreEl || !paginationEl) return;

  let references;
  try {
    references = JSON.parse(gridEl.dataset.references || '[]');
  } catch (err) {
    console.error('References data parse error:', err);
    return;
  }

  const PAGE_SIZE = 8;
  const STEP_SIZE = 2;
  let currentPage = 0;
  let visibleCount = Math.min(STEP_SIZE, PAGE_SIZE);

  function shuffleItems(items) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  const shuffledReferences = shuffleItems(references);

  function getPageItems(pageIndex) {
    const start = pageIndex * PAGE_SIZE;
    return shuffledReferences.slice(start, start + PAGE_SIZE);
  }

  function renderCards() {
    const pageItems = getPageItems(currentPage);
    const itemsToShow = pageItems.slice(0, visibleCount);

    gridEl.innerHTML = itemsToShow.map((ref) => `
      <a href="${ref.href}" class="ref-main-card" aria-label="${ref.ariaLabel}">
        <div class="ref-main-card-img ${ref.listImgCls}">
          <img src="${ref.imgSrc}" alt="${ref.imgAlt}" width="800" height="450" loading="lazy" decoding="async">
          <span class="tech-badge ${ref.badge.cls} ref-main-badge">${ref.badge.text}</span>
        </div>
        <div class="ref-main-card-body">
          <div class="ref-main-card-header">
            <h2 class="ref-main-card-title">${ref.listTitle}</h2>
            <span class="ref-main-card-year">${ref.year}</span>
          </div>
          ${ref.sub ? `<p class="ref-main-card-sub">${ref.sub}</p>` : ''}
          <p class="ref-main-card-desc">${ref.listDesc}</p>
          <div class="ref-main-card-footer">
            <span class="ref-main-link ${ref.linkCls || ''}">Details <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
          </div>
        </div>
      </a>
    `).join('');

    loadMoreEl.hidden = visibleCount >= pageItems.length;
  }

  function renderPagination() {
    const totalPages = Math.ceil(shuffledReferences.length / PAGE_SIZE);
    const pageItems = getPageItems(currentPage);

    if (totalPages <= 1 || visibleCount < pageItems.length) {
      paginationEl.hidden = true;
      paginationEl.innerHTML = '';
      return;
    }

    paginationEl.hidden = false;
    const pageButtons = Array.from({ length: totalPages }, (_, index) => `
      <button
        type="button"
        class="refs-page-btn${index === currentPage ? ' is-active' : ''}"
        data-page="${index}"
        aria-current="${index === currentPage ? 'page' : 'false'}"
        aria-label="Seite ${index + 1}"
      >
        ${index + 1}
      </button>
    `).join('');

    paginationEl.innerHTML = `
      <button
        type="button"
        class="refs-page-arrow"
        data-direction="prev"
        aria-label="Vorherige Seite"
        ${currentPage === 0 ? 'disabled' : ''}
      >
        <span aria-hidden="true">&larr;</span>
      </button>
      <div class="refs-page-list">${pageButtons}</div>
      <button
        type="button"
        class="refs-page-arrow"
        data-direction="next"
        aria-label="Nächste Seite"
        ${currentPage === totalPages - 1 ? 'disabled' : ''}
      >
        <span aria-hidden="true">&rarr;</span>
      </button>
    `;
  }

  function updateView() {
    const pageItems = getPageItems(currentPage);
    visibleCount = Math.min(Math.max(visibleCount, STEP_SIZE), pageItems.length);
    renderCards();
    renderPagination();
  }

  loadMoreEl.addEventListener('click', () => {
    const pageItems = getPageItems(currentPage);
    visibleCount = Math.min(visibleCount + STEP_SIZE, pageItems.length);
    updateView();
  });

  paginationEl.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (!(target instanceof HTMLButtonElement) || target.disabled) return;

    const pageIndex = target.dataset.page;
    const direction = target.dataset.direction;

    if (pageIndex !== undefined) {
      currentPage = Number(pageIndex);
    } else if (direction === 'prev') {
      currentPage = Math.max(currentPage - 1, 0);
    } else if (direction === 'next') {
      currentPage = Math.min(currentPage + 1, Math.ceil(shuffledReferences.length / PAGE_SIZE) - 1);
    }

    visibleCount = Math.min(STEP_SIZE, getPageItems(currentPage).length);
    updateView();
    gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  updateView();
}

function initSpamProtection() {
  const triggers = document.querySelectorAll('#mailBtn, .reveal-mail');
  triggers.forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openContactModal(e.currentTarget);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openContactModal(e.currentTarget);
      }
    });
  });
}

function setModalBackgroundDisabled(disabled) {
  const elements = document.querySelectorAll('header, main, footer');
  if (disabled) {
    _modalBackground.length = 0;
    elements.forEach((el) => {
      _modalBackground.push([el, el.getAttribute('aria-hidden'), el.inert]);
      el.inert = true;
      el.setAttribute('aria-hidden', 'true');
    });
    return;
  }

  _modalBackground.forEach(([el, ariaHidden, wasInert]) => {
    el.inert = wasInert;
    if (ariaHidden === null) {
      el.removeAttribute('aria-hidden');
    } else {
      el.setAttribute('aria-hidden', ariaHidden);
    }
  });
  _modalBackground.length = 0;
}

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);
}

function openContactModal(trigger = document.activeElement) {
  const modal = document.getElementById('contact-modal');
  if (!modal) return;
  _lastModalTrigger = trigger instanceof HTMLElement ? trigger : null;
  clearTimeout(_closeModalTimer);
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  setModalBackgroundDisabled(true);
  lockScroll();
  requestAnimationFrame(() => modal.classList.add('active'));
  setTimeout(() => {
    const firstInput = modal.querySelector('.cmodal-input');
    const closeBtn = modal.querySelector('.cmodal-close');
    (firstInput || closeBtn)?.focus();
  }, TIMING.MODAL_FOCUS_DELAY);
}

function closeContactModal() {
  const modal = document.getElementById('contact-modal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  _closeModalTimer = setTimeout(() => {
    modal.style.display = 'none';
    setModalBackgroundDisabled(false);
    unlockScroll();
    const successEl = document.getElementById('cmodal-success');
    const form = document.getElementById('contact-form');
    const header = modal.querySelector('.cmodal-header');
    if (successEl) successEl.classList.remove('visible');
    if (form) form.style.display = '';
    if (header) header.style.display = '';
    if (_lastModalTrigger && document.contains(_lastModalTrigger)) {
      _lastModalTrigger.focus();
    }
  }, TIMING.MODAL_CLOSE_DELAY);
}

function getCsrfToken() {
  const existing = document.cookie.match(/(?:^|;\s*)_csrf=([^;]+)/)?.[1];
  if (existing) return existing;
  if (!window.crypto?.getRandomValues) return null;
  const arr = new Uint8Array(16);
  window.crypto.getRandomValues(arr);
  const token = Array.from(arr, x => x.toString(16).padStart(2, '0')).join('');
  const expires = new Date(Date.now() + 3600000).toUTCString();
  document.cookie = `_csrf=${token}; path=/; SameSite=Strict; Secure; Expires=${expires}`;
  return token;
}

function initContactModal() {
  const modal = document.getElementById('contact-modal');
  if (!modal) return;

  modal.querySelector('.cmodal-close').addEventListener('click', closeContactModal);
  modal.querySelector('.cmodal-backdrop').addEventListener('click', closeContactModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeContactModal();
    if (e.key !== 'Tab' || !modal.classList.contains('active')) return;

    const focusable = getFocusableElements(modal);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('cmodal-submit');
  const feedback = document.getElementById('cmodal-feedback');
  if (!form || !submitBtn || !feedback) return;

  function showError(msg) {
    feedback.textContent = msg;
    feedback.className = 'cmodal-feedback error';
    feedback.style.display = 'block';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    feedback.style.display = 'none';
    feedback.className = 'cmodal-feedback';
    form.querySelectorAll('.cmodal-input').forEach(f => f.classList.remove('has-error'));

    let valid = true;
    ['name', 'email', 'message'].forEach(fieldName => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (!field.value.trim()) {
        field.classList.add('has-error');
        valid = false;
      }
    });

    const emailField = form.querySelector('[name="email"]');
    if (emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      emailField.classList.add('has-error');
      valid = false;
    }

    const phoneField = form.querySelector('[name="phone"]');
    if (phoneField.value && !/^[0-9+() .-]{7,32}$/.test(phoneField.value.trim())) {
      phoneField.classList.add('has-error');
      valid = false;
    }

    if (!valid) {
      showError('Bitte alle Pflichtfelder korrekt ausfüllen.');
      return;
    }

    submitBtn.dataset.loading = 'true';

    try {
      const csrf = getCsrfToken();
      if (!csrf) {
        showError('Browser nicht unterstützt.');
        return;
      }

      const formData = new FormData(form);
      formData.set('_csrf', csrf);
      const res = await fetch('/send-mail.php', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        form.reset();
        const header = modal.querySelector('.cmodal-header');
        if (header) header.style.display = 'none';
        form.style.display = 'none';
        const successEl = document.getElementById('cmodal-success');
        if (successEl) {
          successEl.classList.add('visible');
          successEl.querySelector('.cmodal-success-close').onclick = closeContactModal;
        }
        setTimeout(closeContactModal, TIMING.AUTO_CLOSE_DELAY);
      } else {
        showError(data.message || 'Fehler beim Senden. Bitte erneut versuchen.');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      showError('Verbindungsfehler. Bitte erneut versuchen.');
    } finally {
      submitBtn.removeAttribute('data-loading');
    }
  });
}

function initAccordions() {
  const accItems = document.querySelectorAll('.accordion-item');
  const accHeaders = document.querySelectorAll('.accordion-header');
  accHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      if (!item) return;
      const isOpen = item.classList.contains('active');
      const content = item.querySelector('.accordion-content');
      const targetHeight = content ? content.scrollHeight : 0; // Read layout before any DOM writes
      accItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherContent = otherItem.querySelector('.accordion-content');
          const otherHeader = otherItem.querySelector('.accordion-header');
          if (otherContent) {
            otherContent.style.maxHeight = 0;
            otherContent.setAttribute('aria-hidden', 'true');
          }
          if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
        }
      });
      if (!isOpen) {
        item.classList.add('active');
        if (content) {
          content.style.maxHeight = targetHeight + "px";
          content.setAttribute('aria-hidden', 'false');
        }
        header.setAttribute('aria-expanded', 'true');
      } else {
        item.classList.remove('active');
        if (content) {
          content.style.maxHeight = 0;
          content.setAttribute('aria-hidden', 'true');
        }
        header.setAttribute('aria-expanded', 'false');
      }
    });
  });
}


function initLightbox() {
  const triggers = document.querySelectorAll('.lightbox-trigger');
  if (triggers.length === 0) return;

  let currentGallery = [];
  let currentIndex = 0;
  let modal, modalImg, prevBtn, nextBtn, closeBtn, counter;

  if (!document.getElementById('lightbox-modal')) {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox-modal';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Schliessen">&times;</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Vorheriges Bild">&lsaquo;</button>
      <button class="lightbox-nav lightbox-next" aria-label="Nächstes Bild">&rsaquo;</button>
      <div class="lightbox-image-container">
        <img class="lightbox-content" id="lightbox-img" src="" alt="Grossansicht">
        <div class="lightbox-counter" id="lightbox-counter"></div>
      </div>
    `;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Bildvorschau');
    document.body.appendChild(lightbox);
  }

  modal = document.getElementById('lightbox-modal');
  modalImg = document.getElementById('lightbox-img');
  prevBtn = modal.querySelector('.lightbox-prev');
  nextBtn = modal.querySelector('.lightbox-next');
  closeBtn = modal.querySelector('.lightbox-close');
  counter = document.getElementById('lightbox-counter');

  let _lastTrigger = null;

  function updateImage() {
    if (currentGallery.length === 0 || currentIndex < 0 || currentIndex >= currentGallery.length) return;
    modalImg.style.opacity = 0;
    setTimeout(() => {
      modalImg.src = currentGallery[currentIndex];
      modalImg.style.opacity = 1;
    }, TIMING.LIGHTBOX_FADE);
    if (currentGallery.length > 1) {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
      counter.style.display = 'block';
      counter.textContent = `${currentIndex + 1} / ${currentGallery.length}`;
    } else {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      counter.style.display = 'none';
    }
  }

  function closeLightbox() {
    modal.classList.remove('active');
    const returnFocus = _lastTrigger;
    _lastTrigger = null;
    setTimeout(() => {
      modal.style.display = 'none';
      currentGallery = [];
      currentIndex = 0;
      if (returnFocus) returnFocus.focus();
    }, TIMING.CLOSE_OVERLAY_DELAY);
  }

  function showNext() {
    if (currentGallery.length <= 1) return;
    currentIndex = (currentIndex + 1) % currentGallery.length;
    updateImage();
  }

  function showPrev() {
    if (currentGallery.length <= 1) return;
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    updateImage();
  }

  function openLightbox(trigger) {
    currentGallery = [];
    currentIndex = 0;

    if (trigger.dataset.gallery) {
      try {
        const parsed = JSON.parse(trigger.dataset.gallery);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentGallery = parsed;
        } else {
          console.warn('[Lightbox] data-gallery parsed but is empty or not an array:', trigger);
          return;
        }
      } catch (e) {
        console.warn('[Lightbox] Failed to parse data-gallery JSON:', e, trigger);
        return;
      }
    } else {
      const src = trigger.dataset.src || trigger.src;
      if (src) {
        currentGallery = [src];
      } else {
        console.warn('[Lightbox] Trigger has no data-src, data-gallery, or src attribute:', trigger);
        return;
      }
    }

    if (currentGallery.length > 0) {
      currentIndex = parseInt(trigger.dataset.galleryIndex, 10) || 0;
      modal.style.display = 'flex';
      updateImage();
      setTimeout(() => {
        modal.classList.add('active');
        closeBtn.focus();
      }, TIMING.LIGHTBOX_OPEN_DELAY);
    }
  }

  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      _lastTrigger = trigger;
      openLightbox(trigger);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showNext();
  });

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showPrev();
  });

  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('active')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    }
  });

  let touchStartX = 0;
  let touchEndX = 0;

  modal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  modal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) showNext();
    if (touchEndX > touchStartX + swipeThreshold) showPrev();
  }, { passive: true });
}

function initGradientIcons() {
  const colors = ['#FFC700', '#FF4D80', '#A64DFF', '#00D2FF'];

  function getRandomPair() {
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    let color2 = colors[Math.floor(Math.random() * colors.length)];
    while (color2 === color1) {
      color2 = colors[Math.floor(Math.random() * colors.length)];
    }
    return [color1, color2];
  }

  document.querySelectorAll('.gradient-icon').forEach((icon) => {
    const [color1, color2] = getRandomPair();
    icon.style.setProperty('--gradient-color-1', color1);
    icon.style.setProperty('--gradient-color-2', color2);
  });
}
