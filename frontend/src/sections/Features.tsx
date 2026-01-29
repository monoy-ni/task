import { useEffect, useRef, useState } from 'react';

const features = [
  {
    id: 1,
    title: '一键生成任务清单',
    subtitle: '表单一次填写',
    description: '只需填写一次表单，AI 立即生成完整的任务拆解清单，无需繁琐的逐步问答。',
    highlights: ['智能识别目标', '自动生成子任务', '秒级响应'],
  },
  {
    id: 2,
    title: '多层级时间规划',
    subtitle: '月度/周度/日度',
    description: '任务拆解层级直达月度、周度、日度，让规划既有宏观视野又有微观执行。',
    highlights: ['月度里程碑', '周度目标', '每日行动'],
  },
  {
    id: 3,
    title: '智能补充问题',
    subtitle: '可跳过的引导',
    description: '任务清单页包含补充问题区，AI 根据任务智能提问，帮助完善计划，也可随时跳过。',
    highlights: ['智能提问', '灵活跳过', '渐进完善'],
  },
  {
    id: 4,
    title: '四象限优先级',
    subtitle: '艾森豪威尔矩阵',
    description: '每日任务按重要且紧急、重要不紧急、不重要但紧急、不重要不紧急四象限自动排序。',
    highlights: ['智能分类', '优先级排序', '聚焦重点'],
  },
  {
    id: 5,
    title: '甘特图 + AI 分析',
    subtitle: '可视化排期',
    description: '可拖拽的甘特图直观展示进度，AI 实时分析并提供拆分、合并、重组建议。',
    highlights: ['拖拽排期', 'AI 影响分析', '智能建议'],
  },
  {
    id: 6,
    title: '每日复盘重组',
    subtitle: '滚动规划',
    description: '每日结束自动复盘，根据完成情况智能重排与重组计划，实现真正的滚动规划。',
    highlights: ['自动复盘', '智能重排', '持续优化'],
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
            6 大核心能力，<span className="text-gradient">重新定义</span>任务管理
          </h2>
          <p className="text-lg text-mono-text-secondary max-w-2xl mx-auto">
            从任务拆解到复盘重组，mono 用 AI 赋能每一个环节
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
                        AI 生成的任务清单
                      </div>
                      <div className="space-y-2">
                        {['词汇积累计划', '听力训练安排', '阅读技巧提升', '写作模板学习', '口语练习计划'].map(
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
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-3 shadow-soft">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-mono-text">
                          第 1 个月
                        </span>
                        <span className="text-xs text-mono-primary">
                          基础阶段
                        </span>
                      </div>
                      <div className="mt-2 h-2 bg-mono-bg rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-mono-primary/60 rounded-full" />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-soft">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-mono-text">
                          第 2 个月
                        </span>
                        <span className="text-xs text-mono-primary">
                          强化阶段
                        </span>
                      </div>
                      <div className="mt-2 h-2 bg-mono-bg rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-mono-primary/80 rounded-full" />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-soft">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-mono-text">
                          第 3 个月
                        </span>
                        <span className="text-xs text-mono-primary">
                          冲刺阶段
                        </span>
                      </div>
                      <div className="mt-2 h-2 bg-mono-bg rounded-full overflow-hidden">
                        <div className="h-full w-full bg-mono-primary rounded-full" />
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === 2 && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="text-sm font-medium text-mono-text mb-3">
                        补充问题（可选）
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-mono-bg rounded-lg">
                          <div className="text-sm text-mono-text">
                            你每天能投入多少时间学习？
                          </div>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-white rounded-full text-mono-primary border border-mono-primary/30">
                              2 小时
                            </span>
                            <span className="text-xs px-2 py-1 bg-mono-bg rounded-full text-mono-text-muted">
                              跳过
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-mono-bg rounded-lg">
                          <div className="text-sm text-mono-text">
                            你的弱项是什么？
                          </div>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-white rounded-full text-mono-primary border border-mono-primary/30">
                              写作
                            </span>
                            <span className="text-xs px-2 py-1 bg-white rounded-full text-mono-primary border border-mono-primary/30">
                              口语
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === 3 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-mono-primary/10 rounded-xl p-3 border-2 border-mono-primary/30">
                        <div className="text-xs font-medium text-mono-primary mb-1">
                          重要且紧急
                        </div>
                        <div className="text-sm text-mono-text">
                          完成明天截止的报告
                        </div>
                      </div>
                      <div className="bg-mono-primary/5 rounded-xl p-3 border-2 border-mono-primary/20">
                        <div className="text-xs font-medium text-mono-text-secondary mb-1">
                          重要不紧急
                        </div>
                        <div className="text-sm text-mono-text">
                          复习英语单词
                        </div>
                      </div>
                      <div className="bg-mono-bg rounded-xl p-3 border-2 border-mono-border">
                        <div className="text-xs font-medium text-mono-text-muted mb-1">
                          不重要但紧急
                        </div>
                        <div className="text-sm text-mono-text">回复邮件</div>
                      </div>
                      <div className="bg-mono-bg/50 rounded-xl p-3 border-2 border-mono-border/50">
                        <div className="text-xs font-medium text-mono-text-muted mb-1">
                          不重要不紧急
                        </div>
                        <div className="text-sm text-mono-text">整理桌面</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === 4 && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-mono-text">
                          项目进度
                        </span>
                        <span className="text-xs text-mono-primary">
                          AI 分析中...
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-mono-text-muted text-sm">⋮⋮</span>
                          <div className="flex-1 h-8 bg-mono-primary/10 rounded-lg flex items-center px-3">
                            <span className="text-xs text-mono-text">
                              任务 A
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-mono-text-muted text-sm">⋮⋮</span>
                          <div className="flex-1 h-8 bg-mono-primary/10 rounded-lg flex items-center px-3">
                            <span className="text-xs text-mono-text">
                              任务 B
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-mono-text-muted text-sm">⋮⋮</span>
                          <div className="flex-1 h-8 bg-mono-primary/10 rounded-lg flex items-center px-3">
                            <span className="text-xs text-mono-text">
                              任务 C
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-mono-primary/10 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-mono-primary text-sm">✦</span>
                        <span className="text-xs font-medium text-mono-primary">
                          AI 建议
                        </span>
                      </div>
                      <div className="text-xs text-mono-text-secondary">
                        建议将"任务 B"拆分为 2 个子任务，预计可提前 1 天完成
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === 5 && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-mono-primary text-lg">☾</span>
                        <span className="text-sm font-medium text-mono-text">
                          今日复盘
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-mono-text-secondary">
                            完成任务
                          </span>
                          <span className="text-mono-text font-medium">
                            5/7
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-mono-text-secondary">
                            完成率
                          </span>
                          <span className="text-mono-primary font-medium">
                            71%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-mono-text-secondary">
                            专注时长
                          </span>
                          <span className="text-mono-text font-medium">
                            4.5h
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-mono-primary/10 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-mono-primary text-sm">↻</span>
                        <span className="text-xs font-medium text-mono-primary">
                          明日计划已更新
                        </span>
                      </div>
                      <div className="text-xs text-mono-text-secondary">
                        根据今日进度，已自动调整明日任务优先级
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
