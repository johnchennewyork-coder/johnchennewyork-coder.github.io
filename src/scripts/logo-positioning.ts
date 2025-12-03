// Replace jQuery logo positioning with vanilla TypeScript
document.addEventListener('DOMContentLoaded', () => {
  const logo = document.getElementById('logo');
  const navbar = document.querySelector('.navbar');
  
  if (logo && navbar) {
    const navbarHeight = navbar.getBoundingClientRect().height;
    (logo as HTMLElement).style.marginTop = `${navbarHeight}px`;
  }
});

