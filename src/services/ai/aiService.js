/**
 * Copyright (c) 2025 Waqar Ghaffar - All Rights Reserved
 *
 * AI Service - Handles OpenAI API interactions
 */
const OpenAI = require('openai');
const config = require('../../config');

class AIService {
  constructor() {
    this.client = this.initialize();
  }

  /**
   * Initialize OpenAI client
   * 
   * @returns {OpenAI|null} OpenAI client or null if initialization fails
   */
  initialize() {
    const apiKey = config.openai.apiKey;
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.warn('OpenAI API key not properly configured');
      return null;
    }
    
    try {
      return new OpenAI({ apiKey });
    } catch (error) {
      console.error('Error initializing OpenAI:', error);
      return null;
    }
  }

  /**
   * Check if the AI service is properly configured
   * 
   * @returns {boolean} Whether the AI service is ready
   */
  isReady() {
    return !!this.client;
  }

  /**
   * Generate domain suggestions using AI
   * 
   * @param {Array} messages - Conversation history
   * @param {string} domainContext - Context about previous domain results
   * @returns {Promise<string>} - AI response text
   */
  async generateSuggestions(messages, domainContext = '') {
    if (!this.isReady()) {
      throw new Error('AI service is not properly configured');
    }

    const systemMessage = {
      role: "system",
      content: this.buildSystemPrompt(domainContext)
    };
    
    // Add the system message to the conversation
    const apiMessages = [
      systemMessage,
      ...messages.slice(-10) // Limit to last 10 messages to stay within token limits
    ];
    
    // Call OpenAI API
    const completion = await this.client.chat.completions.create({
      model: config.openai.model,
      messages: apiMessages,
      temperature: config.openai.temperature,
    });
    
    return completion.choices[0].message.content;
  }

  /**
   * Extract domains from AI response
   * 
   * @param {string} responseContent - AI response content
   * @param {number} limit - Maximum number of domains to extract
   * @returns {string[]} - Array of domain names
   */
  extractDomainsFromResponse(responseContent, limit) {
    try {
      // Look for JSON object in the response
      const domainMatch = responseContent.match(/\{[\s\S]*?"domains"[\s\S]*?\}/);
      if (domainMatch) {
        const domainsJson = JSON.parse(domainMatch[0]);
        if (Array.isArray(domainsJson.domains)) {
          return domainsJson.domains.slice(0, limit);
        }
      }
    } catch (error) {
      console.error('Error parsing domains from AI response:', error);
    }
    
    return [];
  }

  /**
   * Clean the AI response by removing JSON blocks
   * 
   * @param {string} responseContent - Original AI response
   * @returns {string} - Cleaned response text
   */
  cleanResponse(responseContent) {
    let cleanResponse = responseContent.replace(/\{[\s\S]*?"domains"[\s\S]*?\}/, '');
    return cleanResponse.trim();
  }

  /**
   * Build the system prompt with domain context
   * 
   * @param {string} domainContext - Context about previous domain results
   * @returns {string} - Complete system prompt
   */
  buildSystemPrompt(domainContext = '') {
    return `You are a helpful AI assistant specializing in domain name suggestions. Your task is to help users find available domain names for their projects or businesses. Always interpret the user's intent intelligently - they might be asking for domain suggestions, checking domains, or asking for more information.

${domainContext}

IMPORTANT INSTRUCTIONS:
1. Process all user messages directly without requiring specific formats
2. If the user's message suggests they want domain names, include domain suggestions
3. ONLY use the following domain extensions: .ai, .com, and .app
4. When the user specifically asks for a particular TLD (like ".ai only"), ONLY use that TLD 
5. When providing domain suggestions, ALWAYS include them in a properly formatted JSON code block using this exact format:
\`\`\`json
{
  "domains": [
    "example1.com",
    "example2.ai",
    "example3.app"
  ]
}
\`\`\`
6. Adapt to the user's preferences - the number of domains requested may vary with each message
7. If the user says things like "give me demo" or asks for examples, interpret this as a request for sample domains
8. If the user provides feedback on previous suggestions, use that to refine new suggestions
9. If the user is asking a general question unrelated to domains, answer it normally

EXAMPLE:
User: "give me demo"
You should respond with text and include domain suggestions in a JSON block like:
\`\`\`json
{
  "domains": [
    "example1.com",
    "example2.ai",
    "example3.app"
  ]
}
\`\`\`

User: "more like projecthub.ai"
You should generate domains similar to projecthub.ai and include them in a JSON block.`;
  }
}

module.exports = new AIService(); 