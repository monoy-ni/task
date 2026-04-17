import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Play, CheckCircle2, AlertCircle, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Project, Plan, Task, DailyPlan, TaskWithQuadrant } from '../types';
import { getTaskQuadrant } from '../utils/planGenerator';

export default function DailyTasksTimeline() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingHours, setEditingHours] = useState(false);
  const [availableHours, setAvailableHours] = useState(8);

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
    return <div className="text-center py-16"><p className="text-gray-500">加载中...</p></div>;
  }

  const today = new Date(selectedDate);
  today.setHours(0, 0, 0, 0);

  // 找到今日计划
  let todayPlan = plan.dailyPlans.find((dp) => {
    const planDate = new Date(dp.date);
    planDate.setHours(0, 0, 0, 0);
    return planDate.getTime() === today.getTime();
  });

  if (!todayPlan) {
    todayPlan = createDailyPlan(today, plan.tasks, availableHours);
  }

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

  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const usedHours = tasksWithQuadrant
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.duration, 0);
  const remainingHours = availableHours - usedHours;

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* 左侧：日期导航 */}
      <div className="w-72 bg-white rounded-lg border border-gray-200 p-4 flex-shrink-0">
        <MiniCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          tasks={plan.tasks}
        />

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">今日进度</h3>
          <div className="space-y-3">
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-emerald-700">可用时间</span>
                {editingHours ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={availableHours}
                      onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                      title="可用小时数"
                      className="w-12 px-1 py-0.5 border border-gray-300 rounded text-sm"
                      step="0.5"
                    />
                    <button
                      onClick={() => setEditingHours(false)}
                      className="text-xs text-emerald-600"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingHours(true)}
                    className="text-lg font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    {availableHours}h
                  </button>
                )}
              </div>
              <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, (usedHours / availableHours) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 mt-1">
                <span>已用 {usedHours}h</span>
                <span>剩余 {Math.max(0, remainingHours).toFixed(1)}h</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 rounded-lg p-2">
                <div className="text-xs text-emerald-700">已完成</div>
                <div className="text-xl font-semibold text-emerald-600">
                  {tasksWithQuadrant.filter((t) => t.status === 'completed').length}
                </div>
              </div>
              <div className="bg-lime-50 rounded-lg p-2">
                <div className="text-xs text-lime-700">未完成</div>
                <div className="text-xl font-semibold text-lime-600">
                  {tasksWithQuadrant.filter((t) => t.status !== 'completed').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 中间：时间轴主区域 */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              今天
            </button>
            <div className="flex items-center gap-2">
              <button onClick={goToPrevDay} className="p-1.5 hover:bg-gray-100 rounded" title="前一天">
                <ChevronLeft className="size-5 text-gray-600" />
              </button>
              <button onClick={goToNextDay} className="p-1.5 hover:bg-gray-100 rounded" title="后一天">
                <ChevronRight className="size-5 text-gray-600" />
              </button>
            </div>
            <h2 className="text-lg font-semibold">
              {selectedDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </h2>
          </div>

          <Link
            to={`/review/${projectId}`}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm"
          >
            <CheckCircle2 className="size-4" />
            日终复盘
          </Link>
        </div>

        {/* 时间轴区域 */}
        <div className="flex-1 overflow-auto">
          <TimelineView
            tasks={tasksWithQuadrant}
            availableHours={availableHours}
            onTaskClick={setSelectedTask}
            onStatusChange={updateTaskStatus}
          />
        </div>
      </div>

      {/* 右侧：任务详情 */}
      {selectedTask && (
        <div className="w-80 bg-white rounded-lg border border-gray-200 p-6 flex-shrink-0">
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onStatusChange={updateTaskStatus}
          />
        </div>
      )}
    </div>
  );
}

// 时间轴视图
function TimelineView({
  tasks,
  availableHours,
  onTaskClick,
  onStatusChange,
}: {
  tasks: TaskWithQuadrant[];
  availableHours: number;
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status'], reason?: string) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

  // 按优先级分组
  const top1 = tasks.find((t) => (t as any).isTop === 1);
  const top2 = tasks.find((t) => (t as any).isTop === 2);
  const top3 = tasks.find((t) => (t as any).isTop === 3);
  const otherTasks = tasks.filter((t) => !(t as any).isTop);

  return (
    <div className="p-6">
      {/* 优先任务区 */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-emerald-500 rounded"></span>
          优先任务
        </h3>
        <div className="space-y-3">
          {top1 && (
            <TimelineTaskCard
              task={top1}
              label="TOP 1"
              labelColor="bg-yellow-400"
              onClick={onTaskClick}
              onStatusChange={onStatusChange}
            />
          )}
          {top2 && (
            <TimelineTaskCard
              task={top2}
              label="TOP 2"
              labelColor="bg-emerald-400"
              onClick={onTaskClick}
              onStatusChange={onStatusChange}
            />
          )}
          {top3 && (
            <TimelineTaskCard
              task={top3}
              label="TOP 3"
              labelColor="bg-lime-400"
              onClick={onTaskClick}
              onStatusChange={onStatusChange}
            />
          )}
        </div>
      </div>

      {/* 其他任务 */}
      {otherTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-emerald-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-emerald-400 rounded"></span>
            备选任务
          </h3>
          <div className="space-y-3">
            {otherTasks.map((task) => (
              <TimelineTaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
                onStatusChange={onStatusChange}
                label="备选"
                labelColor="bg-emerald-100 text-emerald-700"
              />
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {tasks.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="size-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">今日暂无任务安排</p>
        </div>
      )}
    </div>
  );
}

// 时间轴任务卡片
function TimelineTaskCard({
  task,
  label,
  labelColor,
  onClick,
  onStatusChange,
}: {
  task: TaskWithQuadrant;
  label?: string;
  labelColor?: string;
  onClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status'], reason?: string) => void;
}) {
  const [showBlockInput, setShowBlockInput] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const quadrantColors = {
    IU: 'border-l-yellow-400 bg-yellow-50/50',
    IN: 'border-l-emerald-400 bg-emerald-50/50',
    NU: 'border-l-lime-400 bg-lime-50/50',
    NN: 'border-l-gray-400 bg-gray-50',
  };

  const statusIcons = {
    todo: <div className="size-5 border-2 border-gray-400 rounded-full"></div>,
    'in-progress': <div className="size-5 bg-emerald-400 rounded-full flex items-center justify-center">
      <div className="size-2 bg-white rounded-full"></div>
    </div>,
    blocked: <AlertCircle className="size-5 text-yellow-500" />,
    completed: <CheckCircle2 className="size-5 text-emerald-500 fill-current" />,
  };

  const handleStart = () => {
    onStatusChange(task.id, 'in-progress');
  };

  const handleComplete = () => {
    onStatusChange(task.id, 'completed');
  };

  const handleBlock = () => {
    if (blockReason.trim()) {
      onStatusChange(task.id, 'blocked', blockReason);
      setShowBlockInput(false);
      setBlockReason('');
    }
  };

  return (
    <div className={`border-l-4 ${quadrantColors[task.quadrant]} rounded-lg p-4 hover:shadow-md transition-all cursor-pointer`}>
      <div className="flex items-start gap-3">
        {/* 状态图标 */}
        <div className="flex-shrink-0 mt-0.5">{statusIcons[task.status]}</div>

        {/* 任务内容 */}
        <div className="flex-1 min-w-0" onClick={() => onClick(task)}>
          <div className="flex items-center gap-2 mb-1">
            {label && (
              <span className={`${labelColor} text-white text-xs px-2 py-0.5 rounded font-medium`}>
                {label}
              </span>
            )}
            <h4 className="font-semibold text-gray-900">{task.title}</h4>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {task.duration}h
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-gray-200">
              {task.quadrant === 'IU' && '重要紧急'}
              {task.quadrant === 'IN' && '重要不紧急'}
              {task.quadrant === 'NU' && '不重要但紧急'}
              {task.quadrant === 'NN' && '不重要不紧急'}
            </span>
          </div>

          {task.status === 'blocked' && task.blockedReason && (
            <div className="mt-2 bg-yellow-100 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
              <strong>阻塞:</strong> {task.blockedReason}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex-shrink-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {task.status === 'todo' && (
            <>
              <button
                type="button"
                onClick={handleStart}
                className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded hover:bg-emerald-600"
                title="开始任务"
              >
                开始
              </button>
              <button
                type="button"
                onClick={() => setShowBlockInput(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600"
                title="标记为阻塞"
                aria-label="标记为阻塞"
              >
                <AlertCircle className="size-4" />
              </button>
            </>
          )}

          {task.status === 'in-progress' && (
            <>
              <button
                type="button"
                onClick={handleComplete}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                title="完成任务"
              >
                完成
              </button>
              <button
                type="button"
                onClick={() => setShowBlockInput(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600"
                title="标记为阻塞"
                aria-label="标记为阻塞"
              >
                <AlertCircle className="size-4" />
              </button>
            </>
          )}

          {task.status === 'blocked' && (
            <button
              onClick={handleStart}
              className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
            >
              继续
            </button>
          )}
        </div>
      </div>

      {/* 阻塞原因输入 */}
      {showBlockInput && (
        <div className="mt-3 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-sm"
            rows={2}
            placeholder="请说明阻塞原因..."
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleBlock}
              className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
            >
              确认阻塞
            </button>
            <button
              onClick={() => setShowBlockInput(false)}
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

// 迷你日历
function MiniCalendar({
  selectedDate,
  onDateSelect,
  tasks,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  tasks: Task[];
}) {
  const [displayMonth, setDisplayMonth] = useState(new Date(selectedDate));

  const daysInMonth = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth(),
    1
  ).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const hasTaskOnDay = (day: number) => {
    const checkDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    checkDate.setHours(0, 0, 0, 0);
    return tasks.some((task) => {
      const taskDate = new Date(task.startDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === checkDate.getTime();
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            const newMonth = new Date(displayMonth);
            newMonth.setMonth(newMonth.getMonth() - 1);
            setDisplayMonth(newMonth);
          }}
          className="p-1 hover:bg-gray-100 rounded"
          title="上一月"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold">
          {displayMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
        </span>
        <button
          onClick={() => {
            const newMonth = new Date(displayMonth);
            newMonth.setMonth(newMonth.getMonth() + 1);
            setDisplayMonth(newMonth);
          }}
          className="p-1 hover:bg-gray-100 rounded"
          title="下一月"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="text-xs text-center text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="aspect-square"></div>;
          }

          const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const hasTasks = hasTaskOnDay(day);

          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={`aspect-square rounded text-sm flex flex-col items-center justify-center relative transition-colors ${
                isSelected
                  ? 'bg-emerald-500 text-white font-semibold'
                  : isToday
                  ? 'bg-emerald-50 text-emerald-600 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              {day}
              {hasTasks && !isSelected && (
                <div className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 任务详情面板
function TaskDetailPanel({
  task,
  onClose,
  onStatusChange,
}: {
  task: Task;
  onClose: () => void;
  onStatusChange: (taskId: string, status: Task['status'], reason?: string) => void;
}) {
  const quadrant = getTaskQuadrant(task);
  const quadrantInfo = {
    IU: { text: '重要且紧急', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    IN: { text: '重要不紧急', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    NU: { text: '不重要但紧急', color: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-200' },
    NN: { text: '不重要不紧急', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <h3 className="text-lg font-semibold pr-4">{task.title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div className={`px-3 py-2 rounded-lg border ${quadrantInfo[quadrant].bg} ${quadrantInfo[quadrant].border}`}>
          <div className={`text-sm font-medium ${quadrantInfo[quadrant].color}`}>
            {quadrantInfo[quadrant].text}
          </div>
        </div>

        {task.description && (
          <div>
            <div className="text-sm text-gray-500 mb-1">描述</div>
            <p className="text-sm text-gray-700">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">预计时长</div>
            <div className="text-lg font-semibold">{task.duration}h</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">状态</div>
            <div className="text-sm">
              {task.status === 'todo' && '⚪ 待开始'}
              {task.status === 'in-progress' && '🔵 进行中'}
              {task.status === 'blocked' && '🔴 阻塞'}
              {task.status === 'completed' && '✅ 已完成'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-2">重要性</div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < task.importance ? 'bg-yellow-400' : 'bg-gray-200'
                  }`}
                ></div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">紧急性</div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < task.urgency ? 'bg-lime-400' : 'bg-gray-200'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {task.blockedReason && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm font-medium text-yellow-900 mb-1">阻塞原因</div>
            <div className="text-sm text-yellow-800">{task.blockedReason}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// 辅助函数
function createDailyPlan(date: Date, tasks: Task[], availableHours: number): DailyPlan {
  const dayTasks = tasks.filter((t) => {
    const taskDate = new Date(t.startDate);
    taskDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === targetDate.getTime() && t.level === 'day';
  });

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
