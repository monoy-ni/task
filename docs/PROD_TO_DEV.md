# 生产环境转开发环境配置指南

本文档说明如何将生产环境配置切换为开发环境配置。

## 目录

- [前端配置](#前端配置)
- [后端配置](#后端配置)
- [启动开发服务](#启动开发服务)
- [验证配置](#验证配置)

---

## 前端配置

### 1. 环境变量配置

在 `frontend/` 目录下创建 `.env.development` 文件（如不存在）：

```bash
cd frontend
touch .env.development
```

编辑 `.env.development` 文件：

```env
# 后端 API 地址（开发环境）
VITE_API_URL=http://localhost:5000
```

### 2. 开发服务器配置

前端开发服务器配置位于 `frontend/vite.config.ts`：

```typescript
server: {
  port: 3000,        // 开发服务器端口
  open: true,        // 自动打开浏览器
}
```

**生产环境区别**：
- 生产环境构建后会生成静态文件，部署到 Nginx/COS 等静态服务器
- 开发环境使用 Vite 开发服务器，支持热更新

---

## 后端配置

### 1. 环境变量配置

在 `backend/` 目录下配置 `.env` 文件：

```bash
cd backend
```

编辑 `.env` 文件，确保以下配置为开发环境值：

```env
# ================================
# 开发环境配置
# ================================

# 硅基流动 API 配置
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# 多Agent模型配置
# Agent 1-3 (任务类型/经验水平/时间跨度分析) - 使用快速模型
MODEL_ANALYSIS=inclusionAI/Ling-flash-2.0
# Agent 4-5 (补充问题/任务拆解) - 使用思考模型
MODEL_GENERATION=moonshotai/Kimi-K2-Thinking

# Flask 配置（开发环境）
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production

# CORS 配置（允许本地开发地址）
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# 日志级别（开发环境输出详细日志）
LOG_LEVEL=DEBUG
```

### 2. 与生产环境的区别

| 配置项 | 开发环境 | 生产环境 |
|--------|----------|----------|
| `FLASK_ENV` | `development` | `production` |
| `FLASK_DEBUG` | `True` | `False` |
| `SECRET_KEY` | 任意值 | **必须**使用强随机密钥 |
| `CORS_ORIGINS` | `localhost:*` | 具体域名列表 |
| `LOG_LEVEL` | `DEBUG` | `INFO` 或 `WARNING` |

---

## 启动开发服务

### 方式一：分别启动（推荐用于开发调试）

**1. 启动后端服务**

```bash
cd backend
pip install -r requirements.txt  # 首次运行需要安装依赖
python app.py
```

后端服务将在 `http://localhost:5000` 启动。

**2. 启动前端服务**

新开一个终端：

```bash
cd frontend
npm install  # 首次运行需要安装依赖
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

### 方式二：同时启动（推荐）

在项目根目录使用 npm scripts：

```bash
# 安装根目录依赖（如有）
npm install

# 启动所有开发服务
npm run dev
```

---

## 验证配置

### 1. 检查后端 API

访问 `http://localhost:5000`，应返回健康检查响应：

```json
{
  "status": "ok",
  "message": "Task Breakdown API is running"
}
```

### 2. 检查前端页面

访问 `http://localhost:3000`，应正常显示应用首页。

### 3. 检查 API 联通

打开浏览器开发者工具（F12），切换到 Console 标签，输入：

```javascript
fetch('http://localhost:5000/').then(r => r.json()).then(console.log)
```

应成功返回后端响应。

---

## 常见问题

### Q: 前端无法连接后端 API？

**A:** 检查以下配置：

1. 后端服务是否已启动（访问 `http://localhost:5000` 确认）
2. 前端 `.env.development` 中的 `VITE_API_URL` 是否正确
3. 后端 `.env` 中的 `CORS_ORIGINS` 是否包含前端地址

### Q: CORS 错误？

**A:** 确保后端 `.env` 文件中：

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Q: 修改环境变量后不生效？

**A:** 完全重启服务：

```bash
# 后端：Ctrl+C 停止后重新运行
python app.py

# 前端：Ctrl+C 停止后重新运行
npm run dev
```

### Q: 生产环境数据如何同步到开发环境？

**A:** 本项目当前使用内存存储，重启后数据丢失。如需保留数据：

1. 前端数据存储在 `localStorage` 中
2. 可使用浏览器开发者工具导出/导入 localStorage 数据
3. 后端数据暂未持久化（生产环境建议接入数据库）

---

## 环境切换清单

从生产环境切换到开发环境时，请确认：

- [ ] 前端 `.env.development` 已配置，`VITE_API_URL` 指向 `localhost:5000`
- [ ] 后端 `.env` 中 `FLASK_ENV=development` 和 `FLASK_DEBUG=True`
- [ ] 后端 `.env` 中 `CORS_ORIGINS` 包含本地开发地址
- [ ] 使用 `npm run dev` 而非构建后的静态文件
- [ ] 后端使用 `python app.py` 直接启动而非生产服务器

从开发环境切换到生产环境时，请确认：

- [ ] 前端已执行 `npm run build`，使用 `build/` 目录静态文件
- [ ] 后端 `.env` 中 `FLASK_ENV=production` 和 `FLASK_DEBUG=False`
- [ ] 后端 `.env` 中 `SECRET_KEY` 已更换为强随机密钥
- [ ] 后端 `.env` 中 `CORS_ORIGINS` 仅包含生产域名
- [ ] 后端使用生产服务器（如 Gunicorn + Nginx）部署
