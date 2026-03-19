// DaylyBread Final Patch Script - Anti-Duplicate & YouTube Background Version
(function() {
  'use strict';

  const CONFIG = {
    // YouTube Shorts ID: wvZeYWiL-J8
    youtubeId: 'wvZeYWiL-J8', 
    logoSrc: '/Daylee-bread/assets/logo-new.jpg',
    meals: [
      { image: '/Daylee-bread/assets/breakfast-new.jpg', title: 'Breakfast', description: 'Akara and pap', time: '7am - 9am' },
      { image: '/Daylee-bread/assets/lunch-new.jpg', title: 'Afternoon', description: 'Rice, chicken and plantain', time: '1pm - 3pm' },
      { image: '/Daylee-bread/assets/dinner-new.jpg', title: 'Evening', description: 'Semo, vegetable soup, Eguisi and fish', time: '6pm - 7pm' }
    ]
  };

  const patchedElements = new Set();

  function runPatches() {
    // SAFETY CHECK: Ensure header and hero exist before running to avoid "Footer First" loading
    const header = document.querySelector('header, nav');
    const hero = document.querySelector('section');
    if (!header && !hero) return;

    patchHeroVideo();
    patchLogo();
    patchMealsSlideshow();
    fixNavigationLinks();
    hideWaitlistStats(); 
    fixResponsiveness();
  }

  // 1. YouTube Background (Optimized Aspect Ratio)
  function patchHeroVideo() {
    if (patchedElements.has('hero-video')) return;
    const heroSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('EAT') && s.textContent.includes('EARN')
    );
    if (!heroSection) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${CONFIG.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${CONFIG.youtubeId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0`;
    
    // The "Cover" Hack: Ensures no black bars on any screen size
    iframe.style.cssText = 'position:absolute;top:50%;left:50%;width:100vw;height:56.25vw;min-height:100vh;min-width:177.77vh;transform:translate(-50%,-50%);z-index:0;pointer-events:none;border:none;';
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);z-index:1;';

    heroSection.style.position = 'relative';
    heroSection.style.overflow = 'hidden';
    heroSection.prepend(overlay);
    heroSection.prepend(iframe);
    
    patchedElements.add('hero-video');
  }

  // 2. Logo Swap (Surgical Targeting - PROTECTS SOCIAL ICONS)
  function patchLogo() {
    // A. Target Header Logo
    const header = document.querySelector('header, nav');
    if (header && !patchedElements.has('logo-header-surgical')) {
      const potentialLogos = header.querySelectorAll('img, svg');
      const protectedKeywords = ['x', 'twitter', 'telegram', 'discord', 'menu', 'search'];
      
      potentialLogos.forEach(logo => {
        if (patchedElements.has('logo-header-surgical')) return;
        const rect = logo.getBoundingClientRect();
        const nearbyText = logo.parentElement.textContent.trim().toLowerCase();
        const isProtected = protectedKeywords.some(key => nearbyText.includes(key));
        
        if (rect.left < window.innerWidth * 0.4 && !isProtected) {
          const img = document.createElement('img');
          img.src = CONFIG.logoSrc;
          img.className = 'patched-logo';
          img.style.cssText = 'width:42px;height:42px;object-fit:contain;border-radius:8px;';
          logo.style.display = 'none';
          logo.parentElement.insertBefore(img, logo);
          patchedElements.add('logo-header-surgical');
        }
      });
    }

    // B. Target Footer Brand (Protects social icons in other blocks)
    const footer = document.querySelector('footer');
    if (footer) {
      const brandElements = Array.from(footer.querySelectorAll('div, p, h4')).filter(el => 
        el.textContent.includes('DAYLYBREAD')
      );
      
      brandElements.forEach(el => {
        if (el.querySelector('.patched-logo')) return;
        const img = document.createElement('img');
        img.src = CONFIG.logoSrc;
        img.className = 'patched-logo';
        img.style.cssText = 'width:42px;height:42px;object-fit:contain;border-radius:8px;margin-bottom:10px;display:block;';
        el.prepend(img);
      });
    }
  }

  // 3. Navigation Interceptor (Fixes 404 Errors)
  function fixNavigationLinks() {
    document.querySelectorAll('a, button').forEach(link => {
      const text = link.textContent?.trim().toLowerCase();
      const routes = ['ecosystem', 'community', 'roadmap', 'how it works', 'meal plans', 'home'];
      
      if (routes.some(r => text.includes(r))) {
        link.onclick = (e) => {
          e.preventDefault();
          if (text.includes('home')) { window.scrollTo({top: 0, behavior: 'smooth'}); return; }
          
          let search = text.includes('meal') ? 'Meal Plans' : text.includes('how') ? 'How it Works' : text.charAt(0).toUpperCase() + text.slice(1);
          const target = Array.from(document.querySelectorAll('section, h2, h3')).find(el => el.textContent.includes(search));
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        };
      }
    });
  }

  // 4. Waitlist Stats (Deep Hide)
  function hideWaitlistStats() {
    const words = ['Waitlisters', 'Tasks Completed', 'Cities', 'Taskers'];
    document.querySelectorAll('div, span, p, h4').forEach(el => {
      if (words.some(word => el.textContent.includes(word))) {
        let container = el.closest('div');
        if (container && container.textContent.trim().length < 60) {
          container.style.display = 'none';
          container.style.visibility = 'hidden';
        }
      }
    });
  }

  // 5. General Responsiveness
  function fixResponsiveness() {
    if (patchedElements.has('responsiveness')) return;
    const style = document.createElement('style');
    style.textContent = `
      html, body { max-width: 100vw; overflow-x: hidden; scroll-behavior: smooth; }
      iframe { pointer-events: none; }
      .patched-logo { margin-right: 10px; }
      footer { text-align: left !important; }
      @media (max-width: 768px) { .daylybread-slideshow img { height: 250px !important; } }
    `;
    document.head.appendChild(style);
    patchedElements.add('responsiveness');
  }

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
                            
