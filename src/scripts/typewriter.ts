// Typewriter effect using typed.js
import Typed from 'typed.js';

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');
  
  if (appElement) {
    const typed = new Typed(appElement, {
      strings: [
        'data scientist',
        'AI researcher',
        'Full stack developer',
        'PhD student'
      ],
      typeSpeed: 75,
      backSpeed: 25,
      backDelay: 2000,
      loop: true,
      showCursor: false,
      cursorChar: '|',
    });
  }
});

