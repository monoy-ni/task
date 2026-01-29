import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Project, Plan, Task, DailyPlan, TaskWithQuadrant } from '../types';
import { getTaskQuadrant } from '../utils/planGenerator';

export default function DailyTasks() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingHours, setEditingHours] = useState(false);
  const [availableHours, setAvailableHours] = useState(1);

  useEffect(() => {
    if (!projectId) return;

    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const foundProject = projects.find((p: any) => p.id === projectId);

    if (foundProject) {
      const projectWithDates = {
        ...foundProject,
        createdAt: new Date(foundProject.createdAt),
        deadline: foundProject.deadline ? new Date(foundProject.deadline) : undefined,
      };
      setProject(projectWithDates);
      setAvailableHours(projectWithDates.dailyAvailableHours);
    }

    const storedPlan = localStorage.getItem(`plan-${projectId}`);
    if (storedPlan) {
      const parsedPlan = JSON.parse(storedPlan);
      const planWithDates = {
        ...parsedPlan,
        tasks: parsedPlan.tasks.map((t: any) => ({
          ...t,
          startDate: new Date(t.startDate),
          endDate: new Date(t.endDate),
        })),
        milestones: parsedPlan.milestones.map((m: any) => ({
          ...m,
          date: new Date(m.date),
        })),
        dailyPlans: parsedPlan.dailyPlans.map((d: any) => ({
          ...d,
          date: new Date(d.date),
        })),
      };
      setPlan(planWithDates);
    }
  }, [projectId]);

  if (!project || !plan) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const today = new Date(selectedDate);
  today.setHours(0, 0, 0, 0);

  // 找到今日计划
  let todayPlan = plan.dailyPlans.find((dp) => {
    const planDate = new Date(dp.date);
    planDate.setHours(0, 0, 0, 0);
    return planDate.getTime() === today.getTime();
  });

  // 如果没有今日计划，创建一个
  if (!todayPlan) {
    todayPlan = createDailyPlan(today, plan.tasks, availableHours);
  }

  // 获取任务并添加四象限分类
  const tasksWithQuadrant: TaskWithQuadrant[] = [
    todayPlan.top1,
    todayPlan.top2,
    todayPlan.top3,
    ...todayPlan.backlog,
  ]
    .filter((id): id is string => !!id)
    .map((id) => {
      const task = plan.tasks.find((t) => t.id === id);
      if (!task) return null;
      return {
        ...task,
        quadrant: getTaskQuadrant(task),
      } as TaskWithQuadrant;
    })
    .filter((t): t is TaskWithQuadrant => t !== null);

  const top1Task = tasksWithQuadrant.find((t) => t.id === todayPlan!.top1);
  const top2Task = tasksWithQuadrant.find((t) => t.id === todayPlan!.top2);
  const top3Task = tasksWithQuadrant.find((t) => t.id === todayPlan!.top3);
  const backlogTasks = tasksWithQuadrant.filter((t) =>
    todayPlan!.backlog.includes(t.id)
  );

  // 按四象限分组
  const tasksByQuadrant = {
    IU: tasksWithQuadrant.filter((t) => t.quadrant === 'IU'),
    IN: tasksWithQuadrant.filter((t) => t.quadrant === 'IN'),
    NU: tasksWithQuadrant.filter((t) => t.quadrant === 'NU'),
    NN: tasksWithQuadrant.filter((t) => t.quadrant === 'NN'),
  };

  // 更新任务状态
  const updateTaskStatus = (
    taskId: string,
    status: Task['status'],
    blockedReason?: string
  ) => {
    const updatedTasks = plan.tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status, blockedReason };
      }
      return t;
    });

    const updatedPlan = { ...plan, tasks: updatedTasks };
    setPlan(updatedPlan);
    localStorage.setItem(`plan-${projectId}`, JSON.stringify(updatedPlan));
  };

  // 更新今日可用时间
  const updateAvailableHours = () => {
    if (todayPlan) {
      const updatedDailyPlans = plan.dailyPlans.map((dp) => {
        const planDate = new Date(dp.date);
        planDate.setHours(0, 0, 0, 0);
        if (planDate.getTime() === today.getTime()) {
          return { ...dp, availableHours };
        }
        return dp;
      });

      const updatedPlan = { ...plan, dailyPlans: updatedDailyPlans };
      setPlan(updatedPlan);
      localStorage.setItem(`plan-${projectId}`, JSON.stringify(updatedPlan));
    }
    setEditingHours(false);
  };

  // 计算已用时间
  const usedHours = tasksWithQuadrant
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.duration, 0);

  const remainingHours = availableHours - usedHours;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">今日任务</h1>
            <p className="text-gray-600">
              {selectedDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>
          <Link
            to={`/review/${projectId}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            日终复盘
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-blue-700">可用时间</span>
              {!editingHours ? (
                <button
                  onClick={() => setEditingHours(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  编辑
                </button>
              ) : null}
            </div>
            {editingHours ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-lg"
                  step="0.5"
                  min="0"
                />
                <button
                  onClick={updateAvailableHours}
                  className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  确定
                </button>
              </div>
            ) : (
              <div className="text-2xl font-semibold text-blue-600">
                {availableHours}h
              </div>
            )}
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-700 mb-1">已使用</div>
            <div className="text-2xl font-semibold text-green-600">{usedHours}h</div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <div className="text-sm text-amber-700 mb-1">剩余时间</div>
            <div className="text-2xl font-semibold text-amber-600">
              {Math.max(0, remainingHours).toFixed(1)}h
            </div>
          </div>
        </div>
      </div>

      {/* Top 任务 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">优先任务</h2>
        
        <div className="space-y-4">
          {top1Task && (
            <div className="border-l-4 border-red-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                  TOP 1
                </span>
                <span className="text-xs text-gray-500">关键路径 - 最重要且紧急</span>
              </div>
              <TaskCard task={top1Task} onStatusChange={updateTaskStatus} />
            </div>
          )}

          {top2Task && (
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                  TOP 2
                </span>
                <span className="text-xs text-gray-500">推进型 - 重要但不紧急</span>
              </div>
              <TaskCard task={top2Task} onStatusChange={updateTaskStatus} />
            </div>
          )}

          {top3Task && (
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                  TOP 3
                </span>
                <span className="text-xs text-gray-500">收尾型 - 快速完成</span>
              </div>
              <TaskCard task={top3Task} onStatusChange={updateTaskStatus} />
            </div>
          )}

          {!top1Task && !top2Task && !top3Task && (
            <p className="text-gray-500 text-center py-8">今日暂无优先任务</p>
          )}
        </div>
      </div>

      {/* 四象限视图 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">四象限视图</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* 重要且紧急 */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-red-900">重要且紧急</h3>
              <span className="text-sm font-medium text-red-600">
                {tasksByQuadrant.IU.length} 个
              </span>
            </div>
            <div className="space-y-2">
              {tasksByQuadrant.IU.length > 0 ? (
                tasksByQuadrant.IU.map((task) => (
                  <QuadrantTaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={updateTaskStatus}
                  />
                ))
              ) : (
                <p className="text-sm text-red-700">暂无任务</p>
              )}
            </div>
          </div>

          {/* 重要不紧急 */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-900">重要不紧急</h3>
              <span className="text-sm font-medium text-blue-600">
                {tasksByQuadrant.IN.length} 个
              </span>
            </div>
            <div className="space-y-2">
              {tasksByQuadrant.IN.length > 0 ? (
                tasksByQuadrant.IN.map((task) => (
                  <QuadrantTaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={updateTaskStatus}
                  />
                ))
              ) : (
                <p className="text-sm text-blue-700">暂无任务</p>
              )}
            </div>
          </div>

          {/* 不重要但紧急 */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-amber-900">不重要但紧急</h3>
              <span className="text-sm font-medium text-amber-600">
                {tasksByQuadrant.NU.length} 个
              </span>
            </div>
            <div className="space-y-2">
              {tasksByQuadrant.NU.length > 0 ? (
                tasksByQuadrant.NU.map((task) => (
                  <QuadrantTaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={updateTaskStatus}
                  />
                ))
              ) : (
                <p className="text-sm text-amber-700">暂无任务</p>
              )}
            </div>
          </div>

          {/* 不重要不紧急 */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">不重要不紧急</h3>
              <span className="text-sm font-medium text-gray-600">
                {tasksByQuadrant.NN.length} 个
              </span>
            </div>
            <div className="space-y-2">
              {tasksByQuadrant.NN.length > 0 ? (
                tasksByQuadrant.NN.map((task) => (
                  <QuadrantTaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={updateTaskStatus}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-700">暂无任务</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 备选任务池 */}
      {backlogTasks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">备选任务池</h2>
          <div className="space-y-3">
            {backlogTasks.map((task) => (
              <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 任务卡片组件
interface TaskCardProps {
  task: TaskWithQuadrant;
  onStatusChange: (taskId: string, status: Task['status'], blockedReason?: string) => void;
}

function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const [showBlockReason, setShowBlockReason] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const handleStart = () => {
    onStatusChange(task.id, 'in-progress');
  };

  const handleComplete = () => {
    onStatusChange(task.id, 'completed');
  };

  const handleBlock = () => {
    if (blockReason.trim()) {
      onStatusChange(task.id, 'blocked', blockReason);
      setShowBlockReason(false);
      setBlockReason('');
    }
  };

  const statusColors = {
    todo: 'border-gray-200 bg-white',
    'in-progress': 'border-blue-300 bg-blue-50',
    blocked: 'border-red-300 bg-red-50',
    completed: 'border-green-300 bg-green-50',
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${statusColors[task.status]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-gray-600">{task.duration}h</span>
        </div>
      </div>

      {task.status === 'blocked' && task.blockedReason && (
        <div className="bg-red-100 border border-red-200 rounded p-2 mb-2 text-sm text-red-800">
          <strong>阻塞原因：</strong> {task.blockedReason}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        {task.status === 'todo' && (
          <>
            <button
              onClick={handleStart}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              开始
            </button>
            <button
              onClick={() => setShowBlockReason(true)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              阻塞
            </button>
          </>
        )}

        {task.status === 'in-progress' && (
          <>
            <button
              onClick={handleComplete}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              完成
            </button>
            <button
              onClick={() => setShowBlockReason(true)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              阻塞
            </button>
          </>
        )}

        {task.status === 'blocked' && (
          <button
            onClick={handleStart}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            继续
          </button>
        )}

        {task.status === 'completed' && (
          <span className="text-green-600 text-sm font-medium">
            已完成
          </span>
        )}
      </div>

      {showBlockReason && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            请说明阻塞原因：
          </label>
          <textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-sm mb-2"
            rows={2}
            placeholder="例如：缺少设计稿、等待他人反馈等"
          />
          <div className="flex gap-2">
            <button
              onClick={handleBlock}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              确认阻塞
            </button>
            <button
              onClick={() => setShowBlockReason(false)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 四象限任务卡片（简化版）
function QuadrantTaskCard({ task, onStatusChange }: TaskCardProps) {
  return (
    <div className="bg-white rounded p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium mb-1">{task.title}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{task.duration}h</span>
            {task.status === 'completed' && (
              <span className="text-green-600 font-medium">已完成</span>
            )}
            {task.status === 'in-progress' && (
              <span className="text-blue-600 font-medium">进行中</span>
            )}
            {task.status === 'blocked' && (
              <span className="text-red-600 font-medium">阻塞</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 创建每日计划的辅助函数
function createDailyPlan(date: Date, tasks: Task[], availableHours: number): DailyPlan {
  // 找出当天应该做的任务
  const dayTasks = tasks.filter((t) => {
    const taskDate = new Date(t.startDate);
    taskDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === targetDate.getTime() && t.level === 'day';
  });

  // 按优先级排序
  const sortedTasks = dayTasks.sort((a, b) => {
    const scoreA = a.importance * 2 + a.urgency;
    const scoreB = b.importance * 2 + b.urgency;
    return scoreB - scoreA;
  });

  return {
    date,
    availableHours,
    top1: sortedTasks[0]?.id,
    top2: sortedTasks[1]?.id,
    top3: sortedTasks[2]?.id,
    backlog: sortedTasks.slice(3).map((t) => t.id),
    completedTasks: [],
  };
}