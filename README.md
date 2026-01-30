# mono - 把大目标变成一步步可走的路

> 一个基于 AI 的目标实现助手，帮助有目标但不知从何开始的人，通过智能拆解和每日任务跟踪，一步步达成目标

![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Vite](https://img.shields.io/badge/Vite-6.3.5-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## 功能特性

**核心功能**
- **智能目标拆解** - AI 将大目标分解为年度/月度/日度的可执行小任务
- **邮箱验证登录** - 安全的邮箱 OTP 验证，无需设置密码
- **订阅付费体系** - 免费试用、订阅制、次数包多种方案
- **额度管理** - 每日额度 + 购买次数双轨制
- **甘特图可视化** - 直观展示任务进度和依赖关系
- **每日任务时间线** - 清晰展示今日待办，四象限分类
- **智能复盘** - 记录完成情况，AI 分析并自动调整计划

**目标人群**
- 有目标但不知从何开始的人
- 容易被大目标吓退的人
- 想改变但不知道从哪开始的人
- 需要有人陪伴推动的人

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
| Supabase | latest | 认证与数据库 |
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
- Supabase 项目 ([创建地址](https://supabase.com))

### 安装与运行

1. **克隆项目**
```bash
git clone <repository-url>
cd Task
```

2. **安装前端依赖**
```bash
cd Kimi_Agent_mono/app
npm install
```

3. **配置环境变量**

前端配置 (`app/.env`):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

后端配置 (`backend/.env`):
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

4. **配置 Supabase 数据库**

在 Supabase SQL Editor 中运行：

```sql
-- 创建用户资料表
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'monthly', 'yearly')),
  daily_quota INTEGER DEFAULT 0,
  daily_used INTEGER DEFAULT 0,
  last_reset_date TEXT,
  total_purchased INTEGER DEFAULT 10,
  total_purchased_used INTEGER DEFAULT 0,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

5. **启动后端服务**
```bash
cd backend
python app.py
# 服务运行在 http://localhost:5000
```

6. **启动前端开发服务器**
```bash
cd Kimi_Agent_mono/app
npm run dev
# 前端运行在 http://localhost:5173
```

## 用户指南

### 订阅方案

| 方案 | 价格 | 权益 |
|------|------|------|
| 免费试用 | - | 注册送 10 次，永久有效 |
| 月卡 | ¥29/月 | 每日 10 次 + 购买 8 折 |
| 年卡 | ¥298/年 | 每日 30 次 + 购买 5 折 |
| 20 次包 | ¥9.9 | 永不过期 |
| 100 次包 | ¥39 | 永不过期，性价比 |

### 使用流程

1. **创建目标** - 描述你想达成的事情
2. **AI 拆解** - AI 自动生成任务清单
3. **每日执行** - 完成当天的小任务
4. **进度跟踪** - 甘特图可视化展示进度
5. **智能复盘** - AI 分析并自动调整后续计划

## 项目结构

```
Task/
├── Kimi_Agent_mono/           # 前端应用
│   ├── public/                 # 静态资源
│   ├── src/
│   │   ├── components/          # 组件
│   │   │   ├── ui/             # Radix UI 基础组件
│   │   │   └── ...             # 其他组件
│   │   ├── pages/               # 页面组件
│   │   │   ├── Login.tsx        # 登录页
│   │   │   ├── Pricing.tsx      # 订阅页
│   │   │   ├── Profile.tsx       # 个人中心
│   │   │   ├── CreateProject.tsx
│   │   │   ├── GanttView.tsx
│   │   │   └── ...
│   │   ├── sections/            # 首页区块
│   │   ├── contexts/             # AuthContext
│   │   ├── lib/                  # Supabase 客端
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/                    # 后端 API
│   ├── app.py                 # Flask 主应用
│   ├── services/
│   │   └── ai_service.py        # AI 服务
│   └── requirements.txt
├── docs/                       # 文档
└── README.md
```

## 开发指南

### 添加新页面

1. 在 `app/src/pages/` 创建页面组件
2. 在 `app/src/routes.tsx` 添加路由配置

### 修改主题颜色

编辑 `app/src/index.css` 中的 CSS 变量：

```css
--mono-primary: 10, 166, 149;  /* 薄荷绿 */
--mono-primary-light: 167, 232, 216;
/* ... */
```

### 修改 AI Agent

编辑 `backend/services/ai_service.py` 中的对应 Agent 函数。

## 常见问题

**Q: 如何配置邮件发送？**
A: 在 Supabase 控制台进入 Authentication → Email Templates，确认 Confirm signup 模板使用 OTP 格式（包含 `{{.Code}}` 变量）。

**Q: 数据存储在哪里？**
A: 用户数据存储在 Supabase PostgreSQL 数据库中，项目数据暂未持久化，刷新页面会丢失。

**Q: 如何更换 AI 模型？**
A: 修改 `backend/.env` 中的 `MODEL_ANALYSIS` 和 `MODEL_GENERATION` 配置。

**Q: 免费用户的 10 次用完后怎么办？**
A: 可以购买次数包（20次 ¥9.9 或 100次 ¥39），或订阅月卡/年卡获得每日额度。

## 更新日志

### v1.0.0 (2025-01)
- 初始发布
- 邮箱 OTP 登录
- 订阅付费体系
- 智能目标拆解
- 甘特图和每日任务视图

## 许可证

MIT License

## 致谢

- [Radix UI](https://www.radix-ui.com/) - 无障碍的 UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [Supabase](https://supabase.com/) - 开源 Firebase 替代方案
- [硅基流动](https://siliconflow.cn/) - AI 模型 API 服务
