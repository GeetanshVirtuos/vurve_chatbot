/**
 * GiftCart AI Chatbot Widget
 * Vanilla JS implementation with Shadow DOM for style isolation
 * Optimized for Shopify storefronts
 */

console.log('[GiftCart] Widget script starting...');

(function() {
  'use strict';

  console.log('[GiftCart] IIFE executing...');

  // Prevent multiple initializations
  if (window.GiftCartChatbot) {
    console.log('[GiftCart] Already initialized, exiting');
    return;
  }

  // ============================================================================
  // BACKEND CONFIGURATION - CHANGE THIS TO YOUR BACKEND URL
  // ============================================================================
  const BACKEND_BASE_URL = 'http://localhost:8000'; // Change this to your backend URL
  const CONFIG_API_ENDPOINT = '/api/v1/chat-widget-config/public';
  // ============================================================================

  // Default configuration (will be overridden by backend config)
  const DEFAULT_CONFIG = {
    apiUrl: 'https://bot.api.vurve.ai/api/v1/talk',
    shop: '',
    assistant_name: 'GiftCart Assistant',
    brand_color: '#0284c7',
    text_color: '#FFFFFF',
    accent_color: '#0284c7',
    text_color_for_bot: '#1f2937',
    position: 'bottom-right',
    trigger_button_text: '',
    trigger_button_emoji: '🎁',
    trigger_button_icon_url: '',
    border_radius: 12,
    welcome_message: 'Hello! I\'m your GiftCart assistant. How can I help you find the perfect gift today?',
    enabled: true
  };

  let config = { ...DEFAULT_CONFIG };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  // Get shop domain from Shopify context
  function getShopDomain() {
    // Try multiple methods to get shop domain
    if (window.Shopify && window.Shopify.shop) {
      return window.Shopify.shop;
    }
    // Check for custom config
    if (window.GIFTCART_CHAT_CONFIG && window.GIFTCART_CHAT_CONFIG.shop) {
      return window.GIFTCART_CHAT_CONFIG.shop;
    }
    // Fallback: extract from current domain
    return window.location.hostname;
  }

  // Fetch configuration from backend
  async function fetchBackendConfig() {
    try {
      const shopDomain = getShopDomain();
      console.log('[GiftCart] Fetching config for shop:', shopDomain);
      
      const response = await fetch(`${BACKEND_BASE_URL}${CONFIG_API_ENDPOINT}/${shopDomain}`);
      
      if (!response.ok) {
        console.warn('[GiftCart] Failed to fetch config:', response.status);
        return null;
      }
      
      const backendConfig = await response.json();
      console.log('[GiftCart] Backend config received:', backendConfig);
      
      return backendConfig;
    } catch (error) {
      console.error('[GiftCart] Error fetching backend config:', error);
      return null;
    }
  }

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

  // Utility: Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility: Generate UUID v4
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Utility: Get or create user UUID with session management
  function getUserId(shopDomain) {
    const USER_SESSION_KEY = 'gc_user_session';
    const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours
    
    try {
      const stored = localStorage.getItem(USER_SESSION_KEY);
      const now = Date.now();
      
      if (stored) {
        const session = JSON.parse(stored);
        // Validate session: same shop domain and not expired
        if (session.shop_domain === shopDomain && (now - session.created_at) < EXPIRATION_TIME) {
          // Update last activity
          session.last_activity = now;
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
          return session.user_uuid;
        }
      }
      
      // Create new session
      const newSession = {
        user_uuid: generateUUID(),
        shop_domain: shopDomain,
        created_at: now,
        last_activity: now
      };
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(newSession));
      return newSession.user_uuid;
    } catch (error) {
      console.error('[GiftCart] Error managing user session:', error);
      return generateUUID();
    }
  }

  // Utility: Manage chat history in localStorage
  const ChatHistory = {
    STORAGE_KEY: 'gc_chat_history',
    EXPIRATION_TIME: 24 * 60 * 60 * 1000, // 24 hours
    
    // Load all valid (non-expired) messages
    load: function() {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return [];
        
        const messages = JSON.parse(stored);
        const now = Date.now();
        
        // Filter out expired messages (older than 24 hours)
        const valid = messages.filter(msg => (now - msg.timestamp) < this.EXPIRATION_TIME);
        
        // Save cleaned history
        if (valid.length !== messages.length) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(valid));
        }
        
        return valid;
      } catch (error) {
        console.error('[GiftCart] Error loading chat history:', error);
        return [];
      }
    },
    
    // Add message to history
    add: function(role, content, userId) {
      try {
        const messages = this.load();
        messages.push({
          role: role,
          content: content,
          user_uuid: userId,
          timestamp: Date.now()
        });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('[GiftCart] Error saving message to history:', error);
      }
    },
    
    // Clear all chat history
    clear: function() {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (error) {
        console.error('[GiftCart] Error clearing chat history:', error);
      }
    }
  };

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
    constructor(config, userId) {
      this.config = config;
      this.userId = userId;
      this.api = new ChatAPI(config.apiUrl);
      this.messages = [];
      this.isOpen = false;
      this.isLoading = false;
      this.shopDomain = getShopDomain();
      
      this.init();
    }

    init() {
      // Check if widget is enabled
      if (!this.config.enabled) {
        console.log('[GiftCart] Widget is disabled, not initializing');
        return;
      }
      
      this.createWidget();
      this.attachEventListeners();
      this.setupCrossTabSync();
      this.loadChatHistory();
    }

    createWidget() {
      // Create container
      this.container = document.createElement('div');
      this.container.id = 'giftcart-chatbot-container';
      this.container.style.display = 'block';
      this.container.style.position = 'relative';
      this.container.style.zIndex = '2147483647';
      
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
      // Determine position styles
      let positionStyle = '';
      switch (this.config.position) {
        case 'bottom-left':
          positionStyle = 'left: 20px;';
          break;
        case 'bottom-center':
          positionStyle = 'left: 50%; transform: translateX(-50%);';
          break;
        case 'bottom-right':
        default:
          positionStyle = 'right: 20px;';
      }

      // Get button display content
      const buttonContent = this.getButtonContent();

      return `
        <style>
          ${this.getStyles()}
        </style>
        
        <div id="gc-chat-button" style="${positionStyle}">
          ${buttonContent}
        </div>
        
        <div id="gc-chat-window" style="${positionStyle}">
          <div id="gc-header">
            <div id="gc-header-content">
              <div id="gc-header-icon">${this.config.trigger_button_icon_url ? `<img src="${this.config.trigger_button_icon_url}" alt="icon" />` : this.config.trigger_button_emoji}</div>
              <div>
                <div id="gc-header-title">${escapeHtml(this.config.assistant_name)}</div>
                <div id="gc-header-subtitle">Online</div>
              </div>
            </div>
            <button id="gc-close-btn" aria-label="Close chat">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          
          <div id="gc-messages"></div>
          
          <div id="gc-typing-indicator" style="display: none;">
            <div class="gc-message gc-bot-message">
              <div class="gc-avatar gc-bot-avatar">
                ${this.config.trigger_button_icon_url ? `<img src="${this.config.trigger_button_icon_url}" alt="icon" />` : this.config.trigger_button_emoji}
              </div>
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

    getButtonContent() {
      if (this.config.trigger_button_text) {
        // Icon/Emoji on left, text on right
        const icon = this.config.trigger_button_icon_url 
          ? `<img id="gc-button-icon" src="${this.config.trigger_button_icon_url}" alt="chat" />`
          : `<span id="gc-button-emoji">${this.config.trigger_button_emoji}</span>`;
        
        return `
          ${icon}
          <span id="gc-button-text">${escapeHtml(this.config.trigger_button_text)}</span>
        `;
      } else {
        // Just icon/emoji
        return this.config.trigger_button_icon_url 
          ? `<img id="gc-button-icon" src="${this.config.trigger_button_icon_url}" alt="chat" />`
          : `<span id="gc-button-emoji">${this.config.trigger_button_emoji}</span>`;
      }
    }

    getStyles() {
      const brandColor = this.config.brand_color;
      const textColor = this.config.text_color;
      const accentColor = this.config.accent_color;
      const textColorForBot = this.config.text_color_for_bot;
      const borderRadius = this.config.border_radius || 12;
      
      return `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
        }

        #gc-chat-button {
          position: fixed;
          bottom: 20px;
          width: auto;
          min-width: 60px;
          height: 60px;
          background: linear-gradient(135deg, ${brandColor} 0%, ${this.adjustColor(brandColor, -20)} 100%);
          border-radius: ${borderRadius}px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 14px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          z-index: 999998;
        }

        #gc-chat-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        #gc-button-emoji {
          font-size: 24px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #gc-button-icon {
          width: 28px;
          height: 28px;
          display: block;
          border-radius: ${borderRadius}px;
        }

        #gc-button-text {
          color: ${textColor};
          font-size: 1.5rem;
          font-weight: 500;
          white-space: nowrap;
        }

        #gc-chat-window {
          position: fixed;
          bottom: 90px;
          width: 380px;
          max-width: calc(100vw - 40px);
          height: calc(50vh);
          max-height: calc(50vh);
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          display: none;
          flex-direction: column;
          z-index: 999999;
        }

        #gc-chat-window.gc-open {
          display: flex;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            bottom: 70px;
          }
          to {
            opacity: 1;
            bottom: 90px;
          }
        }

        #gc-header {
          background: linear-gradient(135deg, ${brandColor} 0%, ${this.adjustColor(brandColor, -20)} 100%);
          color: ${textColor};
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
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #gc-header-icon img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        #gc-header-title {
          font-size: 16px;
          font-weight: 600;
          color: ${textColor};
        }

        #gc-header-subtitle {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 2px;
          color: ${textColor};
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
          color: ${textColor};
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
          background-size: cover;
          background-position: center;
        }

        .gc-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .gc-user-avatar {
          background: white;
          border: 2px solid ${brandColor};
        }

        .gc-bot-avatar {
          background: linear-gradient(135deg, ${accentColor} 0%, ${this.adjustColor(accentColor, -20)} 100%);
        }

        .gc-message-content {
          max-width: 75%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
        }

        .gc-user-message .gc-message-content {
          background: white;
          color: #1f2937;
          border: 2px solid ${brandColor};
          border-radius: 16px 16px 4px 16px;
        }

        .gc-bot-message .gc-message-content {
          background: ${accentColor};
          color: ${textColor};
          border-radius: 16px 16px 16px 4px;
        }

        .gc-error-message .gc-message-content {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .gc-message-content strong {
          font-weight: 600;
        }

        .gc-message-content em {
          font-style: italic;
        }

        .gc-message-content a {
          color: ${brandColor};
          text-decoration: underline;
        }

        .gc-user-message .gc-message-content a {
          color: ${textColor};
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
          border: 2px solid #d1d5db;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          max-height: 120px;
          outline: none;
          transition: border-color 0.2s;
          color: #1f2937;
        }

        #gc-input::placeholder {
          color: #9ca3af;
        }

        #gc-input:focus {
          border-color: ${brandColor};
        }

        #gc-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
          color: #9ca3af;
        }

        #gc-send-btn {
          background: ${brandColor};
          color: ${textColor};
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
          background: ${this.adjustColor(brandColor, -20)};
          transform: scale(1.05);
        }

        #gc-send-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        /* Tablet: iPad Mini, Surface Pro, etc (768px - 1024px) */
        @media (max-width: 1024px) and (min-width: 769px) and (min-height: 700px) {
          #gc-chat-window {
            width: 400px;
            max-width: calc(100vw - 40px);
            height: calc(70vh);
            max-height: calc(70vh);
            bottom: 80px;
          }

          #gc-chat-button {
            width: auto;
            min-width: 60px;
            height: 52px;
            padding: 0 14px;
            bottom: 20px;
          }

          #gc-button-text {
            font-size: 13px;
            display: flex;
          }

          #gc-button-icon {
            width: 26px;
            height: 26px;
          }

          #gc-button-emoji {
            font-size: 22px;
          }

          .gc-message-content {
            max-width: 80%;
            font-size: 13px;
          }

          #gc-header-title {
            font-size: 15px;
          }

          #gc-header-subtitle {
            font-size: 11px;
          }
        }

        /* Landscape Tablets: 1024x600 and similar (wide but short) */
        @media (min-width: 1024px) and (max-height: 700px) {
          #gc-chat-window {
            width: 380px;
            max-width: calc(100vw - 40px);
            height: calc(80vh);
            max-height: calc(80vh);
            bottom: 90px;
          }

          #gc-chat-button {
            width: auto;
            min-width: 60px;
            height: 52px;
            padding: 0 14px;
            bottom: 20px;
          }

          #gc-button-text {
            font-size: 13px;
            display: flex;
          }

          #gc-button-icon {
            width: 26px;
            height: 26px;
          }

          #gc-button-emoji {
            font-size: 22px;
          }

          .gc-message-content {
            max-width: 80%;
            font-size: 13px;
          }

          #gc-header-title {
            font-size: 15px;
          }

          #gc-header-subtitle {
            font-size: 11px;
          }
        }

        /* Small Tablet: Surface Duo, small tablets (540px - 768px) */
        @media (max-width: 768px) and (min-width: 481px) {
          #gc-chat-window {
            width: 360px;
            max-width: calc(100vw - 40px);
            height: calc(60vh);
            max-height: calc(60vh);
            bottom: 70px;
          }

          #gc-chat-button {
            width: auto;
            min-width: 54px;
            height: 48px;
            padding: 0 12px;
            bottom: 16px;
          }

          #gc-button-text {
            font-size: 12px;
            display: flex;
          }

          #gc-button-icon {
            width: 24px;
            height: 24px;
          }

          #gc-button-emoji {
            font-size: 20px;
          }

          .gc-message-content {
            max-width: 85%;
            font-size: 12px;
          }

          #gc-header-title {
            font-size: 14px;
          }

          #gc-header-subtitle {
            font-size: 11px;
          }
        }

        /* Mobile: phones (max 480px) */
        @media (max-width: 480px) {
          #gc-chat-window {
            width: calc(100vw - 24px);
            height: calc(50vh);
            max-height: calc(50vh);
            bottom: 60px;
          }

          #gc-chat-button {
            min-width: 50px;
            height: 44px;
            bottom: 12px;
            padding: 0 12px;
          }

          #gc-button-text {
            font-size: 12px;
            display: flex;
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

    setupCrossTabSync() {
      // Listen for chat history updates from other tabs
      window.addEventListener('storage', (e) => {
        if (e.key === ChatHistory.STORAGE_KEY && e.newValue) {
          try {
            const newHistory = JSON.parse(e.newValue);
            const currentCount = this.messages.length;
            
            // If history has grown, render new messages
            if (newHistory.length > currentCount) {
              const newMessages = newHistory.slice(currentCount);
              newMessages.forEach(msg => {
                this.renderMessage({
                  role: msg.role,
                  content: msg.content,
                  timestamp: new Date(msg.timestamp)
                });
              });
              this.scrollToBottom();
            }
          } catch (error) {
            console.error('[GiftCart] Error syncing chat history from other tabs:', error);
          }
        }
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

    loadChatHistory() {
      const history = ChatHistory.load();
      
      if (history.length === 0) {
        // No history found, add welcome message
        this.addWelcomeMessage();
      } else {
        // Render all historical messages
        history.forEach(msg => {
          this.renderMessage({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          });
        });
      }
      
      this.scrollToBottom();
    }

    addWelcomeMessage() {
      const welcomeMsg = {
        role: 'assistant',
        content: this.config.welcome_message,
        timestamp: new Date()
      };
      this.messages.push(welcomeMsg);
      this.renderMessage(welcomeMsg);
      this.scrollToBottom();
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
      
      if (message.role === 'user') {
        avatar.textContent = '👤';
      } else {
        if (this.config.trigger_button_icon_url) {
          const img = document.createElement('img');
          img.src = this.config.trigger_button_icon_url;
          img.alt = 'bot';
          avatar.appendChild(img);
        } else {
          avatar.textContent = this.config.trigger_button_emoji;
        }
      }
      
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

      // Add user message to state and render
      const userMsg = {
        role: 'user',
        content: text,
        timestamp: new Date()
      };
      this.addMessage(userMsg);
      
      // Save to history immediately
      ChatHistory.add('user', text, this.userId);

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
      const botMsg = {
        role: 'assistant',
        content: response.success ? response.message : response.error,
        error: !response.success,
        timestamp: new Date()
      };
      this.addMessage(botMsg);
      
      // Save bot response to history
      ChatHistory.add('assistant', response.success ? response.message : response.error, this.userId);
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
  async function init() {
    console.log('[GiftCart] Init function called, readyState:', document.readyState);
    
    // Get shop domain first for session management
    const shopDomain = getShopDomain();
    
    // Get or create user ID with session validation
    const userId = getUserId(shopDomain);
    console.log('[GiftCart] User ID:', userId);
    
    // Fetch backend configuration
    const backendConfig = await fetchBackendConfig();
    
    if (backendConfig) {
      // Merge backend config with defaults
      config = {
        ...DEFAULT_CONFIG,
        ...backendConfig,
      };
      console.log('[GiftCart] Final config:', config);
    } else {
      console.warn('[GiftCart] Could not fetch backend config, using defaults');
      config = {
        ...DEFAULT_CONFIG,
        ...(window.GIFTCART_CHAT_CONFIG || {})
      };
    }
    
    // Check if widget is enabled
    if (!config.enabled) {
      console.log('[GiftCart] Widget is disabled in configuration');
      return;
    }
    
    if (document.readyState === 'loading') {
      console.log('[GiftCart] Waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[GiftCart] DOMContentLoaded fired, creating chatbot...');
        window.GiftCartChatbot = new GiftCartChatbot(config, userId);
        console.log('[GiftCart] Chatbot created:', window.GiftCartChatbot);
      });
    } else {
      console.log('[GiftCart] DOM already ready, creating chatbot immediately...');
      window.GiftCartChatbot = new GiftCartChatbot(config, userId);
      console.log('[GiftCart] Chatbot created:', window.GiftCartChatbot);
    }
  }

  init();
  console.log('[GiftCart] Script execution complete');
})();
