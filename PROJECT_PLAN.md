# Task Breakdown Tool 项目规划文档

## 一、项目概述

**项目名称**: Task Breakdown Tool（任务拆解工具）

**项目定位**: 一个基于 AI 的智能任务管理工具，帮助用户将宏大的目标分解为可执行的小任务，并提供可视化的进度跟踪和复盘功能。

**设计来源**: [Figma 设计稿](https://www.figma.com/design/FPkZFWwuyZeBXFrr0LBP09/Task-Breakdown-Tool)

---

## 二、技术架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         前端 (React + TS)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  页面组件 │  │ 业务组件 │  │  UI组件  │  │  样式系统 │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    后端 (Flask + Python)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  路由层  │→│  服务层  │→│ AI Agent │→│ 硅基流动API│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术选型理由

| 前端技术 | 选型理由 |
|---------|---------|
| React | 成熟的前端框架，生态丰富 |
| TypeScript | 类型安全，减少运行时错误 |
| Vite | 极速的开发体验和热更新 |
| Radix UI | 无障碍支持，完全可定制 |
| Tailwind CSS | 快速构建，设计一致性 |

| 后端技术 | 选型理由 |
|---------|---------|
| Flask | 轻量级，易于上手和部署 |
| Pydantic | 数据验证，类型安全 |
| OpenAI SDK | 兼容硅基流动 API |

---

## 三、目录结构规范

### 3.1 根目录

```
Task Breakdown Tool/
├── frontend/               # 前端目录
├── backend/                # 后端目录
├── docs/                   # 文档目录
├── README.md               # 项目说明
└── PROJECT_PLAN.md         # 项目规划文档
```

### 3.2 前端目录结构 (frontend/)

```
frontend/
├── src/                   # 前端源码
├── components/             # 可复用组件
│   ├── ui/                # 基础 UI 组件（Radix UI 封装）
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...             # 其他基础组件
│   │
│   ├── mono/              # Mono 主题组件
│   │   ├── MonoGreeting.tsx   # 问候语组件
│   │   └── MonoAvatar.tsx     # 头像组件
│   │
│   ├── GanttChart.tsx     # 甘特图组件
│   ├── ReflectionGenie.tsx # 反思精灵组件
│   ├── Mono.tsx           # Mono 主题布局
│   └── Root.tsx           # 根组件
│
├── pages/                 # 页面级组件
│   ├── Home.tsx           # 首页
│   ├── CreateProject.tsx  # 创建项目页
│   ├── TaskBreakdown.tsx  # 任务拆解结果页
│   ├── TestBreakdown.tsx  # 测试拆解页
│   ├── GanttView.tsx      # 甘特图视图
│   ├── DailyTasksTimeline.tsx # 每日任务时间线
│   ├── Review.tsx         # 复盘页
│   └── NotFound.tsx       # 404 页面
│
├── types/                 # TypeScript 类型定义
│   └── index.ts           # 全局类型定义
│
├── utils/                 # 工具函数
│   └── (待补充)
│
├── styles/                # 样式文件
│   └── (待补充)
│
├── assets/                # 静态资源
│   └── *.png
│
├── guidelines/            # 设计指南
│   └── (设计相关文档)
│
├── index.css              # Tailwind CSS 入口
├── App.tsx                # React 应用根组件
├── main.tsx               # 应用入口
└── routes.tsx             # 路由配置
```

### 3.3 后端目录结构

```
backend/
├── models/                # 数据模型
│   ├── __init__.py
│   └── schema.py          # Pydantic 模型定义
│
├── services/              # 业务逻辑层
│   ├── __init__.py
│   └── ai_service.py      # AI 服务（多 Agent 架构）
│
├── .env                   # 环境变量（不提交）
├── .env.example           # 环境变量示例
├── .gitignore             # Git 忽略规则
├── app.py                 # Flask 主应用（路由 + 启动）
├── requirements.txt       # Python 依赖
├── README.md              # 后端 API 文档
└── START_GUIDE.md         # 启动指南
```

---

## 四、多 Agent AI 架构

### 4.1 Agent 职责划分

| Agent | 职责 | 使用模型 | 调用时机 |
|-------|------|----------|---------|
| Agent 1 | 分析任务类型（学习/工作/生活） | 快速模型 | 任务拆解时 |
| Agent 2 | 评估经验水平（新手/进阶/专家） | 快速模型 | 任务拆解时 |
| Agent 3 | 判断时间跨度（年度/季度/月度） | 快速模型 | 任务拆解时 |
| Agent 4 | 生成补充问题（优化任务计划） | 思考模型 | 任务拆解时 |
| Agent 5 | 执行多层级任务拆解 | 思考模型 | 任务拆解/重新生成时 |

### 4.2 模型配置策略

- **快速模型** (`MODEL_ANALYSIS`): 用于轻量级分析，追求响应速度
  - 推荐: `inclusionAI/Ling-flash-2.0`
  - 备选: `Qwen/Qwen2.5-7B-Instruct`

- **思考模型** (`MODEL_GENERATION`): 用于复杂推理和生成，追求质量
  - 推荐: `moonshotai/Kimi-K2-Thinking`
  - 备选: `Qwen/Qwen2.5-72B-Instruct`, `deepseek-ai/DeepSeek-V3`

---

## 五、API 接口设计

### 5.1 接口列表

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/` | 健康检查 |
| POST | `/api/breakdown` | 创建任务拆解 |
| GET | `/api/projects/{id}` | 获取项目详情 |
| POST | `/api/projects/{id}/answers` | 更新补充问题答案 |
| POST | `/api/projects/{id}/regenerate` | 重新生成任务 |
| GET | `/api/projects` | 获取所有项目列表 |

### 5.2 数据流

```
用户表单 → POST /api/breakdown → AI Agent 拆解 → 返回任务 + 补充问题
     ↓
回答补充问题 → POST /api/projects/{id}/answers → 保存答案
     ↓
重新生成 → POST /api/projects/{id}/regenerate → AI Agent 优化 → 返回新任务
```

---

## 六、页面路由设计

| 路由 | 页面 | 主要功能 |
|------|------|---------|
| `/` | Home | 项目入口，"开始创建"按钮 |
| `/create` | CreateProject | 填写目标、截止日期、经验等表单 |
| `/breakdown/:id` | TaskBreakdown | 展示分层级任务，回答补充问题 |
| `/gantt/:id` | GanttView | 甘特图可视化任务时间线 |
| `/timeline/:id` | DailyTasksTimeline | 按日期展示每日任务 |
| `/review/:id` | Review | 复盘完成情况，记录反思 |
| `*` | NotFound | 404 页面 |

---

## 七、待优化项

### 7.1 短期优化

- [ ] 添加数据持久化（SQLite/PostgreSQL）
- [ ] 添加错误边界组件
- [ ] 完善类型定义
- [ ] 添加单元测试
- [ ] 添加加载状态优化

### 7.2 中期优化

- [ ] 添加用户认证（JWT）
- [ ] 支持导出任务（PDF/Excel）
- [ ] 添加任务拖拽排序
- [ ] 添加子任务功能
- [ ] 添加任务标签系统

### 7.3 长期规划

- [ ] 支持多人协作
- [ ] 添加任务提醒（邮件/推送）
- [ ] 集成日历应用
- [ ] 添加移动端适配
- [ ] 添加数据分析看板

---

## 八、开发规范

### 8.1 命名规范

- 文件名: PascalCase (如 `TaskBreakdown.tsx`)
- 组件名: PascalCase (如 `const Button = ...`)
- 变量/函数: camelCase (如 `handleClick`)
- 常量: UPPER_SNAKE_CASE (如 `API_BASE_URL`)
- 类型/接口: PascalCase (如 `interface TaskData`)

### 8.2 Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链更新
```

### 8.3 代码审查要点

- [ ] 类型定义完整
- [ ] 错误处理完善
- [ ] 没有硬编码的魔法值
- [ ] 组件职责单一
- [ ] 注释清晰（如有必要）

---

## 九、部署建议

### 9.1 开发环境

- 前端: `cd frontend && npm run dev` → `http://localhost:5173`
- 后端: `cd backend && python app.py` → `http://localhost:5000`

### 9.2 生产环境

- 前端: `npm run build` → 静态文件部署到 CDN/Nginx
- 后端: Gunicorn + Nginx 反向代理
- AI API: 硅基流动（国内服务稳定）

---

## 十、联系与支持

- 设计原稿: [Figma](https://www.figma.com/design/FPkZFWwuyZeBXFrr0LBP09/Task-Breakdown-Tool)
- 问题反馈: [GitHub Issues](待添加)

---

*文档最后更新: 2025-01-28*
