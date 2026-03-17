// DaylyBread Website Patch Script
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

  function runPatches() {
    // TIMING FIX: Ensure main components exist before running
    const header = document.querySelector('header, nav');
    const hero = document.querySelector('section');
    if (!header || !hero) return;

    patchHeroVideo();
    patchLogo();
    patchMealsSlideshow();
    fixNavigationLinks();
    hideWaitlistStats(); // Kept your existing logic
    fixResponsiveness();
  }

  // 1. Add video background to hero section
  function patchHeroVideo() {
    if (patchedElements.has('hero-video')) return;
    
    const sections = document.querySelectorAll('section');
    let heroSection = null;
    
    for (const section of sections) {
      const text = section.textContent;
      if (text.includes('EAT') && text.includes('EARN') && text.includes('BELONG')) {
        heroSection = section;
        break;
      }
    }
    
    if (!heroSection) return;
    
    const video = document.createElement('video');
    video.src = CONFIG.heroVideoSrc;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.className = 'hero-video-bg';
    video.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';

    const overlay = document.createElement('div');
    overlay.className = 'hero-overlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);z-index:1;';

    heroSection.style.cssText += 'position:relative;overflow:hidden;min-height:100vh;';
    heroSection.insertBefore(overlay, heroSection.firstChild);
    heroSection.insertBefore(video, heroSection.firstChild);

    const children = heroSection.querySelectorAll(':scope > *:not(video):not(.hero-overlay)');
    children.forEach(child => {
      child.style.position = 'relative';
      child.style.zIndex = '2';
    });

    patchedElements.add('hero-video');
  }

  // 2. Replace logo in header AND footer
  function patchLogo() {
    // Header Logo logic (40% rule)
    const header = document.querySelector('header, nav');
    if (header && !patchedElements.has('logo-header')) {
      const targets = header.querySelectorAll('svg, img');
      targets.forEach(target => {
        const rect = target.getBoundingClientRect();
        if (rect.left < window.innerWidth * 0.4) {
          const img = document.createElement('img');
          img.src = CONFIG.logoSrc;
          img.style.cssText = 'width:40px;height:40px;object-fit:contain;border-radius:8px;';
          target.parentNode.replaceChild(img, target);
          patchedElements.add('logo-header');
        }
      });
    }

    // FOOTER LOGO logic
    const footer = document.querySelector('footer');
    if (footer && !patchedElements.has('logo-footer')) {
      const footerIcons = footer.querySelectorAll('svg, img, div');
      footerIcons.forEach(icon => {
        // Look for the specific orange brand block in footer
        if (icon.textContent.includes('DAYLYBREAD') || (icon.tagName === 'IMG' && icon.src.includes('brand'))) {
           const img = document.createElement('img');
           img.src = CONFIG.logoSrc;
           img.style.cssText = 'width:50px;height:50px;object-fit:contain;border-radius:8px;margin-bottom:10px;';
           icon.prepend(img); // Adds the logo above the footer text
           patchedElements.add('logo-footer');
        }
      });
    }
  }

  // 3. Create meals slideshow
  function patchMealsSlideshow() {
    if (patchedElements.has('meals-slideshow')) return;
    const sections = document.querySelectorAll('section');
    let mealSection = null;
    for (const section of sections) {
      if (section.textContent.includes('Meal Plans') || section.textContent.includes('₦10,000')) {
        mealSection = section;
        break;
      }
    }
    if (!mealSection) return;

    const targetImg = mealSection.querySelector('img');
    if (targetImg) {
      targetImg.parentNode.replaceChild(createSlideshow(), targetImg);
      patchedElements.add('meals-slideshow');
    }
  }

  function createSlideshow() {
    const container = document.createElement('div');
    container.className = 'daylybread-slideshow';
    container.style.cssText = 'position:relative;width:100%;max-width:500px;margin:0 auto;border-radius:16px;overflow:hidden;';

    CONFIG.meals.forEach((meal, index) => {
      const slide = document.createElement('div');
      slide.className = 'slideshow-slide';
      slide.style.cssText = `display:${index === 0 ? 'block' : 'none'};`;
      slide.innerHTML = `<img src="${meal.image}" style="width:100%;height:350px;object-fit:cover;"><div style="position:absolute;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,0.9));padding:20px;color:white;width:100%;"><h3 style="color:#ff6b35;">${meal.title}</h3><p>${meal.description}</p></div>`;
      container.appendChild(slide);
    });

    startSlideshow();
    return container;
  }

  function startSlideshow() {
    let current = 0;
    slideshowInterval = setInterval(() => {
      const slides = document.querySelectorAll('.slideshow-slide');
      if (!slides.length) return;
      slides[current].style.display = 'none';
      current = (current + 1) % slides.length;
      slides[current].style.display = 'block';
    }, 4000);
  }

  // 4. Fix navigation links (404 Prevention)
  function fixNavigationLinks() {
    const allLinks = document.querySelectorAll('a, button');
    allLinks.forEach(link => {
      const text = link.textContent?.trim().toLowerCase();
      
      // Keywords to intercept
      const targets = ['ecosystem', 'community', 'roadmap', 'how it works', 'meal plans', 'home'];
      
      if (targets.some(t => text.includes(t))) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          
          if (text === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }

          let search = '';
          if (text.includes('ecosystem')) search = 'The Ecosystem';
          if (text.includes('community')) search = 'Join Our Community';
          if (text.includes('roadmap')) search = 'Roadmap';
          if (text.includes('how it works')) search = 'How it Works';
          if (text.includes('meal')) search = 'Meal Plans';

          const section = findSectionByText(search);
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        });
      }
    });
  }

  function findSectionByText(searchText) {
    const elements = document.querySelectorAll('section, h2');
    for (const el of elements) {
      if (el.textContent.includes(searchText)) return el.closest('section') || el;
    }
    return null;
  }

  // 5. Hide waitlist stats (KEPT AS PROVIDED)
  function hideWaitlistStats() {
    if (patchedElements.has('waitlist-stats')) return;
    const statKeywords = ['Waitlisters', 'Tasks', 'Cities', 'taskers', 'waitlisters'];
    const allDivs = document.querySelectorAll('div, span, p, h4, h3');
    allDivs.forEach(el => {
      const text = el.textContent?.trim() || "";
      const containsKeyword = statKeywords.some(word => text.includes(word));
      const isNumberStat = /^\d+[,.\\d]*\+?$/.test(text);
      if (containsKeyword || isNumberStat) {
        if (text.length < 30) { 
          el.style.display = 'none';
          if (el.parentElement && el.parentElement.textContent.trim().length < 40) {
            el.parentElement.style.display = 'none';
          }
        }
      }
    });
    patchedElements.add('waitlist-stats');
  }

  // 6. Fix responsiveness issues
  function fixResponsiveness() {
    if (patchedElements.has('responsiveness')) return;
    const style = document.createElement('style');
    style.textContent = `
      html, body { max-width: 100vw; overflow-x: hidden; scroll-behavior: smooth; }
      .hero-video-bg { pointer-events: none; }
      @media (max-width: 768px) { .daylybread-slideshow img { height: 250px !important; } }
    `;
    document.head.appendChild(style);
    patchedElements.add('responsiveness');
  }

  // Initialize with MutationObserver
  function init() {
    runPatches();
    const observer = new MutationObserver(() => runPatches());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
  
