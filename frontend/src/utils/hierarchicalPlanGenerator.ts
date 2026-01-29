interface Task {
  id: string;
  title: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  estimatedHours?: number;
}

interface TaskHierarchy {
  yearly: Task[];
  quarterly: { [key: string]: Task[] };
  monthly: { [key: string]: Task[] };
  weekly: { [key: string]: Task[] };
  daily: { [key: string]: Task[] };
}

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

export function generateHierarchicalTasks(formData: FormData): TaskHierarchy {
  const goal = formData.goal;
  const deadline = formData.deadline ? new Date(formData.deadline) : getDefaultDeadline();
  const today = new Date();
  const dailyHours = parseFloat(formData.dailyHours);
  const experience = formData.experience;
  const workingDays = formData.workingDays;

  // 计算项目时长（天数）
  const totalDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // 计算实际工作天数
  const workingDaysCount = workingDays.length > 0 ? workingDays.length : 7;
  const weeksCount = Math.ceil(totalDays / 7);
  const actualWorkingDays = Math.floor(weeksCount * workingDaysCount);
  
  // 总可用工时
  const totalHours = actualWorkingDays * dailyHours;

  // 根据目标类型决定拆解策略
  const projectType = detectProjectType(goal);
  
  return generateTasksByType(
    goal,
    projectType,
    today,
    deadline,
    totalDays,
    dailyHours,
    experience,
    totalHours
  );
}

function detectProjectType(goal: string): string {
  const goalLower = goal.toLowerCase();
  
  if (/网页|网站|web|app|应用|system|平台/.test(goalLower)) return 'development';
  if (/学|learn|master|掌握|练习/.test(goalLower)) return 'learning';
  if (/写|write|book|文章|content/.test(goalLower)) return 'writing';
  if (/设计|design|ui|ux/.test(goalLower)) return 'design';
  if (/考试|certification|证书|exam/.test(goalLower)) return 'exam';
  
  return 'general';
}

function generateTasksByType(
  goal: string,
  type: string,
  startDate: Date,
  endDate: Date,
  totalDays: number,
  dailyHours: number,
  experience: string,
  totalHours: number
): TaskHierarchy {
  // 根据项目类型生成任务
  switch (type) {
    case 'development':
      return generateDevelopmentTasks(goal, startDate, endDate, totalDays, dailyHours, experience);
    case 'learning':
      return generateLearningTasks(goal, startDate, endDate, totalDays, dailyHours, experience);
    case 'writing':
      return generateWritingTasks(goal, startDate, endDate, totalDays, dailyHours);
    case 'design':
      return generateDesignTasks(goal, startDate, endDate, totalDays, dailyHours);
    case 'exam':
      return generateExamPrepTasks(goal, startDate, endDate, totalDays, dailyHours);
    default:
      return generateGeneralTasks(goal, startDate, endDate, totalDays, dailyHours);
  }
}

// 开发类项目
function generateDevelopmentTasks(
  goal: string,
  start: Date,
  end: Date,
  totalDays: number,
  dailyHours: number,
  experience: string
): TaskHierarchy {
  const isNewbie = experience === 'beginner';
  
  return {
    yearly: [
      {
        id: 'y1',
        title: `完成项目: ${goal}`,
        description: '从需求分析到上线部署的完整开发周期',
        startDate: start,
        endDate: end,
      },
    ],
    quarterly: {
      'Q1 第一季度（规划与基础开发）': [
        {
          id: 'q1-1',
          title: '需求分析与技术选型',
          description: '明确项目需求，选择技术栈，搭建开发环境',
        },
        {
          id: 'q1-2',
          title: '核心功能开发',
          description: '开发项目的主要功能模块',
        },
      ],
      'Q2 第二季度（完善与上线）': [
        {
          id: 'q2-1',
          title: '功能完善与优化',
          description: '补充次要功能，性能优化',
        },
        {
          id: 'q2-2',
          title: '测试与部署',
          description: '全面测试，修复bug，部署上线',
        },
      ],
    },
    monthly: {
      '第1个月 - 项目启动': [
        {
          id: 'm1-1',
          title: '需求梳理与文档编写',
          description: '整理需求文档，画原型图',
          estimatedHours: dailyHours * 5,
        },
        {
          id: 'm1-2',
          title: '技术栈选型与环境搭建',
          description: isNewbie ? '学习并搭建开发环境' : '快速搭建开发环境',
          estimatedHours: dailyHours * (isNewbie ? 5 : 3),
        },
      ],
      '第2个月 - 核心开发': [
        {
          id: 'm2-1',
          title: '数据库设计',
          description: '设计数据表结构，建立数据模型',
          estimatedHours: dailyHours * 3,
        },
        {
          id: 'm2-2',
          title: '后端API开发',
          description: '开发核心业务接口',
          estimatedHours: dailyHours * 10,
        },
        {
          id: 'm2-3',
          title: '前端页面开发',
          description: '开发主要页面和交互',
          estimatedHours: dailyHours * 10,
        },
      ],
      '第3个月 - 完善上线': [
        {
          id: 'm3-1',
          title: '功能联调与测试',
          description: '前后端联调，功能测试',
          estimatedHours: dailyHours * 7,
        },
        {
          id: 'm3-2',
          title: '优化与部署',
          description: '性能优化，部署上线',
          estimatedHours: dailyHours * 5,
        },
      ],
    },
    weekly: {
      '第1周 - 需求分析': [
        {
          id: 'w1-1',
          title: '用户需求调研',
          description: '了解用户需求，竞品分析',
        },
        {
          id: 'w1-2',
          title: '功能清单梳理',
          description: '列出所有功能点，排优先级',
        },
      ],
      '第2周 - 原型设计': [
        {
          id: 'w2-1',
          title: '画页面原型图',
          description: '使用Figma等工具画原型',
        },
        {
          id: 'w2-2',
          title: '技术方案设计',
          description: '确定技术架构和实现方案',
        },
      ],
      '第3周 - 环境搭建': [
        {
          id: 'w3-1',
          title: '初始化项目',
          description: '创建代码仓库，搭建基础框架',
        },
        {
          id: 'w3-2',
          title: '配置开发工具',
          description: '配置代码规范、测试工具等',
        },
      ],
      '第4周 - 数据库': [
        {
          id: 'w4-1',
          title: '设计ER图',
          description: '设计数据库实体关系图',
        },
        {
          id: 'w4-2',
          title: '创建数据表',
          description: '编写SQL创建数据表',
        },
      ],
    },
    daily: generateDailyDevelopmentTasks(dailyHours, isNewbie),
  };
}

function generateDailyDevelopmentTasks(dailyHours: number, isNewbie: boolean): { [key: string]: Task[] } {
  return {
    '第1天': [
      {
        id: 'd1-1',
        title: '需求文档阅读与理解',
        description: `仔细阅读项目需求，标注不清楚的地方 (${dailyHours}h)`,
        estimatedHours: dailyHours,
      },
    ],
    '第2天': [
      {
        id: 'd2-1',
        title: '竞品分析',
        description: `研究3-5个同类产品，记录优缺点 (${dailyHours}h)`,
        estimatedHours: dailyHours,
      },
    ],
    '第3天': [
      {
        id: 'd3-1',
        title: '功能列表整理',
        description: `列出所有功能点，划分核心/次要 (${dailyHours}h)`,
        estimatedHours: dailyHours,
      },
    ],
    '第4天': [
      {
        id: 'd4-1',
        title: '画第一版原型',
        description: `使用Figma画主要页面的原型图 (${dailyHours}h)`,
        estimatedHours: dailyHours,
      },
    ],
    '第5天': [
      {
        id: 'd5-1',
        title: '技术选型研究',
        description: `确定前后端技术栈，调研最佳实践 (${dailyHours}h)`,
        estimatedHours: dailyHours,
      },
    ],
  };
}

// 学习类项目
function generateLearningTasks(
  goal: string,
  start: Date,
  end: Date,
  totalDays: number,
  dailyHours: number,
  experience: string
): TaskHierarchy {
  return {
    yearly: [
      {
        id: 'y1',
        title: `学习目标: ${goal}`,
        description: '从零基础到掌握核心技能',
        startDate: start,
        endDate: end,
      },
    ],
    quarterly: {
      'Q1 基础入门': [
        {
          id: 'q1-1',
          title: '基础概念学习',
          description: '理解核心概念，建立知识框架',
        },
        {
          id: 'q1-2',
          title: '基础练习',
          description: '通过练习巩固基础知识',
        },
      ],
      'Q2 深入提高': [
        {
          id: 'q2-1',
          title: '进阶技能学习',
          description: '学习进阶内容和高级技巧',
        },
        {
          id: 'q2-2',
          title: '项目实战',
          description: '通过实际项目巩固所学',
        },
      ],
    },
    monthly: {
      '第1个月 - 入门': [
        {
          id: 'm1-1',
          title: '学习基础知识',
          description: '看教程、读文档，理解基本概念',
          estimatedHours: dailyHours * 15,
        },
        {
          id: 'm1-2',
          title: '完成入门练习',
          description: '跟着教程做练习题',
          estimatedHours: dailyHours * 10,
        },
      ],
      '第2个月 - 进阶': [
        {
          id: 'm2-1',
          title: '深入学习核心内容',
          description: '学习更深入的知识点',
          estimatedHours: dailyHours * 12,
        },
        {
          id: 'm2-2',
          title: '完成进阶练习',
          description: '做更有挑战的练习',
          estimatedHours: dailyHours * 10,
        },
      ],
      '第3个月 - 实战': [
        {
          id: 'm3-1',
          title: '独立完成项目',
          description: '从零开始做一个完整项目',
          estimatedHours: dailyHours * 20,
        },
      ],
    },
    weekly: {
      '第1周': [
        {
          id: 'w1-1',
          title: '环境搭建',
          description: '安装必要的软件和工具',
        },
        {
          id: 'w1-2',
          title: '学习第一个概念',
          description: '理解最基础的核心概念',
        },
      ],
      '第2周': [
        {
          id: 'w2-1',
          title: '学习基础语法',
          description: '掌握基本语法和用法',
        },
      ],
      '第3周': [
        {
          id: 'w3-1',
          title: '完成基础练习题',
          description: '做10-20道基础练习',
        },
      ],
      '第4周': [
        {
          id: 'w4-1',
          title: '学习进阶内容',
          description: '开始学习更深的知识',
        },
      ],
    },
    daily: {
      '第1天': [
        {
          id: 'd1-1',
          title: '安装开发环境',
          description: `下载并安装必要的软件 (${dailyHours}h)`,
          estimatedHours: dailyHours,
        },
      ],
      '第2天': [
        {
          id: 'd2-1',
          title: '第一个Hello World',
          description: `跟着教程完成第一个示例 (${dailyHours}h)`,
          estimatedHours: dailyHours,
        },
      ],
      '第3天': [
        {
          id: 'd3-1',
          title: '学习基本概念',
          description: `理解核心概念，做笔记 (${dailyHours}h)`,
          estimatedHours: dailyHours,
        },
      ],
      '第4天': [
        {
          id: 'd4-1',
          title: '练习题 1-5',
          description: `完成前5道练习题 (${dailyHours}h)`,
          estimatedHours: dailyHours,
        },
      ],
      '第5天': [
        {
          id: 'd5-1',
          title: '练习题 6-10',
          description: `完成6-10题，复习前5题 (${dailyHours}h)`,
          estimatedHours: dailyHours,
        },
      ],
    },
  };
}

// 通用项目
function generateGeneralTasks(
  goal: string,
  start: Date,
  end: Date,
  totalDays: number,
  dailyHours: number
): TaskHierarchy {
  const phases = Math.max(3, Math.min(5, Math.floor(totalDays / 20)));
  
  return {
    yearly: [
      {
        id: 'y1',
        title: goal,
        description: '完成目标的整体规划',
        startDate: start,
        endDate: end,
      },
    ],
    quarterly: {
      'Q1 启动阶段': [
        {
          id: 'q1-1',
          title: '项目规划与准备',
          description: '明确目标，准备资源',
        },
        {
          id: 'q1-2',
          title: '初步执行',
          description: '开始核心工作',
        },
      ],
      'Q2 推进阶段': [
        {
          id: 'q2-1',
          title: '深入执行',
          description: '完成主要任务',
        },
        {
          id: 'q2-2',
          title: '收尾与总结',
          description: '完善细节，总结经验',
        },
      ],
    },
    monthly: {
      '第1个月': [
        {
          id: 'm1-1',
          title: '制定详细计划',
          description: '拆解任务，排期',
          estimatedHours: dailyHours * 3,
        },
        {
          id: 'm1-2',
          title: '开始第一阶段工作',
          description: '启动核心任务',
          estimatedHours: dailyHours * 15,
        },
      ],
      '第2个月': [
        {
          id: 'm2-1',
          title: '第二阶段工作',
          description: '推进重点任务',
          estimatedHours: dailyHours * 18,
        },
      ],
      '第3个月': [
        {
          id: 'm3-1',
          title: '收尾工作',
          description: '完成剩余任务',
          estimatedHours: dailyHours * 15,
        },
      ],
    },
    weekly: {
      '第1周': [
        {
          id: 'w1-1',
          title: '项目启动',
          description: '明确目标和计划',
        },
      ],
      '第2周': [
        {
          id: 'w2-1',
          title: '执行核心任务',
          description: '开始主要工作',
        },
      ],
    },
    daily: {
      '第1天': [
        {
          id: 'd1-1',
          title: '梳理任务清单',
          description: `列出所有需要做的事 (${dailyHours}h)`,
          estimatedHours: dailyHours,
        },
      ],
      '第2天': [
        {
          id: 'd2-1',
          title: '开始第一项任务',
          description: `执行第一个具体任务 (${dailyHours}h)`,
          estimatedHours: dailyHours,
        },
      ],
    },
  };
}

// 其他类型的生成函数（简化版）
function generateWritingTasks(goal: string, start: Date, end: Date, totalDays: number, dailyHours: number): TaskHierarchy {
  return generateGeneralTasks(goal, start, end, totalDays, dailyHours);
}

function generateDesignTasks(goal: string, start: Date, end: Date, totalDays: number, dailyHours: number): TaskHierarchy {
  return generateGeneralTasks(goal, start, end, totalDays, dailyHours);
}

function generateExamPrepTasks(goal: string, start: Date, end: Date, totalDays: number, dailyHours: number): TaskHierarchy {
  return generateGeneralTasks(goal, start, end, totalDays, dailyHours);
}

function getDefaultDeadline(): Date {
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 3); // 默认3个月
  return deadline;
}
