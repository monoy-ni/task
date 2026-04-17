import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: '首页', href: '#hero' },
    { name: '功能', href: '#features' },
    { name: '流程', href: '#how-it-works' },
    { name: '评价', href: '#testimonials' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 custom-expo ${
          isScrolled
            ? 'py-3 px-4 md:px-8'
            : 'py-5 px-4 md:px-12'
        }`}
      >
        <div
          className={`mx-auto transition-all duration-500 custom-expo ${
            isScrolled
              ? 'max-w-5xl glass rounded-full shadow-soft px-6 py-2'
              : 'max-w-7xl'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('#hero');
              }}
              className="flex items-center gap-2 group"
            >
              <img
                src="/images/ccdeaabfedab259c2cdd2267ec3161e6.png"
                alt="mono"
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-110"
              />
              <span className="font-display text-xl font-bold text-mono-text">
                mono
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.href);
                  }}
                  className="relative text-sm font-medium text-mono-text-secondary hover:text-mono-primary transition-colors duration-300 group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-mono-primary rounded-full transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform duration-300 fluid-bounce" />
                </a>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:block">
              <button onClick={() => navigate('/create')} className="bg-mono-primary hover:bg-mono-primary-dark text-white rounded-full px-6 py-2.5 text-sm font-medium shadow-mono hover:shadow-mono-lg transition-all duration-300 transform hover:scale-105">
                开始使用
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-mono-text"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="w-6 h-0.5 bg-mono-text mb-1.5 transition-all duration-300"></div>
              <div className="w-6 h-0.5 bg-mono-text mb-1.5 transition-all duration-300"></div>
              <div className="w-6 h-0.5 bg-mono-text transition-all duration-300"></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div
          className={`absolute top-20 left-4 right-4 bg-white rounded-3xl shadow-soft-lg p-6 transition-all duration-500 custom-expo ${
            isMobileMenuOpen
              ? 'translate-y-0 opacity-100'
              : '-translate-y-8 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link, index) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.href);
                }}
                className="text-lg font-medium text-mono-text py-2 px-4 rounded-xl hover:bg-mono-primary/10 transition-colors duration-300"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {link.name}
              </a>
            ))}
            <button onClick={() => navigate('/create')} className="mt-4 bg-mono-primary hover:bg-mono-primary-dark text-white rounded-full py-4 font-medium shadow-mono transition-all duration-300">
              开始使用
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
