/**
 * Copyright (c) 2025 Waqar Ghaffar - All Rights Reserved
 *
 * Domain Service - Handles domain availability checks and caching
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

// Constants
const WHOISXML_API_KEY = config.domainApi.whoisXmlApiKey;
const DOMAIN_API_URL = 'https://domain-availability.whoisxmlapi.com/api/v1';
const CACHE_FILE = path.join(__dirname, '../../../data/domain-cache.json');
const CACHE_EXPIRY = config.cache.expiryMs;

// Initialize and manage domain cache
class DomainCache {
  constructor() {
    this.cache = this.initialize();
  }

  initialize() {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load domain cache from file or create empty cache
    let domainCache = {};
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const cacheData = fs.readFileSync(CACHE_FILE, 'utf8');
        domainCache = JSON.parse(cacheData);
      } else {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({}), 'utf8');
      }
    } catch (error) {
      console.warn('Error loading domain cache:', error.message);
    }
    
    return domainCache;
  }

  save() {
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache), 'utf8');
    } catch (error) {
      console.error('Error saving domain cache:', error);
    }
  }

  get(domain) {
    return this.cache[domain];
  }

  set(domain, data) {
    this.cache[domain] = data;
    // Don't save on every set to avoid excessive disk writes
  }

  isValid(cacheEntry) {
    if (!cacheEntry) return false;
    const now = Date.now();
    return (now - cacheEntry.timestamp < CACHE_EXPIRY);
  }
}

class DomainService {
  constructor() {
    this.domainCache = new DomainCache();
  }

  /**
   * Check availability for multiple domains
   * 
   * @param {string[]} domains - Array of domain names to check
   * @param {number} limit - Maximum number of domains to check (default: 10)
   * @returns {Promise<{results: Array}>} - Results of domain availability checks
   */
  async checkBatch(domains, limit = 10) {
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return { results: [] };
    }
    
    if (!WHOISXML_API_KEY) {
      console.error('WHOISXML_API_KEY is not configured');
      return { 
        results: domains.slice(0, limit).map(domain => ({
          domain,
          available: false,
          status: 'ERROR',
          error: 'API key not configured'
        }))
      };
    }
    
    // Limit the number of domains to check
    const domainsToCheck = domains.slice(0, limit);
    const now = Date.now();
    const results = [];
    const domainsToFetch = [];
    
    // First check cache for each domain
    domainsToCheck.forEach(domain => {
      const cachedResult = this.domainCache.get(domain);
      if (cachedResult && this.domainCache.isValid(cachedResult)) {
        // Use cached result if it's not expired
        results.push({
          domain,
          available: cachedResult.available,
          status: cachedResult.status,
          cached: true
        });
      } else {
        // Mark domain for API check
        domainsToFetch.push(domain);
      }
    });
    
    // Fetch domains not in cache
    if (domainsToFetch.length > 0) {
      const checkPromises = domainsToFetch.map(domain => 
        axios.get(DOMAIN_API_URL, {
          params: {
            apiKey: WHOISXML_API_KEY,
            domainName: domain,
            credits: 'DA'
          }
        })
        .then(response => {
          const available = response.data.DomainInfo?.domainAvailability === 'AVAILABLE';
          const status = response.data.DomainInfo?.domainAvailability || 'ERROR';
          
          // Store in cache
          this.domainCache.set(domain, {
            available,
            status,
            timestamp: now
          });
          
          return {
            domain,
            available,
            status,
            cached: false
          };
        })
        .catch(error => {
          console.error(`Error checking domain ${domain}:`, error.message);
          return {
            domain,
            available: false,
            status: 'ERROR',
            error: error.message,
            cached: false
          };
        })
      );
      
      // Wait for all domain checks to complete
      const apiResults = await Promise.all(checkPromises);
      results.push(...apiResults);
      
      // Save updated cache
      this.domainCache.save();
    }
    
    return { results };
  }

  /**
   * Build domain context string from previous results
   * 
   * @param {Array} lastResults - Previous domain check results
   * @returns {string} - Context string for AI prompt
   */
  buildDomainContext(lastResults) {
    if (!lastResults || lastResults.length === 0) {
      return '';
    }
    
    const availableDomains = lastResults.filter(d => d.available).map(d => d.domain);
    const unavailableDomains = lastResults.filter(d => !d.available).map(d => d.domain);
    
    let domainsContext = `\nPrevious domain results:\n`;
    if (availableDomains.length > 0) {
      domainsContext += `Available domains: ${availableDomains.join(', ')}\n`;
    }
    if (unavailableDomains.length > 0) {
      domainsContext += `Unavailable domains: ${unavailableDomains.join(', ')}\n`;
    }
    
    return domainsContext;
  }
}

module.exports = new DomainService(); 