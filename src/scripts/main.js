/**
 * www.nigredo.ch - Main Script
 * Handles Navigation, Animations, Lightbox Gallery, and Spam Protection.
 */

const TIMING = {
  LIGHTBOX_INIT_DELAY:  100,
  IDLE_FALLBACK_DELAY:  200,
  IDLE_TIMEOUT:        1500,
  ANALYTICS_TIMEOUT:   3000,
  ANALYTICS_FALLBACK_DELAY: 1500,
  CLOSE_OVERLAY_DELAY:  300,
  HERO_GLOW_DELAY:     1000,
  LIGHTBOX_FADE:        150,
  LIGHTBOX_OPEN_DELAY:   10,
};

// iOS Safari: body.overflow='hidden' verhindert Scrollen nicht zuverlässig.
// Lock-Depth-Counter hält überlappende Scroll-Sperren stabil.
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

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFaqAnchorNavigation();
  initScrollAnimations();
  if (document.getElementById('contact-form')) initContactForm();
  if (document.querySelector('.accordion-header')) initAccordions();
  if (document.querySelector('.lightbox-trigger')) setTimeout(initLightbox, TIMING.LIGHTBOX_INIT_DELAY);
  runWhenIdle(() => {
    initCardSpotlight();
    initMagneticButtons();
    if (document.querySelector('.gradient-icon')) initGradientIcons();
    initAnalytics();
  }, TIMING.IDLE_TIMEOUT);
  setTimeout(() => {
    document.querySelectorAll('.hero-glow').forEach(el => el.classList.add('animated'));
  }, TIMING.HERO_GLOW_DELAY);
});

function initFaqAnchorNavigation() {
  const faqNavLinks = Array.from(document.querySelectorAll('.faq-article__nav a[href^="#"]'));
  if (faqNavLinks.length === 0) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getAnchorOffset() {
    const floatingHeader = document.querySelector('.floating-header');
    const headerHeight = floatingHeader ? floatingHeader.getBoundingClientRect().height : 0;
    return Math.ceil(headerHeight + 24);
  }

  function scrollToHash(hash, updateHistory = false) {
    if (!hash || hash === '#') return;

    const target = document.querySelector(hash);
    if (!(target instanceof HTMLElement)) return;

    const top = Math.max(
      0,
      Math.round(target.getBoundingClientRect().top + window.scrollY - getAnchorOffset())
    );

    if (updateHistory) {
      if (window.location.hash === hash) {
        history.replaceState(null, '', hash);
      } else {
        history.pushState(null, '', hash);
      }
    }

    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }

  faqNavLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      event.preventDefault();
      scrollToHash(href, true);
    });
  });

  window.addEventListener('hashchange', () => {
    if (!document.querySelector('.faq-article')) return;
    requestAnimationFrame(() => scrollToHash(window.location.hash, false));
  });

  if (window.location.hash) {
    requestAnimationFrame(() => scrollToHash(window.location.hash, false));
  }
}

function runWhenIdle(callback, timeout = TIMING.IDLE_TIMEOUT, fallbackDelay = TIMING.IDLE_FALLBACK_DELAY) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }
  setTimeout(callback, Math.min(timeout, fallbackDelay));
}

function initNavigation() {
  const menuBtn = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const header = document.querySelector('header');
  const desktopNavQuery = window.matchMedia('(min-width: 981px)');

  if (menuBtn && navLinks && header) {
    function syncMenuButtonState(expanded) {
      menuBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', expanded ? 'Menü schliessen' : 'Menü öffnen');
    }

    function closeNav() {
      const wasOpen = navLinks.classList.contains('mobile-active');
      navLinks.classList.remove('mobile-active');
      syncMenuButtonState(false);
      if (wasOpen) unlockScroll();
      header.classList.remove('menu-open');
    }

    function openNav() {
      navLinks.classList.add('mobile-active');
      syncMenuButtonState(true);
      lockScroll();
      header.classList.add('menu-open');
    }

    syncMenuButtonState(false);

    menuBtn.addEventListener('click', () => {
      if (navLinks.classList.contains('mobile-active')) {
        closeNav();
      } else {
        openNav();
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('mobile-active')) {
        closeNav();
        menuBtn.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.classList.contains('mobile-active')) return;
      if (e.target instanceof Node && header.contains(e.target)) return;
      closeNav();
    });

    desktopNavQuery.addEventListener('change', (e) => {
      if (e.matches) closeNav();
    });
  }
}

function initScrollAnimations() {
  const elements = Array.from(document.querySelectorAll('.fade-up'));
  if (elements.length === 0) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  document.documentElement.classList.add('js-reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
  });

  const immediateRevealLine = window.innerHeight * 0.9;
  elements.forEach((element) => {
    if (element.getBoundingClientRect().top < immediateRevealLine) {
      element.classList.add('visible');
    } else {
      observer.observe(element);
    }
  });
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

  cards.forEach((card) => {
    let rafPending = false;
    let pointerX = 0;
    let pointerY = 0;

    card.addEventListener('pointermove', (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (rafPending) return;
      rafPending = true;

      requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${pointerX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${pointerY - rect.top}px`);
        rafPending = false;
      });
    }, { passive: true });
  });
}

function getCsrfToken() {
  const existing = document.cookie.match(/(?:^|;\s*)_csrf=([^;]+)/)?.[1];
  if (existing) return existing;
  if (!window.crypto?.getRandomValues) return null;
  const arr = new Uint8Array(16);
  window.crypto.getRandomValues(arr);
  const token = Array.from(arr, x => x.toString(16).padStart(2, '0')).join('');
  const expires = new Date(Date.now() + 3600000).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `_csrf=${token}; path=/; SameSite=Strict${secure}; Expires=${expires}`;
  return token;
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');
  const feedback = document.getElementById('contact-feedback');
  const success = document.getElementById('contact-success');
  const intro = document.querySelector('.contact-form-card__intro');
  const divider = document.querySelector('.contact-form-card__divider');
  const resetBtn = document.getElementById('contact-reset');
  if (!form || !submitBtn || !feedback || !success) return;

  function showError(msg) {
    feedback.textContent = msg;
    feedback.hidden = false;
  }

  function clearFieldErrors() {
    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
      field.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.contact-form__field-error').forEach((error) => {
      error.hidden = true;
    });
  }

  function markInvalid(field) {
    field.setAttribute('aria-invalid', 'true');
    const errorId = field.getAttribute('aria-describedby');
    const error = errorId ? document.getElementById(errorId) : null;
    if (error) error.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    feedback.hidden = true;
    clearFieldErrors();

    let valid = true;
    let firstInvalid = null;
    ['name', 'email', 'message'].forEach(fieldName => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (!field.value.trim()) {
        markInvalid(field);
        if (!firstInvalid) firstInvalid = field;
        valid = false;
      }
    });

    const emailField = form.querySelector('[name="email"]');
    if (emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      markInvalid(emailField);
      if (!firstInvalid) firstInvalid = emailField;
      valid = false;
    }

    const phoneField = form.querySelector('[name="phone"]');
    if (phoneField.value && !/^[0-9+() .-]{7,32}$/.test(phoneField.value.trim())) {
      markInvalid(phoneField);
      if (!firstInvalid) firstInvalid = phoneField;
      valid = false;
    }

    if (!valid) {
      showError('Bitte prüfe die markierten Felder.');
      firstInvalid?.focus();
      return;
    }

    submitBtn.dataset.loading = 'true';
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');

    try {
      const csrf = getCsrfToken();
      if (!csrf) {
        showError('Browser nicht unterstützt.');
        return;
      }

      const formData = new FormData(form);
      formData.set('_csrf', csrf);
      const res = await fetch('/send-mail.php', { method: 'POST', body: formData });
      const contentType = res.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(`Unexpected response type: ${contentType || 'unknown'}${rawText ? `; body starts with: ${rawText.slice(0, 120)}` : ''}`);
      }

      if (res.ok && data.success) {
        form.reset();
        form.hidden = true;
        if (intro) intro.hidden = true;
        if (divider) divider.hidden = true;
        success.hidden = false;
        resetBtn?.focus();
      } else {
        showError(data.message || 'Fehler beim Senden. Bitte erneut versuchen.');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      showError('Verbindungsfehler. Bitte erneut versuchen.');
    } finally {
      submitBtn.removeAttribute('data-loading');
      submitBtn.removeAttribute('aria-busy');
      submitBtn.disabled = false;
    }
  });

  resetBtn?.addEventListener('click', () => {
    success.hidden = true;
    if (intro) intro.hidden = false;
    if (divider) divider.hidden = false;
    form.hidden = false;
    feedback.hidden = true;
    clearFieldErrors();
    form.querySelector('[name="name"]')?.focus();
  });
}

function initAccordions() {
  const accItems = document.querySelectorAll('.accordion-item');
  const accHeaders = document.querySelectorAll('.accordion-header');

  accItems.forEach(item => {
    if (!item.classList.contains('active')) return;
    const content = item.querySelector('.accordion-content');
    const header = item.querySelector('.accordion-header');
    if (content) {
      content.style.maxHeight = `${content.scrollHeight}px`;
      content.setAttribute('aria-hidden', 'false');
    }
    if (header) header.setAttribute('aria-expanded', 'true');
  });

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
        <img class="lightbox-content" id="lightbox-img" alt="Bild in Grossansicht" decoding="async">
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
      modalImg.alt = currentGallery.length > 1
        ? `Bild ${currentIndex + 1} von ${currentGallery.length} in Grossansicht`
        : 'Bild in Grossansicht';
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
  const rootStyles = getComputedStyle(document.documentElement);
  const fallbackColors = ['#FFDA72', '#FF749E', '#FF3DBB', '#8B4DFF', '#4165FF', '#24D6E7'];
  const tokenNames = ['sun', 'coral', 'pink', 'violet', 'blue', 'cyan'];
  const colors = tokenNames.map((name, index) =>
    rootStyles.getPropertyValue(`--brand-${name}`).trim() || fallbackColors[index]
  );
  const adjacentPairs = colors.map((color, index) => [color, colors[(index + 1) % colors.length]]);

  function getRandomPair() {
    return adjacentPairs[Math.floor(Math.random() * adjacentPairs.length)];
  }

  document.querySelectorAll('.gradient-icon').forEach((icon) => {
    const [color1, color2] = getRandomPair();
    icon.style.setProperty('--gradient-color-1', color1);
    icon.style.setProperty('--gradient-color-2', color2);
  });
}

function initAnalytics() {
  const src = document.querySelector('meta[name="umami-src"]')?.content;
  const websiteId = document.querySelector('meta[name="umami-website-id"]')?.content;
  if (!src || !websiteId || document.querySelector(`script[src="${src}"]`)) return;

  runWhenIdle(() => {
    const script = document.createElement('script');
    script.defer = true;
    script.src = src;
    script.dataset.websiteId = websiteId;
    document.head.appendChild(script);
  }, TIMING.ANALYTICS_TIMEOUT, TIMING.ANALYTICS_FALLBACK_DELAY);
}

function initMagneticButtons() {
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!supportsHover || prefersReducedMotion) return;

  const STRENGTH_X = 0.2;
  const STRENGTH_Y = 0.3;
  const buttons = document.querySelectorAll('.btn-primary, .btn-ghost');

  buttons.forEach(btn => {
    let rafId = null;
    let targetX = 0;
    let targetY = 0;

    const apply = () => {
      rafId = null;
      btn.style.transform = `translate(${targetX}px, ${targetY}px) scale(1.02)`;
    };

    btn.addEventListener('mouseenter', () => {
      // Snappy follow while tracking the cursor (override the CSS spring).
      btn.style.transition = 'transform 0.15s ease-out';
      btn.style.willChange = 'transform';
    });

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      targetX = (e.clientX - rect.left - rect.width / 2) * STRENGTH_X;
      targetY = (e.clientY - rect.top - rect.height / 2) * STRENGTH_Y;
      if (rafId === null) rafId = requestAnimationFrame(apply);
    }, { passive: true });

    btn.addEventListener('mouseleave', () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // Hand styling back to CSS so the spring transition eases it home.
      btn.style.transition = '';
      btn.style.transform = '';
      btn.style.willChange = '';
    });
  });
}
