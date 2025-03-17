/**
 * Copyright (c) 2025 Waqar Ghaffar - All Rights Reserved
 *
 * UI Module - Handles all UI elements and interactions
 */

const UI = {
  elements: {
    userInput: null,
    sendButton: null,
    chatMessages: null,
    domainLimit: null,
    resultsLoader: null,
    resultsContainer: null,
    clearHistoryBtn: null
  },

  /**
   * Initialize all UI elements
   */
  initialize() {
    this.elements.userInput = document.getElementById('user-input');
    this.elements.sendButton = document.getElementById('send-button');
    this.elements.chatMessages = document.getElementById('chat-messages');
    this.elements.domainLimit = document.getElementById('domainLimit');
    this.elements.resultsLoader = document.getElementById('results-loader');
    this.elements.resultsContainer = document.getElementById('results-container');

    // Create clear history button
    this.elements.clearHistoryBtn = document.createElement('button');
    this.elements.clearHistoryBtn.id = 'clear-history-btn';
    this.elements.clearHistoryBtn.className = 'absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors';
    this.elements.clearHistoryBtn.innerHTML = '<i class="fas fa-brush"></i>';
    this.elements.clearHistoryBtn.title = 'Clear history';
    
    // Find the chat container and append the button
    const chatContainer = document.querySelector('#chat-messages').parentNode;
    chatContainer.style.position = 'relative';
    chatContainer.appendChild(this.elements.clearHistoryBtn);
  },

  /**
   * Add a message to the chat window
   * 
   * @param {string} sender - 'user' or 'ai'
   * @param {string} content - Message content
   * @param {boolean} isThinking - Whether this is a thinking indicator
   * @returns {HTMLElement} - The message element
   */
  addMessageToChat(sender, content, isThinking = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex items-start ${sender === 'user' ? 'user-message' : 'ai-message'}`;
    
    // For user messages, we don't need the avatar
    if (sender !== 'user') {
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 bg-blue-500';
      avatarDiv.innerHTML = '<i class="fas fa-robot text-sm"></i>';
      messageDiv.appendChild(avatarDiv);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = `message-bubble ${isThinking ? 'thinking-message' : ''}`;
    
    if (isThinking) {
      contentDiv.innerHTML = `<p>${content} <span class="dots"><span>.</span><span>.</span><span>.</span></span></p>`;
    } else {
      // Process any markdown or links in the content
      const processedContent = this.processMarkdownLinks(content);
      contentDiv.innerHTML = `<p>${processedContent}</p>`;
    }
    
    messageDiv.appendChild(contentDiv);
    
    this.elements.chatMessages.appendChild(messageDiv);
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    
    return messageDiv;
  },

  /**
   * Process markdown-style links in messages
   * 
   * @param {string} text - Text to process
   * @returns {string} - Processed HTML
   */
  processMarkdownLinks(text) {
    // First handle code blocks with triple backticks
    let processedText = text.replace(/```(\w*)\s*([\s\S]*?)```/g, function(match, language, code) {
      // For JSON blocks that contain domain suggestions
      if (language.toLowerCase() === 'json') {
        try {
          // Try to parse the JSON
          const jsonData = JSON.parse(code.trim() || '{"domains":[]}');
          
          // Check if this is a domains JSON block
          if (jsonData.domains && Array.isArray(jsonData.domains)) {
            // Create a formatted list of domains instead of showing raw JSON
            let formattedList = '<div class="domain-suggestions-list">';
            formattedList += '<h4 class="text-sm font-medium mb-2">Domain Suggestions:</h4>';
            formattedList += '<ul class="list-none p-0">';
            
            // Add each domain as a list item with nice formatting
            jsonData.domains.forEach(domain => {
              formattedList += `
                <li class="mb-2 domain-suggestion-item">
                  <div class="flex items-center">
                    <span class="domain-name font-medium">${domain}</span>
                    <a href="https://instantdomainsearch.com/?q=${domain}" target="_blank" class="ml-2 text-xs text-blue-600 hover:underline">
                      <i class="fas fa-external-link-alt"></i> Check
                    </a>
                  </div>
                </li>`;
            });
            
            formattedList += '</ul></div>';
            return formattedList;
          }
        } catch (e) {
          // If JSON parsing fails, fall back to normal handling
          console.error("Error parsing JSON in chat:", e);
        }
        
        // If empty or not a domains JSON, provide sample
        if (code.trim() === '') {
          // Create sample domain data to show instead of "No content"
          const sampleJson = JSON.stringify({
            "domains": [
              "teamflow.ai",
              "projecthub.com",
              "tasklink.app"
            ]
          }, null, 2);
          
          return '<div class="code-block"><span class="code-language">json</span><pre><code>' + sampleJson + '</code></pre></div>';
        }
        
        // Non-empty JSON that's not a domains list
        return '<div class="code-block"><span class="code-language">json</span><pre><code>' + code + '</code></pre></div>';
      } else if (code.trim() === '') {
        // Handle other empty code blocks
        return '<div class="code-block empty-code"><span class="code-language">' + (language || 'plain') + '</span><pre><code>No content</code></pre></div>';
      } else {
        // Non-empty code blocks
        return '<div class="code-block"><span class="code-language">' + (language || 'plain') + '</span><pre><code>' + code + '</code></pre></div>';
      }
    });
    
    // Then handle inline code with single backticks
    processedText = processedText.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Then handle markdown links [text](url)
    processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>');
    
    return processedText;
  },

  /**
   * Create a formatted domain list for display in chat
   * 
   * @param {Array} domains - Array of domain names
   * @returns {string} - HTML string with formatted list
   */
  createFormattedDomainList(domains) {
    if (!domains || domains.length === 0) return '';
    
    let formattedList = '<div class="domain-suggestions-list">';
    formattedList += '<h4 class="text-sm font-medium mb-2">Domain Suggestions:</h4>';
    formattedList += '<ul class="list-none p-0">';
    
    // Add each domain as a list item with nice formatting
    domains.forEach(domain => {
      formattedList += `
        <li class="mb-2 domain-suggestion-item">
          <div class="flex items-center">
            <span class="domain-name font-medium">${domain}</span>
            <a href="https://instantdomainsearch.com/?q=${domain}" target="_blank" class="ml-2 text-xs text-blue-600 hover:underline">
              <i class="fas fa-external-link-alt"></i> Check
            </a>
          </div>
        </li>`;
    });
    
    formattedList += '</ul></div>';
    return formattedList;
  },

  /**
   * Create a summary of domain check results for the chat window
   * 
   * @param {Array} results - Domain check results
   * @returns {string} - HTML string with formatted summary
   */
  createDomainResultsSummary(results) {
    if (!results || results.length === 0) return '';
    
    // Group domains by availability
    const availableDomains = results.filter(r => r.available);
    const unavailableDomains = results.filter(r => !r.available);
    
    let summaryMessage = "Here are the domain check results:\n\n";
    summaryMessage += '<div class="domain-check-results">';
    
    // Available domains section
    if (availableDomains.length > 0) {
      summaryMessage += '<div class="available-domains mb-3">';
      summaryMessage += '<h4 class="text-green-600 font-medium">Available Domains:</h4>';
      summaryMessage += '<ul class="list-none p-0">';
      
      availableDomains.forEach(domain => {
        summaryMessage += `
          <li class="mb-1">
            <span class="text-green-600">✓</span> 
            <span class="font-medium">${domain.domain}</span>
            <a href="https://instantdomainsearch.com/?q=${domain.domain}" target="_blank" class="ml-2 text-xs text-blue-600 hover:underline">
              <i class="fas fa-external-link-alt"></i> Check
            </a>
          </li>`;
      });
      
      summaryMessage += '</ul></div>';
    }
    
    // Unavailable domains section
    if (unavailableDomains.length > 0) {
      summaryMessage += '<div class="unavailable-domains">';
      summaryMessage += '<h4 class="text-red-600 font-medium">Unavailable Domains:</h4>';
      summaryMessage += '<ul class="list-none p-0">';
      
      unavailableDomains.forEach(domain => {
        summaryMessage += `
          <li class="mb-1">
            <span class="text-red-600">✗</span> 
            <span class="font-medium">${domain.domain}</span>
            ${domain.cached ? '<span class="text-xs text-gray-500">(cached)</span>' : ''}
          </li>`;
      });
      
      summaryMessage += '</ul></div>';
    }
    
    summaryMessage += '</div>';
    
    // Add a question to prompt the user for next steps
    summaryMessage += "\n\nWhat would you like to do next?";
    
    return summaryMessage;
  },

  /**
   * Display domain check results in the results container
   * 
   * @param {Array} results - Domain check results
   */
  displayDomainResults(results) {
    // Don't clear previous results, keep appending
    if (results.length === 0) {
      // Only update if empty and no previous results
      if (this.elements.resultsContainer.children.length === 0) {
        this.elements.resultsContainer.innerHTML = `
          <div class="text-center text-gray-500 italic">
            <p>No results found</p>
          </div>
        `;
      }
      return;
    }
    
    // Check for API errors and display them prominently
    const apiErrors = results.filter(result => result.error);
    if (apiErrors.length > 0) {
      // Create error panel at the top
      const errorPanel = document.createElement('div');
      errorPanel.className = 'mb-4 p-4 bg-red-50 border border-red-300 rounded-lg';
      errorPanel.innerHTML = `
        <h3 class="text-red-700 font-medium mb-2">API Errors Detected</h3>
        <div class="text-sm text-red-600">
          ${apiErrors.map(result => `
            <div class="mb-2">
              <p><strong>${result.domain}:</strong> ${result.error}</p>
              ${result.details ? `<pre class="mt-1 bg-red-100 p-2 rounded text-xs overflow-auto">${JSON.stringify(result.details, null, 2)}</pre>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="text-xs text-red-500 mt-2">
          <p>Check the browser console for more detailed error information</p>
        </div>
      `;
      
      // Find existing error panel or add a new one
      const existingPanel = this.elements.resultsContainer.querySelector('.bg-red-50.border-red-300');
      if (existingPanel) {
        this.elements.resultsContainer.replaceChild(errorPanel, existingPanel);
      } else {
        this.elements.resultsContainer.insertBefore(errorPanel, this.elements.resultsContainer.firstChild);
      }
    }
    
    // Remove the empty state message if it exists
    const emptyMessage = this.elements.resultsContainer.querySelector('.text-center.text-gray-500.italic');
    if (emptyMessage) {
      this.elements.resultsContainer.removeChild(emptyMessage);
    }
    
    // Create result cards for each domain and add to the top of their availability group
    results.forEach(result => {
      const resultCard = document.createElement('div');
      resultCard.className = `p-4 rounded-lg border ${result.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} mb-3 result-card`;
      resultCard.setAttribute('data-domain', result.domain);
      resultCard.setAttribute('data-available', result.available);
      resultCard.setAttribute('data-timestamp', Date.now());
      
      // Domain name with link
      const domainName = document.createElement('h3');
      domainName.className = 'text-lg font-medium flex items-center justify-between';
      
      const domainLink = document.createElement('a');
      domainLink.href = `https://instantdomainsearch.com/?q=${result.domain}`;
      domainLink.target = '_blank';
      domainLink.className = 'text-blue-600 hover:underline flex items-center';
      domainLink.innerHTML = `${result.domain} <i class="fas fa-external-link-alt text-xs ml-1"></i>`;
      
      const statusBadge = document.createElement('span');
      statusBadge.className = `px-3 py-1 text-sm rounded-full font-bold ${result.available ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`;
      statusBadge.innerHTML = result.available ? 
        '<i class="fas fa-check-circle mr-1"></i>AVAILABLE' : 
        '<i class="fas fa-times-circle mr-1"></i>UNAVAILABLE';
      
      domainName.appendChild(domainLink);
      domainName.appendChild(statusBadge);
      resultCard.appendChild(domainName);
      
      // Cached indicator if applicable
      if (result.cached) {
        const cachedBadge = document.createElement('div');
        cachedBadge.className = 'text-xs text-gray-500 mt-1 italic';
        cachedBadge.innerHTML = `<i class="fas fa-clock mr-1"></i> Using cached result (refreshed every 24h)`;
        resultCard.appendChild(cachedBadge);
      }
      
      // Additional info for unavailable domains
      if (!result.available && !result.error) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'mt-2 text-sm text-gray-600';
        
        let infoHTML = '';
        if (result.createdDate) {
          infoHTML += `<p><strong>Registered:</strong> ${new Date(result.createdDate).toLocaleDateString()}</p>`;
        }
        if (result.expiresDate) {
          infoHTML += `<p><strong>Expires:</strong> ${new Date(result.expiresDate).toLocaleDateString()}</p>`;
        }
        if (result.registrar) {
          infoHTML += `<p><strong>Registrar:</strong> ${result.registrar}</p>`;
        }
        
        infoDiv.innerHTML = infoHTML;
        resultCard.appendChild(infoDiv);
      }
      
      // Error message if applicable
      if (result.error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mt-2 text-sm text-red-600';
        errorDiv.textContent = `Error: ${result.error}`;
        resultCard.appendChild(errorDiv);
      }
      
      // Check if this domain already exists in the results
      const existingCard = this.elements.resultsContainer.querySelector(`[data-domain="${result.domain}"]`);
      if (existingCard) {
        // Replace the existing card with the updated one
        this.elements.resultsContainer.replaceChild(resultCard, existingCard);
      } else {
        // Add to appropriate section based on availability
        // This ensures available domains stay at the top
        if (result.available) {
          // Find the first unavailable domain card
          const firstUnavailable = this.elements.resultsContainer.querySelector('[data-available="false"]');
          if (firstUnavailable) {
            // Insert before the first unavailable
            this.elements.resultsContainer.insertBefore(resultCard, firstUnavailable);
          } else {
            // No unavailable domains, append to the end
            this.elements.resultsContainer.appendChild(resultCard);
          }
        } else {
          // Unavailable domain - append to end
          this.elements.resultsContainer.appendChild(resultCard);
        }
      }
    });
    
    // Re-sort available domains by newest first (within their availability group)
    const availableDomains = Array.from(this.elements.resultsContainer.querySelectorAll('[data-available="true"]'))
      .sort((a, b) => parseInt(b.getAttribute('data-timestamp')) - parseInt(a.getAttribute('data-timestamp')));
    
    const unavailableDomains = Array.from(this.elements.resultsContainer.querySelectorAll('[data-available="false"]'))
      .sort((a, b) => parseInt(b.getAttribute('data-timestamp')) - parseInt(a.getAttribute('data-timestamp')));
    
    // Clear and re-add in the sorted order
    availableDomains.forEach(card => {
      this.elements.resultsContainer.removeChild(card);
    });
    
    unavailableDomains.forEach(card => {
      this.elements.resultsContainer.removeChild(card);
    });
    
    // Add available domains first (newest at top)
    availableDomains.forEach(card => {
      this.elements.resultsContainer.appendChild(card);
    });
    
    // Then add unavailable domains (newest at top)
    unavailableDomains.forEach(card => {
      this.elements.resultsContainer.appendChild(card);
    });
    
    this.hideLoader();
  },

  /**
   * Show the loading indicator
   */
  showLoader() {
    this.elements.resultsLoader.classList.remove('hidden');
    this.elements.resultsContainer.classList.add('hidden');
  },

  /**
   * Hide the loading indicator
   */
  hideLoader() {
    this.elements.resultsLoader.classList.add('hidden');
    this.elements.resultsContainer.classList.remove('hidden');
  }
};

export default UI; 