import { MonoAvatar } from './MonoAvatar';

interface MonoMessageProps {
  message: string;
  variant?: 'default' | 'info' | 'success' | 'warning';
  showAvatar?: boolean;
  className?: string;
}

const variantStyles = {
  default: 'bg-[#E4FBF7] border-[#A8F2E7] text-gray-700',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
};

export function MonoMessage({ 
  message, 
  variant = 'default', 
  showAvatar = true,
  className = '' 
}: MonoMessageProps) {
  return (
    <div className={`flex gap-3 p-4 rounded-xl border-2 ${variantStyles[variant]} ${className}`}>
      {showAvatar && (
        <div className="flex-shrink-0">
          <MonoAvatar size="sm" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
