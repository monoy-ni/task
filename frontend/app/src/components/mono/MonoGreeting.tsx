import { MonoAvatar } from './MonoAvatar';

interface MonoGreetingProps {
  name?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

/**
 * Mono 问候组件
 */
export function MonoGreeting({ name, timeOfDay }: MonoGreetingProps) {
  const greetings = {
    morning: {
      text: name ? `早安，${name}` : '早安',
      message: '新的一天开始了，让我们一起把大目标拆解成今天可以完成的小步骤吧',
      mood: 'happy' as const,
    },
    afternoon: {
      text: name ? `下午好，${name}` : '下午好',
      message: '下午是整理思路的好时机，让我帮你梳理接下来的计划',
      mood: 'happy' as const,
    },
    evening: {
      text: name ? `晚上好，${name}` : '晚上好',
      message: '一天辛苦了，要不要一起回顾今天的收获？',
      mood: 'curious' as const,
    },
  };

  const greeting = greetings[timeOfDay];

  return (
    <div className="flex items-start gap-4">
      <MonoAvatar mood={greeting.mood} size="lg" withGlow />
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-2">
          <h3 className="text-xl font-light text-gray-900">{greeting.text}</h3>
          <span className="text-xs text-gray-500">mono</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{greeting.message}</p>
      </div>
    </div>
  );
}
