import { useEffect, useRef, useState } from 'react';

const painPoints = [
  {
    number: '01',
    title: '有目标，但不知从何开始',
    description: '我想学习新技能、完成大项目，但面对宏大的目标感到无从下手',
  },
  {
    number: '02',
    title: '以为是自己不够自律',
    description: '计划总是半途而废，以为是自己执行力不行，其实只是目标太大',
  },
  {
    number: '03',
    title: '不知道今天该做什么',
    description: '目标在那边，但不知道今天该迈哪一步，一天天过去毫无进展',
  },
  {
    number: '04',
    title: '遇到阻碍就停滞',
    description: '一旦遇到困难或计划被打乱，就不知道该怎么继续，干脆放弃',
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
              这些困扰，我们都懂
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-mono-text mb-4">
            不是你不够努力，是<span className="text-mono-primary">目标太大了</span>
          </h2>
          <p className="text-lg text-mono-text-secondary max-w-2xl mx-auto">
            我们常常以为是执行力的问题，其实只是大脑不知道第一步该迈哪只脚
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
              mono 把大目标拆小，让你只需要关心今天
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPoints;
