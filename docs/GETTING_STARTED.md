# 快速启动指南

本文档帮助你快速启动 AI 任务拆解工具的开发环境。

## 目录

- [项目概述](#项目概述)
- [环境要求](#环境要求)
- [后端启动](#后端启动)
- [前端启动](#前端启动)
- [常见问题](#常见问题)

---

## 项目概述

```
task/
├── backend/          # Flask 后端 API
├── Kimi_Agent_mono/  # React 前端应用
├── frontend/         # 旧版前端（已废弃）
└── docs/             # 项目文档
```

---

## 环境要求

### 后端

| 依赖 | 版本要求 |
|------|---------|
| Python | 3.8+ |
| pip | 最新版 |

### 前端

| 依赖 | 版本要求 |
|------|---------|
| Node.js | 18+ |
| npm / pnpm | 最新版 |

---

## 后端启动

### 1. 进入后端目录

```bash
cd backend
```

### 2. 安装 Python 依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

复制示例配置文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写必要配置：

```env
# 硅基流动 API 配置（必填）
# 获取地址: https://cloud.siliconflow.cn/account/ak
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# 模型配置
MODEL_ANALYSIS=inclusionAI/Ling-flash-2.0
MODEL_GENERATION=moonshotai/Kimi-K2-Thinking

# Flask 配置
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key

# CORS 配置
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4. 启动后端服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动。

### 5. 验证后端

访问 http://localhost:5000 或运行：

```bash
curl http://localhost:5000
```

期望返回：

```json
{"status": "ok", "service": "Task Breakdown API", "version": "1.0.0", ...}
```

---

## 前端启动

### 1. 进入前端目录

```bash
cd Kimi_Agent_mono/app
```

### 2. 安装 Node 依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐）
pnpm install
```

### 3. 配置环境变量

编辑 `.env` 文件（已存在），确保指向正确的后端地址：

```env
# 后端 API 地址
VITE_API_URL=http://localhost:5000

# Supabase 配置（可选，用于用户认证）
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 启动开发服务器

```bash
# 使用 npm
npm run dev

# 或使用 pnpm
pnpm dev
```

前端将在 `http://localhost:5173` 启动。

### 5. 验证前端

浏览器访问 http://localhost:5173，应看到任务拆解工具的主界面。

---

## 同时启动前后端（推荐）

在项目根目录打开两个终端：

**终端 1 - 后端：**

```bash
cd backend
python app.py
```

**终端 2 - 前端：**

```bash
cd Kimi_Agent_mono/app
npm run dev
```

---

## 生产环境部署

### 后端部署

1. 使用生产环境配置：

```bash
cp .env.production .env
# 修改 .env 中的配置
```

2. 使用 Gunicorn 启动：

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 前端构建

```bash
cd Kimi_Agent_mono/app
npm run build
```

构建产物在 `dist/` 目录。

---

## 常见问题

### Q1: 后端启动报错 `ModuleNotFoundError`

**解决方案：**

```bash
pip install -r requirements.txt
```

### Q2: 前端无法连接后端

**检查项：**

1. 后端是否正常运行（访问 http://localhost:5000）
2. `.env` 中的 `VITE_API_URL` 是否正确
3. 后端 CORS 配置是否包含前端地址

### Q3: AI 拆解功能不工作

**检查项：**

1. 确认已配置 `SILICONFLOW_API_KEY`
2. 访问 https://cloud.siliconflow.cn/account/ak 获取 API Key
3. 检查后端日志是否有错误信息

### Q4: 前端依赖安装失败

**解决方案：**

```bash
# 清除缓存后重试
rm -rf node_modules
npm cache clean --force
npm install
```

### Q5: 端口被占用

**更改端口：**

```bash
# 后端 - 修改 .env
PORT=5001

# 前端 - 使用命令行参数
npm run dev -- --port 3000
```

---

## API 接口速查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 健康检查 |
| POST | `/api/breakdown` | 创建任务拆解 |
| GET | `/api/projects/{id}` | 获取项目详情 |
| POST | `/api/projects/{id}/answers` | 更新补充问题答案 |
| POST | `/api/projects/{id}/regenerate` | 重新生成任务 |
| POST | `/api/quick-task/generate` | 快速任务拆解 |
| GET | `/api/quick-task/{id}` | 获取快速任务详情 |

---

## 技术栈

### 后端

- **Flask** - Web 框架
- **Pydantic** - 数据验证
- **OpenAI SDK** - AI 模型调用

### 前端

- **React 19** - UI 框架
- **Vite** - 构建工具
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **Radix UI** - 组件库
- **Supabase** - 用户认证

---

## 下一步

- 阅读 [项目设计文档](./milestone-task-redesign.md)
- 查看 [后端 API 文档](../backend/README.md)
- 了解 [项目计划](../PROJECT_PLAN.md)

---

## 获取帮助

如有问题，请提交 Issue 或联系项目维护者。
