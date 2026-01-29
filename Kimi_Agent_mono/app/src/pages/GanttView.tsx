import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Project, Plan, Task, AISuggestion } from '../types';
import { getTaskQuadrant } from '../utils/planGenerator';

type ZoomLevel = 'day' | 'week' | 'month';

export default function GanttView() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [filterQuadrant, setFilterQuadrant] = useState<string>('all');
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId) return;

    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const foundProject = projects.find((p: any) => p.id === projectId);

    if (foundProject) {
      setProject({
        ...foundProject,
        createdAt: new Date(foundProject.createdAt),
        deadline: foundProject.deadline ? new Date(foundProject.deadline) : undefined,
      });
    }

    const storedPlan = localStorage.getItem(`plan-${projectId}`);
    if (storedPlan) {
      const parsedPlan = JSON.parse(storedPlan);
      setPlan({
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
      });
    } else if (foundProject && foundProject.tasks) {
      // 如果没有 plan，从 tasks 生成默认 plan
      console.log('没有找到 plan，从 project.tasks 生成默认 plan');
      const defaultPlan = convertHierarchyToPlan(foundProject);
      setPlan(defaultPlan);
      localStorage.setItem(`plan-${projectId}`, JSON.stringify(defaultPlan));
    }
  }, [projectId]);

  if (!project || !plan) {
    return <div className="text-center py-16"><p className="text-gray-500">加载中...</p></div>;
  }

  const updatePlan = (newPlan: Plan) => {
    setPlan(newPlan);
    localStorage.setItem(`plan-${projectId}`, JSON.stringify(newPlan));
  };

  // 计算日期范围
  const allDates = plan.tasks.flatMap((t) => [t.startDate, t.endDate]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  // 过滤任务
  const filteredTasks = filterQuadrant === 'all'
    ? plan.tasks
    : plan.tasks.filter(t => getTaskQuadrant(t) === filterQuadrant);

  // 按父子关系组织任务
  const rootTasks = filteredTasks.filter(t => !t.parentId);
  const getChildTasks = (parentId: string) =>
    filteredTasks.filter(t => t.parentId === parentId);

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // 处理任务拖拽
  const handleTaskDrop = (
    task: Task,
    newStartDate: Date,
    newEndDate: Date
  ) => {
    const updatedTasks = plan.tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          startDate: newStartDate,
          endDate: newEndDate,
          duration: Math.ceil(
            (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)
          ),
        };
      }
      return t;
    });

    // 检查依赖和影响
    const affectedTasks = findAffectedTasks(task, updatedTasks);
    if (affectedTasks.length > 0) {
      const newSuggestions = generateSuggestions(task, affectedTasks, updatedTasks);
      setSuggestions(newSuggestions);
    }

    // 自动顺延后继任务
    const finalTasks = propagateChanges(task, updatedTasks);
    updatePlan({ ...plan, tasks: finalTasks });
  };

  // 查找受影响的任务
  const findAffectedTasks = (changedTask: Task, allTasks: Task[]): Task[] => {
    const affected: Task[] = [];
    allTasks.forEach((task) => {
      if (task.dependencies.includes(changedTask.id)) {
        affected.push(task);
        affected.push(...findAffectedTasks(task, allTasks));
      }
    });
    return Array.from(new Set(affected));
  };

  // 传播变更
  const propagateChanges = (changedTask: Task, allTasks: Task[]): Task[] => {
    const result = [...allTasks];
    const changedTaskData = result.find((t) => t.id === changedTask.id);
    if (!changedTaskData) return result;

    const dependents = result.filter((t) => t.dependencies.includes(changedTask.id));

    dependents.forEach((dependent) => {
      if (dependent.startDate < changedTaskData.endDate) {
        const delay = changedTaskData.endDate.getTime() - dependent.startDate.getTime();
        const newStartDate = new Date(dependent.startDate.getTime() + delay);
        const newEndDate = new Date(dependent.endDate.getTime() + delay);

        const index = result.findIndex((t) => t.id === dependent.id);
        if (index !== -1) {
          result[index] = {
            ...result[index],
            startDate: newStartDate,
            endDate: newEndDate,
          };
          propagateChanges(result[index], result);
        }
      }
    });

    return result;
  };

  // 生成建议
  const generateSuggestions = (
    changedTask: Task,
    affectedTasks: Task[],
    allTasks: Task[]
  ): AISuggestion[] => {
    const suggestions: AISuggestion[] = [];

    if (changedTask.duration > 8) {
      suggestions.push({
        type: 'split',
        targetTaskIds: [changedTask.id],
        reason: '任务时长超过8天，建议拆分成更小的子任务',
        preview: {
          before: [changedTask],
          after: [
            {
              ...changedTask,
              id: `${changedTask.id}-1`,
              title: `${changedTask.title} (第1部分)`,
              duration: Math.ceil(changedTask.duration / 2),
              endDate: new Date(
                changedTask.startDate.getTime() +
                  Math.ceil(changedTask.duration / 2) * 24 * 60 * 60 * 1000
              ),
            } as Task,
            {
              ...changedTask,
              id: `${changedTask.id}-2`,
              title: `${changedTask.title} (第2部分)`,
              duration: Math.floor(changedTask.duration / 2),
              startDate: new Date(
                changedTask.startDate.getTime() +
                  Math.ceil(changedTask.duration / 2) * 24 * 60 * 60 * 1000
              ),
              dependencies: [`${changedTask.id}-1`],
            } as Task,
          ],
        },
        impact: '拆分为2个子任务，总工期保持不变',
      });
    }

    if (affectedTasks.length > 2) {
      suggestions.push({
        type: 'reorganize',
        targetTaskIds: affectedTasks.map((t) => t.id),
        reason: `影响了${affectedTasks.length}个后继任务，建议重新调整`,
        preview: {
          before: affectedTasks,
          after: affectedTasks,
        },
        impact: `${affectedTasks.length}个任务需要重新排期`,
      });
    }

    return suggestions;
  };

  // 应用建议
  const applySuggestion = (suggestion: AISuggestion) => {
    let updatedTasks = [...plan.tasks];

    if (suggestion.type === 'split') {
      updatedTasks = updatedTasks.filter(
        (t) => !suggestion.targetTaskIds.includes(t.id)
      );
      updatedTasks.push(...suggestion.preview.after);
    }

    updatePlan({ ...plan, tasks: updatedTasks });
    setSuggestions([]);
  };

  const completedCount = plan.tasks.filter(t => t.status === 'completed').length;
  const totalCount = plan.tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* 左侧：项目信息和统计 */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* 项目概览 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold mb-3">{project.title}</h2>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">项目进度</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-gray-500">已完成</div>
                <div className="text-lg font-semibold text-green-600">{completedCount}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">总任务</div>
                <div className="text-lg font-semibold">{totalCount}</div>
              </div>
            </div>
            {project.deadline && (
              <div>
                <div className="text-xs text-gray-500">截止日期</div>
                <div className="text-sm font-medium">
                  {project.deadline.toLocaleDateString('zh-CN')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 过滤器 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="size-4 text-gray-500" />
            <h3 className="text-sm font-semibold">按优先级筛选</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setFilterQuadrant('all')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                filterQuadrant === 'all'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-50'
              }`}
            >
              全部任务 ({plan.tasks.length})
            </button>
            <button
              onClick={() => setFilterQuadrant('IU')}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                filterQuadrant === 'IU'
                  ? 'bg-red-50 text-red-700 font-medium'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              重要且紧急 ({plan.tasks.filter(t => getTaskQuadrant(t) === 'IU').length})
            </button>
            <button
              onClick={() => setFilterQuadrant('IN')}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                filterQuadrant === 'IN'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              重要不紧急 ({plan.tasks.filter(t => getTaskQuadrant(t) === 'IN').length})
            </button>
            <button
              onClick={() => setFilterQuadrant('NU')}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                filterQuadrant === 'NU'
                  ? 'bg-amber-50 text-amber-700 font-medium'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              不重要紧急 ({plan.tasks.filter(t => getTaskQuadrant(t) === 'NU').length})
            </button>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold mb-3">快捷操作</h3>
          <div className="space-y-2">
            <Link
              to={`/daily/${projectId}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
            >
              <CheckCircle2 className="size-4" />
              查看今日任务
            </Link>
            <Link
              to={`/review/${projectId}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
            >
              <Sparkles className="size-4" />
              日终复盘
            </Link>
          </div>
        </div>
      </div>

      {/* 右侧：甘特图主区域 */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200">
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">项目甘特图</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setZoomLevel('day')}
                className={`px-3 py-1 text-sm rounded ${
                  zoomLevel === 'day'
                    ? 'bg-white shadow-sm font-medium'
                    : 'text-gray-600'
                }`}
              >
                日
              </button>
              <button
                onClick={() => setZoomLevel('week')}
                className={`px-3 py-1 text-sm rounded ${
                  zoomLevel === 'week'
                    ? 'bg-white shadow-sm font-medium'
                    : 'text-gray-600'
                }`}
              >
                周
              </button>
              <button
                onClick={() => setZoomLevel('month')}
                className={`px-3 py-1 text-sm rounded ${
                  zoomLevel === 'month'
                    ? 'bg-white shadow-sm font-medium'
                    : 'text-gray-600'
                }`}
              >
                月
              </button>
            </div>
          </div>
        </div>

        {/* AI建议 */}
        {suggestions.length > 0 && (
          <div className="mx-6 mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 mb-2">AI 优化建议</h3>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-white rounded p-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">
                          {suggestion.type === 'split' && '🔀 建议拆分任务'}
                          {suggestion.type === 'reorganize' && '♻️ 建议重组任务'}
                        </div>
                        <p className="text-sm text-gray-700">{suggestion.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">影响: {suggestion.impact}</p>
                      </div>
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        className="ml-3 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        应用
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 甘特图内容 */}
        <div className="flex-1 overflow-auto" ref={chartRef}>
          <GanttChart
            tasks={rootTasks}
            getChildTasks={getChildTasks}
            minDate={minDate}
            maxDate={maxDate}
            zoomLevel={zoomLevel}
            expandedTasks={expandedTasks}
            onToggleExpand={toggleExpand}
            onTaskDrop={handleTaskDrop}
            onTaskSelect={setSelectedTask}
          />
        </div>

        {/* 图例 */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-gray-300 rounded"></div>
            <span>待开始</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-blue-500 rounded"></div>
            <span>进行中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-green-500 rounded"></div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-red-500 rounded"></div>
            <span>阻塞</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            <span>有依赖关系</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 甘特图组件
function GanttChart({
  tasks,
  getChildTasks,
  minDate,
  maxDate,
  zoomLevel,
  expandedTasks,
  onToggleExpand,
  onTaskDrop,
  onTaskSelect,
}: {
  tasks: Task[];
  getChildTasks: (parentId: string) => Task[];
  minDate: Date;
  maxDate: Date;
  zoomLevel: ZoomLevel;
  expandedTasks: Set<string>;
  onToggleExpand: (taskId: string) => void;
  onTaskDrop: (task: Task, newStart: Date, newEnd: Date) => void;
  onTaskSelect: (task: Task) => void;
}) {
  const totalDays = Math.ceil(
    (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 根据缩放级别生成时间列
  const timeColumns =
    zoomLevel === 'day'
      ? Array.from({ length: totalDays }, (_, i) => {
          const date = new Date(minDate);
          date.setDate(minDate.getDate() + i);
          return date;
        })
      : zoomLevel === 'week'
      ? Array.from({ length: Math.ceil(totalDays / 7) }, (_, i) => {
          const date = new Date(minDate);
          date.setDate(minDate.getDate() + i * 7);
          return date;
        })
      : Array.from({ length: Math.ceil(totalDays / 30) }, (_, i) => {
          const date = new Date(minDate);
          date.setMonth(minDate.getMonth() + i);
          return date;
        });

  const renderTask = (task: Task, level: number = 0) => {
    const children = getChildTasks(task.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedTasks.has(task.id);

    return (
      <div key={task.id}>
        <GanttRow
          task={task}
          level={level}
          minDate={minDate}
          totalDays={totalDays}
          zoomLevel={zoomLevel}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onTaskDrop={onTaskDrop}
          onTaskSelect={onTaskSelect}
        />
        {hasChildren && isExpanded && children.map((child) => renderTask(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="min-w-max">
      {/* 时间轴标题 */}
      <div className="flex sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
        <div className="w-80 px-4 py-3 font-semibold border-r border-gray-200">任务名称</div>
        <div className="flex-1 flex">
          {timeColumns.map((date, i) => (
            <div
              key={i}
              className="flex-shrink-0 px-3 py-3 text-center border-r border-gray-200 text-sm"
              style={{ width: zoomLevel === 'day' ? '60px' : zoomLevel === 'week' ? '100px' : '120px' }}
            >
              <div className="font-medium">
                {zoomLevel === 'day' && date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                {zoomLevel === 'week' && `第${Math.floor(i + 1)}周`}
                {zoomLevel === 'month' && date.toLocaleDateString('zh-CN', { month: 'long' })}
              </div>
              {zoomLevel === 'day' && (
                <div className="text-xs text-gray-500">
                  {date.toLocaleDateString('zh-CN', { weekday: 'short' })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 任务行 */}
      <div>{tasks.map((task) => renderTask(task))}</div>

      {tasks.length === 0 && (
        <div className="text-center py-16 text-gray-500">暂无任务</div>
      )}
    </div>
  );
}

// 甘特图行组件
function GanttRow({
  task,
  level,
  minDate,
  totalDays,
  zoomLevel,
  hasChildren,
  isExpanded,
  onToggleExpand,
  onTaskDrop,
  onTaskSelect,
}: {
  task: Task;
  level: number;
  minDate: Date;
  totalDays: number;
  zoomLevel: ZoomLevel;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: (taskId: string) => void;
  onTaskDrop: (task: Task, newStart: Date, newEnd: Date) => void;
  onTaskSelect: (task: Task) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const taskStartDay = Math.floor(
    (task.startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const taskDuration = Math.ceil(
    (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const columnWidth = zoomLevel === 'day' ? 60 : zoomLevel === 'week' ? 100 : 120;
  const pixelsPerDay = columnWidth / (zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30);

  const leftPosition = taskStartDay * pixelsPerDay;
  const barWidth = taskDuration * pixelsPerDay;

  const colorMap = {
    todo: 'bg-gray-300 border-gray-400',
    'in-progress': 'bg-blue-500 border-blue-600',
    blocked: 'bg-red-500 border-red-600',
    completed: 'bg-green-500 border-green-600',
  };

  const quadrant = getTaskQuadrant(task);
  const isHighPriority = quadrant === 'IU';

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset((prev) => prev + e.movementX);
  };

  const handleMouseUp = () => {
    if (isDragging && dragOffset !== 0) {
      const daysMoved = Math.round(dragOffset / pixelsPerDay);
      const newStartDate = new Date(task.startDate);
      newStartDate.setDate(task.startDate.getDate() + daysMoved);
      const newEndDate = new Date(task.endDate);
      newEndDate.setDate(task.endDate.getDate() + daysMoved);
      onTaskDrop(task, newStartDate, newEndDate);
    }
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <div
      className="flex border-b border-gray-100 hover:bg-blue-50/30 group"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 左侧任务名 */}
      <div className="w-80 px-4 py-3 border-r border-gray-200 flex items-center gap-2">
        <div style={{ marginLeft: `${level * 20}px` }} className="flex items-center gap-2">
          {hasChildren && (
            <button
              onClick={() => onToggleExpand(task.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              )}
            </button>
          )}
          <button
            onClick={() => onTaskSelect(task)}
            className="text-sm font-medium text-left hover:text-blue-600 flex items-center gap-2"
          >
            {task.title}
            {task.dependencies.length > 0 && (
              <AlertTriangle className="size-3 text-amber-500" />
            )}
          </button>
        </div>
      </div>

      {/* 右侧时间轴 */}
      <div className="flex-1 relative py-2">
        {/* 今日线 */}
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayDays = Math.floor(
            (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (todayDays >= 0 && todayDays <= totalDays) {
            return (
              <div
                className="absolute top-0 bottom-0 w-px bg-red-400 z-10 opacity-50"
                style={{ left: `${todayDays * pixelsPerDay}px` }}
              ></div>
            );
          }
          return null;
        })()}

        {/* 任务条 */}
        <div
          className={`absolute h-6 rounded border-l-4 cursor-move transition-all ${
            colorMap[task.status]
          } ${isHighPriority ? 'ring-2 ring-red-300' : ''} ${
            isDragging ? 'opacity-60 shadow-lg' : 'shadow-sm group-hover:shadow-md'
          }`}
          style={{
            left: `${leftPosition + dragOffset}px`,
            width: `${barWidth}px`,
            minWidth: '40px',
          }}
          onMouseDown={handleMouseDown}
          title={`${task.title}\n${task.startDate.toLocaleDateString('zh-CN')} - ${task.endDate.toLocaleDateString('zh-CN')}\n时长: ${task.duration}天`}
        >
          <div className="px-2 text-xs text-white font-medium truncate leading-6">
            {task.title}
          </div>
        </div>
      </div>
    </div>
  );
}

// 从项目任务层次结构生成默认计划
function convertHierarchyToPlan(project: any): Plan {
  const tasks: Task[] = [];
  let taskCounter = 0;

  // 转换5层任务层级：yearly -> quarterly -> monthly -> weekly -> daily
  const hierarchy = project.tasks;

  if (!hierarchy) {
    return {
      projectId: project.id,
      tasks: [],
      milestones: [],
      dailyPlans: [],
    };
  }

  const now = new Date();
  let currentDate = new Date(now);

  // 年度任务（顶层）
  const yearlyTaskIds = new Map<string, string>(); // 年名 -> 年任务ID
  (hierarchy.yearly || []).forEach((yearTask: any, i: number) => {
    const yearNum = i + 1;
    const startDate = new Date(currentDate);
    startDate.setMonth(0); // 从1月开始
    startDate.setDate(1);

    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const taskId = `yearly-year-${yearNum}`;
    yearlyTaskIds.set(`第${yearNum}年`, taskId);

    tasks.push({
      id: taskId,
      title: yearTask.title || `第${yearNum}年`,
      description: yearTask.description || '',
      startDate,
      endDate,
      duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      status: 'todo',
      importance: 5,
      urgency: 3,
      cost: 100,
      risk: 3,
      parentId: undefined,
      dependencies: [],
      level: 'month', // 年度也作为 month 级别显示在顶层
    });
  });

  // 季度任务
  const quarterlyTaskIds = new Map<string, string>(); // 季名 -> 季任务ID
  Object.keys(hierarchy.quarterly || {}).forEach((quarter) => {
    if (Array.isArray(hierarchy.quarterly[quarter])) {
      // 解析季度：如 "Q1" 或 "第1季度" -> 1
      const quarterMatch = quarter.match(/[Qq]?(\d+)/);
      const quarterNum = quarterMatch ? parseInt(quarterMatch[1]) : 1;

      // 计算父年
      const parentYearKey = `第1年`; // 默认第1年
      const parentId = yearlyTaskIds.get(parentYearKey);

      const taskId = `quarterly-quarter-${quarterNum}`;
      quarterlyTaskIds.set(`第${quarterNum}季度`, taskId);
      quarterlyTaskIds.set(`Q${quarterNum}`, taskId);

      const startDate = new Date(currentDate);
      startDate.setMonth((quarterNum - 1) * 3);
      startDate.setDate(1);

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);

      hierarchy.quarterly[quarter].forEach((quarterTask: any) => {
        tasks.push({
          id: taskId,
          title: quarterTask.title || `第${quarterNum}季度`,
          description: quarterTask.description || '',
          startDate,
          endDate,
          duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          status: 'todo',
          importance: 4,
          urgency: 3,
          cost: 50,
          risk: 2,
          parentId, // 关联到父年任务
          dependencies: [],
          level: 'month',
        });
      });
    }
  });

  // 月度任务
  // 先收集月任务ID用于周任务建立父子关系
  const monthlyTaskIds = new Map<string, string>(); // 月名 -> 月任务ID

  Object.keys(hierarchy.monthly || {}).forEach((month) => {
    if (Array.isArray(hierarchy.monthly[month])) {
      hierarchy.monthly[month].forEach((monthTask: any) => {
        // 解析月数：如 "第1个月" -> 1
        const monthMatch = month.match(/第(\d+)个月/);
        const monthNum = monthMatch ? parseInt(monthMatch[1]) : 1;

        // 计算父季度：月1-3属于Q1，月4-6属于Q2，月7-9属于Q3，月10-12属于Q4
        const parentQuarterNum = Math.ceil(monthNum / 3);
        const parentQuarterKey = `第${parentQuarterNum}季度`;
        const parentId = quarterlyTaskIds.get(parentQuarterKey) || quarterlyTaskIds.get(`Q${parentQuarterNum}`);

        // 计算开始和结束日期
        const startDate = new Date(currentDate);
        startDate.setMonth(startDate.getMonth() + monthNum - 1);
        startDate.setDate(1);

        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const taskId = `monthly-month-${monthNum}`;
        monthlyTaskIds.set(`第${monthNum}个月`, taskId);

        tasks.push({
          id: taskId,
          title: monthTask.title || month,
          description: monthTask.description || '',
          startDate,
          endDate,
          duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          status: 'todo',
          importance: 4,
          urgency: 4,
          cost: 20,
          risk: 2,
          parentId, // 关联到父季度任务
          dependencies: [],
          level: 'month',
        });
      });
    }
  });

  // 周度任务
  Object.keys(hierarchy.weekly || {}).forEach((week) => {
    if (Array.isArray(hierarchy.weekly[week])) {
      hierarchy.weekly[week].forEach((weekTask: any) => {
        // 解析周数：从week key提取，如 "第1周" -> 1
        const weekMatch = week.match(/第(\d+)周/);
        const weekNum = weekMatch ? parseInt(weekMatch[1]) : 1;

        // 计算开始日期：基于当前日期和周数
        const startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() + (weekNum - 1) * 7);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);

        // 计算父月：周1-4属于第1个月，周5-8属于第2个月
        const parentMonthNum = Math.ceil(weekNum / 4);
        const parentMonthKey = `第${parentMonthNum}个月`;
        const parentId = monthlyTaskIds.get(parentMonthKey);

        const taskId = `weekly-week-${weekNum}`;

        tasks.push({
          id: taskId,
          title: weekTask.title || `${week}`,
          description: weekTask.description || '',
          startDate,
          endDate,
          duration: 7,
          status: 'todo',
          importance: 3,
          urgency: 4,
          cost: 8,
          risk: 1,
          parentId, // 关联到父月任务
          dependencies: [],
          level: 'week',
        });
      });
    }
  });

  // 日度任务 - 支持两种格式
  // 格式1（旧）: {"第1天": [tasks]}
  // 格式2（Agent6）: {"第1个月-第1周": {"1月1日": [tasks]}}
  Object.keys(hierarchy.daily || {}).forEach((dayKey) => {
    const dayData = hierarchy.daily[dayKey];

    if (Array.isArray(dayData)) {
      // 旧格式：直接是任务数组
      let dayIndex = 0;
      dayData.forEach((dayTask: any) => {
        const startDate = new Date(dayTask.startDate || currentDate);
        const endDate = new Date(dayTask.endDate || startDate.getTime() + 1 * 24 * 60 * 60 * 1000);

        tasks.push({
          id: `daily-${taskCounter++}`,
          title: dayTask.title || `${dayKey}任务 ${dayIndex + 1}`,
          description: dayTask.description || '',
          startDate,
          endDate,
          duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          status: 'todo',
          importance: 3,
          urgency: 5,
          cost: 4,
          risk: 1,
          parentId: undefined,
          dependencies: [],
          level: 'day',
        });
        dayIndex++;
      });
    } else if (typeof dayData === 'object' && !Array.isArray(dayData)) {
      // Agent6 新格式：{"第1个月-第1周": {"1月1日": [tasks]}}
      // 解析周数和月数
      const weekMatch = dayKey.match(/第(\d+)个月-第(\d+)周/);
      if (weekMatch) {
        const weekNum = parseInt(weekMatch[2]);

        // 遍历该周的每一天
        Object.entries(dayData).forEach(([dateStr, dayTasks]: [string, any]) => {
          if (Array.isArray(dayTasks)) {
            dayTasks.forEach((dayTask: any, i: number) => {
              // 解析日期字符串 "1月1日" 或 "12月25日"
              const dateMatch = dateStr.match(/(\d+)月(\d+)日/);
              let startDate: Date;
              if (dateMatch) {
                const taskMonth = parseInt(dateMatch[1]);
                const taskDay = parseInt(dateMatch[2]);
                startDate = new Date(now.getFullYear(), taskMonth - 1, taskDay);
              } else {
                startDate = new Date(currentDate);
              }

              const endDate = new Date(dayTask.endDate || startDate.getTime() + 1 * 24 * 60 * 60 * 1000);

              // 计算父级周任务的ID
              const parentWeekId = `weekly-week-${weekNum}`;
              // 找到对应的周任务作为父级
              const parentTask = tasks.find(t => t.id === parentWeekId);

              tasks.push({
                id: `daily-${taskCounter++}`,
                title: dayTask.title || `${dateStr}任务 ${i + 1}`,
                description: dayTask.description || '',
                startDate,
                endDate,
                duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
                status: 'todo',
                importance: 3,
                urgency: 5,
                cost: 4,
                risk: 1,
                parentId: parentTask?.id,
                dependencies: [],
                level: 'day',
              });
            });
          }
        });
      }
    }
  });

  return {
    projectId: project.id,
    tasks,
    milestones: [],
    dailyPlans: [],
  };
}
