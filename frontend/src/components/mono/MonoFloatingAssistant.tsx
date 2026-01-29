import { useState, useEffect } from 'react';
import { MonoAvatar } from './MonoAvatar';
import { getMonoQuote } from './monoQuotes';

interface MonoFloatingAssistantProps {
  scene?: keyof typeof import('./monoQuotes').monoQuotes;
  position?: 'bottom-right' | 'bottom-left';
}

export function MonoFloatingAssistant({ 
  scene = 'wisdom', 
  position = 'bottom-right' 
}: MonoFloatingAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    setQuote(getMonoQuote(scene));
  }, [scene]);

  const positionClass = position === 'bottom-right' 
    ? 'right-6 bottom-6' 
    : 'left-6 bottom-6';

  return (
    <div className={`fixed ${positionClass} z-50`}>
      {isExpanded && (
        <div className="mb-3 max-w-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white border-2 border-[#A8F2E7] rounded-xl p-4 shadow-lg">
            <div className="flex items-start gap-2 mb-2">
              <MonoAvatar size="sm" />
              <span className="text-sm font-medium text-[#8B8B8B]">mono</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{quote}</p>
            <button
              onClick={() => setIsExpanded(false)}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              收起
            </button>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group relative"
      >
        <div className="w-14 h-14 bg-[#A8F2E7] rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center">
          <MonoAvatar size="sm" />
        </div>
        
        {/* 脉冲动画 */}
        {!isExpanded && (
          <span className="absolute inset-0 w-14 h-14 bg-[#A8F2E7] rounded-full animate-ping opacity-20"></span>
        )}
      </button>
    </div>
  );
}
