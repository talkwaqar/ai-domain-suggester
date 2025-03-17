/**
 * Copyright (c) 2025 Waqar Ghaffar - All Rights Reserved
 *
 * API Module - Handles all API communications
 */

const API = {
  /**
   * Send a chat message with context to the API
   * 
   * @param {Array} conversationHistory - Array of message objects with role and content
   * @param {Array} lastResults - Previous domain check results
   * @param {number} limit - Maximum number of domains to suggest/check
   * @returns {Promise} - API response with message and domain results
   */
  async sendChatMessage(conversationHistory, lastResults, limit) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: conversationHistory,
          lastResults: lastResults,
          limit: limit
        })
      });
      
      const data = await response.json();
      
      // Log the raw response for debugging
      console.log('Raw API Response:', data);
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

export default API; 