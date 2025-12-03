// Scroll-triggered animations using Intersection Observer
document.addEventListener('DOMContentLoaded', () => {
  // Add fade-in class to elements that should animate
  const animateElements = document.querySelectorAll(
    '.card, #Hackathons, #intro, .glass, #icons, #projects_section > h1, #projects_section .container'
  );
  
  // Don't animate hero section elements as they have their own animations
  
  animateElements.forEach((el) => {
    el.classList.add('fade-in');
  });
  
  // Create Intersection Observer with better performance
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Stop observing after animation to improve performance
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe all fade-in elements
  document.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
  });
  
  // Add smooth scroll behavior for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (this: HTMLAnchorElement, e: Event) {
      const href = this.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const offsetTop = (target as HTMLElement).offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });
});

