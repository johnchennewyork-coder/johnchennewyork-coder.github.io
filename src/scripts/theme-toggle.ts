// Theme toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const html = document.documentElement;
  
  // Get saved theme or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  updateIcon(savedTheme);
  
  if (themeToggle && themeIcon) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateIcon(newTheme);
    });
  }
  
  function updateIcon(theme: string) {
    if (themeIcon) {
      if (theme === 'dark') {
        themeIcon.className = 'fas fa-moon';
      } else {
        themeIcon.className = 'fas fa-sun';
      }
    }
  }
});

