import { Link, useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { MonoAvatar } from '../components/mono';
import { Task } from '../types';

// 四象限定义
const QUADRANTS = [
  {
    id: 'urgent-important',
    title: '重要且紧急',
    subtitle: '立即执行',
    color: 'from-red-50 to-red-100/50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
  },
  {
    id: 'important-not-urgent',
    title: '重要不紧急',
    subtitle: '规划安排',
    color: 'from-amber-50 to-amber-100/50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'urgent-not-important',
    title: '不重要但紧急',
    subtitle: '快速处理',
    color: 'from-blue-50 to-blue-100/50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'not-urgent-not-important',
    title: '不重要不紧急',
    subtitle: '有空再做',
    color: 'from-gray-50 to-gray-100/50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
];

// 根据任务的属性判断其象限
function getQuadrantForTask(task: Task): string {
  const hasDeadline = task.deadline && new Date(task.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const isImportant = task.estimatedHours && task.estimatedHours > 2;

  if (isImportant && hasDeadline) return 'urgent-important';
  if (isImportant && !hasDeadline) return 'important-not-urgent';
  if (!isImportant && hasDeadline) return 'urgent-not-important';
  return 'not-urgent-not-important';
}

export default function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    // 从 localStorage 获取项目数据
    const stored = localStorage.getItem(`project_${projectId}`);
    if (stored) {
      const data = JSON.parse(stored);
      setProjectData(data);

      // 展平所有层级的任务
      const allTasks: Task[] = [];
      if (data.tasks) {
        // 月度任务
        Object.values(data.tasks.monthly || {}).forEach((monthTasks: any) => {
          monthTasks.forEach((task: Task) => {
            allTasks.push({ ...task, level: 'monthly' });
          });
        });

        // 周度任务
        Object.values(data.tasks.weekly || {}).forEach((weekTasks: any) => {
          weekTasks.forEach((task: Task) => {
            allTasks.push({ ...task, level: 'weekly' });
          });
        });

        // 日度任务 - 处理嵌套结构
        Object.entries(data.tasks.daily || {}).forEach(([weekKey, weekData]: [string, any]) => {
          if (weekData && typeof weekData === 'object') {
            Object.entries(weekData).forEach(([dateKey, dateTasks]: [string, any]) => {
              if (Array.isArray(dateTasks)) {
                dateTasks.forEach((task: Task) => {
                  allTasks.push({ ...task, level: 'daily', date: dateKey });
                });
              }
            });
          }
        });
      }

      setTasks(allTasks);
    }
    setLoading(false);
  }, [projectId]);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, quadrantId: string) => {
    e.preventDefault();
    if (draggedTask) {
      // 更新任务的象限（在实际应用中，这里应该调用API更新）
      console.log(`Moving task ${draggedTask.id} to ${quadrantId}`);
      setDraggedTask(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // 按象限分组任务
  const tasksByQuadrant = QUADRANTS.reduce((acc, quadrant) => {
    acc[quadrant.id] = tasks.filter(task => {
      const taskQuadrant = getQuadrantForTask(task);
      return taskQuadrant === quadrant.id;
    });
    return acc;
  }, {} as Record<string, Task[]>);

  // 统计数据
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#7dd3c0] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">未找到项目</p>
          <Link to="/" className="text-[#7dd3c0] hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-[#7dd3c0] font-bold text-xl">mono</span>
            </Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <h1 className="text-lg font-medium text-gray-900 truncate max-w-md">
              {projectData?.form_data?.goal || '项目看板'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={`/plan/${projectId}`}
              className="px-4 py-2 text-sm text-gray-600 hover:text-[#7dd3c0] transition-colors"
            >
              甘特图
            </Link>
            <Link
              to={`/daily/${projectId}`}
              className="px-4 py-2 bg-[#7dd3c0] text-white text-sm rounded-full hover:bg-[#5bd4c3] transition-colors"
            >
              日任务
            </Link>
          </div>
        </div>
      </header>

      {/* 统计卡片 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">总任务</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">已完成</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">进行中</div>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">完成率</div>
            <div className="text-2xl font-bold text-[#7dd3c0]">{stats.completionRate}%</div>
          </div>
        </div>

        {/* Mono 提示 */}
        <div className="bg-gradient-to-r from-[#E4FBF7] to-[#C9F7EF] rounded-xl p-4 mb-6 flex items-center gap-4">
          <MonoAvatar mood="happy" size="md" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">mono 提示：</span>
              拖拽任务可以在不同象限之间移动。优先完成"重要且紧急"的任务哦！
            </p>
          </div>
        </div>

        {/* 看板区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUADRANTS.map((quadrant) => (
            <div
              key={quadrant.id}
              className={`bg-white rounded-xl shadow-sm border ${quadrant.borderColor} overflow-hidden`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, quadrant.id)}
            >
              {/* 象限标题 */}
              <div className={`p-4 bg-gradient-to-r ${quadrant.color} border-b ${quadrant.borderColor}`}>
                <h3 className={`font-bold ${quadrant.textColor}`}>{quadrant.title}</h3>
                <p className="text-xs text-gray-600 mt-0.5">{quadrant.subtitle}</p>
                <div className="text-xs text-gray-500 mt-1">
                  {tasksByQuadrant[quadrant.id]?.length || 0} 个任务
                </div>
              </div>

              {/* 任务列表 */}
              <div className="p-3 space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto">
                {tasksByQuadrant[quadrant.id]?.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white rounded-lg p-3 shadow-sm border cursor-move transition-all hover:shadow-md ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskComplete(task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-[#7dd3c0]'
                        }`}
                      >
                        {task.completed && <span className="text-xs">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${
                          task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                        }`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className={`text-xs mt-1 ${
                            task.completed ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {task.description}
                          </p>
                        )}
                        {task.estimatedHours && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                              {task.estimatedHours}h
                            </span>
                            {task.date && (
                              <span className="text-xs text-gray-400">{task.date}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!tasksByQuadrant[quadrant.id] || tasksByQuadrant[quadrant.id].length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">暂无任务</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
