# 启动指南 - Task Breakdown Tool

本文档说明如何同时启动前端和后端服务。

## 前置要求

- **Node.js** >= 18.0.0
- **Python** >= 3.9
- **硅基流动 API Key** (获取地址: https://cloud.siliconflow.cn/account/ak)

---

## 一、后端启动

### 1. 安装 Python 依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制配置文件
cp .env.example .env
```

编辑 `.env` 文件，填写你的 API Key：

```env
SILICONFLOW_API_KEY=sk-xxxxxxxxxxxxxxxxxx
```

其他配置保持默认即可：
```env
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
# 多Agent模型配置
MODEL_ANALYSIS=inclusionAI/Ling-flash-2.0
MODEL_GENERATION=moonshotai/Kimi-K2-Thinking
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. 启动后端服务

```bash
# 在 backend 目录下
python app.py
```

看到以下输出表示启动成功：
```
 * Running on http://0.0.0.0:5000
 * Press CTRL+C to quit
```

**后端地址**: http://localhost:5000

---

## 二、前端启动

### 1. 打开新终端，安装依赖

```bash
# 回到项目根目录
cd ..
npm install
```

### 2. 启动前端服务

```bash
npm run dev
```

看到以下输出表示启动成功：
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**前端地址**: http://localhost:5173

---

## 三、完整启动流程（推荐）

### 方式 1：两个终端窗口

**终端 1 - 后端**:
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**终端 2 - 前端**:
```bash
npm install
npm run dev
```

### 方式 2：使用 concurrently（Windows/Mac/Linux 通用）

1. 在项目根目录安装：
```bash
npm install -D concurrently
```

2. 在 `package.json` 的 `scripts` 中添加：
```json
"dev:all": "concurrently \"cd backend && python app.py\" \"npm run dev\""
```

3. 一键启动：
```bash
npm run dev:all
```

---

## 四、验证服务

### 1. 检查后端健康状态

```bash
curl http://localhost:5000/
```

预期返回：
```json
{"status": "ok", "service": "Task Breakdown API", ...}
```

### 2. 访问前端页面

浏览器打开：http://localhost:5173

应该能看到任务拆解工具的首页。

---

## 五、常见问题

### 问题 1：后端启动失败 - `ModuleNotFoundError`

```bash
# 确保在 backend 目录下安装依赖
cd backend
pip install -r requirements.txt
```

### 问题 2：前端请求后端报错 - `CORS` 或 `Network Error`

1. 确认后端已启动（http://localhost:5000 可访问）
2. 检查 `.env` 中的 `CORS_ORIGINS` 包含前端端口
3. 检查前端 API 请求地址是否正确

### 问题 3：AI 调用失败 - `API Key 无效`

1. 确认 `.env` 中的 `SILICONFLOW_API_KEY` 已正确填写
2. 去硅基流动控制台确认 API Key 有效且有余额
3. 检查网络是否正常

### 问题 4：端口被占用

**后端端口 5000 被占用**：
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <进程ID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

**前端端口 5173 被占用**：
```bash
# 使用其他端口启动
npm run dev -- --port 3000
```

---

## 六、目录结构

```
Task Breakdown Tool/
├── backend/              # 后端服务
│   ├── .env             # 后端环境配置（需要自己创建）
│   ├── app.py           # Flask 主应用
│   ├── requirements.txt # Python 依赖
│   └── ...
├── src/                 # 前端源码
│   ├── pages/
│   ├── components/
│   └── ...
├── package.json         # 前端依赖配置
├── vite.config.ts       # Vite 配置
└── index.html           # 入口文件
```

---

## 七、开发调试

### 后端调试
- 修改 `app.py` 后，Flask 会自动重启（`FLASK_DEBUG=True`）
- 查看 API 返回：浏览器访问 http://localhost:5000/api/breakdown（需 POST）

### 前端调试
- 修改 `src/` 下文件后，Vite 会自动热更新
- 打开浏览器控制台查看网络请求

---

## 八、停止服务

- **后端**: 在后端终端按 `Ctrl + C`
- **前端**: 在前端终端按 `Ctrl + C`
