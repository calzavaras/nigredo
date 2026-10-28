/**
 * www.nigredo.ch - Main Script
 * Navigation, Einblendungen, Lightbox, Kontaktformular und Analyse.
 */

const TIMING = {
  LIGHTBOX_INIT_DELAY:  100,
  IDLE_FALLBACK_DELAY:  200,
  IDLE_TIMEOUT:        1500,
  ANALYTICS_TIMEOUT:   3000,
  ANALYTICS_FALLBACK_DELAY: 1500,
  CLOSE_OVERLAY_DELAY:  300,
  LIGHTBOX_FADE:        150,
  LIGHTBOX_OPEN_DELAY:   10,
};

// iOS Safari: body.overflow='hidden' verhindert Scrollen nicht zuverlässig.
// Lock-Depth-Counter hält überlappende Scroll-Sperren stabil.
let _scrollLockY = 0;
let _lockDepth = 0;
let _scrollLockStyles = null;
function lockScroll() {
  if (_lockDepth === 0) {
    _scrollLockY = window.scrollY;
    _scrollLockStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${_scrollLockY}px`;
    document.body.style.width = '100%';
  }
  _lockDepth++;
}
function unlockScroll() {
  if (_lockDepth <= 0) return;
  _lockDepth--;
  if (_lockDepth === 0) {
    document.body.style.position = _scrollLockStyles.position;
    document.body.style.top = _scrollLockStyles.top;
    document.body.style.width = _scrollLockStyles.width;
    _scrollLockStyles = null;
    window.scrollTo(0, _scrollLockY);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHeaderScrollState();
  initFaqAnchorNavigation();
  initScrollAnimations();
  if (document.getElementById('contact-form')) initContactForm();
  if (document.querySelector('.lightbox-trigger')) setTimeout(initLightbox, TIMING.LIGHTBOX_INIT_DELAY);
  runWhenIdle(() => {
    initCardSpotlight();
    initMagneticButtons();
    initAnalytics();
  }, TIMING.IDLE_TIMEOUT);
});

function initHeaderScrollState() {
  const header = document.querySelector('.floating-header');
  const homeHero = document.querySelector('.home-hero');
  if (!header) return;

  header.classList.add('site-header-polish');
  if (homeHero) header.classList.add('home-header-polish');

  let rafPending = false;
  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 32);
    rafPending = false;
  }

  updateHeader();
  window.addEventListener('scroll', () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(updateHeader);
  }, { passive: true });
}

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

    let target;
    try {
      target = document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      // Ein ungültiges URL-Fragment darf die weitere Initialisierung nicht abbrechen.
      return;
    }
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
  if (prefersReducedMotion) {
    elements.forEach(el => el.classList.add('visible'));

    // Sanfte Überblendung ohne räumliche Bewegung auf allen Bildschirmgrössen.
    if (!('IntersectionObserver' in window) ||
        !('animate' in Element.prototype)) return;

    const targets = [...elements];

    const reveal = (element) => {
      element.animate([{ opacity: 0.55 }, { opacity: 1 }], {
        duration: 240,
        easing: 'ease-out',
      });
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    const immediateRevealLine = window.innerHeight * 0.9;
    targets.forEach((element) => {
      if (element.getBoundingClientRect().top < immediateRevealLine) {
        reveal(element);
      } else {
        observer.observe(element);
      }
    });
    return;
  }

  if (!('IntersectionObserver' in window)) {
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
      // Let the initial state paint before starting the entrance transition.
      if (document.visibilityState === 'hidden') {
        element.classList.add('visible');
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => element.classList.add('visible')));
      }
    } else {
      observer.observe(element);
    }
  });
}

function initCardSpotlight() {
  const cards = Array.from(document.querySelectorAll('.card'));
  if (cards.length === 0) return;

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
    if (submitBtn.disabled) return;

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
    emailField.value = emailField.value.trim();
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
  let imageTimer = null;
  let closeTimer = null;
  let openTimer = null;
  let isOpen = false;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateImage() {
    if (currentGallery.length === 0 || currentIndex < 0 || currentIndex >= currentGallery.length) return;
    window.clearTimeout(imageTimer);
    const src = currentGallery[currentIndex];
    const alt = currentGallery.length > 1
      ? `Bild ${currentIndex + 1} von ${currentGallery.length} in Grossansicht`
      : (_lastTrigger?.querySelector('img')?.getAttribute('alt') || _lastTrigger?.getAttribute('alt') || 'Bild in Grossansicht');
    modalImg.style.opacity = 0;
    imageTimer = window.setTimeout(() => {
      if (!isOpen) return;
      modalImg.src = src;
      modalImg.alt = alt;
      modalImg.style.opacity = 1;
    }, prefersReducedMotion ? 0 : TIMING.LIGHTBOX_FADE);
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
    if (!isOpen) return;
    isOpen = false;
    window.clearTimeout(openTimer);
    window.clearTimeout(imageTimer);
    modal.classList.remove('active');
    unlockScroll();
    const returnFocus = _lastTrigger;
    _lastTrigger = null;
    if (returnFocus) returnFocus.focus({ preventScroll: true });
    closeTimer = window.setTimeout(() => {
      modal.style.display = 'none';
      currentGallery = [];
      currentIndex = 0;
      modalImg.removeAttribute('src');
    }, prefersReducedMotion ? 0 : TIMING.CLOSE_OVERLAY_DELAY);
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
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(src => typeof src === 'string' && src.length > 0)) {
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
      window.clearTimeout(closeTimer);
      window.clearTimeout(openTimer);
      _lastTrigger = trigger;
      currentIndex = Math.max(0, Math.min(currentGallery.length - 1, parseInt(trigger.dataset.galleryIndex, 10) || 0));
      if (!isOpen) lockScroll();
      isOpen = true;
      modal.style.display = 'flex';
      updateImage();
      openTimer = window.setTimeout(() => {
        modal.classList.add('active');
        closeBtn.focus();
      }, TIMING.LIGHTBOX_OPEN_DELAY);
    }
  }

  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
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
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (e.key === 'ArrowRight') showNext();
      else showPrev();
    }
    if (e.key === 'Tab') {
      const buttons = [closeBtn, prevBtn, nextBtn].filter(button => button.style.display !== 'none');
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
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
    let pointerX = 0;
    let pointerY = 0;

    const apply = () => {
      rafId = null;
      const rect = btn.getBoundingClientRect();
      const targetX = (pointerX - rect.left - rect.width / 2) * STRENGTH_X;
      const targetY = (pointerY - rect.top - rect.height / 2) * STRENGTH_Y;
      btn.style.transform = `translate(${targetX}px, ${targetY}px) scale(1.02)`;
    };

    btn.addEventListener('mouseenter', () => {
      // Snappy follow while tracking the cursor (override the CSS spring).
      btn.style.transition = 'transform 0.15s ease-out';
      btn.style.willChange = 'transform';
    });

    btn.addEventListener('mousemove', (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
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
