import { Outlet, Link, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Root() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 获取项目ID
  const projectId = location.pathname.split('/')[2];

  return (
    <div className={`${isHomePage ? '' : 'min-h-screen bg-gradient-to-br from-[#E4FBF7]/30 via-white to-[#C9F7EF]/30'}`}>
      {/* 使用首页样式的导航栏 */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'py-3 px-4 md:px-8'
            : 'py-5 px-4 md:px-12'
        }`}
      >
        <div
          className={`mx-auto transition-all duration-500 ${
            isScrolled
              ? 'max-w-5xl glass rounded-full shadow-soft px-6 py-2'
              : 'max-w-7xl'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
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
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {isHomePage ? (
                // 首页的导航链接
                <>
                  <a
                    href="#features"
                    className="relative text-sm font-medium text-mono-text-secondary hover:text-mono-primary transition-colors duration-300 group"
                  >
                    功能
                    <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-mono-primary rounded-full transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform duration-300" />
                  </a>
                  <a
                    href="#how-it-works"
                    className="relative text-sm font-medium text-mono-text-secondary hover:text-mono-primary transition-colors duration-300 group"
                  >
                    流程
                    <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-mono-primary rounded-full transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform duration-300" />
                  </a>
                  <a
                    href="#testimonials"
                    className="relative text-sm font-medium text-mono-text-secondary hover:text-mono-primary transition-colors duration-300 group"
                  >
                    评价
                    <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-mono-primary rounded-full transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform duration-300" />
                  </a>
                  <Link
                    to="/history"
                    className="relative text-sm font-medium text-mono-text-secondary hover:text-mono-primary transition-colors duration-300 group"
                  >
                    历史记录
                    <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-mono-primary rounded-full transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform duration-300" />
                  </Link>
                </>
              ) : projectId && !location.pathname.includes('/create') ? (
                // 项目页面的导航链接
                <>
                  <Link
                    to={`/plan/${projectId}`}
                    className={`relative text-sm font-medium transition-colors duration-300 ${
                      location.pathname.includes('/plan')
                        ? 'text-mono-primary'
                        : 'text-mono-text-secondary hover:text-mono-primary'
                    }`}
                  >
                    甘特视图
                    {location.pathname.includes('/plan') && (
                      <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-mono-primary rounded-full transform -translate-x-1/2" />
                    )}
                  </Link>
                  <Link
                    to={`/daily/${projectId}`}
                    className={`relative text-sm font-medium transition-colors duration-300 ${
                      location.pathname.includes('/daily')
                        ? 'text-mono-primary'
                        : 'text-mono-text-secondary hover:text-mono-primary'
                    }`}
                  >
                    今日任务
                    {location.pathname.includes('/daily') && (
                      <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-mono-primary rounded-full transform -translate-x-1/2" />
                    )}
                  </Link>
                </>
              ) : location.pathname === '/history' ? (
                // 历史记录页面
                <>
                  <Link
                    to="/history"
                    className="relative text-sm font-medium text-mono-primary transition-colors duration-300"
                  >
                    历史记录
                    <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-mono-primary rounded-full transform -translate-x-1/2" />
                  </Link>
                </>
              ) : null}
            </div>

            {/* CTA Button / 返回首页按钮 */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {isHomePage && (
                    <Link
                      to="/pricing"
                      className="text-sm font-medium text-mono-text-secondary hover:text-mono-primary transition-colors"
                    >
                      升级会员
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 bg-mono-bg hover:bg-mono-primary/10 rounded-full px-4 py-2 transition-all"
                  >
                    <div className="w-7 h-7 bg-mono-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-mono-primary">
                        {(userProfile?.email || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-mono-text">
                      {userProfile ? (userProfile.tier === 'free' ? '免费用户' : userProfile.tier === 'monthly' ? '月卡' : '年卡') : '用户'}
                    </span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-mono-text-secondary hover:text-mono-primary transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    to="/login"
                    className="bg-mono-primary hover:bg-mono-primary-dark text-white rounded-full px-6 py-2.5 text-sm font-medium shadow-mono hover:shadow-mono-lg transition-all duration-300 transform hover:scale-105"
                  >
                    开始使用
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-mono-text"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className={`w-6 h-0.5 bg-mono-text mb-1.5 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
              <div className={`w-6 h-0.5 bg-mono-text mb-1.5 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
              <div className={`w-6 h-0.5 bg-mono-text transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-20 left-4 right-4 bg-white rounded-3xl shadow-soft-lg p-6">
            <div className="flex flex-col gap-4">
              {isHomePage ? (
                <>
                  <a
                    href="#features"
                    className="text-lg font-medium text-mono-text py-2 px-4 rounded-xl hover:bg-mono-primary/10 transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    功能
                  </a>
                  <a
                    href="#how-it-works"
                    className="text-lg font-medium text-mono-text py-2 px-4 rounded-xl hover:bg-mono-primary/10 transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    流程
                  </a>
                  <a
                    href="#testimonials"
                    className="text-lg font-medium text-mono-text py-2 px-4 rounded-xl hover:bg-mono-primary/10 transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    评价
                  </a>
                  <Link
                    to="/history"
                    className="text-lg font-medium text-mono-text py-2 px-4 rounded-xl hover:bg-mono-primary/10 transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    历史记录
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = '/create';
                    }}
                    className="mt-4 bg-mono-primary hover:bg-mono-primary-dark text-white rounded-full py-4 font-medium shadow-mono transition-all duration-300"
                  >
                    开始使用
                  </button>
                  {!user && (
                    <Link
                      to="/login"
                      className="text-center text-mono-text-secondary py-2 px-4 hover:text-mono-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      已有账号？去登录
                    </Link>
                  )}
                </>
              ) : projectId && !location.pathname.includes('/create') ? (
                <>
                  <Link
                    to={`/plan/${projectId}`}
                    className="text-lg font-medium text-mono-text py-2 px-4 rounded-xl hover:bg-mono-primary/10 transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    甘特视图
                  </Link>
                  <Link
                    to={`/daily/${projectId}`}
                    className="text-lg font-medium text-mono-text py-2 px-4 rounded-xl hover:bg-mono-primary/10 transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    今日任务
                  </Link>
                  <Link
                    to="/"
                    className="mt-4 bg-mono-primary hover:bg-mono-primary-dark text-white rounded-full py-4 font-medium shadow-mono transition-all duration-300 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    返回首页
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="mt-4 bg-mono-primary hover:bg-mono-primary-dark text-white rounded-full py-4 font-medium shadow-mono transition-all duration-300 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    返回首页
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 首页使用 sections/Navbar，其他页面使用 main 容器 */}
      {isHomePage ? (
        <Outlet />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <Outlet />
        </main>
      )}
    </div>
  );
}
