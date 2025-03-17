/**
 * Copyright (c) 2025 Waqar Ghaffar - All Rights Reserved
 *
 * Main application entry point
 */
import App from './modules/app.js';
import Theme from './modules/theme.js';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme functionality
  Theme.initialize();
  
  // Initialize the application
  App.initialize();
}); 