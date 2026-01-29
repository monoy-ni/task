import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { MonoAvatar } from '../components/mono';
import { Copy, Check } from 'lucide-react';

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

// 层级配置
const LEVEL_CONFIG = [
  { key: 'yearly', label: '年度', emoji: '📅' },
  { key: 'quarterly', label: '季度', emoji: '📆' },
  { key: 'monthly', label: '月度', emoji: '📇' },
  { key: 'weekly', label: '周度', emoji: '📋' },
  { key: 'daily', label: '日度', emoji: '📝' },
];

// 将任务层级转换为文本格式
function tasksToText(tasks: TaskHierarchy): string {
  const lines: string[] = [];

  // 添加标题
  lines.push('📋 任务拆解清单');
  lines.push('=' .repeat(40));
  lines.push('');

  // 遍历每个层级
  for (const config of LEVEL_CONFIG) {
    const data = tasks[config.key as keyof TaskHierarchy];

    if (!data) continue;

    // 处理数组格式（yearly）
    if (Array.isArray(data) && data.length > 0) {
      lines.push(`${config.emoji} ${config.label}任务 (${data.length}项)`);
      lines.push('-'.repeat(30));
      data.forEach((task, index) => {
        lines.push(`${index + 1}. ${task.title}`);
        if (task.description) {
          lines.push(`   ${task.description}`);
        }
      });
      lines.push('');
    }
    // 处理对象格式（quarterly, monthly, weekly）
    else if (typeof data === 'object' && !Array.isArray(data)) {
      const entries = Object.entries(data);

      // 检查是否是嵌套的日度格式
      const isNestedDaily = entries.length > 0 &&
        typeof entries[0][1] === 'object' &&
        !Array.isArray(entries[0][1]);

      if (isNestedDaily) {
        // 日度嵌套格式 {"第1个月-第1周": {"1月1日": [tasks]}}
        lines.push(`${config.emoji} ${config.label}任务`);
        lines.push('-'.repeat(30));

        entries.forEach(([weekKey, weekData]) => {
          lines.push(`\n【${weekKey}】`);
          const dateEntries = Object.entries(weekData as { [date: string]: Task[] });
          dateEntries.forEach(([date, dateTasks]) => {
            lines.push(`  ${date} (${dateTasks.length}项):`);
            dateTasks.forEach((task, index) => {
              lines.push(`    ${index + 1}. ${task.title}`);
              if (task.description) {
                lines.push(`       ${task.description}`);
              }
            });
          });
        });
        lines.push('');
      } else {
        // 普通对象格式 {"Q1": [tasks]}
        lines.push(`${config.emoji} ${config.label}任务 (${entries.length}组)`);
        lines.push('-'.repeat(30));

        entries.forEach(([key, taskList]) => {
          lines.push(`\n【${key}】 (${taskList.length}项)`);
          (taskList as Task[]).forEach((task, index) => {
            lines.push(`  ${index + 1}. ${task.title}`);
            if (task.description) {
              lines.push(`     ${task.description}`);
            }
          });
        });
        lines.push('');
      }
    }
  }

  // 添加结尾
  lines.push('=' .repeat(40));
  lines.push('🎯 以上为任务拆解结果，请按时完成！');

  return lines.join('\n');
}

export default function TaskBreakdown() {
  const location = useLocation();
  const navigate = useNavigate();

  // 将 formData 保存到组件 state 中
  const [formData] = useState<FormData | null>(() => location.state?.formData || null);

  const [tasks, setTasks] = useState<TaskHierarchy | null>(null);
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!formData) {
      navigate('/create');
      return;
    }

    // 调用后端 API 生成任务拆解
    const fetchTaskBreakdown = async () => {
      try {
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

        console.log('=== [DEBUG] API 返回结果 ===');
        console.log('success:', result.success);
        console.log('data:', result.data);
        console.log('tasks 结构:', JSON.stringify(result.data?.tasks, null, 2));

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

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // 复制到剪贴板
  const handleCopy = () => {
    if (tasks) {
      const text = tasksToText(tasks);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 完成创建：根据补充问题的答案重新生成任务
  const handleComplete = async () => {
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
          setTasks(result.data.tasks);
          setAnswers({});
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

    const existing = localStorage.getItem('projects');
    const projects = existing ? JSON.parse(existing) : [];
    projects.push(project);
    localStorage.setItem('projects', JSON.stringify(projects));

    navigate(`/plan/${project.id}`);
  };

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
            <MonoAvatar size="xl" mood="curious" withGlow />
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

  const tasksText = tasks ? tasksToText(tasks) : '';

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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-gray-900">任务清单</h2>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all text-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>

              {/* 文本框显示 */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-100">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                  {tasksText}
                </pre>
              </div>
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
