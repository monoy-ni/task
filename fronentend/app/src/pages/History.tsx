import { Link, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';

interface ProjectHistory {
  id: string;
  goal: string;
  createdAt: string;
  tasks?: any;
  completedTasks?: number;
  totalTasks?: number;
}

// 多样化的图片池
const PROJECT_IMAGES = [
  '/images/history-garden.png',
  '/images/mono-logo-variant.png',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop',
];

// 根据项目ID获取图片
const getProjectImage = (projectId: string) => {
  const hash = projectId.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  return PROJECT_IMAGES[Math.abs(hash) % PROJECT_IMAGES.length];
};

export default function History() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadProjects();
    setIsVisible(true);
  }, []);

  const loadProjects = () => {
    setLoading(true);
    const history: ProjectHistory[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('project_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const projectId = key.replace('project_', '');

          let totalTasks = 0;
          let completedTasks = 0;

          if (data.tasks) {
            Object.values(data.tasks.monthly || {}).forEach((monthTasks: any) => {
              if (Array.isArray(monthTasks)) {
                monthTasks.forEach((task: any) => {
                  totalTasks++;
                  if (task.completed) completedTasks++;
                });
              }
            });
            Object.values(data.tasks.weekly || {}).forEach((weekTasks: any) => {
              if (Array.isArray(weekTasks)) {
                weekTasks.forEach((task: any) => {
                  totalTasks++;
                  if (task.completed) completedTasks++;
                });
              }
            });
            Object.entries(data.tasks.daily || {}).forEach(([_, weekData]: [string, any]) => {
              if (weekData && typeof weekData === 'object') {
                Object.entries(weekData).forEach(([_, dateTasks]: [string, any]) => {
                  if (Array.isArray(dateTasks)) {
                    dateTasks.forEach((task: any) => {
                      totalTasks++;
                      if (task.completed) completedTasks++;
                    });
                  }
                });
              }
            });
          }

          history.push({
            id: projectId,
            goal: data.form_data?.goal || data.goal || '未命名项目',
            createdAt: data.created_at || data.metadata?.generated_at || new Date().toISOString(),
            tasks: data.tasks,
            completedTasks,
            totalTasks,
          });
        } catch (e) {
          console.error(`Failed to parse ${key}:`, e);
        }
      }
    }

    history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setProjects(history);
    setLoading(false);
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个项目吗？此操作无法撤销。')) {
      localStorage.removeItem(`project_${projectId}`);
      loadProjects();
    }
  };

  const getCompletionRate = (project: ProjectHistory) => {
    if (!project.totalTasks || project.totalTasks === 0) return 0;
    return Math.round((project.completedTasks! / project.totalTasks) * 100);
  };

  const getStatusInfo = (project: ProjectHistory) => {
    const rate = getCompletionRate(project);
    if (rate === 100) {
      return {
        label: '已完成',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        dot: 'bg-emerald-500',
        gradient: 'from-emerald-400 to-teal-500',
      };
    } else if (rate >= 50) {
      return {
        label: '进行中',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        dot: 'bg-blue-500',
        gradient: 'from-blue-400 to-indigo-500',
      };
    } else {
      return {
        label: '刚开始',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        dot: 'bg-amber-500',
        gradient: 'from-amber-400 to-orange-500',
      };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} 周前`;
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredProjects = projects.filter(project => {
    const rate = getCompletionRate(project);
    if (filterStatus === 'completed') return rate === 100;
    if (filterStatus === 'active') return rate < 100;
    return true;
  });

  const stats = {
    total: projects.length,
    completed: projects.filter(p => getCompletionRate(p) === 100).length,
    active: projects.filter(p => getCompletionRate(p) < 100).length,
    avgProgress: projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + getCompletionRate(p), 0) / projects.length)
      : 0,
  };

  const FilterButton = ({ value, label, count }: { value: string; label: string; count: number }) => {
    const isActive = filterStatus === value;
    return (
      <button
        type="button"
        onClick={() => setFilterStatus(value as any)}
        className={`relative px-6 py-2.5 text-sm font-medium rounded-2xl transition-all duration-300 ${
          isActive
            ? 'bg-mono-primary text-white shadow-mono transform scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:text-mono-primary hover:bg-white'
        }`}
      >
        {label}
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
          isActive ? 'bg-white/20' : 'bg-gray-100'
        }`}>
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4FBF7]/30 via-white to-[#C9F7EF]/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-8 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #7dd3c0 1px, transparent 0)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-mono-primary/8 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-mono-primary-light/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Decorations - Abstract Shapes */}
      <div className="absolute top-32 left-10 w-16 h-16 rounded-full bg-mono-primary/10 animate-float pointer-events-none hidden lg:block blur-sm"></div>
      <div className="absolute top-1/2 right-16 w-12 h-12 rounded-2xl bg-mono-primary-light/10 animate-float pointer-events-none hidden lg:block rotate-45" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full bg-mono-primary/5 animate-float pointer-events-none hidden lg:block blur-md" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header Section with Image */}
        <div className={`flex flex-col lg:flex-row items-center gap-8 mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Image - Dynamic based on content */}
          <div className="relative lg:w-1/3 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-mono-primary/30 to-mono-primary-light/30 rounded-3xl blur-2xl"></div>
              <img
                src="/images/history-garden.png"
                alt="mono garden"
                className="relative w-56 h-56 object-cover rounded-3xl shadow-2xl border-4 border-white/50"
              />
              {/* Floating badge - abstract */}
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-mono-primary to-mono-primary-dark rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="lg:w-2/3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm mb-4">
              <span className="w-2 h-2 bg-mono-primary rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-600">项目记录中心</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              历史项目
            </h1>
            <p className="text-gray-500 text-lg max-w-lg mx-auto lg:mx-0">
              查看你创建的所有项目，追踪进度，管理任务。每一个项目都是你成长的足迹
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {projects.length > 0 && (
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 transition-all duration-700 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-mono-primary/20 to-mono-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-mono-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-500">总项目</div>
                </div>
              </div>
            </div>
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                  <div className="text-sm text-gray-500">已完成</div>
                </div>
              </div>
            </div>
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-indigo-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
                  <div className="text-sm text-gray-500">进行中</div>
                </div>
              </div>
            </div>
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.avgProgress}%</div>
                  <div className="text-sm text-gray-500">平均进度</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {projects.length > 0 && (
          <div className={`flex justify-center gap-3 mb-8 transition-all duration-700 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <FilterButton value="all" label="全部" count={stats.total} />
            <FilterButton value="active" label="进行中" count={stats.active} />
            <FilterButton value="completed" label="已完成" count={stats.completed} />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-mono-primary/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-mono-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 mt-4">加载项目...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className={`text-center py-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="relative inline-block mb-8">
              <div className="w-48 h-48 bg-gradient-to-br from-mono-primary/20 to-mono-primary-light/20 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop"
                  alt="empty state"
                  className="w-40 h-40 object-cover rounded-full"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-mono-primary to-mono-primary-dark rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">还没有项目记录</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              创建你的第一个项目，开始用 mono 规划你的目标吧！每一个小步都是进步
            </p>
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-mono-primary to-mono-primary-dark hover:from-mono-primary-dark hover:to-mono-primary text-white rounded-full px-8 py-4 font-medium shadow-mono hover:shadow-mono-lg transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              创建第一个项目
            </button>
          </div>
        ) : (
          /* Projects Grid */
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 transition-all duration-700 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {filteredProjects.map((project, index) => {
              const completionRate = getCompletionRate(project);
              const statusInfo = getStatusInfo(project);
              const projectImage = getProjectImage(project.id);

              return (
                <div
                  key={project.id}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:-translate-y-1"
                >
                  {/* Progress Bar Top */}
                  <div className="h-1.5 bg-gray-100">
                    <div
                      className={`h-full bg-gradient-to-r ${statusInfo.gradient} transition-all duration-500`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-mono-primary transition-colors">
                          {project.goal}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(project.createdAt)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {project.totalTasks || 0} 任务
                          </span>
                        </div>
                      </div>

                      {/* Project Thumbnail + Progress */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md">
                          <img
                            src={projectImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Progress Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                          <span className="text-sm font-bold text-white">{completionRate}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                      <div
                        className={`h-full bg-gradient-to-r ${statusInfo.gradient} rounded-full transition-all duration-500`}
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/${project.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-mono-primary bg-mono-primary/5 hover:bg-mono-primary/10 rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        看板
                      </Link>
                      <Link
                        to={`/plan/${project.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        甘特图
                      </Link>
                      <Link
                        to={`/daily/${project.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        日任务
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        className="inline-flex items-center justify-center p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        aria-label="删除项目"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Results for Filter */}
        {!loading && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">没有找到项目</h3>
            <p className="text-gray-500">试试切换到其他筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
}
