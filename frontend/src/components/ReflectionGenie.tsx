import { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight, Lightbulb } from 'lucide-react';
import { MonoAvatar } from './Mono';

interface ReflectionGenieProps {
  onClose: () => void;
  completedCount: number;
  incompleteCount: number;
  completionRate: number;
  incompleteTasks: { taskId: string; reason: string; title: string }[];
}

interface Question {
  id: string;
  text: string;
  placeholder: string;
  isOptional?: boolean;
}

export function ReflectionGenie({
  onClose,
  completedCount,
  incompleteCount,
  completionRate,
  incompleteTasks,
}: ReflectionGenieProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // 根据复盘结果生成问题
  const questions: Question[] = [];

  // 基础问题
  questions.push({
    id: 'energy',
    text: '今天在执行任务时，你的精力状态如何？',
    placeholder: '例如：上午精力充沛，下午容易疲惫...',
  });

  // 如果完成率低于70%，询问原因
  if (completionRate < 70) {
    questions.push({
      id: 'obstacles',
      text: '看起来今天遇到了一些挑战。是什么影响了你的进度？',
      placeholder: '例如：任务难度超出预期、被临时打断、时间安排不合理...',
    });
  }

  // 如果有未完成任务，询问模式
  if (incompleteCount > 0) {
    questions.push({
      id: 'patterns',
      text: '未完成的任务有什么共同特点吗？',
      placeholder: '例如：都是需要深度思考的、都是下午安排的、都是新领域的任务...',
      isOptional: true,
    });
  }

  // 如果完成率高，询问成功经验
  if (completionRate >= 80) {
    questions.push({
      id: 'success',
      text: '今天状态很好！你觉得哪些做法特别有效？',
      placeholder: '例如：早上优先处理重要任务、使用番茄钟、减少了社交媒体干扰...',
    });
  }

  // 优化建议
  questions.push({
    id: 'optimization',
    text: '如果明天再做一次，你会如何调整今天的计划？',
    placeholder: '例如：减少任务数量、调整任务顺序、预留缓冲时间...',
  });

  const currentQuestion = questions[currentStep];

  // 打字机效果
  useEffect(() => {
    if (!currentQuestion) return;

    setIsTyping(true);
    setDisplayedText('');
    let index = 0;
    const text = currentQuestion.text;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [currentStep]);

  // 生成智能建议
  const generateSuggestions = () => {
    const suggestions: string[] = [];

    // 根据用户的回答生成建议
    const energyAnswer = answers['energy']?.toLowerCase() || '';
    const obstaclesAnswer = answers['obstacles']?.toLowerCase() || '';
    const patternsAnswer = answers['patterns']?.toLowerCase() || '';
    const optimizationAnswer = answers['optimization']?.toLowerCase() || '';

    // 精力管理建议
    if (energyAnswer.includes('疲惫') || energyAnswer.includes('下午')) {
      suggestions.push('💡 建议将重要任务安排在上午，下午处理一些轻松的事务性工作');
    }

    // 时间管理建议
    if (obstaclesAnswer.includes('打断') || obstaclesAnswer.includes('干扰')) {
      suggestions.push('💡 尝试设置"专注时段"，关闭通知，告知他人不要打扰');
    }

    if (obstaclesAnswer.includes('预估') || obstaclesAnswer.includes('时间')) {
      suggestions.push('💡 可以给每个任务额外预留20%的缓冲时间，应对突发情况');
    }

    // 任务拆分建议
    if (patternsAnswer.includes('难') || patternsAnswer.includes('复杂')) {
      suggestions.push('💡 建议将复杂任务拆分成更小的步骤，降低执行门槛');
    }

    // 通用建议
    if (completionRate < 50) {
      suggestions.push('💡 明日任务数量建议减少30%，专注完成最重要的1-2件事');
    }

    if (incompleteCount > 3) {
      suggestions.push('💡 考虑使用"三只青蛙法则"：每天只设置3个最重要任务');
    }

    // 如果没有特定建议，给予鼓励
    if (suggestions.length === 0) {
      if (completionRate >= 80) {
        suggestions.push('🎉 你的执行力很棒！保持这个节奏继续前进');
      } else {
        suggestions.push('💡 每一天都是新的开始，明天继续加油！');
      }
    }

    // 根据用户的优化想法
    if (optimizationAnswer.trim()) {
      suggestions.push(`✨ 你的想法很好："${optimizationAnswer.slice(0, 50)}${optimizationAnswer.length > 50 ? '...' : ''}"，明天就试试吧！`);
    }

    setSuggestions(suggestions);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 最后一步，生成建议
      generateSuggestions();
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // 跳过当前问题
    handleNext();
  };

  // 显示建议页面
  if (currentStep >= questions.length) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-purple-50 via-rose-50 to-amber-50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-amber-200/50 relative">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-colors z-10"
          >
            <X className="size-5 text-gray-600" />
          </button>

          {/* 魔法装饰 */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-amber-400/40 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div className="p-8 relative">
            {/* mono 头像 */}
            <div className="flex items-center justify-center mb-6">
              <MonoAvatar mood="thinking" size="xl" withGlow />
            </div>

            <h2 className="text-3xl font-light text-center mb-2 text-gray-900" style={{ fontFamily: 'serif' }}>
              mono 的建议
            </h2>
            <p className="text-xs text-center text-gray-500 mb-6">你的任务拆解助理</p>

            <p className="text-center text-gray-600 mb-8 leading-loose">
              基于你的复盘和反思，mono 为你准备了以下优化建议
            </p>

            {/* 建议列表 */}
            <div className="space-y-4 mb-8">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-white/70 backdrop-blur-sm border border-amber-200/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <p className="text-gray-800 leading-relaxed">{suggestion}</p>
                </div>
              ))}
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 text-center border border-gray-200/50">
                <div className="text-2xl font-semibold text-green-600 mb-1">
                  {completedCount}
                </div>
                <div className="text-xs text-gray-600">完成任务</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 text-center border border-gray-200/50">
                <div className="text-2xl font-semibold text-amber-600 mb-1">
                  {incompleteCount}
                </div>
                <div className="text-xs text-gray-600">待完成</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 text-center border border-gray-200/50">
                <div className="text-2xl font-semibold text-purple-600 mb-1">
                  {completionRate}%
                </div>
                <div className="text-xs text-gray-600">完成率</div>
              </div>
            </div>

            {/* 完成按钮 */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              收到！明天继续努力 ✨
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-50 via-rose-50 to-amber-50 rounded-2xl max-w-2xl w-full shadow-2xl border-2 border-amber-200/50 relative">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-colors z-10"
        >
          <X className="size-5 text-gray-600" />
        </button>

        {/* 魔法装饰 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-2xl">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/40 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="p-8 relative">
          {/* 精灵头像 */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <Sparkles className="size-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-light text-gray-900 mb-1" style={{ fontFamily: 'serif' }}>
                反思精灵
              </h2>
              <p className="text-sm text-gray-600">
                让我们一起回顾今天，为明天做得更好
              </p>
            </div>
          </div>

          {/* 进度指示 */}
          <div className="flex items-center gap-2 mb-6">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'bg-purple-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* 问题卡片 */}
          <div className="bg-white/70 backdrop-blur-sm border-2 border-amber-200/50 rounded-xl p-6 mb-6 min-h-[280px]">
            {/* 问题文本 */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-600 font-semibold text-sm">
                    {currentStep + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-lg text-gray-900 leading-relaxed min-h-[60px]">
                    {displayedText}
                    {isTyping && (
                      <span className="inline-block w-0.5 h-5 bg-purple-500 ml-1 animate-pulse" />
                    )}
                  </p>
                  {!isTyping && currentQuestion?.isOptional && (
                    <p className="text-sm text-gray-500 mt-2">（选填）</p>
                  )}
                </div>
              </div>
            </div>

            {/* 输入框 */}
            {!isTyping && (
              <div className="animate-fadeIn">
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) =>
                    setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                  }
                  placeholder={currentQuestion.placeholder}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  rows={4}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* 按钮组 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-white/50'
              }`}
            >
              上一题
            </button>

            <div className="flex items-center gap-3">
              {currentQuestion?.isOptional && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 text-gray-600 hover:bg-white/50 rounded-xl font-medium transition-all"
                >
                  跳过
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={
                  isTyping ||
                  (!currentQuestion?.isOptional && !answers[currentQuestion?.id]?.trim())
                }
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {currentStep === questions.length - 1 ? '生成建议' : '下一题'}
                <ArrowRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}