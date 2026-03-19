/**
 * GiftCart AI Chatbot Widget
 * Vanilla JS implementation with Shadow DOM for style isolation
 * Optimized for Shopify storefronts
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.GiftCartChatbot) return;

  // Configuration
  const DEFAULT_CONFIG = {
    apiUrl: 'http://localhost:8000/api/v1/talk',
    shop: '',
    theme: {
      primaryColor: '#0284c7',
      position: 'bottom-right'
    }
  };

  const config = {
    ...DEFAULT_CONFIG,
    ...(window.GIFTCART_CHAT_CONFIG || {})
  };

  // Utility: Simple markdown-like text formatting
  function formatMessage(text) {
    if (!text) return '';
    
    return text
      // Bold: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Links: [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  // Utility: Get or create user UUID
  function getUserId() {
    const STORAGE_KEY = 'giftcart_user_uuid';
    let userId = localStorage.getItem(STORAGE_KEY);
    
    if (!userId) {
      userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem(STORAGE_KEY, userId);
    }
    
    return userId;
  }

  // API Service with retry logic
  class ChatAPI {
    constructor(apiUrl) {
      this.apiUrl = apiUrl;
      this.maxRetries = 3;
      this.retryDelay = 1000;
    }

    async sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async sendMessage(userId, message) {
      const payload = {
        user_uuid: userId,
        msg: message
      };

      let lastError = null;

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000);

          const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });

          clearTimeout(timeout);

          if (!response.ok) {
            let errorMsg = `Server error: ${response.status}`;
            try {
              const errorData = await response.json();
              if (errorData.error) errorMsg = errorData.error;
            } catch {}
            throw new Error(errorMsg);
          }

          const data = await response.json();
          
          if ('error' in data) {
            return { success: false, error: data.error };
          }
          
          return { success: true, message: data.bot_message };

        } catch (error) {
          lastError = error;
          
          if (error.name === 'AbortError') {
            return { success: false, error: 'Request timeout. Please try again.' };
          }

          if (attempt < this.maxRetries) {
            const delay = this.retryDelay * Math.pow(2, attempt);
            console.log(`Retry attempt ${attempt + 1}/${this.maxRetries} in ${delay}ms...`);
            await this.sleep(delay);
            continue;
          }
        }
      }

      return { 
        success: false, 
        error: lastError?.message || 'Unable to connect. Please try again.' 
      };
    }
  }

  // Main Chatbot Widget Class
  class GiftCartChatbot {
    constructor(config) {
      this.config = config;
      this.userId = getUserId();
      this.api = new ChatAPI(config.apiUrl);
      this.messages = [];
      this.isOpen = false;
      this.isLoading = false;
      
      this.init();
    }

    init() {
      this.createWidget();
      this.attachEventListeners();
      this.addWelcomeMessage();
    }

    createWidget() {
      // Create container
      this.container = document.createElement('div');
      this.container.id = 'giftcart-chatbot-container';
      
      // Attach Shadow DOM
      this.shadow = this.container.attachShadow({ mode: 'open' });
      
      // Add styles and HTML
      this.shadow.innerHTML = this.getTemplate();
      
      // Append to body
      document.body.appendChild(this.container);
      
      // Get element references
      this.elements = {
        button: this.shadow.querySelector('#gc-chat-button'),
        window: this.shadow.querySelector('#gc-chat-window'),
        closeBtn: this.shadow.querySelector('#gc-close-btn'),
        messagesContainer: this.shadow.querySelector('#gc-messages'),
        input: this.shadow.querySelector('#gc-input'),
        sendBtn: this.shadow.querySelector('#gc-send-btn'),
        typingIndicator: this.shadow.querySelector('#gc-typing-indicator')
      };
    }

    getTemplate() {
      const position = this.config.theme.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;';
      const primaryColor = this.config.theme.primaryColor;

      return `
        <style>
          ${this.getStyles()}
        </style>
        
        <div id="gc-chat-button" style="${position}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 13.89 2.53 15.66 3.45 17.15L2.05 21.95L6.85 20.55C8.34 21.47 10.11 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.34 20 8.77 19.53 7.45 18.71L7.14 18.53L4.23 19.27L4.97 16.36L4.79 16.05C3.97 14.73 3.5 13.16 3.5 11.5C3.5 7.36 6.86 4 11 4C15.14 4 18.5 7.36 18.5 11.5C18.5 15.64 15.14 19 11 19H12ZM16 13.5C16 13.78 15.78 14 15.5 14H8.5C8.22 14 8 13.78 8 13.5C8 13.22 8.22 13 8.5 13H15.5C15.78 13 16 13.22 16 13.5ZM13.5 10H8.5C8.22 10 8 9.78 8 9.5C8 9.22 8.22 9 8.5 9H13.5C13.78 9 14 9.22 14 9.5C14 9.78 13.78 10 13.5 10Z" fill="white"/>
          </svg>
        </div>
        
        <div id="gc-chat-window" style="${position}">
          <div id="gc-header">
            <div id="gc-header-content">
              <div id="gc-header-icon">🎁</div>
              <div>
                <div id="gc-header-title">GiftCart Assistant</div>
                <div id="gc-header-subtitle">Here to help you find perfect gifts</div>
              </div>
            </div>
            <button id="gc-close-btn" aria-label="Close chat">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          
          <div id="gc-messages"></div>
          
          <div id="gc-typing-indicator" style="display: none;">
            <div class="gc-message gc-bot-message">
              <div class="gc-avatar gc-bot-avatar">🤖</div>
              <div class="gc-message-content">
                <div class="gc-typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
          
          <div id="gc-input-container">
            <textarea 
              id="gc-input" 
              placeholder="Ask me about gifts..." 
              rows="1"
            ></textarea>
            <button id="gc-send-btn" aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }

    getStyles() {
      const primaryColor = this.config.theme.primaryColor;
      
      return `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        #gc-chat-button {
          position: fixed;
          bottom: 20px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -20)} 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          z-index: 999998;
        }

        #gc-chat-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        #gc-chat-button svg {
          width: 28px;
          height: 28px;
        }

        #gc-chat-window {
          position: fixed;
          bottom: 90px;
          width: 380px;
          max-width: calc(100vw - 40px);
          height: 600px;
          max-height: calc(100vh - 120px);
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          display: none;
          flex-direction: column;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        #gc-chat-window.gc-open {
          display: flex;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        #gc-header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -20)} 100%);
          color: white;
          padding: 16px;
          border-radius: 16px 16px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        #gc-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        #gc-header-icon {
          font-size: 32px;
          line-height: 1;
        }

        #gc-header-title {
          font-size: 16px;
          font-weight: 600;
        }

        #gc-header-subtitle {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 2px;
        }

        #gc-close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        #gc-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        #gc-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: linear-gradient(to bottom, #f9fafb 0%, #ffffff 100%);
        }

        #gc-messages::-webkit-scrollbar {
          width: 6px;
        }

        #gc-messages::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        #gc-messages::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .gc-message {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .gc-user-message {
          flex-direction: row-reverse;
        }

        .gc-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .gc-user-avatar {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -20)} 100%);
        }

        .gc-bot-avatar {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        }

        .gc-message-content {
          max-width: 75%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
        }

        .gc-user-message .gc-message-content {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -20)} 100%);
          color: white;
          border-radius: 16px 16px 4px 16px;
        }

        .gc-bot-message .gc-message-content {
          background: white;
          color: #1f2937;
          border: 1px solid #e5e7eb;
          border-radius: 16px 16px 16px 4px;
        }

        .gc-error-message .gc-message-content {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .gc-message-content strong {
          font-weight: 600;
        }

        .gc-message-content em {
          font-style: italic;
        }

        .gc-message-content a {
          color: ${primaryColor};
          text-decoration: underline;
        }

        .gc-user-message .gc-message-content a {
          color: white;
        }

        .gc-message-time {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
          text-align: right;
        }

        .gc-user-message .gc-message-time {
          color: rgba(255, 255, 255, 0.7);
        }

        #gc-typing-indicator {
          padding: 0 16px 16px;
          background: linear-gradient(to bottom, #f9fafb 0%, #ffffff 100%);
        }

        .gc-typing-dots {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }

        .gc-typing-dots span {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .gc-typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .gc-typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        #gc-input-container {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: white;
          border-radius: 0 0 16px 16px;
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        #gc-input {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          max-height: 120px;
          outline: none;
          transition: border-color 0.2s;
        }

        #gc-input:focus {
          border-color: ${primaryColor};
        }

        #gc-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        #gc-send-btn {
          background: ${primaryColor};
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        #gc-send-btn:hover:not(:disabled) {
          background: ${this.adjustColor(primaryColor, -20)};
          transform: scale(1.05);
        }

        #gc-send-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          #gc-chat-window {
            width: calc(100vw - 20px);
            height: calc(100vh - 100px);
            bottom: 80px;
          }

          #gc-chat-button {
            width: 56px;
            height: 56px;
          }

          .gc-message-content {
            max-width: 85%;
          }
        }
      `;
    }

    adjustColor(color, percent) {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
    }

    attachEventListeners() {
      this.elements.button.addEventListener('click', () => this.toggleChat());
      this.elements.closeBtn.addEventListener('click', () => this.closeChat());
      this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
      
      this.elements.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto-resize textarea
      this.elements.input.addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
      });
    }

    toggleChat() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.elements.window.classList.add('gc-open');
        this.elements.input.focus();
      } else {
        this.elements.window.classList.remove('gc-open');
      }
    }

    closeChat() {
      this.isOpen = false;
      this.elements.window.classList.remove('gc-open');
    }

    addWelcomeMessage() {
      this.addMessage({
        role: 'assistant',
        content: "👋 Hello! I'm your GiftCart assistant. How can I help you find the perfect gift today?",
        timestamp: new Date()
      });
    }

    addMessage(message) {
      this.messages.push(message);
      this.renderMessage(message);
      this.scrollToBottom();
    }

    renderMessage(message) {
      const messageEl = document.createElement('div');
      messageEl.className = `gc-message ${message.role === 'user' ? 'gc-user-message' : 'gc-bot-message'} ${message.error ? 'gc-error-message' : ''}`;
      
      const avatar = document.createElement('div');
      avatar.className = `gc-avatar ${message.role === 'user' ? 'gc-user-avatar' : 'gc-bot-avatar'}`;
      avatar.textContent = message.role === 'user' ? '👤' : '🤖';
      
      const content = document.createElement('div');
      content.className = 'gc-message-content';
      content.innerHTML = formatMessage(message.content);
      
      messageEl.appendChild(avatar);
      messageEl.appendChild(content);
      
      this.elements.messagesContainer.appendChild(messageEl);
    }

    scrollToBottom() {
      this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    async sendMessage() {
      const text = this.elements.input.value.trim();
      if (!text || this.isLoading) return;

      // Add user message
      this.addMessage({
        role: 'user',
        content: text,
        timestamp: new Date()
      });

      // Clear input
      this.elements.input.value = '';
      this.elements.input.style.height = 'auto';

      // Show loading state
      this.setLoading(true);

      // Call API
      const response = await this.api.sendMessage(this.userId, text);

      // Hide loading state
      this.setLoading(false);

      // Add bot response
      this.addMessage({
        role: 'assistant',
        content: response.success ? response.message : response.error,
        error: !response.success,
        timestamp: new Date()
      });
    }

    setLoading(loading) {
      this.isLoading = loading;
      this.elements.input.disabled = loading;
      this.elements.sendBtn.disabled = loading;
      this.elements.typingIndicator.style.display = loading ? 'block' : 'none';
      
      if (loading) {
        this.scrollToBottom();
      }
    }
  }

  // Initialize chatbot when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.GiftCartChatbot = new GiftCartChatbot(config);
      });
    } else {
      window.GiftCartChatbot = new GiftCartChatbot(config);
    }
  }

  init();
})();
