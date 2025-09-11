"use client";

import React from 'react';
import { Activity, Sparkles } from 'lucide-react';

interface AISuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  disabled?: boolean;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ onSuggestionClick, disabled = false }) => {
  // Curated popular health questions
  const popularQuestions = [
    "🌡️ What are the symptoms of flu?",
    "💊 How to manage high blood pressure?",
    "🏃‍♀️ Best exercises for heart health",
    "🥗 Healthy meal planning for busy schedules",
    "😴 How to improve sleep quality naturally?",
    "🧠 Tips for managing stress and anxiety",
    "🩺 When should I see a doctor?",
    "💉 Tell me about vaccination schedules",
    "🍎 Best foods for immune system support",
    "⏰ What's the ideal sleep schedule?",
    "💓 What are heart palpitations?",
    "🧂 How much salt is too much?"
  ];

  return (
    <div className="space-y-6 px-4">
      {/* Header */}
      <div className="text-center space-y-2 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            Popular Health Questions
          </h3>
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click any question below to get started
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
              group relative text-left p-4 text-sm bg-white dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700 rounded-xl
              transition-all duration-300 transform hover:scale-105 hover:shadow-lg
              hover:bg-blue-50 dark:hover:bg-blue-900/20
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
              overflow-hidden animate-fade-in-up suggestion-card-${index}
            `}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br from-blue-400 to-transparent" />
            
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 animate-shimmer" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <div className="text-blue-600 dark:text-blue-400 group-hover:animate-pulse">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed">
                    {suggestion}
                  </p>
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                      <span>Ask now</span>
                      <Activity className="h-3 w-3 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hover indicator */}
            <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300 bg-blue-500" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default AISuggestions;
