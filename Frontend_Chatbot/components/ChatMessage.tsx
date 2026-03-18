import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.error;

  return (
    <div
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      <div
        className={`flex items-start max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
            isUser
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 ml-2'
              : 'bg-gradient-to-br from-gray-600 to-gray-700 mr-2'
          }`}
        >
          {isUser ? '👤' : '🤖'}
        </div>

        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-sm'
              : isError
              ? 'bg-red-50 text-red-900 border border-red-200 rounded-tl-sm'
              : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
          }`}
        >
          {isError && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-600">⚠️</span>
              <span className="text-xs font-semibold text-red-600">Error</span>
            </div>
          )}
          <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : ''}`}>
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          <div
            className={`text-xs mt-1 ${
              isUser ? 'text-primary-100' : isError ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
