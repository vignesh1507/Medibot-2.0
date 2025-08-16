"use client";

import React from 'react';

interface AISuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  disabled?: boolean;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ onSuggestionClick, disabled = false }) => {
  const healthSuggestions = [
    "🌡️ What are the symptoms of flu?",
    "💊 How to manage high blood pressure?",
    "🏃‍♀️ Best exercises for heart health",
    "🥗 Nutrition tips for diabetes",
    "😴 How to improve sleep quality?",
    "🧠 Tips for mental health wellness",
    "💚 Natural remedies for headaches",
    "🩺 When should I see a doctor?"
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mb-4 px-4">
      {healthSuggestions.slice(0, 4).map((suggestion, index) => (
        <button
          key={index}
          onClick={() => !disabled && onSuggestionClick(suggestion)}
          disabled={disabled}
          className="text-left p-3 text-sm bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default AISuggestions;
