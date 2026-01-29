import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

const Hero = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePosition({ x: x * 3, y: y * 3 });
    };

    const heroElement = heroRef.current;
    if (heroElement) {
      heroElement.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    return () => {
      if (heroElement) {
        heroElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #7dd3c0 1px, transparent 0)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-mono-primary/15 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-mono-primary-light/20 rounded-full blur-3xl" />

      {/* Floating Decorative Elements - Only using brand colors */}
      <div 
        className="absolute text-mono-primary/30 text-4xl font-light pointer-events-none"
        style={{
          left: '8%',
          top: '25%',
          animation: 'float 5s ease-in-out infinite',
        }}
      >
        ○
      </div>
      <div 
        className="absolute text-mono-primary/20 text-3xl font-light pointer-events-none"
        style={{
          left: '88%',
          top: '18%',
          animation: 'float 6s ease-in-out infinite 0.5s',
        }}
      >
        ◇
      </div>
      <div 
        className="absolute text-mono-primary/25 text-2xl font-light pointer-events-none"
        style={{
          left: '12%',
          top: '75%',
          animation: 'float 4.5s ease-in-out infinite 1s',
        }}
      >
        △
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div
            className={`space-y-8 transition-all duration-1000 custom-expo ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-soft"
              style={{ animationDelay: '0.1s' }}
            >
              <span className="w-2 h-2 bg-mono-primary rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-mono-text-secondary">
                AI 驱动的任务管理
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-mono-text leading-tight">
              像呼吸一样自然的
              <span className="text-gradient block mt-2">任务管理</span>
            </h1>

            {/* Description */}
            <p
              className={`text-lg md:text-xl text-mono-text-secondary max-w-lg leading-relaxed transition-all duration-1000 delay-200 custom-expo ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              mono 帮助你轻松组织生活，将宏大目标分解为可执行的小任务，
              智能规划每一天，让计划变动不再成为困扰。
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-wrap gap-4 transition-all duration-1000 delay-300 custom-expo ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <button onClick={() => navigate('/create')} className="bg-mono-primary hover:bg-mono-primary-dark text-white rounded-full px-8 py-4 text-lg font-medium shadow-mono hover:shadow-mono-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group">
                立即开始
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
              <button onClick={() => navigate('/about')} className="rounded-full px-8 py-4 text-lg font-medium border-2 border-mono-border hover:border-mono-primary hover:text-mono-primary transition-all duration-300">
                了解更多
              </button>
            </div>

            {/* Stats */}
            <div
              className={`flex gap-8 pt-4 transition-all duration-1000 delay-400 custom-expo ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div>
                <div className="font-display text-3xl font-bold text-mono-primary">
                  10K+
                </div>
                <div className="text-sm text-mono-text-muted">活跃用户</div>
              </div>
              <div className="w-px bg-mono-border" />
              <div>
                <div className="font-display text-3xl font-bold text-mono-primary">
                  98%
                </div>
                <div className="text-sm text-mono-text-muted">满意度</div>
              </div>
              <div className="w-px bg-mono-border" />
              <div>
                <div className="font-display text-3xl font-bold text-mono-primary">
                  50M+
                </div>
                <div className="text-sm text-mono-text-muted">完成任务</div>
              </div>
            </div>
          </div>

          {/* Right Content - Web Dashboard Mockup */}
          <div
            className={`relative flex justify-center lg:justify-end transition-all duration-1000 delay-500 custom-expo ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              transform: `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            {/* Web Dashboard Container */}
            <div className="relative animate-float">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-mono-primary/20 rounded-2xl blur-3xl scale-105" />

              {/* Browser Frame */}
              <div className="relative bg-white rounded-2xl p-2 shadow-2xl">
                {/* Browser Header */}
                <div className="bg-mono-bg rounded-t-xl px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-mono-text-muted/30"></div>
                    <div className="w-3 h-3 rounded-full bg-mono-text-muted/30"></div>
                    <div className="w-3 h-3 rounded-full bg-mono-text-muted/30"></div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-full px-4 py-1.5 text-xs text-mono-text-muted text-center">
                      mono.app
                    </div>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="relative bg-white rounded-b-xl overflow-hidden w-[320px] md:w-[480px] h-[320px] md:h-[360px]">
                  {/* App Header */}
                  <div className="bg-mono-primary px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src="/images/ccdeaabfedab259c2cdd2267ec3161e6.png"
                          alt="mono"
                          className="w-7 h-7"
                        />
                        <span className="text-white font-display font-bold text-sm">
                          mono
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-7 h-7 bg-white/20 rounded-full"></div>
                        <div className="w-7 h-7 bg-white/20 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Grid */}
                  <div className="p-4 grid grid-cols-3 gap-3">
                    {/* Sidebar */}
                    <div className="col-span-1 space-y-2">
                      <div className="h-8 bg-mono-primary/10 rounded-lg"></div>
                      <div className="h-6 bg-mono-bg rounded-lg"></div>
                      <div className="h-6 bg-mono-bg rounded-lg"></div>
                      <div className="h-6 bg-mono-bg rounded-lg"></div>
                      <div className="h-6 bg-mono-bg rounded-lg"></div>
                    </div>

                    {/* Main Content */}
                    <div className="col-span-2 space-y-3">
                      {/* Stats Row */}
                      <div className="flex gap-2">
                        <div className="flex-1 h-14 bg-mono-bg rounded-lg p-2">
                          <div className="text-xs text-mono-text-muted">今日任务</div>
                          <div className="text-lg font-bold text-mono-primary">5</div>
                        </div>
                        <div className="flex-1 h-14 bg-mono-bg rounded-lg p-2">
                          <div className="text-xs text-mono-text-muted">完成率</div>
                          <div className="text-lg font-bold text-mono-primary">85%</div>
                        </div>
                      </div>

                      {/* Task List */}
                      <div className="bg-mono-bg rounded-lg p-2 space-y-2">
                        <div className="text-xs text-mono-text-muted mb-1">任务清单</div>
                        <div className="flex items-center gap-2 bg-white rounded-lg p-2">
                          <div className="w-4 h-4 rounded-full border-2 border-mono-primary bg-mono-primary"></div>
                          <div className="flex-1 text-xs text-mono-text line-through opacity-50">完成项目提案</div>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-lg p-2">
                          <div className="w-4 h-4 rounded-full border-2 border-mono-primary"></div>
                          <div className="flex-1 text-xs text-mono-text">复习英语单词</div>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-lg p-2">
                          <div className="w-4 h-4 rounded-full border-2 border-mono-text-muted"></div>
                          <div className="flex-1 text-xs text-mono-text">回复邮件</div>
                        </div>
                      </div>

                      {/* AI Suggestion */}
                      <div className="bg-mono-primary/10 rounded-lg p-2">
                        <div className="text-xs text-mono-primary font-medium mb-1">AI 建议</div>
                        <div className="text-xs text-mono-text-secondary">建议将任务拆分为 3 个小任务</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -left-6 top-16 bg-white rounded-xl p-3 shadow-soft-lg animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-mono-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-mono-primary text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-mono-text">任务完成</div>
                    <div className="text-xs text-mono-text-muted">+5 积分</div>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -right-4 bottom-20 bg-white rounded-xl p-3 shadow-soft-lg animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-center">
                  <div className="font-display text-xl font-bold text-mono-primary">
                    85%
                  </div>
                  <div className="text-xs text-mono-text-muted">今日进度</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
