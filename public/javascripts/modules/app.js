/**
 * Copyright (c) 2025 Waqar Ghaffar - All Rights Reserved
 *
 * Main App Module - Controls the application flow
 */
import API from './api.js';
import UI from './ui.js';
import Storage from './storage.js';

const App = {
  // State variables
  conversationHistory: [],
  lastResults: [],

  /**
   * Initialize the application
   */
  initialize() {
    // Initialize UI
    UI.initialize();
    
    // Load saved data
    this.conversationHistory = Storage.getInitialConversation();
    this.lastResults = Storage.getLastResults();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load saved domains to results container if they exist
    if (this.lastResults.length > 0) {
      UI.displayDomainResults(this.lastResults);
    }
    
    // Load saved chat messages
    this.loadSavedChatMessages();
  },

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Send button click
    UI.elements.sendButton.addEventListener('click', () => this.handleUserMessage());
    
    // Enter key in input field
    UI.elements.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleUserMessage();
      }
    });
    
    // Clear history button
    UI.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
  },

  /**
   * Handle user message submission
   */
  handleUserMessage() {
    const message = UI.elements.userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    UI.addMessageToChat('user', message);
    UI.elements.userInput.value = '';

    // Get current domain limit
    const currentLimit = parseInt(UI.elements.domainLimit.value);
    
    // Append domain limit info to the user's message
    const messageWithLimit = `${message}\n\n[Please provide ${currentLimit} domain suggestions]`;

    // Store in conversation history (with domain limit appended)
    this.conversationHistory.push({ role: 'user', content: messageWithLimit });
    Storage.save('conversationHistory', this.conversationHistory);

    // Process the user message
    this.processUserMessage(message);
  },

  /**
   * Process user message and show loader
   * 
   * @param {string} message - User's message
   */
  processUserMessage(message) {
    UI.showLoader();
    this.processChatWithContext(message);
  },
  
  /**
   * Process chat with context and handle the response
   * 
   * @param {string} message - User's message
   */
  async processChatWithContext(message) {
    // Show the thinking message
    const thinkingMsg = UI.addMessageToChat('ai', "Thinking", true);
    
    try {
      // Send entire conversation history to get a contextualized response
      const data = await API.sendChatMessage(
        this.conversationHistory,
        this.lastResults,
        parseInt(UI.elements.domainLimit.value)
      );
      
      // Remove the thinking message with a smooth transition
      thinkingMsg.classList.add('fade-out');
      
      // Use a promise to wait for the fade-out animation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Make sure the message still exists before trying to remove it
      if (UI.elements.chatMessages.contains(thinkingMsg)) {
        UI.elements.chatMessages.removeChild(thinkingMsg);
      }
      
      if (data.error) {
        UI.addMessageToChat('ai', `Sorry, I encountered an error: ${data.error}`);
        UI.hideLoader();
        return;
      }
      
      // Process message and domain results together
      let processedMessage = data.message;
      
      // If we have domain results and the message contains a JSON block indicator
      if (data.domains && data.domains.results && data.domains.results.length > 0) {
        // Extract all domain names from the results
        const domainNames = data.domains.results.map(result => result.domain);
        
        // Remove any empty JSON blocks from the message
        if (processedMessage) {
          // More comprehensive pattern to catch different empty JSON block formats
          processedMessage = processedMessage.replace(/```json\s*\n*\s*\n*```/g, '');
        }
        
        // Create a formatted domain list to insert into the message
        let formattedList = UI.createFormattedDomainList(domainNames);
        
        // If the message has a cue about domain suggestions, insert the formatted list after it
        if (processedMessage && (
            processedMessage.includes("domain suggestion") || 
            processedMessage.includes("domain name") || 
            processedMessage.includes("Here are some") ||
            processedMessage.includes("suggestions for you"))) {
          
          // Insert the formatted list at the end of the first paragraph
          const firstParagraphEnd = processedMessage.indexOf("\n\n");
          if (firstParagraphEnd !== -1) {
            processedMessage = 
              processedMessage.substring(0, firstParagraphEnd) + 
              "\n\n" + formattedList + 
              (firstParagraphEnd + 2 < processedMessage.length ? processedMessage.substring(firstParagraphEnd + 2) : "");
          } else {
            // If no paragraph break, just append
            processedMessage += "\n\n" + formattedList;
          }
        } else if (processedMessage) {
          // Otherwise append the formatted list to the end
          processedMessage += "\n\n" + formattedList;
        } else {
          // If there's no message at all, create one with the formatted list
          processedMessage = "Here are some domain suggestions based on your request:\n\n" + formattedList;
        }
      }
      
      // Display AI's text response if available
      if (processedMessage) {
        UI.addMessageToChat('ai', processedMessage);
        // Add to conversation history
        this.conversationHistory.push({ role: 'assistant', content: processedMessage });
        Storage.save('conversationHistory', this.conversationHistory);
      }
      
      // Show domain results in the sidebar if available
      if (data.domains && data.domains.results && data.domains.results.length > 0) {
        // Sort results (available first)
        data.domains.results.sort((a, b) => {
          if (a.available && !b.available) return -1;
          if (!a.available && b.available) return 1;
          return a.domain.localeCompare(b.domain);
        });
        
        // Update lastResults for future context
        this.lastResults = data.domains.results;
        Storage.save('lastResults', this.lastResults);
        
        // Display results
        UI.displayDomainResults(data.domains.results);
      } else {
        // No domains were returned
        UI.hideLoader();
      }
      
    } catch (error) {
      console.error('Error in chat processing:', error);
      
      // Remove the thinking message with a smooth transition
      thinkingMsg.classList.add('fade-out');
      
      // Wait for the animation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Make sure the message still exists before trying to remove it
      if (UI.elements.chatMessages.contains(thinkingMsg)) {
        UI.elements.chatMessages.removeChild(thinkingMsg);
      }
      
      UI.addMessageToChat('ai', `Sorry, I encountered an error: ${error.message}`);
      UI.hideLoader();
    }
  },

  /**
   * Load saved chat messages from storage
   */
  loadSavedChatMessages() {
    // Skip the first two entries (system message and welcome message)
    const chatHistory = this.conversationHistory.slice(2);
    
    if (chatHistory.length === 0) return;
    
    // Clear any initial welcome message that may be in the DOM
    UI.elements.chatMessages.innerHTML = '';
    
    // Add welcome message from assistant
    UI.addMessageToChat('ai', this.conversationHistory[1].content);
    
    // Add saved messages
    for (let i = 0; i < chatHistory.length; i++) {
      const message = chatHistory[i];
      UI.addMessageToChat(message.role === 'user' ? 'user' : 'ai', message.content);
    }
  },
  
  /**
   * Clear history after confirmation
   */
  clearHistory() {
    // Confirm before clearing
    if (confirm('Are you sure you want to clear all chat history and domain results?')) {
      // Clear localStorage
      Storage.clearAll();
      
      // Reset conversation history to initial state
      this.conversationHistory = Storage.getInitialConversation();
      
      // Reset results
      this.lastResults = [];
      
      // Clear UI
      UI.elements.chatMessages.innerHTML = '';
      UI.elements.resultsContainer.innerHTML = '';
      
      // Add welcome message
      UI.addMessageToChat('ai', this.conversationHistory[1].content);
      
      // Show message that history was cleared
      const notification = document.createElement('div');
      notification.className = 'text-center text-gray-500 italic my-4';
      notification.textContent = 'History cleared';
      UI.elements.chatMessages.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        if (UI.elements.chatMessages.contains(notification)) {
          notification.classList.add('fade-out');
          setTimeout(() => {
            if (UI.elements.chatMessages.contains(notification)) {
              UI.elements.chatMessages.removeChild(notification);
            }
          }, 300);
        }
      }, 3000);
    }
  }
};

export default App; 