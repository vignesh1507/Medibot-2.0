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
}

const TextType: React.FC<TextTypeProps> = ({
  text,
  typingSpeed = 15, // Faster default typing speed for reduced latency
  pauseDuration = 1500,
  showCursor = true,
  cursorCharacter = "|",
  onComplete,
  className = "",
  renderAsMarkdown = false
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showCursorState, setShowCursorState] = useState(true);

  // Convert text to string if it's an array
  const fullText = Array.isArray(text) ? text.join(" ") : text || "";

  useEffect(() => {
    // Reset when text changes
    setDisplayText("");
    setCurrentIndex(0);
    setIsTyping(true);
  }, [fullText]);

  useEffect(() => {
    if (currentIndex < fullText.length && isTyping) {
      // Add slight randomness to typing speed for more natural feel (±5ms)
      const randomDelay = typingSpeed + (Math.random() * 10 - 5);
      const actualDelay = Math.max(5, Math.round(randomDelay)); // Minimum 5ms delay
      
      const timer = setTimeout(() => {
        setDisplayText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, actualDelay);

      return () => clearTimeout(timer);
    } else if (currentIndex >= fullText.length) {
      setIsTyping(false);
      if (onComplete) {
        setTimeout(() => onComplete(), 50); // Reduced delay for faster completion
      }
    }
  }, [currentIndex, fullText, typingSpeed, onComplete, isTyping]);

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
    <span className={`${className} leading-relaxed`}>
      {renderAsMarkdown ? (
        renderResponse(displayText)
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
  );
};

export default TextType;
