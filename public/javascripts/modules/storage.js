/**
 * Storage Module - Handles persistent storage operations
 */

const Storage = {
  /**
   * Save data to localStorage
   * 
   * @param {string} key - Storage key
   * @param {any} data - Data to save (will be JSON stringified)
   */
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  /**
   * Load data from localStorage
   * 
   * @param {string} key - Storage key
   * @returns {any} - Parsed data or null if not found
   */
  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  },
  
  /**
   * Remove item from localStorage
   * 
   * @param {string} key - Storage key to remove
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  /**
   * Clear all application data from localStorage
   */
  clearAll() {
    this.remove('conversationHistory');
    this.remove('lastResults');
  },
  
  /**
   * Get initial conversation history or create default
   * 
   * @returns {Array} - Conversation history array
   */
  getInitialConversation() {
    return this.load('conversationHistory') || [
      { role: "system", content: "You are a helpful AI assistant specializing in domain name suggestions. Your task is to help users find available domain names for their projects or businesses. Focus on providing creative, memorable, and available domain suggestions. You can both check specific domains and generate new domain ideas based on descriptions." },
      { role: "assistant", content: "Hello! I'm your domain finding assistant. Describe your business or project, and I'll help you find available domains. You can also ask me to check specific domains." }
    ];
  },
  
  /**
   * Get last domain results or empty array
   * 
   * @returns {Array} - Last domain results array
   */
  getLastResults() {
    return this.load('lastResults') || [];
  }
};

export default Storage; 