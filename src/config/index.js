/**
 * Configuration Module - Loads and validates environment variables
 */
require('dotenv').config();

// Define the configuration object with all environmental variables
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  },
  
  // Domain API configuration
  domainApi: {
    whoisXmlApiKey: process.env.WHOISXML_API_KEY,
  },
  
  // Cache configuration
  cache: {
    expiryMs: 86400000, // 24 hours in milliseconds
  }
};

// Validate critical configuration
const validateConfig = () => {
  const missingVars = [];
  
  if (!config.domainApi.whoisXmlApiKey) {
    missingVars.push('WHOISXML_API_KEY');
  }
  
  if (!config.openai.apiKey) {
    missingVars.push('OPENAI_API_KEY');
  }
  
  if (missingVars.length > 0) {
    console.warn(`WARNING: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Some functionality may be limited');
  }
};

// Run validation
validateConfig();

module.exports = config; 