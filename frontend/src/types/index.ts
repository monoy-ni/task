// 任务类型定义
export interface Task {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  duration: number; // 小时
  status: 'todo' | 'in-progress' | 'blocked' | 'completed';
  importance: number; // 1-5
  urgency: number; // 1-5
  cost: number; // 预计时间成本（小时）
  risk: number; // 1-5
  parentId?: string;
  dependencies: string[]; // 依赖的任务ID
  level: 'month' | 'week' | 'day';
  blockedReason?: string;
}

// 四象限分类
export type Quadrant = 'IU' | 'IN' | 'NU' | 'NN';

export interface TaskWithQuadrant extends Task {
  quadrant: Quadrant;
  isTop?: 1 | 2 | 3;
}

// 项目目标
export interface Project {
  id: string;
  title: string;
  description: string;
  deadline?: Date;
  createdAt: Date;
  assumptions: string[];
  knownFacts: string[];
  risks: string[];
  pendingQuestions: string[];
  dailyAvailableHours: number;
}

// 对话问题
export interface Question {
  id: string;
  text: string;
  category: 'direction' | 'scope' | 'constraint';
  round: 1 | 2;
  skippable: boolean;
  answer?: string;
}

// 计划
export interface Plan {
  projectId: string;
  tasks: Task[];
  milestones: Milestone[];
  dailyPlans: DailyPlan[];
}

// 里程碑
export interface Milestone {
  id: string;
  title: string;
  date: Date;
  description: string;
  taskIds: string[];
}

// 每日计划
export interface DailyPlan {
  date: Date;
  availableHours: number;
  top1?: string; // 任务ID
  top2?: string;
  top3?: string;
  backlog: string[];
  completedTasks: string[];
}

// 复盘记录
export interface Review {
  date: Date;
  completedTasks: string[];
  incompleteTasks: { taskId: string; reason: string }[];
  tomorrowAvailableHours: number;
  tomorrowPriority?: string;
  notes?: string;
}

// AI 建议
export interface AISuggestion {
  type: 'split' | 'merge' | 'reorganize' | 'postpone' | 'downgrade';
  targetTaskIds: string[];
  reason: string;
  preview: {
    before: Task[];
    after: Task[];
  };
  impact: string;
}
