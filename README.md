# Task Breakdown Tool

> 一个基于 AI 的智能任务拆解工具，帮助你将宏大的目标分解为可执行的小任务

![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 功能特性

- **智能任务拆解** - 基于多 Agent AI 架构，将大目标分解为年度/季度/月度/周度/日度任务
- **个性化分析** - 根据你的经验水平、时间安排、资源情况生成定制化计划
- **甘特图可视化** - 直观展示任务时间线和依赖关系
- **每日任务时间线** - 清晰展示每日待办事项
- **复盘反思** - 记录完成情况，分析未完成任务原因，持续优化计划
- **迭代优化** - 根据补充问题和反馈重新生成更精准的任务

## 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.0+ | 类型安全 |
| Vite | 6.3.5 | 构建工具 |
| React Router | latest | 路由管理 |
| Radix UI | latest | 无样式组件库 |
| Tailwind CSS | 4.1.3 | 样式方案 |
| Recharts | latest | 图表可视化 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Flask | 3.0+ | Web 框架 |
| Pydantic | latest | 数据验证 |
| OpenAI SDK | 1.60+ | AI 模型调用 |
| 硅基流动 API | - | AI 模型提供商 |

## 快速开始

### 前置要求

- Node.js 18+
- Python 3.10+
- 硅基流动 API Key ([获取地址](https://cloud.siliconflow.cn/account/ak))

### 安装与运行

1. **克隆项目**
```bash
git clone <repository-url>
cd Task-Breakdown-Tool
```

2. **安装前端依赖**
```bash
cd frontend
npm install
```

3. **配置后端环境**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # 编辑 .env 填入 API Key
```

4. **启动后端服务**
```bash
cd backend
python app.py
# 服务运行在 http://localhost:5000
```

5. **启动前端开发服务器**
```bash
cd frontend
npm run dev
# 前端运行在 http://localhost:5173
```

### 环境变量配置

在 `backend/.env` 中配置以下变量：

```env
# 硅基流动 API 配置
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# 多Agent模型配置
MODEL_ANALYSIS=inclusionAI/Ling-flash-2.0
MODEL_GENERATION=moonshotai/Kimi-K2-Thinking

# Flask 配置
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key

# CORS 配置
CORS_ORIGINS=http://localhost:5173
```

## 项目结构

```
task-breakdown-tool/
├── frontend/                   # 前端目录
│   ├── src/                   # React 源码
│   │   ├── components/        # 组件
│   │   │   ├── ui/           # Radix UI 基础组件
│   │   │   ├── mono/         # Mono 主题组件
│   │   │   └── ...
│   │   ├── pages/            # 页面组件
│   │   ├── types/            # 类型定义
│   │   ├── utils/            # 工具函数
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── build/                # 构建输出
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/                   # 后端目录
│   ├── models/               # 数据模型
│   │   └── schema.py
│   ├── services/             # 服务层
│   │   └── ai_service.py
│   ├── app.py
│   └── requirements.txt
├── docs/                      # 文档目录
│   └── PRODUCT_DESCRIPTION.md
├── README.md                  # 项目说明
└── PROJECT_PLAN.md            # 项目规划
```

## 页面说明

| 页面 | 路由 | 功能 |
|------|------|------|
| 首页 | `/` | 项目入口和欢迎页面 |
| 创建项目 | `/create` | 填写任务目标和相关信息 |
| 任务拆解 | `/breakdown/:id` | 查看AI生成的任务拆解结果 |
| 甘特图 | `/gantt/:id` | 可视化展示任务时间线 |
| 每日任务 | `/timeline/:id` | 按日期查看任务列表 |
| 复盘 | `/review/:id` | 记录完成情况和反思 |

## 开发指南

### 添加新页面

1. 在 `frontend/src/pages/` 创建页面组件
2. 在 `frontend/src/routes.tsx` 添加路由配置
3. 如需新 API，在 `backend/app.py` 添加对应接口

### 添加新的 AI Agent

编辑 `backend/services/ai_service.py`，参考现有的 5 个 Agent 实现：

```python
async def agent_6_new_analysis(form_data: dict) -> dict:
    """新的分析 Agent"""
    # 实现你的逻辑
    pass
```

## 常见问题

**Q: AI 拆解效果不理想？**
A: 可以通过补充问题页面提供更多信息，然后点击"重新生成"让 AI 优化计划。

**Q: 数据会保存吗？**
A: 当前版本使用内存存储，重启后数据会丢失。生产环境建议接入数据库。

**Q: 如何更换 AI 模型？**
A: 修改 `backend/.env` 中的 `MODEL_ANALYSIS` 和 `MODEL_GENERATION` 配置。

## 待办事项

- [ ] 接入数据库持久化存储
- [ ] 添加用户认证系统
- [ ] 支持导出任务计划（PDF/Excel）
- [ ] 添加任务提醒功能
- [ ] 支持多人协作项目

## 许可证

MIT License

## 致谢

- [Radix UI](https://www.radix-ui.com/) - 无障碍的 UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [硅基流动](https://siliconflow.cn/) - AI 模型 API 服务
- 原设计来自 [Figma](https://www.figma.com/design/FPkZFWwuyZeBXFrr0LBP09/Task-Breakdown-Tool)
