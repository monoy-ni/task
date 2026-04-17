import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

const steps = [
  {
    number: '01',
    title: '说出你的目标',
    description: '简单描述你想达成的事情，mono 会听懂并帮你梳理关键信息',
  },
  {
    number: '02',
    title: 'AI 拆成小任务',
    description: 'AI 把大目标分解成月度、周度、日度的小任务，告诉你第一步做什么',
  },
  {
    number: '03',
    title: '完成今天的事',
    description: '每天只需要完成3-5件小事，做完它们，你就离目标近了一步',
  },
  {
    number: '04',
    title: '一天天走到终点',
    description: '计划被打乱也没关系，AI 会帮你调整，继续往前走就好',
  },
];

const HowItWorks = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleSteps((prev) => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-50px' }
    );

    const items = sectionRef.current?.querySelectorAll('.step-item');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-20 md:py-32 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-mono-primary/5 via-transparent to-mono-primary/5" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-soft mb-6">
            <span className="w-2 h-2 bg-mono-primary rounded-full"></span>
            <span className="text-sm font-medium text-mono-text-secondary">
              使用流程
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-mono-text mb-4">
            简单 <span className="text-gradient">4 步</span>，让目标变成现实
          </h2>
          <p className="text-lg text-mono-text-secondary max-w-2xl mx-auto">
            不需要复杂的计划技巧，mono 会帮你一步步走到终点
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-mono-border -translate-y-1/2 z-0" />
          <div
            className="hidden lg:block absolute top-1/2 left-0 h-1 bg-mono-primary -translate-y-1/2 z-0 transition-all duration-1000"
            style={{
              width: `${(visibleSteps.length / steps.length) * 100}%`,
            }}
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => {
              const isVisible = visibleSteps.includes(index);

              return (
                <div
                  key={index}
                  data-index={index}
                  className={`step-item group transition-all duration-700 custom-expo ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 0.15}s` }}
                >
                  <div className="relative bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-500 h-full">
                    {/* Step Number */}
                    <div className="absolute -top-4 -left-2 w-10 h-10 bg-mono-primary rounded-full flex items-center justify-center text-white font-display font-bold text-sm shadow-mono">
                      {step.number}
                    </div>

                    {/* Icon Placeholder */}
                    <div className="w-16 h-16 bg-mono-bg rounded-2xl flex items-center justify-center mb-4 mt-2 group-hover:bg-mono-primary/10 transition-colors duration-300">
                      <span className="font-display text-2xl font-bold text-mono-primary/50 group-hover:text-mono-primary transition-colors duration-300">
                        {step.number}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="font-display text-xl font-bold text-mono-text mb-2">
                      {step.title}
                    </h3>
                    <p className="text-mono-text-secondary text-sm leading-relaxed">
                      {step.description}
                    </p>

                    {/* Hover Indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-mono-primary rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-mono-text-secondary mb-4">
            你的目标值得被实现
          </p>
          <button onClick={() => navigate('/create')} className="bg-mono-primary hover:bg-mono-primary-dark text-white font-medium px-8 py-4 rounded-full shadow-mono hover:shadow-mono-lg transition-all duration-300 transform hover:scale-105">
            今天就开始
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
