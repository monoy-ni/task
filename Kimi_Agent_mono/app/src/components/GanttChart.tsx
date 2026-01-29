import { useState, useRef, useEffect } from 'react';
import { Plan, Task, AISuggestion } from '../types';
import { AlertTriangle, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';

interface GanttChartProps {
  plan: Plan;
  onPlanUpdate: (plan: Plan) => void;
}

export default function GanttChart({ plan, onPlanUpdate }: GanttChartProps) {
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const chartRef = useRef<HTMLDivElement>(null);

  // 计算日期范围
  const allDates = plan.tasks.flatMap((t) => [t.startDate, t.endDate]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weeks = Math.ceil(daysDiff / 7);

  // 生成周标签
  const weekLabels = Array.from({ length: weeks }, (_, i) => {
    const weekStart = new Date(minDate);
    weekStart.setDate(minDate.getDate() + i * 7);
    return weekStart;
  });

  // 按层级组织任务
  const tasksByLevel = {
    month: plan.tasks.filter((t) => t.level === 'month'),
    week: plan.tasks.filter((t) => t.level === 'week'),
    day: plan.tasks.filter((t) => t.level === 'day'),
  };

  // 切换任务展开/折叠
  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // 拖拽开始
  const handleDragStart = (task: Task, type: 'move' | 'resize-start' | 'resize-end') => {
    setDraggingTask({ ...task, dragType: type } as any);
  };

  // 拖拽结束
  const handleDrop = (task: Task, newStartDate: Date, newEndDate: Date) => {
    const updatedTasks = plan.tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          startDate: newStartDate,
          endDate: newEndDate,
          duration: Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)),
        };
      }
      return t;
    });

    // 检查依赖冲突和影响
    const affectedTasks = findAffectedTasks(task, updatedTasks);
    if (affectedTasks.length > 0) {
      const suggestions = generateSuggestions(task, affectedTasks, updatedTasks);
      setSuggestions(suggestions);
    }

    // 自动顺延后继任务
    const finalTasks = propagateChanges(task, updatedTasks);

    const updatedPlan = { ...plan, tasks: finalTasks };
    onPlanUpdate(updatedPlan);
    setDraggingTask(null);
  };

  // 查找受影响的任务
  const findAffectedTasks = (changedTask: Task, allTasks: Task[]): Task[] => {
    const affected: Task[] = [];

    // 找所有依赖于该任务的任务
    allTasks.forEach((task) => {
      if (task.dependencies.includes(changedTask.id)) {
        affected.push(task);
        // 递归找间接依赖
        affected.push(...findAffectedTasks(task, allTasks));
      }
    });

    return Array.from(new Set(affected));
  };

  // 传播变更（顺延后继任务）
  const propagateChanges = (changedTask: Task, allTasks: Task[]): Task[] => {
    const result = [...allTasks];
    const changedTaskData = result.find((t) => t.id === changedTask.id);
    if (!changedTaskData) return result;

    // 找到所有依赖该任务的后继任务
    const dependents = result.filter((t) => t.dependencies.includes(changedTask.id));

    dependents.forEach((dependent) => {
      // 如果后继任务的开始时间早于前置任务的结束时间，需要顺延
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

          // 递归处理这个任务的后继
          propagateChanges(result[index], result);
        }
      }
    });

    // 更新父任务的日期范围
    if (changedTaskData.parentId) {
      updateParentDates(changedTaskData.parentId, result);
    }

    return result;
  };

  // 更新父任务日期
  const updateParentDates = (parentId: string, allTasks: Task[]) => {
    const children = allTasks.filter((t) => t.parentId === parentId);
    if (children.length === 0) return;

    const parent = allTasks.find((t) => t.id === parentId);
    if (!parent) return;

    const minStart = new Date(Math.min(...children.map((c) => c.startDate.getTime())));
    const maxEnd = new Date(Math.max(...children.map((c) => c.endDate.getTime())));

    const index = allTasks.findIndex((t) => t.id === parentId);
    if (index !== -1) {
      allTasks[index].startDate = minStart;
      allTasks[index].endDate = maxEnd;
      allTasks[index].duration = Math.ceil((maxEnd.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24));
    }
  };

  // 生成AI建议
  const generateSuggestions = (
    changedTask: Task,
    affectedTasks: Task[],
    allTasks: Task[]
  ): AISuggestion[] => {
    const suggestions: AISuggestion[] = [];

    // 如果任务时长变长，建议拆分
    if (changedTask.duration > 8) {
      suggestions.push({
        type: 'split',
        targetTaskIds: [changedTask.id],
        reason: '任务时长超过8天，建议拆分成更小的子任务以便更好地跟踪进度',
        preview: {
          before: [changedTask],
          after: [
            {
              ...changedTask,
              id: `${changedTask.id}-1`,
              title: `${changedTask.title} (第1部分)`,
              duration: Math.ceil(changedTask.duration / 2),
              endDate: new Date(changedTask.startDate.getTime() + (Math.ceil(changedTask.duration / 2) * 24 * 60 * 60 * 1000)),
            } as Task,
            {
              ...changedTask,
              id: `${changedTask.id}-2`,
              title: `${changedTask.title} (第2部分)`,
              duration: Math.floor(changedTask.duration / 2),
              startDate: new Date(changedTask.startDate.getTime() + (Math.ceil(changedTask.duration / 2) * 24 * 60 * 60 * 1000)),
              dependencies: [`${changedTask.id}-1`],
            } as Task,
          ],
        },
        impact: `将拆分为2个子任务，总工期保持不变`,
      });
    }

    // 如果影响了多个任务，建议重组
    if (affectedTasks.length > 2) {
      suggestions.push({
        type: 'reorganize',
        targetTaskIds: affectedTasks.map((t) => t.id),
        reason: `此变更影响了${affectedTasks.length}个后继任务，建议重新调整任务顺序或并行执行`,
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
      // 移除原任务，添加拆分后的任务
      updatedTasks = updatedTasks.filter(
        (t) => !suggestion.targetTaskIds.includes(t.id)
      );
      updatedTasks.push(...suggestion.preview.after);
    }

    const updatedPlan = { ...plan, tasks: updatedTasks };
    onPlanUpdate(updatedPlan);
    setSuggestions([]);
  };

  return (
    <div className="space-y-6">
      {/* AI建议 */}
      {suggestions.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-2">AI 优化建议</h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm mb-1">
                          {suggestion.type === 'split' && '🔀 建议拆分'}
                          {suggestion.type === 'merge' && '🔗 建议合并'}
                          {suggestion.type === 'reorganize' && '♻️ 建议重组'}
                          {suggestion.type === 'postpone' && '⏭️ 建议延期'}
                          {suggestion.type === 'downgrade' && '⬇️ 建议降级'}
                        </div>
                        <p className="text-sm text-gray-700">{suggestion.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          影响: {suggestion.impact}
                        </p>
                      </div>
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        className="ml-4 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        应用
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 甘特图 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto" ref={chartRef}>
          <div className="min-w-[1000px]">
            {/* 时间轴标题 */}
            <div className="flex border-b border-gray-200">
              <div className="w-64 px-4 py-3 font-semibold bg-gray-50 border-r border-gray-200">
                任务名称
              </div>
              <div className="flex-1 flex">
                {weekLabels.map((date, i) => (
                  <div
                    key={i}
                    className="flex-1 px-2 py-3 text-sm text-center bg-gray-50 border-r border-gray-200"
                  >
                    <div className="font-medium">第{i + 1}周</div>
                    <div className="text-xs text-gray-500">
                      {date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 任务行 */}
            <div>
              {['month', 'week', 'day'].map((level) => {
                const levelTasks = tasksByLevel[level as keyof typeof tasksByLevel];
                if (levelTasks.length === 0) return null;

                return (
                  <div key={level}>
                    <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
                      {level === 'month' && '月度目标'}
                      {level === 'week' && '周度里程碑'}
                      {level === 'day' && '每日任务'}
                    </div>
                    {levelTasks.map((task) => (
                      <GanttRow
                        key={task.id}
                        task={task}
                        minDate={minDate}
                        daysDiff={daysDiff}
                        onDrop={handleDrop}
                        isExpanded={expandedTasks.has(task.id)}
                        onToggleExpand={toggleExpand}
                        childTasks={plan.tasks.filter((t) => t.parentId === task.id)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span>进行中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>已完成</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <span>未开始</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span>阻塞/延期</span>
        </div>
      </div>
    </div>
  );
}

// 甘特图行组件
interface GanttRowProps {
  task: Task;
  minDate: Date;
  daysDiff: number;
  onDrop: (task: Task, newStartDate: Date, newEndDate: Date) => void;
  isExpanded: boolean;
  onToggleExpand: (taskId: string) => void;
  childTasks: Task[];
}

function GanttRow({
  task,
  minDate,
  daysDiff,
  onDrop,
  isExpanded,
  onToggleExpand,
  childTasks,
}: GanttRowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [tempPosition, setTempPosition] = useState<{ start: number; width: number } | null>(null);

  const taskStartDay = Math.floor(
    (task.startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const taskDuration = Math.ceil(
    (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const leftPercent = (taskStartDay / daysDiff) * 100;
  const widthPercent = (taskDuration / daysDiff) * 100;

  const colorMap = {
    'todo': 'bg-gray-300',
    'in-progress': 'bg-blue-500',
    'blocked': 'bg-red-500',
    'completed': 'bg-green-500',
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setTempPosition({ start: leftPercent, width: widthPercent });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tempPosition) return;

    const deltaX = e.clientX - dragStartX;
    const deltaPercent = (deltaX / (e.currentTarget.parentElement?.clientWidth || 1)) * 100;

    setTempPosition({
      start: Math.max(0, Math.min(100 - tempPosition.width, tempPosition.start + deltaPercent)),
      width: tempPosition.width,
    });
  };

  const handleMouseUp = () => {
    if (isDragging && tempPosition) {
      const newStartDay = Math.round((tempPosition.start / 100) * daysDiff);
      const newStartDate = new Date(minDate);
      newStartDate.setDate(minDate.getDate() + newStartDay);

      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newStartDate.getDate() + taskDuration);

      onDrop(task, newStartDate, newEndDate);
    }
    setIsDragging(false);
    setTempPosition(null);
  };

  const hasChildren = childTasks.length > 0;

  return (
    <>
      <div
        className="flex border-b border-gray-200 hover:bg-gray-50 transition-colors"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="w-64 px-4 py-3 border-r border-gray-200 flex items-center gap-2">
          {hasChildren && (
            <button
              onClick={() => onToggleExpand(task.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>
          )}
          <span className="text-sm truncate" title={task.title}>
            {task.title}
          </span>
        </div>
        <div className="flex-1 relative py-3 px-2">
          <div
            className={`absolute h-6 rounded cursor-move transition-all ${
              colorMap[task.status]
            } ${isDragging ? 'opacity-50' : ''}`}
            style={{
              left: `${tempPosition?.start ?? leftPercent}%`,
              width: `${tempPosition?.width ?? widthPercent}%`,
            }}
            onMouseDown={handleMouseDown}
            title={`${task.title}\n${task.startDate.toLocaleDateString('zh-CN')} - ${task.endDate.toLocaleDateString('zh-CN')}`}
          >
            <div className="px-2 text-xs text-white truncate leading-6">
              {task.title}
            </div>
          </div>

          {/* 依赖关系线条 (简化显示) */}
          {task.dependencies.length > 0 && (
            <div className="absolute top-0 left-0 text-xs text-red-500">
              <AlertTriangle className="size-3" />
            </div>
          )}
        </div>
      </div>

      {/* 子任务 */}
      {isExpanded && childTasks.map((child) => (
        <GanttRow
          key={child.id}
          task={child}
          minDate={minDate}
          daysDiff={daysDiff}
          onDrop={onDrop}
          isExpanded={false}
          onToggleExpand={onToggleExpand}
          childTasks={[]}
        />
      ))}
    </>
  );
}
