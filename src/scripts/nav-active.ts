// Replace jQuery nav active state handling with vanilla TypeScript
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-item a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Remove active class from all nav items
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to clicked nav item's parent
      const navItem = (e.currentTarget as HTMLElement).parentElement;
      if (navItem) {
        navItem.classList.add('active');
      }
    });
  });
});

