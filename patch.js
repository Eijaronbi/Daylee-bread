(function() {
  'use strict';

  const script = document.currentScript || Array.from(document.scripts).find((item) => item.src && item.src.includes('/patch.js'));
  const scriptUrl = script?.src ? new URL(script.src, window.location.href) : new URL(window.location.href);
  const BASE_PATH = scriptUrl.pathname.replace(/\/patch\.js$/, '') || '';
  const ROOT_URL = `${window.location.origin}${BASE_PATH || ''}/`.replace(/([^:]\/)\/+/g, '$1');
  const SECTION_STORAGE_KEY = 'daylybread:pending-section';
  const PATCH_STYLE_ID = 'daylybread-runtime-patch-styles';
  const HERO_IFRAME_ID = 'daylybread-hero-iframe';
  const HERO_OVERLAY_ID = 'daylybread-hero-overlay';
  const SLIDESHOW_ID = 'daylybread-meals-slideshow';
  const HEADER_LOGO_CLASS = 'daylybread-header-logo';
  const patchedElements = new Set();
  let slideshowTimer = null;
  let lastUrl = location.href;

  function resolveAssetPath(fileName) {
    return `${BASE_PATH}/assets/${fileName}`;
  }

  const CONFIG = {
    youtubeId: 'wvZeYWiL-J8',
    logoFileName: 'logo-new.jpg',
    logoSrc: resolveAssetPath('logo-new.jpg'),
    meals: [
      {
        imageFileName: 'breakfast-new.jpg',
        image: resolveAssetPath('breakfast-new.jpg'),
        title: 'Breakfast',
        description: 'Akara and pap',
        time: '7am - 9am'
      },
      {
        imageFileName: 'lunch-new.jpg',
        image: resolveAssetPath('lunch-new.jpg'),
        title: 'Afternoon',
        description: 'Rice, chicken and plantain',
        time: '1pm - 3pm'
      },
      {
        imageFileName: 'dinner-new.jpg',
        image: resolveAssetPath('dinner-new.jpg'),
        title: 'Evening',
        description: 'Semo, vegetable soup, Eguisi and fish',
        time: '6pm - 7pm'
      }
    ],
    sectionTargets: {
      home: ['EAT', 'EARN', 'BELONG'],
      ecosystem: ['The Ecosystem', 'Ecosystem'],
      community: ['Join Our Community', 'Community'],
      roadmap: ['Roadmap'],
      'how it works': ['How It Works', 'How it Works'],
      'meal plans': ['Meal Plans', 'Our Meal Plans']
    }
  };

  function normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function isHomePath(pathname = location.pathname) {
    const trimmedBase = BASE_PATH.replace(/\/$/, '');
    return pathname === `${trimmedBase}` || pathname === `${trimmedBase}/` || pathname === '/' || pathname === '';
  }

  function ensureScrollTop(force = false) {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    if (force || !sessionStorage.getItem('daylybread:did-scroll-top')) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      sessionStorage.setItem('daylybread:did-scroll-top', 'true');
      setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 60);
      setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 240);
    }
  }

  function findSectionByMarkers(markers) {
    const sections = Array.from(document.querySelectorAll('section'));
    return sections.find((section) => {
      const text = section.textContent || '';
      return markers.every((marker) => text.includes(marker));
    }) || null;
  }

  function findSectionByName(name) {
    const markers = CONFIG.sectionTargets[name] || [name];
    const sections = Array.from(document.querySelectorAll('section'));

    for (const marker of markers) {
      const direct = sections.find((section) => (section.textContent || '').includes(marker));
      if (direct) return direct;
    }

    const heading = Array.from(document.querySelectorAll('h1, h2, h3, h4')).find((node) => {
      const text = node.textContent || '';
      return markers.some((marker) => text.includes(marker));
    });

    return heading ? heading.closest('section') || heading : null;
  }

  function clearDuplicatePatchedLogos() {
    document.querySelectorAll('.patched-logo').forEach((node) => node.remove());
    document.querySelectorAll(`img[src*="${CONFIG.logoSrc.split('/').pop()}"]`).forEach((img) => {
      if (!img.closest('header, nav')) {
        img.remove();
      }
    });
  }

  function patchHeaderLogo() {
    const header = document.querySelector('header, nav');
    if (!header) return;

    clearDuplicatePatchedLogos();

    const brand = Array.from(header.querySelectorAll('a, div, button')).find((node) =>
      normalizeText(node.textContent).includes('daylybread')
    );

    if (!brand) return;

    let logo = brand.querySelector(`img.${HEADER_LOGO_CLASS}`);
    if (!logo) {
      logo = document.createElement('img');
      logo.className = HEADER_LOGO_CLASS;
      logo.alt = 'DaylyBread logo';
      logo.decoding = 'async';
      logo.loading = 'eager';
      logo.src = CONFIG.logoSrc;
      const oldIcon = brand.querySelector('svg, img');
      if (oldIcon) {
        oldIcon.replaceWith(logo);
      } else {
        brand.prepend(logo);
      }
    }

    logo.src = CONFIG.logoSrc;
  }

  function patchHeroVideo() {
    const heroSection = findSectionByMarkers(['EAT', 'EARN']) || findSectionByName('home');
    if (!heroSection) return;

    const existingFrame = heroSection.querySelector(`#${HERO_IFRAME_ID}`);
    const existingOverlay = heroSection.querySelector(`#${HERO_OVERLAY_ID}`);
    heroSection.querySelectorAll('video.hero-video-bg').forEach((node) => node.remove());

    if (!existingFrame) {
      const iframe = document.createElement('iframe');
      iframe.id = HERO_IFRAME_ID;
      iframe.title = 'DaylyBread hero video';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.src = `https://www.youtube.com/embed/${CONFIG.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${CONFIG.youtubeId}&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3`;
      heroSection.prepend(iframe);
    }

    if (!existingOverlay) {
      const overlay = document.createElement('div');
      overlay.id = HERO_OVERLAY_ID;
      heroSection.prepend(overlay);
    }

    heroSection.classList.add('daylybread-patched-hero');
    Array.from(heroSection.children).forEach((child) => {
      if (child.id !== HERO_IFRAME_ID && child.id !== HERO_OVERLAY_ID) {
        child.classList.add('daylybread-hero-content');
      }
    });
  }

  function buildSlideshow() {
    const container = document.createElement('div');
    container.id = SLIDESHOW_ID;
    container.className = 'daylybread-slideshow';

    const stage = document.createElement('div');
    stage.className = 'daylybread-slideshow-stage';
    container.appendChild(stage);

    const dots = document.createElement('div');
    dots.className = 'daylybread-slideshow-dots';

    CONFIG.meals.forEach((meal, index) => {
      const slide = document.createElement('article');
      slide.className = 'daylybread-slide';
      slide.dataset.index = String(index);
      slide.hidden = index !== 0;

      slide.innerHTML = `
        <img src="${meal.image}" alt="${meal.title}" loading="eager" />
        <div class="daylybread-slide-overlay">
          <p class="daylybread-slide-kicker">${meal.time}</p>
          <h3>${meal.title}</h3>
          <p>${meal.description}</p>
        </div>
      `;

      stage.appendChild(slide);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'daylybread-slideshow-dot';
      dot.setAttribute('aria-label', `Show ${meal.title}`);
      dot.dataset.index = String(index);
      if (index === 0) dot.setAttribute('aria-current', 'true');
      dot.addEventListener('click', () => showSlide(index));
      dots.appendChild(dot);
    });

    container.appendChild(dots);
    return container;
  }

  function showSlide(index) {
    const slides = Array.from(document.querySelectorAll('.daylybread-slide'));
    const dots = Array.from(document.querySelectorAll('.daylybread-slideshow-dot'));
    if (!slides.length) return;

    slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== index;
    });

    dots.forEach((dot, dotIndex) => {
      if (dotIndex === index) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  function startSlideshow() {
    if (slideshowTimer) {
      clearInterval(slideshowTimer);
    }

    slideshowTimer = setInterval(() => {
      const slides = Array.from(document.querySelectorAll('.daylybread-slide'));
      if (!slides.length) return;
      const currentIndex = slides.findIndex((slide) => !slide.hidden);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % slides.length : 0;
      showSlide(nextIndex);
    }, 4200);
  }

  function patchMealsSlideshow() {
    const mealSection = findSectionByName('meal plans');
    if (!mealSection) return;

    const existing = mealSection.querySelector(`#${SLIDESHOW_ID}`);
    if (!existing) {
      const brokenImage = Array.from(mealSection.querySelectorAll('img')).find((img) => {
        const src = img.getAttribute('src') || '';
        return src.includes('/images/meal-plan.jpg') || normalizeText(img.alt).includes('meal plan');
      });

      const slideshow = buildSlideshow();
      if (brokenImage) {
        brokenImage.replaceWith(slideshow);
      } else {
        const headingBlock = mealSection.querySelector('h2, h3')?.parentElement || mealSection.firstElementChild || mealSection;
        headingBlock.insertAdjacentElement('afterend', slideshow);
      }
    }

    mealSection.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.includes('/images/meal-plan.jpg')) {
        img.closest('div')?.remove();
      }
    });

    startSlideshow();
  }

  function hideWaitlistStats() {
    const statLabels = ['Waitlisters', 'Tasks Completed', 'Cities', 'Taskers'];
    const statBlocks = [];

    document.querySelectorAll('p, span, div, h3, h4').forEach((node) => {
      const text = (node.textContent || '').trim();
      if (statLabels.includes(text)) {
        const block = node.closest('div');
        if (block) statBlocks.push(block);
      }
    });

    statBlocks.forEach((block) => {
      block.style.display = 'none';
    });

    const rows = Array.from(document.querySelectorAll('div')).filter((node) => {
      const text = node.textContent || '';
      return statLabels.filter((label) => text.includes(label)).length >= 2;
    });

    rows.forEach((row) => {
      row.style.display = 'none';
    });
  }

  function goToSection(name) {
    const target = findSectionByName(name);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (name === 'home') {
        ensureScrollTop(true);
      }
      return true;
    }
    return false;
  }

  function buildRouteUrl(pathname = '/') {
    const cleanPath = pathname === '/' ? '' : pathname.replace(/^\//, '');
    return new URL(cleanPath, ROOT_URL).href;
  }

  function navigateToRoute(pathname = '/') {
    const nextUrl = buildRouteUrl(pathname);
    if (location.href !== nextUrl) {
      window.location.assign(nextUrl);
    }
  }

  function navigateToHomeSection(name) {
    sessionStorage.setItem(SECTION_STORAGE_KEY, name);
    const homeUrl = new URL(ROOT_URL, window.location.origin);
    if (location.href !== homeUrl.href) {
      window.location.assign(homeUrl.href);
    } else {
      setTimeout(() => goToSection(name), 100);
    }
  }

  function fixNavigationLinks() {
    const sectionNames = ['home', 'ecosystem', 'community', 'how it works', 'meal plans'];
    const routeNames = {
      home: '/',
      waitlist: '/waitlist',
      roadmap: '/roadmap'
    };

    document.querySelectorAll('a, button').forEach((link) => {
      if (link.dataset.daylybreadPatchedNav === 'true') return;

      const text = normalizeText(link.textContent);
      const href = normalizeText(link.getAttribute?.('href'));
      const matchedSection = sectionNames.find((name) => text === name || text.includes(name));
      const matchedRoute = Object.keys(routeNames).find((name) => (
        text === name || text.includes(name) || href === routeNames[name]
      ));

      if (!matchedSection && !matchedRoute) return;

      link.dataset.daylybreadPatchedNav = 'true';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (matchedRoute) {
          if (matchedRoute === 'home') {
            if (isHomePath()) {
              ensureScrollTop(true);
            } else {
              navigateToRoute('/');
            }
            return;
          }

          navigateToRoute(routeNames[matchedRoute]);
          return;
        }

        if (isHomePath()) {
          goToSection(matchedSection);
        } else {
          navigateToHomeSection(matchedSection);
        }
      }, true);
    });
  }

  function applyPendingSectionNavigation() {
    const pending = sessionStorage.getItem(SECTION_STORAGE_KEY);
    if (!pending || !isHomePath()) return;

    if (pending === 'home') {
      ensureScrollTop(true);
      sessionStorage.removeItem(SECTION_STORAGE_KEY);
      return;
    }

    const target = findSectionByName(pending);
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
      sessionStorage.removeItem(SECTION_STORAGE_KEY);
    }
  }

  function fixResponsiveness() {
    if (document.getElementById(PATCH_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = PATCH_STYLE_ID;
    style.textContent = `
      html, body {
        max-width: 100%;
        overflow-x: hidden;
        scroll-behavior: smooth;
      }

      .daylybread-patched-hero {
        position: relative !important;
        overflow: hidden !important;
        min-height: 100svh !important;
        isolation: isolate;
        background:
          radial-gradient(circle at top, rgba(255, 137, 90, 0.28), transparent 38%),
          linear-gradient(180deg, rgba(16, 16, 16, 0.18) 0%, rgba(10, 10, 10, 0.52) 100%) !important;
      }

      #${HERO_IFRAME_ID} {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        width: 120% !important;
        height: 120% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        transform: translate(-50%, -50%) !important;
        border: 0 !important;
        pointer-events: none !important;
        z-index: 0 !important;
        filter: brightness(1.12) saturate(1.04) contrast(1.01);
      }

      #${HERO_OVERLAY_ID} {
        position: absolute !important;
        inset: 0 !important;
        background:
          linear-gradient(180deg, rgba(7, 7, 7, 0.22) 0%, rgba(7, 7, 7, 0.5) 60%, rgba(7, 7, 7, 0.72) 100%) !important;
        z-index: 1 !important;
      }

      .daylybread-hero-content {
        position: relative !important;
        z-index: 2 !important;
      }

      .${HEADER_LOGO_CLASS} {
        width: 42px !important;
        height: 42px !important;
        border-radius: 12px !important;
        object-fit: cover !important;
        flex-shrink: 0;
      }

      #${SLIDESHOW_ID} {
        width: 100%;
        max-width: 64rem;
        margin: 0 auto 3rem;
        border-radius: 1.5rem;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(20,20,20,0.92);
        box-shadow: 0 24px 80px rgba(0,0,0,0.42);
      }

      .daylybread-slideshow-stage {
        position: relative;
      }

      .daylybread-slide {
        position: relative;
      }

      .daylybread-slide[hidden] {
        display: none !important;
      }

      .daylybread-slide img {
        width: 100%;
        height: clamp(260px, 48vw, 520px);
        object-fit: cover;
        display: block;
      }

      .daylybread-slide-overlay {
        position: absolute;
        inset: auto 0 0 0;
        padding: 1.5rem;
        background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.82) 100%);
      }

      .daylybread-slide-kicker {
        margin: 0 0 0.35rem;
        color: #ff8a65;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .daylybread-slide-overlay h3 {
        margin: 0 0 0.25rem;
        font-size: clamp(1.4rem, 3vw, 2rem);
        font-weight: 800;
        color: #fff;
      }

      .daylybread-slide-overlay p:last-child {
        margin: 0;
        color: rgba(255,255,255,0.82);
      }

      .daylybread-slideshow-dots {
        display: flex;
        justify-content: center;
        gap: 0.65rem;
        padding: 1rem 1rem 1.25rem;
      }

      .daylybread-slideshow-dot {
        width: 0.78rem;
        height: 0.78rem;
        border: 0;
        border-radius: 999px;
        background: rgba(255,255,255,0.32);
      }

      .daylybread-slideshow-dot[aria-current='true'] {
        background: #ff5722;
        transform: scale(1.08);
      }

      footer {
        overflow-x: hidden;
      }

      footer ul,
      footer .space-y-2,
      footer p,
      footer a {
        word-break: break-word;
      }

      footer .grid {
        align-items: start;
      }

      footer .flex.gap-6 {
        flex-wrap: wrap;
        justify-content: center;
      }

      @media (max-width: 900px) {
        footer .gap-12 {
          gap: 2rem !important;
        }
      }

      @media (max-width: 768px) {
        footer {
          text-align: center;
        }

        footer .grid {
          gap: 2rem !important;
        }

        footer .flex.items-center.gap-3,
        footer .flex.gap-3,
        footer .pt-8.border-t.border-white\/5.flex.flex-col.sm\:flex-row.justify-between.items-center.gap-4 {
          justify-content: center;
        }

        .${HEADER_LOGO_CLASS} {
          width: 38px !important;
          height: 38px !important;
        }

        #${SLIDESHOW_ID} {
          border-radius: 1.15rem;
          margin-bottom: 2rem;
        }

        .daylybread-slide-overlay {
          padding: 1rem;
        }
      }

      @media (max-width: 640px) {
        #${HERO_IFRAME_ID} {
          width: 165% !important;
          height: 115% !important;
        }

        .daylybread-slide img {
          height: 280px;
        }

        footer .grid,
        footer .flex-wrap {
          row-gap: 1.5rem;
        }

        footer .pt-8.border-t.border-white\/5.flex.flex-col.sm\:flex-row.justify-between.items-center.gap-4 > * {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function runPatches() {
    ensureScrollTop();
    fixResponsiveness();
    patchHeaderLogo();
    patchHeroVideo();
    patchMealsSlideshow();
    hideWaitlistStats();
    fixNavigationLinks();
    applyPendingSectionNavigation();
    patchedElements.add('ran');
  }

  function onUrlChange() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    sessionStorage.removeItem('daylybread:did-scroll-top');
    ensureScrollTop(true);
    setTimeout(runPatches, 80);
    setTimeout(applyPendingSectionNavigation, 240);
  }

  function init() {
    fixResponsiveness();
    runPatches();

    [120, 320, 650, 1200, 2200].forEach((delay) => setTimeout(runPatches, delay));

    const observer = new MutationObserver(() => {
      onUrlChange();
      runPatches();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('load', () => {
      ensureScrollTop(true);
      runPatches();
      applyPendingSectionNavigation();
    });

    window.addEventListener('popstate', () => {
      onUrlChange();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
