import { ReactNode } from 'react';

/**
 * Mono - 任务拆解助理精灵
 * 
 * 品牌理念：
 * - mono = 单色、单一、专注
 * - 帮助用户将抽象的大目标拆解成每日可执行的小步骤
 * - 温柔、智慧、陪伴型的存在
 */

interface MonoProps {
  mood?: 'happy' | 'thinking' | 'encouraging' | 'celebrating' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withGlow?: boolean;
  className?: string;
}

/**
 * Mono 精灵头像
 */
export function MonoAvatar({ mood = 'neutral', size = 'md', withGlow = false, className = '' }: MonoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const expressions = {
    happy: (
      <g>
        {/* 眼睛 */}
        <circle cx="35" cy="45" r="3" fill="currentColor" />
        <circle cx="65" cy="45" r="3" fill="currentColor" />
        {/* 微笑 */}
        <path
          d="M 35 60 Q 50 70 65 60"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    ),
    thinking: (
      <g>
        {/* 眯眼 */}
        <path d="M 30 45 L 40 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M 60 45 L 70 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        {/* 思考表情 */}
        <circle cx="50" cy="62" r="2" fill="currentColor" opacity="0.5" />
      </g>
    ),
    encouraging: (
      <g>
        {/* 温柔的眼睛 */}
        <path
          d="M 30 45 Q 35 48 40 45"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 60 45 Q 65 48 70 45"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* 温和微笑 */}
        <path
          d="M 38 60 Q 50 65 62 60"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    ),
    celebrating: (
      <g>
        {/* 闭眼笑 */}
        <path d="M 30 45 Q 35 42 40 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 60 45 Q 65 42 70 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* 大笑 */}
        <path
          d="M 32 58 Q 50 72 68 58"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    ),
    neutral: (
      <g>
        {/* 平静的眼睛 */}
        <circle cx="35" cy="45" r="2.5" fill="currentColor" />
        <circle cx="65" cy="45" r="2.5" fill="currentColor" />
        {/* 平和表情 */}
        <path d="M 38 62 L 62 62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  };

  return (
    <div className={`relative ${className}`}>
      {withGlow && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-purple-400/30 rounded-full blur-xl animate-pulse" />
      )}
      <div className={`relative ${sizes[size]} rounded-full bg-gradient-to-br from-amber-100 to-purple-100 border-2 border-amber-200/50 flex items-center justify-center overflow-hidden`}>
        <svg viewBox="0 0 100 100" className="w-full h-full text-gray-700">
          {expressions[mood]}
        </svg>
      </div>
    </div>
  );
}

interface MonoMessageProps {
  children: ReactNode;
  mood?: 'happy' | 'thinking' | 'encouraging' | 'celebrating' | 'neutral';
  showAvatar?: boolean;
  className?: string;
}

/**
 * Mono 消息气泡
 */
export function MonoMessage({ children, mood = 'neutral', showAvatar = true, className = '' }: MonoMessageProps) {
  return (
    <div className={`flex items-start gap-4 ${className}`}>
      {showAvatar && <MonoAvatar mood={mood} size="md" />}
      <div className="flex-1 bg-gradient-to-br from-amber-50/50 to-purple-50/50 border border-amber-200/50 rounded-2xl rounded-tl-none p-4 shadow-sm">
        <div className="text-sm text-gray-800 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

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
      mood: 'encouraging' as const,
    },
    evening: {
      text: name ? `晚上好，${name}` : '晚上好',
      message: '一天辛苦了，要不要一起回顾今天的收获？',
      mood: 'neutral' as const,
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

interface MonoTypingProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  mood?: 'happy' | 'thinking' | 'encouraging' | 'celebrating' | 'neutral';
}

/**
 * Mono 打字机效果
 */
export function MonoTyping({ text, speed = 30, onComplete, mood = 'thinking' }: MonoTypingProps) {
  const [displayedText, setDisplayedText] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(true);

  React.useEffect(() => {
    setIsTyping(true);
    setDisplayedText('');
    let index = 0;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <MonoMessage mood={mood}>
      {displayedText}
      {isTyping && <span className="inline-block w-0.5 h-4 bg-amber-500 ml-1 animate-pulse" />}
    </MonoMessage>
  );
}

// 需要 React import
import React from 'react';

interface MonoInsightProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Mono 洞察卡片（用于展示分析结果）
 */
export function MonoInsight({ title, description, icon, action }: MonoInsightProps) {
  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur" />
      <div className="relative bg-white border border-gray-200 rounded-xl p-5 hover:border-amber-300 transition-colors">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center flex-shrink-0 text-amber-700">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">{description}</p>
            {action && (
              <button
                onClick={action.onClick}
                className="text-sm text-amber-700 hover:text-amber-800 font-medium transition-colors"
              >
                {action.label} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MonoProgressProps {
  current: number;
  total: number;
  label?: string;
  mood?: 'happy' | 'thinking' | 'encouraging' | 'celebrating' | 'neutral';
}

/**
 * Mono 进度显示
 */
export function MonoProgress({ current, total, label, mood = 'encouraging' }: MonoProgressProps) {
  const percentage = Math.round((current / total) * 100);
  
  let message = '';
  let displayMood = mood;
  
  if (percentage === 100) {
    message = '太棒了！你已经完成了所有任务 🎉';
    displayMood = 'celebrating';
  } else if (percentage >= 80) {
    message = '加油，快要完成了！';
    displayMood = 'encouraging';
  } else if (percentage >= 50) {
    message = '很好，已经完成了一半呢';
    displayMood = 'happy';
  } else if (percentage > 0) {
    message = '每一步都算数，继续前进吧';
    displayMood = 'encouraging';
  } else {
    message = '准备好了吗？让我们开始吧';
    displayMood = 'neutral';
  }

  return (
    <div className="bg-gradient-to-br from-amber-50/50 to-purple-50/50 border border-amber-200/50 rounded-xl p-5">
      <div className="flex items-center gap-4 mb-3">
        <MonoAvatar mood={displayMood} size="sm" />
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              {label || '今日进度'}
            </span>
            <span className="text-lg font-semibold text-amber-700">{percentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-purple-400 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-600 ml-12">{message}</p>
    </div>
  );
}

interface MonoEmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Mono 空状态
 */
export function MonoEmptyState({ title, description, action }: MonoEmptyStateProps) {
  return (
    <div className="text-center py-16">
      <MonoAvatar mood="neutral" size="xl" withGlow className="mx-auto mb-6" />
      <h3 className="text-xl font-light text-gray-900 mb-3">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-8 py-3 bg-gradient-to-r from-amber-600 to-purple-600 text-white rounded-lg hover:from-amber-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Mono 语录库
 */
export const MonoQuotes = {
  welcome: [
    '我是mono，你的任务拆解助理。让我们一起把大目标变成每天可以完成的小步骤',
    '很高兴见到你！我擅长把看似遥远的梦想，拆解成今天就能开始的行动',
    '嗨，我是mono。专注、拆解、执行，这是我们一起要做的事',
  ],
  
  planning: [
    '让我仔细分析一下你的目标...',
    '嗯，我理解了。让我把它拆解成可执行的步骤',
    '这是个很棒的目标！让我们一起制定计划',
    '我正在思考最合理的安排方式...',
  ],
  
  daily: [
    '今天的任务已经为你准备好了，一步一步来吧',
    '记住，完成比完美更重要',
    '每一个小步骤都在让你接近目标',
    '专注当下，其他的交给时间',
  ],
  
  review: [
    '让我们一起回顾今天的收获',
    '无论完成多少，你都在进步',
    '今天的经验会让明天更好',
    '反思是为了更好地前进',
  ],
  
  encouragement: [
    '你做得很好',
    '继续保持这个节奏',
    '每一天都在成长',
    '相信过程，享受当下',
    '小步前进，终会到达',
  ],
  
  celebration: [
    '太棒了！又完成了一个任务',
    '你的坚持正在带来改变',
    '为你的进步感到开心',
    '这就是持续行动的力量',
  ],
};

/**
 * 随机获取 Mono 语录
 */
export function getMonoQuote(category: keyof typeof MonoQuotes): string {
  const quotes = MonoQuotes[category];
  return quotes[Math.floor(Math.random() * quotes.length)];
}
