"use client";

import { useState, useEffect } from "react";

interface TextTypeProps {
  text: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  onComplete?: () => void;
  className?: string;
}

const TextType: React.FC<TextTypeProps> = ({
  text,
  typingSpeed = 75,
  pauseDuration = 1500,
  showCursor = true,
  cursorCharacter = "|",
  onComplete,
  className = "",
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [displayText, setDisplayText] = useState("");
  const [showCursorState, setShowCursorState] = useState(true);

  // Cursor blinking effect
  useEffect(() => {
    if (!showCursor) return;
    
    const cursorInterval = setInterval(() => {
      setShowCursorState(prev => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, [showCursor]);

  // Main typing effect
  useEffect(() => {
    if (!text || text.length === 0) return;

    const currentText = text[currentTextIndex];
    
    if (isTyping) {
      if (currentCharIndex < currentText.length) {
        const timer = setTimeout(() => {
          setDisplayText(currentText.slice(0, currentCharIndex + 1));
          setCurrentCharIndex(prev => prev + 1);
        }, typingSpeed);

        return () => clearTimeout(timer);
      } else {
        // Finished typing current text
        setIsTyping(false);
        
        // Pause before moving to next text or completing
        const pauseTimer = setTimeout(() => {
          if (currentTextIndex < text.length - 1) {
            // Move to next text
            setCurrentTextIndex(prev => prev + 1);
            setCurrentCharIndex(0);
            setDisplayText("");
            setIsTyping(true);
          } else {
            // All texts completed
            onComplete?.();
          }
        }, pauseDuration);

        return () => clearTimeout(pauseTimer);
      }
    }
  }, [currentTextIndex, currentCharIndex, isTyping, text, typingSpeed, pauseDuration, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <span 
          className={`inline-block ${showCursorState ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}
        >
          {cursorCharacter}
        </span>
      )}
    </span>
  );
};

export default TextType;
