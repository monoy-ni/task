import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Project, Plan, Task, Milestone } from '../types';
import { getTaskQuadrant } from '../utils/planGenerator';
import GanttChart from '../components/GanttChart';

type Tab = 'overview' | 'weekly' | 'today' | 'gantt';

export default function PlanView() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>('gantt');
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

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

  const updatePlan = (newPlan: Plan) => {
    setPlan(newPlan);
    localStorage.setItem(`plan-${projectId}`, JSON.stringify(newPlan));
  };

  if (!project || !plan) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'gantt' as Tab, label: '甘特图' },
    { id: 'overview' as Tab, label: '概览' },
  ];

  return (
    <div>
      {/* 项目头部 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
          {project.deadline && (
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">截止日期</div>
              <div className="text-lg font-semibold">
                {project.deadline.toLocaleDateString('zh-CN')}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-sm text-gray-500 mb-1">总任务数</div>
            <div className="text-2xl font-semibold">{plan.tasks.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">已完成</div>
            <div className="text-2xl font-semibold text-green-600">
              {plan.tasks.filter((t) => t.status === 'completed').length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">进行中</div>
            <div className="text-2xl font-semibold text-blue-600">
              {plan.tasks.filter((t) => t.status === 'in-progress').length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">里程碑</div>
            <div className="text-2xl font-semibold">{plan.milestones.length}</div>
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'gantt' && <GanttChart plan={plan} onUpdatePlan={updatePlan} />}
          {activeTab === 'overview' && <OverviewTab plan={plan} project={project} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ plan, project }: { plan: Plan; project: Project }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingMilestones = plan.milestones
    .filter((m) => new Date(m.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const recentTasks = plan.tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* 即将到来的里程碑 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">即将到来的里程碑</h3>
        {upcomingMilestones.length > 0 ? (
          <div className="space-y-3">
            {upcomingMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg"
              >
                <div>
                  <div className="font-medium">{milestone.title}</div>
                  <div className="text-sm text-gray-600">{milestone.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {new Date(milestone.date).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">暂无即将到来的里程碑</p>
        )}
      </div>

      {/* 近期任务 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">近期任务</h3>
        {recentTasks.length > 0 ? (
          <div className="space-y-2">
            {recentTasks.map((task) => {
              const quadrant = getTaskQuadrant(task);
              const quadrantColors = {
                IU: 'bg-red-50 border-red-200 text-red-700',
                IN: 'bg-orange-50 border-orange-200 text-orange-700',
                NU: 'bg-blue-50 border-blue-200 text-blue-700',
                NN: 'bg-green-50 border-green-200 text-green-700',
              };

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded border ${quadrantColors[quadrant]}`}
                      >
                        {quadrant}
                      </span>
                      <span className="font-medium">{task.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{task.duration}h</span>
                    <span>{new Date(task.startDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">暂无近期任务</p>
        )}
      </div>
    </div>
  );
}
