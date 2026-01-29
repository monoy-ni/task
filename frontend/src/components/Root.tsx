import { Outlet, Link, useLocation } from 'react-router';
import monoLogo from 'figma:asset/263b05502fe4f16ac930f2b238a69dde3399d505.png';

export default function Root() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4FBF7]/30 via-white to-[#C9F7EF]/30">
      <header className={`${isHomePage ? 'bg-transparent' : 'bg-white/90 backdrop-blur-sm'} border-b ${isHomePage ? 'border-transparent' : 'border-[#A8F2E7]/30'} sticky top-0 z-50 transition-all`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <img src={monoLogo} alt="mono" className="w-10 h-10 object-contain" />
              <span className="font-light text-lg text-gray-900 tracking-wide">
                mono
              </span>
            </Link>
            
            {!location.pathname.includes('/create') && location.pathname !== '/' && (
              <nav className="flex items-center gap-12">
                <Link
                  to={`/plan/${location.pathname.split('/')[2]}`}
                  className={`text-sm tracking-wider transition-colors ${
                    location.pathname.includes('/plan')
                      ? 'text-[#7DE3D4] border-b-2 border-[#7DE3D4]'
                      : 'text-gray-500 hover:text-[#7DE3D4]'
                  }`}
                >
                  甘特视图
                </Link>
                <Link
                  to={`/daily/${location.pathname.split('/')[2]}`}
                  className={`text-sm tracking-wider transition-colors ${
                    location.pathname.includes('/daily')
                      ? 'text-[#7DE3D4] border-b-2 border-[#7DE3D4]'
                      : 'text-gray-500 hover:text-[#7DE3D4]'
                  }`}
                >
                  今日任务
                </Link>
              </nav>
            )}
          </div>
        </div>
      </header>
      
      <main className={`${isHomePage ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <Outlet />
      </main>
    </div>
  );
}