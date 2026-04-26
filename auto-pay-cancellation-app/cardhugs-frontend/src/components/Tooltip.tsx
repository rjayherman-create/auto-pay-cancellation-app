import React, { useState, ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

/**
 * Tooltip component for inline help and guidance
 * Usage:
 *   <Tooltip text="LoRA models are fine-tuned AI models trained on specific styles">
 *     <button>Generate</button>
 *   </Tooltip>
 *   
 * With icon:
 *   <Tooltip text="Help text">
 *     <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
 *   </Tooltip>
 */
export const Tooltip: React.FC<TooltipProps> = ({ 
  text, 
  children, 
  position = 'top',
  delay = 200
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div 
          className={`absolute ${positionClasses[position]} left-1/2 -translate-x-1/2 
            bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap 
            z-50 shadow-lg pointer-events-none transition-opacity duration-200`}
        >
          {text}
          <div 
            className={`absolute w-2 h-2 bg-gray-900 ${arrowClasses[position]}`}
            style={{
              clipPath: position === 'top' 
                ? 'polygon(0 0, 100% 0, 50% 100%)'
                : position === 'bottom'
                ? 'polygon(50% 0, 100% 100%, 0 100%)'
                : position === 'left'
                ? 'polygon(0 50%, 100% 0, 100% 100%)'
                : 'polygon(0 0, 100% 50%, 0 100%)'
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Help Icon with tooltip
 * Usage:
 *   <HelpIcon text="LoRA models are trained on specific styles" />
 */
export const HelpIcon: React.FC<{ text: string }> = ({ text }) => (
  <Tooltip text={text}>
    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help inline-block ml-1" />
  </Tooltip>
);
