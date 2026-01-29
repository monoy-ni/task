import { useEffect, useRef, useState } from 'react';

const painPoints = [
  {
    number: '01',
    title: '不知道从哪里开始',
    description: '面对宏大目标，感到无从下手，缺乏清晰的行动路径',
  },
  {
    number: '02',
    title: '计划太虚或太细',
    description: '要么计划过于笼统无法执行，要么过于琐碎难以坚持',
  },
  {
    number: '03',
    title: '每天不知道先做什么',
    description: '任务堆积如山，没有优先级判断，效率低下',
  },
  {
    number: '04',
    title: '计划变动后全乱',
    description: '一旦有突发情况，整个计划被打乱，需要重新规划',
  },
  {
    number: '05',
    title: '复盘难坚持',
    description: '知道复盘重要，但缺乏工具和引导，难以形成习惯',
  },
];

const PainPoints = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleItems((prev) => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-50px' }
    );

    const items = sectionRef.current?.querySelectorAll('.pain-point-item');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mono-primary/5 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-soft mb-6">
            <span className="w-2 h-2 bg-mono-text rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-mono-text-secondary">
              这些困扰，我们懂
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-mono-text mb-4">
            计划总是<span className="text-mono-primary">半途而废</span>？
          </h2>
          <p className="text-lg text-mono-text-secondary max-w-2xl mx-auto">
            无论是备考、项目推进还是自我管理，这些痛点是否也在困扰着你？
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {painPoints.map((point, index) => {
            const isVisible = visibleItems.includes(index);

            return (
              <div
                key={index}
                data-index={index}
                className={`pain-point-item group relative bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-500 custom-expo ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                {/* Number */}
                <div className="w-12 h-12 bg-mono-bg rounded-xl flex items-center justify-center mb-4 group-hover:bg-mono-primary/10 transition-colors duration-300">
                  <span className="font-display font-bold text-mono-primary text-lg">
                    {point.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold text-mono-text mb-2">
                  {point.title}
                </h3>
                <p className="text-mono-text-secondary leading-relaxed text-sm">
                  {point.description}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-mono-primary/20 transition-colors duration-300" />
              </div>
            );
          })}
        </div>

        {/* Solution Teaser */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-mono-primary/10 rounded-full px-6 py-3">
            <span className="text-mono-primary text-xl">✦</span>
            <span className="text-mono-text font-medium">
              mono 用 AI 帮你解决这些问题
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPoints;
