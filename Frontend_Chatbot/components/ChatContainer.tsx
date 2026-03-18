'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { sendChatMessage, ApiError } from '@/lib/api';
import { getOrCreateUserId } from '@/lib/utils';

export default function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize user ID
    const id = getOrCreateUserId();
    setUserId(id);

    // Add welcome message
    const welcomeMessage: ChatMessageType = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: "👋 Hello! I'm your GiftCart assistant. How can I help you find the perfect gift today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!userId || isLoading) return;

    // Add user message to chat
    const userMessage: ChatMessageType = {
      id: 'user-' + Date.now(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call API
      const response = await sendChatMessage({
        user_uuid: userId,
        msg: content,
      });

      // Check if response contains an error
      if ('error' in response) {
        const errorMessage: ChatMessageType = {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: response.error,
          timestamp: new Date(),
          error: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const botMessage: ChatMessageType = {
          id: 'bot-' + Date.now(),
          role: 'assistant',
          content: response.bot_message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorContent = 'Sorry, something went wrong. Please try again.';
      
      if (error instanceof ApiError) {
        if (error.isNetworkError) {
          errorContent = '🔌 Unable to connect to the server. Please check your connection and try again.';
        } else {
          errorContent = error.message;
        }
      }

      const errorMessage: ChatMessageType = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const welcomeMessage: ChatMessageType = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: "Chat cleared! How can I help you find the perfect gift today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
              🎁
            </div>
            <div>
              <h1 className="text-xl font-bold">GiftCart Assistant</h1>
              <p className="text-sm text-primary-100">Here to help you find perfect gifts</p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium backdrop-blur-sm"
            aria-label="Clear chat"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ maxHeight: 'calc(100vh - 220px)' }}
      >
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white shadow-lg">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder="Ask me about gifts, products, or anything else..."
          />
        </div>
      </div>
    </div>
  );
}
