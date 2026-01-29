import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { MonoAvatar } from '../components/Mono';
import { ChevronDown, ChevronRight } from 'lucide-react';

// API 配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface FormData {
  goal: string;
  hasDeadline: string;
  deadline: string;
  experience: string;
  importance: number;
  dailyHours: string;
  workingDays: string[];
  blockers: string;
  resources: string;
  expectations: string[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
}

interface TaskHierarchy {
  yearly?: Task[] | null;
  quarterly?: { [key: string]: Task[] } | null;
  monthly?: { [key: string]: Task[] } | null;
  weekly?: { [key: string]: Task[] } | null;
  // daily 支持两种格式：新格式 {"第1个月-第1周": {"1月1日": [tasks]}} 或 旧格式 {"1月1日": [tasks]}
  daily?: ({ [key: string]: Task[] } | { [weekKey: string]: { [date: string]: Task[] } }) | null;
}

interface FollowUpQuestion {
  id: string;
  question: string;
  type: 'text' | 'single' | 'multiple';
  options?: string[];
}

interface TaskAnalysis {
  task_type?: string;
  experience_level?: string;
  time_span?: string;
}

export default function TaskBreakdown() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔥 关键修复：将 formData 保存到组件 state 中，避免从 location.state 反复读取
  const [formData] = useState<FormData | null>(() => location.state?.formData || null);

  const [tasks, setTasks] = useState<TaskHierarchy | null>(null);
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!formData) {
      navigate('/create');
      return;
    }

    // 调用后端 API 生成任务拆解
    const fetchTaskBreakdown = async () => {
      try {
        // 转换字段名为蛇形命名（后端格式）
        const snakeCaseData = {
          goal: formData.goal,
          has_deadline: formData.hasDeadline,
          deadline: formData.deadline,
          experience: formData.experience,
          importance: formData.importance,
          daily_hours: formData.dailyHours,
          working_days: formData.workingDays,
          blockers: formData.blockers,
          resources: formData.resources,
          expectations: formData.expectations,
        };

        const response = await fetch(`${API_BASE_URL}/api/breakdown`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form_data: snakeCaseData }),
        });

        if (!response.ok) {
          throw new Error(`API 请求失败: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setTasks(result.data.tasks);
          setAnalysis(result.data.analysis);
          setFollowUpQuestions(result.data.follow_up_questions);
          setProjectId(result.data.project_id);
        } else {
          throw new Error(result.error || '生成任务失败');
        }
      } catch (err) {
        console.error('生成任务时出错:', err);
        setError(err instanceof Error ? err.message : '生成任务失败');
      } finally {
        setIsGenerating(false);
      }
    };

    fetchTaskBreakdown();
  }, [formData, navigate]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // 完成创建：根据补充问题的答案重新生成任务
  const handleComplete = async () => {
    // 如果有补充问题的答案，调用后端API重新生成任务
    const hasAnswers = Object.keys(answers).some(key => {
      const val = answers[key];
      return val && (Array.isArray(val) ? val.length > 0 : true);
    });

    if (hasAnswers && projectId) {
      setIsGenerating(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/regenerate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        });

        if (!response.ok) {
          throw new Error(`API 请求失败: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          // 更新任务列表
          setTasks(result.data.tasks);
          // 清空答案，避免重复提交
          setAnswers({});
          // 可以在这里添加一个提示："任务已根据你的答案更新"
        } else {
          throw new Error(result.error || '重新生成任务失败');
        }
      } catch (err) {
        console.error('重新生成任务时出错:', err);
        setError(err instanceof Error ? err.message : '重新生成任务失败');
      } finally {
        setIsGenerating(false);
      }
    } else {
      // 没有答案，直接保存并跳转
      handleSaveAndNavigate();
    }
  };

  // 保存项目并跳转到甘特图页面
  const handleSaveAndNavigate = () => {
    const project = {
      id: projectId || Date.now().toString(),
      title: formData!.goal.substring(0, 50),
      description: formData!.goal,
      formData,
      tasks,
      followUpAnswers: answers,
      createdAt: new Date(),
      deadline: formData!.deadline ? new Date(formData!.deadline) : undefined,
      dailyAvailableHours: parseFloat(formData!.dailyHours),
    };

    // 保存到localStorage
    const existing = localStorage.getItem('projects');
    const projects = existing ? JSON.parse(existing) : [];
    projects.push(project);
    localStorage.setItem('projects', JSON.stringify(projects));

    navigate(`/plan/${project.id}`);
  };

  // 跳过问题：直接保存并跳转
  const handleSkip = () => {
    handleSaveAndNavigate();
  };

  if (!formData || isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E4FBF7]/30 via-white to-[#C9F7EF]/30">
        <div className="text-center flex flex-col items-center">
          <div className="mb-6">
            <MonoAvatar size="xl" mood="thinking" withGlow />
          </div>
          <p className="text-xl font-light text-gray-600">mono正在为你拆解任务...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E4FBF7]/30 via-white to-[#C9F7EF]/30">
        <div className="text-center flex flex-col items-center max-w-md">
          <div className="mb-6">
            <MonoAvatar size="xl" mood="neutral" withGlow />
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-4">出错了</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/create')}
            className="px-6 py-3 bg-[#7DE3D4] text-white rounded-2xl hover:bg-[#5BD4C3] transition-all"
          >
            返回重新创建
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4FBF7]/30 via-white to-[#C9F7EF]/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 头部 */}
        <div className="text-center mb-12 flex flex-col items-center">
          <MonoAvatar size="lg" mood="happy" withGlow className="mb-6" />
          <h1 className="text-4xl font-light text-gray-900 mb-4">任务拆解完成！</h1>
          <p className="text-gray-600 font-light">mono已经帮你把目标拆解成了具体的执行计划</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* 左侧：任务清单区 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl shadow-[#A8F2E7]/10 p-8">
              <h2 className="text-2xl font-light text-gray-900 mb-6">任务清单</h2>

              {tasks && <NestedTaskView tasks={tasks} expandedSections={expandedSections} toggleSection={toggleSection} />}
            </div>
          </div>

          {/* 右侧：补充问题区 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl shadow-[#A8F2E7]/10 p-8 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <MonoAvatar size="sm" mood="curious" />
                <h2 className="text-xl font-light text-gray-900">补充问题</h2>
              </div>

              <p className="text-sm text-gray-600 mb-6 font-light">
                回答这些问题可以让计划更精准，也可以直接跳过
              </p>

              {followUpQuestions.length > 0 ? (
                <div className="space-y-6 mb-8">
                  {followUpQuestions.map((q, index) => (
                    <div key={q.id}>
                      <label className="block text-sm font-light text-gray-900 mb-2">
                        {index + 1}. {q.question}
                      </label>
                      
                      {q.type === 'text' && (
                        <textarea
                          value={answers[q.id] || ''}
                          onChange={(e) => updateAnswer(q.id, e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-[#7DE3D4] focus:outline-none transition-colors resize-none text-sm"
                        />
                      )}

                      {q.type === 'single' && q.options && (
                        <div className="space-y-2">
                          {q.options.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => updateAnswer(q.id, option)}
                              className={`w-full text-left py-2 px-3 rounded-xl border-2 transition-all text-sm ${
                                answers[q.id] === option
                                  ? 'bg-[#7DE3D4] border-[#7DE3D4] text-white'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-[#7DE3D4]/50'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'multiple' && q.options && (
                        <div className="space-y-2">
                          {q.options.map((option) => {
                            const selected = (answers[q.id] || []) as string[];
                            const isSelected = selected.includes(option);
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  const newValue = isSelected
                                    ? selected.filter((v) => v !== option)
                                    : [...selected, option];
                                  updateAnswer(q.id, newValue);
                                }}
                                className={`w-full text-left py-2 px-3 rounded-xl border-2 transition-all text-sm ${
                                  isSelected
                                    ? 'bg-[#7DE3D4] border-[#7DE3D4] text-white'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#7DE3D4]/50'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-8 italic">暂无补充问题</p>
              )}

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={handleComplete}
                  className="w-full py-3 bg-[#7DE3D4] text-white rounded-2xl hover:bg-[#5BD4C3] transition-all shadow-lg shadow-[#A8F2E7]/30"
                >
                  完成创建
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl hover:border-[#7DE3D4]/50 transition-all"
                >
                  跳过问题
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 嵌套任务视图组件 - 年度>季度>月度>周度>日度
interface NestedTaskViewProps {
  tasks: TaskHierarchy;
  expandedSections: { [key: string]: boolean };
  toggleSection: (key: string) => void;
}

// 层级配置
const LEVEL_CONFIG = [
  { key: 'yearly', label: '年度', color: 'from-[#7DE3D4] to-[#5BD4C3]', textColor: 'text-white' },
  { key: 'quarterly', label: '季度', color: 'from-[#A8F2E7] to-[#7DE3D4]', textColor: 'text-white', childKey: 'yearly' },
  { key: 'monthly', label: '月度', color: 'from-[#C9F7EF] to-[#A8F2E7]', textColor: 'text-white', childKey: 'quarterly' },
  { key: 'weekly', label: '周度', color: 'from-[#E4FBF7] to-[#C9F7EF]', textColor: 'text-teal-900', childKey: 'monthly' },
  { key: 'daily', label: '日度', color: 'from-[#F0FDFB] to-[#E4FBF7]', textColor: 'text-teal-900', childKey: 'weekly' },
];

// 渲染单个任务项
function TaskItem({ task }: { task: Task }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg mb-2 last:mb-0">
      <h4 className="font-light text-gray-900 mb-1">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-600 font-light">{task.description}</p>
      )}
    </div>
  );
}

// 渲染嵌套的任务区块
function NestedTaskBlock({
  level,
  tasks,
  expandedSections,
  toggleSection,
  parentKey = '',
}: {
  level: number;
  tasks: Task[] | { [key: string]: Task[] } | { [weekKey: string]: { [date: string]: Task[] } };
  expandedSections: { [key: string]: boolean };
  toggleSection: (key: string) => void;
  parentKey?: string;
}) {
  const config = LEVEL_CONFIG[level];
  const isTasksArray = Array.isArray(tasks);

  // 如果是数组（直接任务列表）
  if (isTasksArray) {
    const taskArray = tasks as Task[];
    if (taskArray.length === 0) return null;

    const sectionKey = parentKey ? `${parentKey}-${config.key}` : config.key;
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="mb-2">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r ${config.color} text-white transition-all hover:opacity-90`}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-light text-sm">{config.label}</span>
            <span className="text-xs opacity-80">({taskArray.length})</span>
          </div>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-2 space-y-2">
            {taskArray.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 如果是对象（包含多个子区块）
  const taskGroups = tasks as { [key: string]: Task[] } | { [weekKey: string]: { [date: string]: Task[] } };
  const keys = Object.keys(taskGroups);
  if (keys.length === 0) return null;

  // 检查是否是日度层级的嵌套格式 {"第1个月-第1周": {"1月1日": [tasks]}}
  const isNestedDailyFormat = keys.length > 0 && typeof taskGroups[keys[0]] === 'object' && !Array.isArray(taskGroups[keys[0]]);

  // 日度层级使用嵌套格式时，需要特殊处理：展开所有周的日期
  if (config.key === 'daily' && isNestedDailyFormat) {
    const sectionKey = parentKey ? `${parentKey}-${config.key}` : config.key;
    const isExpanded = expandedSections[sectionKey];

    // 收集所有日期的任务
    const allDateTasks: { [date: string]: Task[] } = {};
    let totalCount = 0;
    keys.forEach(weekKey => {
      const weekData = taskGroups[weekKey] as { [date: string]: Task[] };
      Object.entries(weekData).forEach(([date, tasks]) => {
        allDateTasks[date] = tasks;
        totalCount += tasks.length;
      });
    });

    return (
      <div className="mb-2">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r ${config.color} ${config.textColor} transition-all hover:opacity-90`}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-light text-sm">{config.label}</span>
            <span className="text-xs opacity-80">({totalCount})</span>
          </div>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-2 space-y-2">
            {Object.entries(allDateTasks).map(([date, tasks]) => {
              const dateKey = `${sectionKey}-${date}`;
              const dateExpanded = expandedSections[dateKey];
              return (
                <div key={date} className="mb-2">
                  <button
                    type="button"
                    onClick={() => toggleSection(dateKey)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-teal-100 to-teal-200 text-teal-900 transition-all hover:opacity-90`}
                  >
                    <div className="flex items-center gap-2">
                      {dateExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span className="font-light text-xs">{date}</span>
                      <span className="text-xs opacity-70">({tasks.length})</span>
                    </div>
                  </button>
                  {dateExpanded && (
                    <div className="ml-4 mt-2 space-y-2">
                      {tasks.map((task) => (
                        <TaskItem key={task.id} task={task} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 常规处理：遍历每个key（用于weekly等层级）
  return (
    <div className="ml-2">
      {keys.map((key) => {
        const childTasks = taskGroups[key];
        const sectionKey = parentKey ? `${parentKey}-${config.key}-${key}` : `${config.key}-${key}`;
        const isExpanded = expandedSections[sectionKey];

        // 计算任务数量
        let taskCount = 0;
        if (Array.isArray(childTasks)) {
          taskCount = childTasks.length;
        } else if (typeof childTasks === 'object') {
          taskCount = Object.values(childTasks).reduce((sum, tasks) => sum + (tasks as Task[]).length, 0);
        }

        return (
          <div key={key} className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection(sectionKey)}
              className={`w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r ${config.color} ${config.textColor} transition-all hover:opacity-90`}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-light text-sm">{key}</span>
                <span className="text-xs opacity-80">({taskCount})</span>
              </div>
            </button>
            {isExpanded && (
              <div className="ml-3 mt-2 border-l-2 border-gray-200 pl-3">
                {Array.isArray(childTasks) ? (
                  // childTasks 是任务数组，递归渲染下一层级
                  level + 1 < LEVEL_CONFIG.length ? (
                    <NestedTaskBlock
                      level={level + 1}
                      tasks={childTasks}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                      parentKey={sectionKey}
                    />
                  ) : (
                    <div className="mt-2 space-y-2">
                      {(childTasks as Task[]).map((task: Task) => (
                        <TaskItem key={task.id} task={task} />
                      ))}
                  </div>
                )
                ) : (
                  // childTasks 是嵌套对象（日度层的周数据），递归渲染
                  level + 1 < LEVEL_CONFIG.length ? (
                    <NestedTaskBlock
                      level={level + 1}
                      tasks={childTasks}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                      parentKey={sectionKey}
                    />
                  ) : (
                    <div className="mt-2 space-y-2">
                      {Object.entries(childTasks as { [date: string]: Task[] }).map(([date, tasks]) => (
                        <div key={date} className="mb-2">
                          <button
                            type="button"
                            onClick={() => toggleSection(`${sectionKey}-${date}`)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-teal-100 to-teal-200 text-teal-900 transition-all hover:opacity-90`}
                          >
                            <div className="flex items-center gap-2">
                              {expandedSections[`${sectionKey}-${date}`] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              <span className="font-light text-xs">{date}</span>
                              <span className="text-xs opacity-70">({tasks.length})</span>
                            </div>
                          </button>
                          {expandedSections[`${sectionKey}-${date}`] && (
                            <div className="ml-4 mt-2 space-y-2">
                              {tasks.map((task) => (
                                <TaskItem key={task.id} task={task} />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// 主嵌套视图组件
function NestedTaskView({ tasks, expandedSections, toggleSection }: NestedTaskViewProps) {
  // 找到第一个有数据的层级
  const firstNonEmptyLevel = LEVEL_CONFIG.findIndex(config => {
    const data = tasks[config.key as keyof TaskHierarchy];
    if (Array.isArray(data)) return (data as Task[]).length > 0;
    if (data && typeof data === 'object') return Object.keys(data).length > 0;
    return false;
  });

  if (firstNonEmptyLevel === -1) {
    return <p className="text-gray-500 text-center py-8">暂无任务数据</p>;
  }

  return (
    <NestedTaskBlock
      level={firstNonEmptyLevel}
      tasks={tasks[LEVEL_CONFIG[firstNonEmptyLevel].key as keyof TaskHierarchy]!}
      expandedSections={expandedSections}
      toggleSection={toggleSection}
    />
  );
}