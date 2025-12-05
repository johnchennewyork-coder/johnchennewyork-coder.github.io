// Main entry point for RL Simulator

import { Simulator } from './simulator';
import '../styles/main.css';
import './styles/simulator.css';

// Initialize simulator when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new Simulator();
  });
} else {
  new Simulator();
}

