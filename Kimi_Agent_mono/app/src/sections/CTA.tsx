import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

const benefits = [
  '永久免费基础功能',
  '无需信用卡',
  '随时取消',
  '数据安全保障',
];

const CTA = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
    }

    const particles: Particle[] = [];
    const particleCount = 25;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 1,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    let animationId: number;
    let frameCount = 0;

    const animate = () => {
      frameCount++;
      if (frameCount % 2 === 0) {
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

        particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < 0 || particle.x > canvas.offsetWidth) {
            particle.vx *= -1;
          }
          if (particle.y < 0 || particle.y > canvas.offsetHeight) {
            particle.vy *= -1;
          }

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(125, 211, 192, ${particle.alpha})`;
          ctx.fill();
        });

        // Draw connections
        particles.forEach((p1, i) => {
          particles.slice(i + 1).forEach((p2) => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(125, 211, 192, ${0.15 * (1 - distance / 100)})`;
              ctx.stroke();
            }
          });
        });
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-32 relative overflow-hidden">
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mono-primary/10 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
        <div
          className={`bg-white rounded-3xl p-8 md:p-16 shadow-soft-lg text-center transition-all duration-700 custom-expo ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-mono-primary/10 rounded-full px-4 py-2 mb-6">
            <span className="text-mono-primary text-lg">✦</span>
            <span className="text-sm font-medium text-mono-primary">
              立即开始你的旅程
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-mono-text mb-4">
            让 mono 成为你的
            <span className="text-gradient block mt-2">任务管理伙伴</span>
          </h2>

          {/* Description */}
          <p className="text-lg text-mono-text-secondary max-w-xl mx-auto mb-8">
            无论是备考、项目推进还是习惯养成，mono 都能帮你将宏大目标分解为可执行的小任务，让每一天都充满成就感。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button onClick={() => navigate('/create')} className="bg-mono-primary hover:bg-mono-primary-dark text-white rounded-full px-8 py-4 text-lg font-medium shadow-mono hover:shadow-mono-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group">
              免费开始
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-mono-text-secondary"
              >
                <span className="text-mono-primary">✓</span>
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
