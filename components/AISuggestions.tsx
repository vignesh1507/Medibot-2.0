"use client";

import React from 'react';

interface AISuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  disabled?: boolean;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ onSuggestionClick, disabled = false }) => {
  // Curated popular health questions
  const popularQuestions = [
    "🌡️ What are the symptoms of flu?",
    "💊 How to manage high blood pressure?",
    "🥗 Healthy meal planning for busy schedules",
    "😴 How to improve sleep quality naturally?"
  ];

  return (
    <div className="space-y-6 px-4">
      {/* Header */}
      <div className="text-center space-y-2 animate-fade-in-up">
        <p className="text-sm text-gray-700 font-medium">
          Click any question below to get started...
        </p>
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {popularQuestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => !disabled && onSuggestionClick(suggestion)}
            disabled={disabled}
            className={`
              group relative text-left p-3 text-sm
              transition-all duration-300 transform hover:scale-105
              hover:bg-teal-50 rounded-lg border border-gray-200 bg-white
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              animate-fade-in-up suggestion-card-${index}
            `}
          >
            <div className="relative z-10">
              <p className="text-gray-800 font-semibold leading-relaxed group-hover:text-teal-700 transition-colors duration-200">
                {suggestion}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AISuggestions;
