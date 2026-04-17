import { useEffect, useRef, useState } from 'react';

const features = [
  {
    id: 1,
    title: '描述你的目标，AI 来拆解',
    subtitle: '一键生成',
    description: '只需描述你的大目标，AI 自动把它分解成月度、周度、日度的小任务，告诉你第一步该做什么。',
    highlights: ['智能理解目标', '自动拆解任务', '清晰第一步'],
  },
  {
    id: 2,
    title: '你只需要关心今天',
    subtitle: '每天只做几件小事',
    description: '不用再为整个目标焦虑，mono 会告诉你今天只需要完成这3-5件小事，做完就离目标近一步。',
    highlights: ['今日任务明确', '无焦虑感', '小步前进'],
  },
  {
    id: 3,
    title: '遇到阻碍 AI 帮你调整',
    subtitle: '灵活重新规划',
    description: '计划被打乱？任务遇到困难？AI 会帮你调整计划，重新生成后续步骤，你继续往前走就好。',
    highlights: ['智能调整', '重新生成', '持续推进'],
  },
  {
    id: 4,
    title: '看到自己走了多远',
    subtitle: '进度可视化',
    description: '甘特图、进度条、里程碑，让你清楚看到自己已经走了多远，还有多远到达目的地。',
    highlights: ['进度追踪', '可视化展示', '成就感'],
  },
];

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-20 md:py-32 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-mono-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-mono-primary-light/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-soft mb-6">
            <span className="w-2 h-2 bg-mono-primary rounded-full"></span>
            <span className="text-sm font-medium text-mono-text-secondary">
              核心功能
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-mono-text mb-4">
            把大目标变小，<span className="text-gradient">把小任务</span>做好
          </h2>
          <p className="text-lg text-mono-text-secondary max-w-2xl mx-auto">
            mono 用 AI 帮你把宏大的目标，变成每天都能完成的小任务
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left - Feature List */}
          <div className="space-y-4">
            {features.map((feature, index) => {
              const isActive = activeFeature === index;

              return (
                <div
                  key={feature.id}
                  onClick={() => setActiveFeature(index)}
                  className={`group cursor-pointer bg-white rounded-2xl p-5 shadow-soft transition-all duration-500 custom-expo ${
                    isVisible
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 -translate-x-8'
                  } ${
                    isActive
                      ? 'shadow-soft-lg ring-2 ring-mono-primary/30'
                      : 'hover:shadow-soft-lg'
                  }`}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Number */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'bg-mono-primary/10' : 'bg-mono-bg'
                      }`}
                    >
                      <span
                        className={`font-display font-bold transition-colors duration-300 ${
                          isActive ? 'text-mono-primary' : 'text-mono-text-muted'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-mono-primary text-white'
                              : 'bg-mono-bg text-mono-text-muted'
                          }`}
                        >
                          {feature.subtitle}
                        </span>
                      </div>
                      <h3
                        className={`font-display text-lg font-bold transition-colors duration-300 ${
                          isActive ? 'text-mono-text' : 'text-mono-text-secondary'
                        }`}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className={`text-sm mt-1 transition-all duration-300 ${
                          isActive
                            ? 'text-mono-text-secondary max-h-20 opacity-100'
                            : 'max-h-0 opacity-0 overflow-hidden'
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>

                    {/* Indicator */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-mono-primary text-white'
                          : 'bg-mono-bg text-mono-text-muted'
                      }`}
                    >
                      {isActive ? (
                        <span className="text-xs">✓</span>
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right - Feature Preview */}
          <div
            className={`sticky top-32 transition-all duration-700 custom-expo ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="bg-white rounded-3xl p-6 shadow-soft-lg">
              {/* Preview Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-mono-primary/10 rounded-xl flex items-center justify-center">
                    <span className="font-display font-bold text-mono-primary">
                      {String(activeFeature + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-mono-text">
                      {features[activeFeature].title}
                    </h4>
                    <p className="text-xs text-mono-text-muted">
                      {features[activeFeature].subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {features.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        index === activeFeature
                          ? 'bg-mono-primary'
                          : 'bg-mono-border'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Preview Content */}
              <div className="bg-mono-bg rounded-2xl p-6 min-h-[300px]">
                {activeFeature === 0 && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="text-sm font-medium text-mono-text mb-2">
                        你的目标
                      </div>
                      <div className="text-mono-text-secondary text-sm">
                        3 个月内通过雅思考试，目标分数 7.0
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-8 h-8 bg-mono-primary rounded-full flex items-center justify-center text-white text-sm">
                        ↓
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="text-sm font-medium text-mono-text mb-3">
                        AI 拆解成小任务
                      </div>
                      <div className="space-y-2">
                        {['第1个月：词汇积累', '第2个月：听说强化', '第3个月：真题冲刺'].map(
                          (task, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm text-mono-text-secondary"
                            >
                              <span className="text-mono-primary">✓</span>
                              {task}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === 1 && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="text-sm font-medium text-mono-text mb-3">
                        今天只需要完成这 3 件事
                      </div>
                      <div className="space-y-2">
                        {['背诵50个雅思单词', '完成1篇阅读理解', '听力练习30分钟'].map(
                          (task, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-3 bg-mono-bg rounded-lg"
                            >
                              <div className="w-5 h-5 rounded-full border-2 border-mono-primary" />
                              <span className="text-sm text-mono-text">{task}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="bg-mono-primary/10 rounded-xl p-3">
                      <div className="text-xs text-mono-primary">
                        完成这3件事，你今天就在向目标前进一步
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === 2 && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="text-sm font-medium text-mono-text mb-3">
                        计划被打乱了
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-mono-bg rounded-lg">
                          <div className="text-sm text-mono-text mb-1">
                            今天有突发事情，任务没完成
                          </div>
                          <div className="text-xs text-mono-text-muted">
                            已完成: 1/3，未完成: 2/3
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-mono-primary/10 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-mono-primary text-sm">AI 建议</span>
                      </div>
                      <div className="text-xs text-mono-text-secondary">
                        已自动调整明天的计划，未完成的任务优先安排，你可以继续往前走
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === 3 && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="text-sm font-medium text-mono-text mb-3">
                        看到你走了多远
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-mono-text-secondary">目标进度</span>
                          <span className="text-mono-primary font-medium">35%</span>
                        </div>
                        <div className="h-3 bg-mono-bg rounded-full overflow-hidden">
                          <div className="h-full w-[35%] bg-mono-primary rounded-full" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-mono-text-muted pt-2">
                          <span>已走过: 32 天</span>
                          <span>还有: 58 天</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-mono-primary/10 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-mono-primary">12</div>
                        <div className="text-xs text-mono-text-secondary">已完成任务</div>
                      </div>
                      <div className="bg-mono-primary/10 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-mono-primary">3</div>
                        <div className="text-xs text-mono-text-secondary">里程碑</div>
                      </div>
                      <div className="bg-mono-primary/10 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-mono-primary">15</div>
                        <div className="text-xs text-mono-text-secondary">连续天数</div>
                      </div>
                    </div>
                  </div>
 )}
              </div>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2 mt-4">
                {features[activeFeature].highlights.map((highlight, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 bg-mono-bg rounded-full text-mono-text-secondary"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
