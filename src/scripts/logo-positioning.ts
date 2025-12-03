// Replace jQuery logo positioning with vanilla TypeScript
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.getElementById('hero');
  const navbar = document.querySelector('.navbar');
  
  if (hero && navbar) {
    const navbarHeight = navbar.getBoundingClientRect().height;
    (hero as HTMLElement).style.marginTop = `${navbarHeight}px`;
  }
});

