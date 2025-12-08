// Navigation active state handling with scroll-based highlighting
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-item a');
  const navItems = document.querySelectorAll('.nav-item');
  
  // Map navigation links to their corresponding sections
  const sectionMap = new Map<HTMLElement, string>();
  navLinks.forEach(link => {
    const href = (link as HTMLAnchorElement).getAttribute('href');
    if (href && href.startsWith('#')) {
      sectionMap.set(link as HTMLElement, href.substring(1));
    } else if (href === '#' || !href) {
      // Home link - maps to hero section
      sectionMap.set(link as HTMLElement, 'hero');
    }
  });

  // Function to update active nav item
  const updateActiveNav = (targetId: string) => {
    navItems.forEach(item => {
      item.classList.remove('active');
    });

    // Find the nav link that corresponds to this section
    navLinks.forEach(link => {
      const href = (link as HTMLAnchorElement).getAttribute('href');
      let linkTargetId = '';
      
      if (href && href.startsWith('#')) {
        linkTargetId = href.substring(1);
      } else if (href === '#' || !href) {
        linkTargetId = 'hero';
      }

      if (linkTargetId === targetId) {
        const navItem = link.parentElement;
        if (navItem) {
          navItem.classList.add('active');
        }
      }
    });
  };

  // Handle click events
  navLinks.forEach(link => {
    link.addEventListener('click', (_e) => {
      const href = (link as HTMLAnchorElement).getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetId = href.substring(1);
        updateActiveNav(targetId);
      } else if (href === '#' || !href) {
        updateActiveNav('hero');
      }
    });
  });

  // Scroll-based active state using Intersection Observer
  // Map section IDs to their elements (prefer section elements, fallback to anchor/heading elements)
  const sections = [
    { id: 'hero', element: document.getElementById('hero') },
    { id: 'intro', element: document.getElementById('intro') },
    { id: 'Projects', element: document.getElementById('Projects') || document.getElementById('projects_section') },
    { id: 'Hackathons', element: document.getElementById('Hackathons') }
  ].filter(section => section.element !== null);

  // Create intersection observer with options
  // Use a more generous rootMargin to trigger earlier
  const observerOptions = {
    root: null,
    rootMargin: '-10% 0px -70% 0px', // Trigger when section enters upper 30% of viewport
    threshold: [0, 0.1, 0.5, 1.0] // Multiple thresholds for better detection
  };

  const observer = new IntersectionObserver((entries) => {
    // Find the section that's most visible in the viewport
    let mostVisible: { id: string; ratio: number; top: number } | null = null;

    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0) {
        const sectionId = entry.target.id;
        // Map section IDs to nav IDs
        let navId = sectionId;
        if (sectionId === 'hero' || sectionId === 'intro' || sectionId === 'projects_section') {
          if (sectionId === 'projects_section') {
            navId = 'Projects';
          } else {
            navId = 'hero'; // Both hero and intro map to Home
          }
        }

        const rect = entry.boundingClientRect;
        const distanceFromTop = Math.abs(rect.top);
        
        // Prefer sections that are closer to the top of the viewport
        if (!mostVisible || 
            (entry.intersectionRatio > mostVisible.ratio * 0.8 && distanceFromTop < mostVisible.top) ||
            entry.intersectionRatio > mostVisible.ratio) {
          mostVisible = { id: navId, ratio: entry.intersectionRatio, top: distanceFromTop };
        }
      }
    });

    // Fallback: use scroll position to determine active section if observer didn't find anything
    let needsFallback = false;
    if (!mostVisible) {
      needsFallback = true;
    } else {
      // TypeScript workaround: use non-null assertion since we've already checked for null
      const ratio = (mostVisible as { id: string; ratio: number; top: number }).ratio;
      if (ratio < 0.05) {
        needsFallback = true;
      }
    }
    if (needsFallback) {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // If at the very top, always show Home
      if (scrollY < 100) {
        updateActiveNav('hero');
        return;
      }
      
      // Check sections in order from top to bottom
      for (const section of sections) {
        if (!section.element) continue;
        const rect = section.element.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionBottom = rect.bottom;
        
        // Check if section is in the upper portion of viewport
        if (sectionTop <= windowHeight * 0.4 && sectionBottom >= 0) {
          let navId = section.id;
          if (section.id === 'hero' || section.id === 'intro' || section.id === 'projects_section') {
            if (section.id === 'projects_section') {
              navId = 'Projects';
            } else {
              navId = 'hero';
            }
          }
          mostVisible = { id: navId, ratio: 1, top: Math.abs(sectionTop) };
          break;
        }
      }
    }

    if (mostVisible) {
      updateActiveNav(mostVisible.id);
    }
  }, observerOptions);

  // Observe all sections
  sections.forEach(section => {
    if (section.element) {
      observer.observe(section.element);
    }
  });

  // Initial state - check on page load
  const checkInitialSection = () => {
    const scrollY = window.scrollY;
    if (scrollY < 100) {
      // Near top of page - highlight Home
      updateActiveNav('hero');
    } else {
      // Check which section is in view
      for (const section of sections) {
        if (!section.element) continue;
        const rect = section.element.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.3 && rect.bottom >= 0) {
          let navId = section.id;
          if (section.id === 'hero' || section.id === 'intro') {
            navId = 'hero';
          }
          updateActiveNav(navId);
          break;
        }
      }
    }
  };

  // Check initial section after a short delay to ensure DOM is ready
  setTimeout(checkInitialSection, 100);
});

