/**
 * Theme Module - Handles theme toggling and persistence
 */

const Theme = {
  /**
   * Initialize theme functionality
   */
  initialize() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or use default dark mode
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // Apply the saved theme
    if (savedTheme === 'light') {
      body.classList.remove('dark-mode');
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
    
    // Toggle theme when the button is clicked
    themeToggle.addEventListener('click', function() {
      body.classList.toggle('dark-mode');
      
      // Update the icon
      if (body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
      }
    });
  }
};

export default Theme; 