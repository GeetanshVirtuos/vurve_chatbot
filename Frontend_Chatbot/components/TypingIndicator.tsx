import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex w-full mb-4 justify-start animate-fade-in">
      <div className="flex items-start max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-700 text-white font-semibold mr-2">
          🤖
        </div>

        {/* Typing Bubble */}
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
