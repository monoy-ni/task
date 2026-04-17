import { useEffect, useRef, useState } from 'react';

const testimonials = [
  {
    id: 1,
    name: '小林',
    role: '考研学生',
    avatar: '林',
    content:
      '备考期间很焦虑，不知道每天该学什么。mono 把复习计划拆成每天的小任务，我只需要完成今天的任务，一步一步就走到了考场，最后成功上岸。',
    rating: 5,
    tag: '目标达成',
  },
  {
    id: 2,
    name: '阿杰',
    role: '独立开发者',
    avatar: '杰',
    content:
      '想做一个独立项目，但面对宏大的想法一直拖延。mono 把我的大目标拆成一个个能完成的小功能，每完成一个就很有成就感，3个月后真的上线了。',
    rating: 5,
    tag: '目标达成',
  },
  {
    id: 3,
    name: '雨婷',
    role: '产品经理',
    avatar: '婷',
    content:
      '想学习新技能但总是半途而废。mono 让我专注于今天的小任务，而不是被遥远的终点吓退。坚持了半年，现在真的掌握了这项技能。',
    rating: 5,
    tag: '目标达成',
  },
  {
    id: 4,
    name: '浩然',
    role: '转行者',
    avatar: '浩',
    content:
      '想转行但不知道从哪开始。mono 帮我规划了学习路径，把转行这个大目标变成了每天能完成的小任务。现在已经在新的岗位上工作了。',
    rating: 5,
    tag: '目标达成',
  },
  {
    id: 5,
    name: '晓雯',
    role: '设计师',
    avatar: '雯',
    content:
      '一直想建立作品集但总是拖延。mono 把这个目标拆成每周完成一个小项目，压力小了很多，现在作品集已经完成了。',
    rating: 5,
    tag: '目标达成',
  },
];

const Testimonials = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
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

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="py-20 md:py-32 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-mono-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-mono-primary-light/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-soft mb-6">
            <span className="w-2 h-2 bg-mono-primary rounded-full"></span>
            <span className="text-sm font-medium text-mono-text-secondary">
              用户故事
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-mono-text mb-4">
            和你一样的人，<span className="text-gradient">都实现了目标</span>
          </h2>
          <p className="text-lg text-mono-text-secondary max-w-2xl mx-auto">
            有目标但不知从何开始？看看他们是如何一步步走到终点的
          </p>
        </div>

        {/* Main Testimonial */}
        <div
          className={`max-w-4xl mx-auto transition-all duration-700 custom-expo ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-soft-lg relative">
            {/* Quote Icon */}
            <div className="absolute -top-6 left-8 w-12 h-12 bg-mono-primary rounded-full flex items-center justify-center shadow-mono">
              <span className="text-white text-2xl font-display">"</span>
            </div>

            {/* Content */}
            <div className="pt-4">
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                  <span key={i} className="text-mono-primary text-lg">★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-xl md:text-2xl text-mono-text leading-relaxed mb-8 font-medium">
                "{testimonials[activeIndex].content}"
              </p>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-mono-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-display text-xl font-bold text-mono-primary">
                      {testimonials[activeIndex].avatar}
                    </span>
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold text-mono-text">
                      {testimonials[activeIndex].name}
                    </div>
                    <div className="text-sm text-mono-text-secondary">
                      {testimonials[activeIndex].role}
                    </div>
                  </div>
                </div>

                <span className="px-4 py-2 bg-mono-bg rounded-full text-sm text-mono-text-secondary">
                  {testimonials[activeIndex].tag}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-mono-border">
              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? 'bg-mono-primary w-8'
                        : 'bg-mono-border hover:bg-mono-primary/50'
                    }`}
                  />
                ))}
              </div>

              {/* Arrows */}
              <div className="flex gap-2">
                <button
                  onClick={goToPrev}
                  className="w-10 h-10 rounded-full bg-mono-bg flex items-center justify-center text-mono-text-secondary hover:bg-mono-primary hover:text-white transition-all duration-300"
                >
                  <span className="text-lg">←</span>
                </button>
                <button
                  onClick={goToNext}
                  className="w-10 h-10 rounded-full bg-mono-bg flex items-center justify-center text-mono-text-secondary hover:bg-mono-primary hover:text-white transition-all duration-300"
                >
                  <span className="text-lg">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-500 cursor-pointer ${
                activeIndex === index ? 'ring-2 ring-mono-primary/30' : ''
              } ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${(index + 1) * 0.1}s` }}
              onClick={() => setActiveIndex(index)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-mono-primary/10 rounded-full flex items-center justify-center">
                  <span className="font-display font-bold text-mono-primary">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-mono-text text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-mono-text-muted">
                    {testimonial.role}
                  </div>
                </div>
              </div>
              <p className="text-sm text-mono-text-secondary line-clamp-3">
                "{testimonial.content}"
              </p>
              <div className="flex gap-0.5 mt-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-mono-primary text-sm">★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
