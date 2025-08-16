"use client";

import React, { useState, useEffect } from 'react';

interface TextTypeProps {
  text: string | string[];
  typingSpeed?: number;
  pauseDuration?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  onComplete?: () => void;
  className?: string;
  renderAsMarkdown?: boolean;
  showStopButton?: boolean;
  onStop?: () => void;
  isStopRequested?: boolean;
}

const TextType: React.FC<TextTypeProps> = ({
  text,
  typingSpeed = 80, // Slower speed for more ChatGPT-like experience (80ms per word)
  pauseDuration = 1500,
  showCursor = true,
  cursorCharacter = "|",
  onComplete,
  className = "",
  renderAsMarkdown = false,
  showStopButton = false,
  onStop,
  isStopRequested = false
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showCursorState, setShowCursorState] = useState(true);
  const [isStopped, setIsStopped] = useState(false);

  // Convert text to string if it's an array and split into words
  const fullText = Array.isArray(text) ? text.join(" ") : text || "";
  const words = fullText.split(/(\s+)/); // Split by spaces but keep the spaces

  // Handle external stop requests
  useEffect(() => {
    if (isStopRequested && !isStopped) {
      handleStop();
    }
  }, [isStopRequested]);

  // Function to stop typing - preserve what's already displayed
  const handleStop = () => {
    setIsStopped(true);
    setIsTyping(false);
    // Don't show full text immediately - keep what's already displayed
    if (onStop) {
      onStop();
    }
  };

  useEffect(() => {
    // Reset when text changes
    setDisplayText("");
    setCurrentWordIndex(0);
    setIsTyping(true);
    setIsStopped(false);
  }, [fullText]);

  useEffect(() => {
    if (currentWordIndex < words.length && isTyping && !isStopped) {
      // Add slight randomness to typing speed for more natural feel (±30ms)
      const randomDelay = typingSpeed + (Math.random() * 60 - 30);
      const actualDelay = Math.max(40, Math.round(randomDelay)); // Minimum 40ms delay
      
      const timer = setTimeout(() => {
        setDisplayText(words.slice(0, currentWordIndex + 1).join(''));
        setCurrentWordIndex(currentWordIndex + 1);
      }, actualDelay);

      return () => clearTimeout(timer);
    } else if (currentWordIndex >= words.length || isStopped) {
      setIsTyping(false);
      if (onComplete && !isStopped) {
        setTimeout(() => onComplete(), 50);
      }
    }
  }, [currentWordIndex, words, typingSpeed, onComplete, isTyping, isStopped]);

  // Cursor blinking effect
  useEffect(() => {
    if (showCursor && isTyping) {
      const cursorTimer = setInterval(() => {
        setShowCursorState(prev => !prev);
      }, 400); // Faster cursor blinking for more responsiveness

      return () => clearInterval(cursorTimer);
    } else {
      setShowCursorState(false);
    }
  }, [showCursor, isTyping]);

  // Render response with bullet points and formatting
  const renderResponse = (response: string) => {
    const lines = response.split("\n");
    // Detect if there are any headings (lines starting with #)
    const hasHeadings = lines.some(line => /^#\s+/.test(line));
    
    if (hasHeadings) {
      // Render as sections with headings
      type Section = { heading: string | null; content: string[] };
      const sections: Section[] = [];
      let current: Section = { heading: null, content: [] };
      
      for (let line of lines) {
        const headingMatch = line.match(/^#\s*(.+)/);
        if (headingMatch) {
          if (current.heading || current.content.length) sections.push(current);
          current = { heading: headingMatch[1].trim(), content: [] };
        } else {
          current.content.push(line);
        }
      }
      if (current.heading || current.content.length) sections.push(current);
      
      return (
        <div className="space-y-4">
          {sections.map((sec, idx) =>
            sec.heading ? (
              <div key={idx} className="mb-5">
                <h3 className="font-semibold text-base mb-3">{sec.heading}</h3>
                {sec.content.map((line, i) => line.trim() && (
                  <p key={i} className="mb-3 leading-relaxed">{line.replace(/\*\*|\*/g, "")}</p>
                ))}
              </div>
            ) : (
              <div key={idx} className="mb-4 italic leading-relaxed">
                {sec.content.join(" ").replace(/\*\*|\*/g, "")}
              </div>
            )
          )}
        </div>
      );
    } else {
      // Render greeting (first non-empty line), then bullets for points
      const nonEmptyLines = lines.filter(l => l.trim().length > 0);
      const greeting = nonEmptyLines.length > 0 ? nonEmptyLines[0] : "";
      const bulletLines = nonEmptyLines.slice(1);
      
      return (
        <div className="space-y-3">
          {greeting && (
            <div className="mb-4 italic leading-relaxed">{greeting.replace(/\*\*|\*/g, "")}</div>
          )}
          {bulletLines.length > 0 && (
            <ul className="list-disc pl-5 space-y-2">
              {bulletLines.map((line, i) => (
                <li key={i} className="leading-relaxed">{line.replace(/\*\*|\*/g, "")}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }
  };

  return (
    <div className="relative">
      <span className={`${className} leading-relaxed`}>
        {renderAsMarkdown ? (
          // For markdown, render as simple text during typing, then format when complete
          isTyping ? (
            <span 
              className="leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: displayText.replace(/\n/g, '<br class="mb-2">') }} 
            />
          ) : (
            renderResponse(displayText)
          )
        ) : (
          <span 
            className="leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: displayText.replace(/\n/g, '<br class="mb-2">') }} 
          />
        )}
        {showCursor && (
          <span 
            className={`${showCursorState ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100 ml-1`}
          >
            {cursorCharacter}
          </span>
        )}
      </span>
      
      {/* Stop button - only show when typing and showStopButton is true */}
      {showStopButton && isTyping && !isStopped && (
        <button
          onClick={handleStop}
          className="ml-3 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors duration-200 border border-gray-300 dark:border-gray-600"
          type="button"
        >
          Stop generating
        </button>
      )}
    </div>
  );
};

export default TextType;
