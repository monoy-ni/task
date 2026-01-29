import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Project, Plan, Task, Review as ReviewType, DailyPlan } from '../types';
import { getTaskQuadrant } from '../utils/planGenerator';
import { ReflectionGenie } from '../components/ReflectionGenie';

export default function Review() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState<'review' | 'analyzing' | 'complete'>('review');
  const [showGenie, setShowGenie] = useState(false);

  // 复盘表单
  const [incompleteTasks, setIncompleteTasks] = useState<
    { taskId: string; reason: string }[]
  >([]);
  const [tomorrowHours, setTomorrowHours] = useState(1);
  const [tomorrowPriority, setTomorrowPriority] = useState('');
  const [notes, setNotes] = useState('');

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
      setTomorrowHours(projectWithDates.dailyAvailableHours);
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

      // 自动识别未完成任务
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayPlan = planWithDates.dailyPlans.find((dp: any) => {
        const planDate = new Date(dp.date);
        planDate.setHours(0, 0, 0, 0);
        return planDate.getTime() === today.getTime();
      });

      if (todayPlan) {
        const allTodayTaskIds = [
          todayPlan.top1,
          todayPlan.top2,
          todayPlan.top3,
          ...todayPlan.backlog,
        ].filter((id): id is string => !!id);

        const incomplete = allTodayTaskIds
          .map((id) => planWithDates.tasks.find((t: Task) => t.id === id))
          .filter((t): t is Task => t !== null && t.status !== 'completed')
          .map((t) => ({ taskId: t.id, reason: t.blockedReason || '' }));

        setIncompleteTasks(incomplete);
      }
    }
  }, [projectId]);

  if (!project || !plan) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayPlan = plan.dailyPlans.find((dp) => {
    const planDate = new Date(dp.date);
    planDate.setHours(0, 0, 0, 0);
    return planDate.getTime() === today.getTime();
  });

  if (!todayPlan) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">今日暂无任务安排</p>
      </div>
    );
  }

  const allTodayTaskIds = [
    todayPlan.top1,
    todayPlan.top2,
    todayPlan.top3,
    ...todayPlan.backlog,
  ].filter((id): id is string => !!id);

  const allTodayTasks = allTodayTaskIds
    .map((id) => plan.tasks.find((t) => t.id === id))
    .filter((t): t is Task => t !== null);

  const completedTasks = allTodayTasks.filter((t) => t.status === 'completed');
  const incompleteTasksData = allTodayTasks.filter((t) => t.status !== 'completed');

  // 提交复盘
  const handleSubmitReview = () => {
    setStep('analyzing');

    // 创建复盘记录
    const review: ReviewType = {
      date: today,
      completedTasks: completedTasks.map((t) => t.id),
      incompleteTasks,
      tomorrowAvailableHours: tomorrowHours,
      tomorrowPriority,
      notes,
    };

    // 保存复盘记录
    const reviews = JSON.parse(localStorage.getItem(`reviews-${projectId}`) || '[]');
    reviews.push(review);
    localStorage.setItem(`reviews-${projectId}`, JSON.stringify(reviews));

    // 自动重排明日任务
    setTimeout(() => {
      const updatedPlan = reorganizeTasks(plan, review);
      setPlan(updatedPlan);
      localStorage.setItem(`plan-${projectId}`, JSON.stringify(updatedPlan));
      setStep('complete');
    }, 2000);
  };

  // 重组任务逻辑
  const reorganizeTasks = (currentPlan: Plan, review: ReviewType): Plan => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // 找到明日计划
    let tomorrowPlan = currentPlan.dailyPlans.find((dp) => {
      const planDate = new Date(dp.date);
      planDate.setHours(0, 0, 0, 0);
      return planDate.getTime() === tomorrow.getTime();
    });

    // 如果没有明日计划，创建一个
    if (!tomorrowPlan) {
      tomorrowPlan = {
        date: tomorrow,
        availableHours: review.tomorrowAvailableHours,
        backlog: [],
        completedTasks: [],
      };
      currentPlan.dailyPlans.push(tomorrowPlan);
    } else {
      tomorrowPlan.availableHours = review.tomorrowAvailableHours;
    }

    // 获取未完成任务
    const incompleteTasks = review.incompleteTasks.map((it) =>
      currentPlan.tasks.find((t) => t.id === it.taskId)
    ).filter((t): t is Task => t !== null);

    // 获取明日原有任务
    const originalTomorrowTaskIds = [
      tomorrowPlan.top1,
      tomorrowPlan.top2,
      tomorrowPlan.top3,
      ...tomorrowPlan.backlog,
    ].filter((id): id is string => !!id);

    const originalTomorrowTasks = originalTomorrowTaskIds
      .map((id) => currentPlan.tasks.find((t) => t.id === id))
      .filter((t): t is Task => t !== null);

    // 合并未完成任务和原有任务
    const allTomorrowTasks = [...incompleteTasks, ...originalTomorrowTasks];

    // 按四象限和优先级重新排序
    const sortedTasks = allTomorrowTasks.sort((a, b) => {
      const quadrantA = getTaskQuadrant(a);
      const quadrantB = getTaskQuadrant(b);

      // 四象限优先级：IU > IN > NU > NN
      const quadrantPriority = { IU: 4, IN: 3, NU: 2, NN: 1 };
      const priorityDiff = quadrantPriority[quadrantB] - quadrantPriority[quadrantA];

      if (priorityDiff !== 0) return priorityDiff;

      // 相同象限内，按重要性+紧急性排序
      return b.importance + b.urgency - (a.importance + a.urgency);
    });

    // 装箱：确保不超过明日可用时长
    let accumulatedHours = 0;
    const fittingTasks: Task[] = [];
    const overflowTasks: Task[] = [];

    sortedTasks.forEach((task) => {
      if (accumulatedHours + task.duration <= review.tomorrowAvailableHours) {
        fittingTasks.push(task);
        accumulatedHours += task.duration;
      } else {
        overflowTasks.push(task);
      }
    });

    // 分配Top1/2/3
    tomorrowPlan.top1 = fittingTasks[0]?.id;
    tomorrowPlan.top2 = fittingTasks[1]?.id;
    tomorrowPlan.top3 = fittingTasks[2]?.id;
    tomorrowPlan.backlog = fittingTasks.slice(3).map((t) => t.id);

    // 溢出任务延后
    overflowTasks.forEach((task) => {
      const taskIndex = currentPlan.tasks.findIndex((t) => t.id === task.id);
      if (taskIndex !== -1) {
        const newStartDate = new Date(tomorrow);
        newStartDate.setDate(newStartDate.getDate() + 1);
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + task.duration);

        currentPlan.tasks[taskIndex] = {
          ...currentPlan.tasks[taskIndex],
          startDate: newStartDate,
          endDate: newEndDate,
        };
      }
    });

    // 检查连续未完成任务，触发拆分建议
    const consecutiveIncomplete = incompleteTasks.filter((task) => {
      // 简化：如果任务连续2天未完成，标记为需要拆分
      const pastReviews = JSON.parse(
        localStorage.getItem(`reviews-${projectId}`) || '[]'
      );
      const taskIncompleteCount = pastReviews.filter((r: ReviewType) =>
        r.incompleteTasks.some((it) => it.taskId === task.id)
      ).length;
      return taskIncompleteCount >= 2;
    });

    if (consecutiveIncomplete.length > 0) {
      // 这里可以生成拆分建议，暂时只更新任务风险值
      consecutiveIncomplete.forEach((task) => {
        const taskIndex = currentPlan.tasks.findIndex((t) => t.id === task.id);
        if (taskIndex !== -1) {
          currentPlan.tasks[taskIndex].risk = Math.min(5, task.risk + 1);
        }
      });
    }

    return currentPlan;
  };

  if (step === 'analyzing') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="size-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <div className="size-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-semibold mb-4">正在分析和重组任务...</h2>
        <p className="text-gray-600">
          系统正在根据你的复盘结果，自动生成明日计划并重排未完成任务
        </p>
      </div>
    );
  }

  if (step === 'complete') {
    const completionRate = allTodayTasks.length > 0
      ? Math.round((completedTasks.length / allTodayTasks.length) * 100)
      : 0;

    const incompleteTasksWithTitles = incompleteTasks.map((it) => {
      const task = allTodayTasks.find((t) => t.id === it.taskId);
      return {
        ...it,
        title: task?.title || '未知任务',
      };
    });

    return (
      <>
        <div className="max-w-2xl mx-auto py-16">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="size-8 border-4 border-green-600 rounded-full border-t-transparent rotate-45"></div>
            </div>
            <h2 className="text-2xl font-semibold mb-4">复盘完成！</h2>
            <p className="text-gray-600 mb-8">
              明日计划已生成，未完成任务已重新排期
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {completedTasks.length}
                </div>
                <div className="text-sm text-green-700">今日完成任务</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {incompleteTasks.length}
                </div>
                <div className="text-sm text-blue-700">未完成任务（已重排）</div>
              </div>
            </div>

            {/* 反思精灵按钮 */}
            <div className="mb-8">
              <button
                onClick={() => setShowGenie(true)}
                className="w-full bg-gradient-to-r from-amber-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium hover:from-amber-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                与 mono 对话，优化明日计划
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                通过几个简单的问题，获得个性化的效率优化建议
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                to={`/daily/${projectId}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                查看明日计划
              </Link>
              <Link
                to={`/plan/${projectId}`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                返回计划视图
              </Link>
            </div>
          </div>
        </div>

        {/* 反思精灵对话框 */}
        {showGenie && (
          <ReflectionGenie
            onClose={() => setShowGenie(false)}
            completedCount={completedTasks.length}
            incompleteCount={incompleteTasks.length}
            completionRate={completionRate}
            incompleteTasks={incompleteTasksWithTitles}
          />
        )}
      </>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">日终复盘</h1>
        <p className="text-gray-600">
          {today.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </p>
      </div>

      {/* 今日总结 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">今日总结</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-3">
              <h3 className="font-semibold">已完成任务 ({completedTasks.length})</h3>
            </div>
            {completedTasks.length > 0 ? (
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-green-50 border border-green-200 rounded p-3"
                  >
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{task.duration}h</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">今日暂无完成的任务</p>
            )}
          </div>

          <div>
            <div className="mb-3">
              <h3 className="font-semibold">未完成任务 ({incompleteTasksData.length})</h3>
            </div>
            {incompleteTasksData.length > 0 ? (
              <div className="space-y-2">
                {incompleteTasksData.map((task) => (
                  <div
                    key={task.id}
                    className="bg-amber-50 border border-amber-200 rounded p-3"
                  >
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{task.duration}h</div>
                    {task.blockedReason && (
                      <div className="text-xs text-red-600 mt-1">
                        阻塞: {task.blockedReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">所有任务已完成</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">完成率</span>
            <span className="text-2xl font-semibold text-blue-600">
              {allTodayTasks.length > 0
                ? Math.round((completedTasks.length / allTodayTasks.length) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{
                width: `${
                  allTodayTasks.length > 0
                    ? (completedTasks.length / allTodayTasks.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 复盘问题 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">复盘问题</h2>

        <div className="space-y-6">
          {/* 未完成原因 */}
          {incompleteTasksData.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                未完成任务的原因（可选）
              </label>
              <div className="space-y-3">
                {incompleteTasksData.map((task) => {
                  const existing = incompleteTasks.find((it) => it.taskId === task.id);
                  return (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="font-medium text-sm mb-2">{task.title}</div>
                      <textarea
                        value={existing?.reason || ''}
                        onChange={(e) => {
                          const updated = incompleteTasks.filter(
                            (it) => it.taskId !== task.id
                          );
                          updated.push({ taskId: task.id, reason: e.target.value });
                          setIncompleteTasks(updated);
                        }}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        rows={2}
                        placeholder="例如：时间预估不准、遇到技术难题、被其他事情打断..."
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 明日可用时长 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              明日可用时长（小时）*
            </label>
            <input
              type="number"
              value={tomorrowHours}
              onChange={(e) => setTomorrowHours(parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              step="0.5"
              min="0"
              required
            />
          </div>

          {/* 明日最重要事项 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              明日最重要的事项是什么？（可选）
            </label>
            <input
              type="text"
              value={tomorrowPriority}
              onChange={(e) => setTomorrowPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="例如：完成核心功能开发、准备演示材料..."
            />
          </div>

          {/* 其他备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              其他备注（可选）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              rows={3}
              placeholder="今天有什么收获或需要注意的地方..."
            />
          </div>
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex-1">
          <p className="text-sm text-blue-900 mb-3">
            <strong>提交后，系统将：</strong>
          </p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>根据完成情况自动调整明日优先级</li>
            <li>重新装箱任务，确保不超过明日可用时长</li>
            <li>识别高风险任务并给出优化建议</li>
            <li>保持甘特图不变，仅调整每日清单</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSubmitReview}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          提交复盘并生成明日计划
        </button>
        <Link
          to={`/daily/${projectId}`}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          取消
        </Link>
      </div>
    </div>
  );
}
