// Main entry point for Agents Simulator

import { AgentsSimulator } from './simulator';
import '../styles/main.css';
import './styles/agents.css';

// Initialize simulator when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AgentsSimulator();
  });
} else {
  new AgentsSimulator();
}

