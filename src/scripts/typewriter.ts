// Typewriter effect using typed.js
import Typed from 'typed.js';

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');
  
  if (appElement) {
    new Typed(appElement, {
      strings: [
        'research engineer',
        'AI researcher',
        'vibe coder',
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

