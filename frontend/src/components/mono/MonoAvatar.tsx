import monoImage from 'figma:asset/b596a6772d8489d08f4749d243b11a2e17ee27cd.png';

interface MonoAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withBg?: boolean;
  withGlow?: boolean;
  mood?: 'happy' | 'thinking' | 'celebrating' | 'curious';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export function MonoAvatar({ 
  size = 'md', 
  withBg = false, 
  withGlow = false,
  mood = 'happy',
  className = '' 
}: MonoAvatarProps) {
  const sizeClass = sizeMap[size];
  
  return (
    <div className={`relative ${sizeClass} ${className}`}>
      {withGlow && (
        <div className="absolute inset-0 bg-[#A8F2E7] rounded-full blur-xl opacity-50 animate-pulse"></div>
      )}
      <div className={`relative ${sizeClass} ${withBg ? 'bg-[#A8F2E7] p-2 rounded-full' : ''}`}>
        <img 
          src={monoImage} 
          alt="mono精灵" 
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}