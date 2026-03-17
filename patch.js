// DaylyBread Website Patch Script
(function() {
  'use strict';

  const CONFIG = {
    heroVideoSrc: './assets/hero-video-new.mp4',
    logoSrc: './assets/logo-new.jpg',
    meals: [
      {
        image: './assets/breakfast-new.jpg',
        title: 'Breakfast',
        description: 'Akara and pap',
        time: '7am - 9am'
      },
      {
        image: './assets/lunch-new.jpg',
        title: 'Afternoon',
        description: 'Rice, chicken and plantain',
        time: '1pm - 3pm'
      },
      {
        image: './assets/dinner-new.jpg',
        title: 'Evening',
        description: 'Semo, vegetable soup, Eguisi and fish',
        time: '6pm - 7pm'
      }
    ]
  };

  const patchedElements = new Set();
  let slideshowInterval = null;

  function runPatches() {
    patchHeroVideo();
    patchLogo();
    patchMealsSlideshow();
    fixNavigationLinks();
    hideWaitlistStats();
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
    
    // Remove existing video if any
    const existingVideo = heroSection.querySelector('video');
    if (existingVideo) existingVideo.remove();
    const existingOverlay = heroSection.querySelector('.hero-overlay');
    if (existingOverlay) existingOverlay.remove();

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

    // Ensure content is above video
    const children = heroSection.querySelectorAll(':scope > *:not(video):not(.hero-overlay)');
    children.forEach(child => {
      child.style.position = 'relative';
      child.style.zIndex = '2';
    });

    patchedElements.add('hero-video');
  }

  // 2. Replace logo in header with new logo
  function patchLogo() {
    if (patchedElements.has('logo')) return;

    const header = document.querySelector('header, nav');
    if (!header) return;

    // Look for SVG icon or existing logo
    const svg = header.querySelector('svg');
    if (svg) {
      const img = document.createElement('img');
      img.src = CONFIG.logoSrc;
      img.alt = 'DaylyBread';
      img.style.cssText = 'width:40px;height:40px;object-fit:contain;border-radius:8px;display:block;';
      svg.parentNode.replaceChild(img, svg);
      patchedElements.add('logo');
      return;
    }

    // Look for existing logo image
    const logoImgs = header.querySelectorAll('img');
    for (const img of logoImgs) {
      if (img.width < 100 || img.height < 100 || img.alt?.includes('logo') || img.alt?.includes('DaylyBread')) {
        img.src = CONFIG.logoSrc;
        img.style.cssText = 'width:40px;height:40px;object-fit:contain;border-radius:8px;display:block;';
        patchedElements.add('logo');
        return;
      }
    }
  }

  // 3. Create meals slideshow
  function patchMealsSlideshow() {
    if (patchedElements.has('meals-slideshow')) return;
    if (document.querySelector('.daylybread-slideshow')) return;

    const sections = document.querySelectorAll('section');
    let mealSection = null;
    
    for (const section of sections) {
      const text = section.textContent;
      if (text.includes('Meal Plans') || text.includes('Daily Plan') || text.includes('₦10,000')) {
        mealSection = section;
        break;
      }
    }

    if (!mealSection) return;

    const existingImages = mealSection.querySelectorAll('img');
    if (existingImages.length > 0) {
      const targetImg = existingImages[0];
      const slideshowContainer = createSlideshow();
      targetImg.parentNode.replaceChild(slideshowContainer, targetImg);
      
      for (let i = 1; i < existingImages.length; i++) {
        const img = existingImages[i];
        if (img.closest('.daylybread-slideshow')) continue;
        const parent = img.parentElement;
        if (parent && parent.children.length === 1) {
          parent.style.display = 'none';
        } else {
          img.style.display = 'none';
        }
      }
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
      slide.style.cssText = `position:relative;width:100%;display:${index === 0 ? 'block' : 'none'};`;
      slide.dataset.index = index;

      const img = document.createElement('img');
      img.src = meal.image;
      img.alt = meal.title;
      img.style.cssText = 'width:100%;height:350px;object-fit:cover;display:block;';

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.9));padding:30px 20px 20px;color:white;';

      const title = document.createElement('h3');
      title.textContent = meal.title;
      title.style.cssText = 'font-size:1.5rem;font-weight:bold;margin:0 0 5px 0;color:#ff6b35;';

      const desc = document.createElement('p');
      desc.textContent = meal.description;
      desc.style.cssText = 'font-size:1rem;margin:0 0 5px 0;';

      const time = document.createElement('p');
      time.textContent = meal.time;
      time.style.cssText = 'font-size:0.875rem;color:#aaa;margin:0;';

      overlay.appendChild(title);
      overlay.appendChild(desc);
      overlay.appendChild(time);
      slide.appendChild(img);
      slide.appendChild(overlay);
      container.appendChild(slide);
    });

    const dotsContainer = document.createElement('div');
    dotsContainer.style.cssText = 'position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10;';
    
    CONFIG.meals.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'slideshow-dot';
      dot.style.cssText = `width:10px;height:10px;border-radius:50%;border:none;cursor:pointer;background:${index === 0 ? '#ff6b35' : 'rgba(255,255,255,0.5)'};`;
      dot.onclick = () => goToSlide(index);
      dotsContainer.appendChild(dot);
    });
    container.appendChild(dotsContainer);

    startSlideshow();

    return container;
  }

  function startSlideshow() {
    if (slideshowInterval) clearInterval(slideshowInterval);
    let currentSlide = 0;
    
    slideshowInterval = setInterval(() => {
      const slides = document.querySelectorAll('.slideshow-slide');
      const dots = document.querySelectorAll('.slideshow-dot');
      
      if (slides.length === 0) return;
      
      slides.forEach((slide, i) => {
        slide.style.display = i === currentSlide ? 'block' : 'none';
      });
      
      dots.forEach((dot, i) => {
        dot.style.background = i === currentSlide ? '#ff6b35' : 'rgba(255,255,255,0.5)';
      });
      
      currentSlide = (currentSlide + 1) % slides.length;
    }, 4000);
  }

  function goToSlide(index) {
    const slides = document.querySelectorAll('.slideshow-slide');
    const dots = document.querySelectorAll('.slideshow-dot');
    
    slides.forEach((slide, i) => {
      slide.style.display = i === index ? 'block' : 'none';
    });
    
    dots.forEach((dot, i) => {
      dot.style.background = i === index ? '#ff6b35' : 'rgba(255,255,255,0.5)';
    });
  }

  // 4. Fix navigation links - make ecosystem and community links work
  function fixNavigationLinks() {
    if (patchedElements.has('nav-links')) return;

    // Find Ecosystem link and make it scroll to ecosystem section
    const allLinks = document.querySelectorAll('a, button');
    
    allLinks.forEach(link => {
      const text = link.textContent?.trim().toLowerCase();
      
      // Fix Ecosystem link
      if (text === 'ecosystem') {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const ecosystemSection = findSectionByText('The Ecosystem');
          if (ecosystemSection) {
            ecosystemSection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
      
      // Fix Community link
      if (text === 'community') {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const communitySection = findSectionByText('Join Our Community');
          if (communitySection) {
            communitySection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    });

    patchedElements.add('nav-links');
  }

  function findSectionByText(searchText) {
    const sections = document.querySelectorAll('section');
    for (const section of sections) {
      if (section.textContent.includes(searchText)) {
        return section;
      }
    }
    return null;
  }

  // 5. Hide waitlist stats
  function hideWaitlistStats() {
    if (patchedElements.has('waitlist-stats')) return;

    const statLabels = ['Waitlisters', 'Tasks Completed', 'Cities', 'taskers', 'waitlisters'];
    const allElements = document.querySelectorAll('div, span, p, h4');
    
    for (const el of allElements) {
      const text = el.textContent?.trim();
      if (statLabels.includes(text)) {
        let container = el.parentElement;
        for (let i = 0; i < 4 && container; i++) {
          const containerText = container.textContent || '';
          if (/\d+/.test(containerText) && containerText.length < 200) {
            container.style.display = 'none';
            break;
          }
          container = container.parentElement;
        }
      }
    }

    // Also hide by pattern matching
    document.querySelectorAll('div').forEach(div => {
      const text = div.textContent || '';
      if ((text.match(/\d+,?\d*\+?\s*Waitlisters/i) || 
           text.match(/\d+,?\d*\+?\s*Tasks\s*Completed/i) || 
           text.match(/\d+\s*Cities/i)) && text.length < 200) {
        div.style.display = 'none';
      }
    });

    patchedElements.add('waitlist-stats');
  }

  // 6. Fix responsiveness issues
  function fixResponsiveness() {
    if (patchedElements.has('responsiveness')) return;

    // Add viewport meta if missing
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
      document.head.appendChild(viewport);
    }

    // Add comprehensive responsive styles
    const style = document.createElement('style');
    style.textContent = `
      /* Responsive slideshow */
      @media (max-width: 768px) {
        .daylybread-slideshow {
          max-width: 100% !important;
        }
        .daylybread-slideshow img {
          height: 250px !important;
        }
        .slideshow-slide h3 {
          font-size: 1.2rem !important;
        }
        .slideshow-slide p {
          font-size: 0.875rem !important;
        }
      }
      
      @media (max-width: 480px) {
        .daylybread-slideshow img {
          height: 200px !important;
        }
      }
      
      /* Prevent overflow */
      html, body {
        max-width: 100vw;
        overflow-x: hidden;
      }
      
      section {
        max-width: 100%;
      }
      
      img {
        max-width: 100%;
        height: auto;
      }
      
      /* Touch optimization */
      button, a, [role="button"] {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
      }
      
      /* Prevent text zoom on mobile */
      @media screen and (max-width: 768px) {
        body {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
      }
    `;
    document.head.appendChild(style);

    // Fix event delegation for better responsiveness
    document.addEventListener('touchstart', function() {}, { passive: true });
    document.addEventListener('touchmove', function() {}, { passive: true });
    
    patchedElements.add('responsiveness');
  }

  // Initialize
  function init() {
    runPatches();
    
    // Run multiple times to catch dynamically loaded content
    [100, 300, 500, 800, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000].forEach(d => {
      setTimeout(runPatches, d);
    });

    // Watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          runPatches();
          break;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Start when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Handle route changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      patchedElements.clear();
      if (slideshowInterval) clearInterval(slideshowInterval);
      setTimeout(runPatches, 500);
    }
  }).observe(document, { subtree: true, childList: true });

})();
