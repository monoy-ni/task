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
          src="/images/ccdeaabfedab259c2cdd2267ec3161e6.png"
          alt="mono精灵"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
