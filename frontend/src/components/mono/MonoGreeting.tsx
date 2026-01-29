import { MonoAvatar } from './MonoAvatar';
import { getGreeting } from './monoQuotes';

interface MonoGreetingProps {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  showMessage?: boolean;
}

export function MonoGreeting({ timeOfDay, showMessage = true }: MonoGreetingProps) {
  const greeting = getGreeting();

  const timeConfig = {
    morning: {
      color: 'text-[#7DE3D4]',
      label: '早安',
    },
    afternoon: {
      color: 'text-[#A8F2E7]',
      label: '午安',
    },
    evening: {
      color: 'text-[#8B8B8B]',
      label: '晚安',
    },
  };

  const config = timeConfig[timeOfDay];

  return (
    <div className="flex items-center gap-4">
      <MonoAvatar size="md" withBg />
      <div>
        <p className={`text-sm font-medium ${config.color} mb-1`}>
          {config.label}，我是 mono
        </p>
        {showMessage && (
          <p className="text-base text-gray-600 font-light">
            {greeting}
          </p>
        )}
      </div>
    </div>
  );
}
