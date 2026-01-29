import { Project, Plan, Task, Milestone, DailyPlan, Quadrant } from '../types';

export function generatePlan(
  goalInput: string,
  answers: Record<string, string>
): { project: Project; plan: Plan } {
  const projectId = `project-${Date.now()}`;

  // 解析截止日期
  let deadline: Date | undefined;
  const deadlineAnswer = answers['q1-deadline'];
  if (deadlineAnswer && deadlineAnswer !== '无固定截止日期') {
    // 尝试解析日期字符串 (YYYY-MM-DD格式)
    const dateMatch = deadlineAnswer.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      deadline = new Date(deadlineAnswer);
    } else {
      // 尝试解析相对时间
      const match = deadlineAnswer.match(/(\d+)\s*(天|周|个?月)/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        deadline = new Date();
        if (unit.includes('天')) {
          deadline.setDate(deadline.getDate() + value);
        } else if (unit.includes('周')) {
          deadline.setDate(deadline.getDate() + value * 7);
        } else if (unit.includes('月')) {
          deadline.setMonth(deadline.getMonth() + value);
        }
      }
    }
  }
  
  // 如果没有解析出deadline，设置默认1个月
  if (!deadline) {
    deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 1);
  }

  // 解析每日可用时间
  const dailyHoursAnswer = answers['q2-daily-hours'];
  let dailyAvailableHours = 1;
  if (dailyHoursAnswer) {
    const hoursMatch = dailyHoursAnswer.match(/(\d+\.?\d*)/);
    if (hoursMatch) {
      dailyAvailableHours = parseFloat(hoursMatch[1]);
    }
  }

  // 创建项目
  const project: Project = {
    id: projectId,
    title: goalInput,
    description: `目标：${goalInput}`,
    deadline,
    createdAt: new Date(),
    dailyAvailableHours,
    assumptions: [],
    knownFacts: [],
    risks: [],
    pendingQuestions: [],
  };

  // 添加假设和已知事实
  if (deadlineAnswer) {
    project.knownFacts.push(`截止日期：${deadline?.toLocaleDateString('zh-CN')}`);
  } else {
    project.assumptions.push('假设项目周期为1个月');
  }

  if (dailyHoursAnswer) {
    project.knownFacts.push(`每日可用时间：${dailyAvailableHours}小时`);
  } else {
    project.assumptions.push('假设每日可用时间为1小时');
  }

  const experienceAnswer = answers['q1-experience'];
  if (experienceAnswer) {
    project.knownFacts.push(`经验水平：${experienceAnswer}`);
  } else {
    project.assumptions.push('假设为中等经验水平');
  }

  // 生成任务（示例：根据目标类型生成不同的任务模板）
  const tasks = generateTasksForGoal(goalInput, projectId, deadline!, dailyAvailableHours);

  // 生成里程碑
  const milestones = generateMilestones(tasks, deadline!);

  // 生成每日计划
  const dailyPlans = generateDailyPlans(tasks, dailyAvailableHours, deadline!);

  const plan: Plan = {
    projectId,
    tasks,
    milestones,
    dailyPlans,
  };

  return { project, plan };
}

function generateTasksForGoal(
  goal: string,
  projectId: string,
  deadline: Date,
  dailyHours: number
): Task[] {
  const tasks: Task[] = [];
  const startDate = new Date();

  // 根据目标关键词生成任务
  const isWebProject = /网页|网站|web|site/i.test(goal);
  const isLearningProject = /学|学习|掌握/i.test(goal);

  if (isWebProject) {
    // 网页项目模板
    tasks.push(
      createTask('需求分析与规划', 'month', 2, 5, 4, startDate, 1, [], projectId),
      createTask('设计原型与UI设计', 'week', 3, 4, 4, addDays(startDate, 2), 2, ['task-1'], projectId),
      createTask('前端开发 - 首页', 'day', 1, 5, 3, addDays(startDate, 5), 3, ['task-2'], projectId),
      createTask('前端开发 - 详情页', 'day', 1, 4, 3, addDays(startDate, 6), 3, ['task-3'], projectId),
      createTask('后端API开发', 'week', 4, 4, 4, addDays(startDate, 7), 2, ['task-2'], projectId),
      createTask('数据库设计与实现', 'day', 2, 4, 3, addDays(startDate, 11), 3, ['task-5'], projectId),
      createTask('前后端联调', 'day', 1, 5, 2, addDays(startDate, 13), 3, ['task-4', 'task-6'], projectId),
      createTask('测试与修复', 'week', 2, 5, 2, addDays(startDate, 14), 2, ['task-7'], projectId),
      createTask('部署上线', 'day', 0.5, 5, 1, addDays(startDate, 16), 3, ['task-8'], projectId)
    );
  } else if (isLearningProject) {
    // 学习项目模板
    tasks.push(
      createTask('了解基础概念', 'week', 2, 5, 2, startDate, 2, [], projectId),
      createTask('学习核心技能', 'week', 5, 5, 4, addDays(startDate, 7), 2, ['task-1'], projectId),
      createTask('实践练习1', 'day', 1, 4, 3, addDays(startDate, 12), 3, ['task-2'], projectId),
      createTask('实践练习2', 'day', 1, 4, 3, addDays(startDate, 13), 3, ['task-3'], projectId),
      createTask('实践练习3', 'day', 1, 3, 3, addDays(startDate, 14), 3, ['task-4'], projectId),
      createTask('进阶技巧学习', 'week', 3, 4, 3, addDays(startDate, 15), 2, ['task-5'], projectId),
      createTask('综合项目实践', 'week', 4, 5, 4, addDays(startDate, 18), 2, ['task-6'], projectId),
      createTask('复习与总结', 'day', 1, 3, 2, addDays(startDate, 22), 3, ['task-7'], projectId)
    );
  } else {
    // 通用项目模板
    tasks.push(
      createTask('项目启动与规划', 'week', 1, 5, 2, startDate, 2, [], projectId),
      createTask('第一阶段执行', 'week', 3, 5, 4, addDays(startDate, 2), 2, ['task-1'], projectId),
      createTask('第二阶段执行', 'week', 3, 4, 4, addDays(startDate, 5), 2, ['task-2'], projectId),
      createTask('第三阶段执行', 'week', 2, 4, 3, addDays(startDate, 8), 2, ['task-3'], projectId),
      createTask('收尾与总结', 'day', 1, 5, 2, addDays(startDate, 10), 3, ['task-4'], projectId)
    );
  }

  // 根据dailyHours调整任务，确保每天的任务不超过可用时间
  return adjustTasksByDailyHours(tasks, dailyHours);
}

function createTask(
  title: string,
  level: 'month' | 'week' | 'day',
  duration: number,
  importance: number,
  urgency: number,
  startDate: Date,
  risk: number,
  dependencies: string[],
  projectId: string
): Task {
  const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration);

  return {
    id,
    title,
    level,
    duration,
    importance,
    urgency,
    cost: duration,
    risk,
    startDate,
    endDate,
    dependencies,
    status: 'todo',
  };
}

function adjustTasksByDailyHours(tasks: Task[], dailyHours: number): Task[] {
  // 如果任务时长超过每日可用时间，拆分任务
  const adjusted: Task[] = [];

  tasks.forEach((task, index) => {
    if (task.duration <= dailyHours) {
      adjusted.push({ ...task, id: `task-${index + 1}` });
    } else {
      // 拆分成多个子任务
      const numSubtasks = Math.ceil(task.duration / dailyHours);
      for (let i = 0; i < numSubtasks; i++) {
        const subDuration = Math.min(dailyHours, task.duration - i * dailyHours);
        const subStartDate = addDays(task.startDate, i * dailyHours / dailyHours);
        const subTask = {
          ...task,
          id: `task-${index + 1}-${i + 1}`,
          title: `${task.title} (${i + 1}/${numSubtasks})`,
          duration: subDuration,
          startDate: subStartDate,
          endDate: addDays(subStartDate, subDuration),
          dependencies: i === 0 ? task.dependencies : [`task-${index + 1}-${i}`],
          parentId: `task-${index + 1}`,
        };
        adjusted.push(subTask);
      }
    }
  });

  return adjusted;
}

function generateMilestones(tasks: Task[], deadline: Date): Milestone[] {
  const milestones: Milestone[] = [];

  // 找出每周的关键任务作为里程碑
  const weeklyTasks = tasks.filter((t) => t.level === 'week' || t.importance >= 4);

  weeklyTasks.forEach((task, index) => {
    milestones.push({
      id: `milestone-${index + 1}`,
      title: `里程碑：${task.title}`,
      date: task.endDate,
      description: `完成${task.title}`,
      taskIds: [task.id],
    });
  });

  // 添加最终里程碑
  milestones.push({
    id: 'milestone-final',
    title: '项目完成',
    date: deadline,
    description: '所有任务完成，项目交付',
    taskIds: tasks.map((t) => t.id),
  });

  return milestones;
}

function generateDailyPlans(
  tasks: Task[],
  dailyHours: number,
  deadline: Date
): DailyPlan[] {
  const plans: DailyPlan[] = [];
  const startDate = new Date();
  const daysDiff = Math.ceil((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < daysDiff; i++) {
    const date = addDays(startDate, i);
    const dayTasks = tasks.filter((t) => {
      const taskDate = new Date(t.startDate).setHours(0, 0, 0, 0);
      const currentDate = date.getTime();
      return taskDate === currentDate && t.level === 'day';
    });

    // 按四象限排序
    const sortedTasks = dayTasks.sort((a, b) => {
      const scoreA = a.importance * 2 + a.urgency;
      const scoreB = b.importance * 2 + b.urgency;
      return scoreB - scoreA;
    });

    const plan: DailyPlan = {
      date,
      availableHours: dailyHours,
      top1: sortedTasks[0]?.id,
      top2: sortedTasks[1]?.id,
      top3: sortedTasks[2]?.id,
      backlog: sortedTasks.slice(3).map((t) => t.id),
      completedTasks: [],
    };

    plans.push(plan);
  }

  return plans;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getTaskQuadrant(task: Task): Quadrant {
  const isImportant = task.importance >= 4;
  const isUrgent = task.urgency >= 4;

  if (isImportant && isUrgent) return 'IU';
  if (isImportant && !isUrgent) return 'IN';
  if (!isImportant && isUrgent) return 'NU';
  return 'NN';
}