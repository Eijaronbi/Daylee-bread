// Daylee-bread Complete Smart Patch Script
(function() {
  'use strict';

  const CONFIG = {
    heroVideoSrc: '/Daylee-bread/assets/hero-video-new.mp4',
    logoSrc: '/Daylee-bread/assets/logo-new.jpg',
    meals: [
      {
        image: '/Daylee-bread/assets/breakfast-new.jpg',
        title: 'Breakfast',
        description: 'Akara and pap',
        time: '7am - 9am'
      },
      {
        image: '/Daylee-bread/assets/lunch-new.jpg',
        title: 'Afternoon',
        description: 'Rice, chicken and plantain',
        time: '1pm - 3pm'
      },
      {
        image: '/Daylee-bread/assets/dinner-new.jpg',
        title: 'Evening',
        description: 'Semo, vegetable soup, Eguisi and fish',
        time: '6pm - 7pm'
      }
    ]
  };

  const patchedElements = new Set();
  let slideshowInterval = null;

  // 1. Force Scroll to Top on Load (Stops footer jumping)
  function forceScrollTop() {
    if (!patchedElements.has('scroll-top')) {
      window.scrollTo(0, 0);
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      patchedElements.add('scroll-top');
    }
  }

  function runPatches() {
    forceScrollTop();
    patchHeroVideo();
    patchLogo();
    patchMealsSlideshow();
    fixNavigationLinks(); 
    hideWaitlistStats();
    fixResponsiveness();
  }

  // Improved Logo Patching (Absolute path and aggressive replacement)
  function patchLogo() {
    if (patchedElements.has('logo')) return;
    const nav = document.querySelector('nav, header');
    if (!nav) return;

    const newLogo = document.createElement('img');
    newLogo.src = CONFIG.logoSrc;
    newLogo.alt = 'DaylyBread';
    newLogo.style.cssText = 'width:42px;height:42px;object-fit:contain;border-radius:8px;display:block;';
    
    const brandLink = nav.querySelector('a');
    if (brandLink) {
      brandLink.innerHTML = ''; 
      brandLink.appendChild(newLogo);
      patchedElements.add('logo');
    }
  }

  // Navigation Link Fix (Intercepts Ecosystem/Community)
  function fixNavigationLinks() {
    const allLinks = document.querySelectorAll('a, button');
    
    allLinks.forEach(link => {
      const text = link.textContent?.trim().toLowerCase();
      
      if (text === 'ecosystem' || text === 'community') {
        link.onclick = (e) => {
          e.preventDefault();
          const targetKeyword = text === 'ecosystem' ? 'Ecosystem' : 'Community';
          const targetSection = findSectionByText(targetKeyword);
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };
      }
    });
    patchedElements.add('nav-links');
  }

  function findSectionByText(searchText) {
    const sections = document.querySelectorAll('section');
    for (const section of sections) {
      const headings = section.querySelectorAll('h1, h2, h3, h4');
      for (const h of headings) {
        if (h.textContent.includes(searchText)) return section;
      }
      if (section.textContent.includes(searchText)) return section;
    }
    return null;
  }

  function patchHeroVideo() {
    if (patchedElements.has('hero-video')) return;
    const sections = document.querySelectorAll('section');
    let heroSection = null;
    for (const section of sections) {
      if (section.textContent.includes('EAT') && section.textContent.includes('EARN')) {
        heroSection = section;
        break;
      }
    }
    if (!heroSection) return;

    const video = document.createElement('video');
    video.src = CONFIG.heroVideoSrc;
    video.autoplay = video.loop = video.muted = video.playsInline = true;
    video.className = 'hero-video-bg';
    video.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';

    const overlay = document.createElement('div');
    overlay.className = 'hero-overlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:1;';

    heroSection.style.position = 'relative';
    heroSection.style.overflow = 'hidden';
    heroSection.prepend(overlay);
    heroSection.prepend(video);
    patchedElements.add('hero-video');
  }

  function patchMealsSlideshow() {
    if (patchedElements.has('meals-slideshow')) return;
    const sections = document.querySelectorAll('section');
    let mealSection = null;
    for (const s of sections) {
      if (s.textContent.includes('Meal Plans') || s.textContent.includes('₦10,000')) {
        mealSection = s;
        break;
      }
    }
    if (!mealSection) return;

    const existingImages = mealSection.querySelectorAll('img');
    if (existingImages.length > 0) {
      const container = createSlideshow();
      existingImages[0].parentNode.replaceChild(container, existingImages[0]);
      for (let i = 1; i < existingImages.length; i++) existingImages[i].style.display = 'none';
    }
    patchedElements.add('meals-slideshow');
  }

  function createSlideshow() {
    const container = document.createElement('div');
    container.className = 'daylybread-slideshow';
    container.style.cssText = 'position:relative;width:100%;max-width:500px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);';
    CONFIG.meals.forEach((meal, index) => {
      const slide = document.createElement('div');
      slide.className = 'slideshow-slide';
      slide.style.cssText = `position:relative;display:${index === 0 ? 'block' : 'none'};`;
      slide.innerHTML = `<img src="${meal.image}" style="width:100%;height:350px;object-fit:cover;display:block;">
        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.9));padding:20px;color:white;">
          <h3 style="color:#ff6b35;margin:0;">${meal.title}</h3>
          <p style="margin:5px 0;">${meal.description}</p>
          <small style="color:#aaa;">${meal.time}</small>
        </div>`;
      container.appendChild(slide);
    });
    startSlideshow();
    return container;
  }

  function startSlideshow() {
    let current = 0;
    setInterval(() => {
      const slides = document.querySelectorAll('.slideshow-slide');
      if (slides.length) {
        slides[current].style.display = 'none';
        current = (current + 1) % slides.length;
        slides[current].style.display = 'block';
      }
    }, 4000);
  }

  function hideWaitlistStats() {
    const labels = ['Waitlisters', 'Tasks Completed', 'Cities'];
    document.querySelectorAll('div, p, span').forEach(el => {
      if (labels.some(l => el.textContent.includes(l))) {
        let parent = el.parentElement;
        if (parent && parent.textContent.length < 200) parent.style.display = 'none';
      }
    });
  }

  function fixResponsiveness() {
    if (patchedElements.has('resp')) return;
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) { .daylybread-slideshow img { height: 250px !important; } }
      html, body { max-width: 100vw; overflow-x: hidden; scroll-behavior: smooth; }
    `;
    document.head.appendChild(style);
    patchedElements.add('resp');
  }

  function init() {
    document.querySelectorAll('[autofocus]').forEach(el => el.blur());
    runPatches();
    [100, 500, 1000, 3000, 5000].forEach(d => setTimeout(runPatches, d));
    new MutationObserver(() => runPatches()).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
