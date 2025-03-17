/**
 * Copyright (c) 2025 Waqar Ghaffar - All Rights Reserved
 *
 * Chat Controller - Handles chat-related API endpoints
 */
const domainService = require('../services/domain/domainService');
const aiService = require('../services/ai/aiService');

/**
 * Process chat request with AI and domain checking
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.processChat = async (req, res, next) => {
  try {
    const { messages, lastResults, limit = 5 } = req.body;
    
    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Valid conversation history is required' });
    }
    
    // Check if AI service is ready
    if (!aiService.isReady()) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        message: 'The server is not properly configured to use AI chat features.'
      });
    }
    
    // Build context from previous domain results
    const domainsContext = domainService.buildDomainContext(lastResults);
    
    // Generate suggestions with the AI service
    const responseContent = await aiService.generateSuggestions(messages, domainsContext);
    
    // Extract domains from the response
    const extractedDomains = aiService.extractDomainsFromResponse(responseContent, limit);
    
    // Clean up the response by removing the JSON object
    const cleanResponse = aiService.cleanResponse(responseContent);
    
    // If we found domains, check their availability
    let domainResults = { results: [] };
    if (extractedDomains.length > 0) {
      try {
        domainResults = await domainService.checkBatch(extractedDomains, limit);
      } catch (error) {
        console.error('Error checking domain availability:', error);
      }
    }
    
    // Send back response with both message and domain results
    res.json({
      message: cleanResponse,
      domains: domainResults
    });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      message: error.response?.data?.message || error.message
    });
  }
}; 