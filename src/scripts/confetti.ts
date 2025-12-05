import confetti from 'canvas-confetti';

/**
 * Initialize confetti effect on navbar brand click
 */
export function initConfetti(): void {
  const navbarBrand = document.querySelector('.navbar-brand');
  
  if (!navbarBrand) {
    return;
  }

  navbarBrand.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Create a confetti burst effect
    const duration = 1500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    function randomInRange(min: number, max: number): number {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Launch confetti from multiple points
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Also do a burst from the center
    confetti({
      ...defaults,
      particleCount: 100,
      origin: { x: 0.5, y: 0.5 }
    });
  });
}

