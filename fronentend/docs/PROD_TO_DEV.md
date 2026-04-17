# 生产环境转开发环境配置指南

本文档说明如何将 mono 项目从生产环境配置切换为开发环境配置。

---

## 项目结构

```
Task/
├── Kimi_Agent_mono/          # 前端项目（React + Vite）
│   └── app/                   # 前端源码目录
│       ├── src/
│       ├── .env.example       # 环境变量示例
│       └── vite.config.ts
├── backend/                   # 后端项目（Flask）
│   ├── .env.example
│   └── app.py
└── docs/
```

---

## 一、前端配置

### 1. 环境变量配置

在 `Kimi_Agent_mono/app/` 目录下创建 `.env` 文件：

```bash
cd Kimi_Agent_mono/app
cp .env.example .env
```

编辑 `.env` 文件：

```env
# ================================
# 后端 API 配置
# ================================
# 开发环境后端地址
VITE_API_URL=http://localhost:5000

# ================================
# Supabase 配置（用户认证/数据库）
# ================================
# 从 Supabase 项目设置中获取
# 开发环境可以使用开发专用的 Supabase 项目
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Supabase 项目配置

**创建开发环境 Supabase 项目：**

1. 访问 [https://supabase.com](https://supabase.com)
2. 创建新项目（建议命名为 `mono-dev`）
3. 进入项目设置 → API，获取：
   - Project URL
   - `anon` / `public` Key

**配置数据库表：**

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 用户配置表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  phone TEXT,
  email TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'monthly', 'yearly')),
  daily_quota INTEGER DEFAULT 0,
  daily_used INTEGER DEFAULT 0,
  last_reset_date DATE,
  total_purchased INTEGER DEFAULT 10,
  total_purchased_used INTEGER DEFAULT 0,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订阅购买记录表
CREATE TABLE subscription_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('monthly', 'yearly', 'pack_20', 'pack_100')),
  amount NUMERIC,
  currency TEXT DEFAULT 'CNY',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method TEXT CHECK (payment_method IN ('wechat', 'alipay')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 使用日志表
CREATE TABLE usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT,
  tokens_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS（行级安全）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- 允许用户查看和修改自己的数据
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

**启用手机号登录：**

在 Supabase 项目设置中：
1. Authentication → Providers
2. 启用 `Phone` provider
3. 配置短信服务商（如阿里云、腾讯云）

---

## 二、后端配置

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
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

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

## 三、启动开发服务

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
cd Kimi_Agent_mono/app
npm install  # 首次运行需要安装依赖
npm run dev
```

前端服务将在 `http://localhost:5173` 启动。

### 方式二：同时启动（推荐）

在项目根目录同时启动前后端（需要两个终端）：

```bash
# 终端1 - 后端
cd backend && python app.py

# 终端2 - 前端
cd Kimi_Agent_mono/app && npm run dev
```

---

## 四、验证配置

### 1. 检查后端 API

访问 `http://localhost:5000`，应返回健康检查响应：

```json
{
  "status": "ok",
  "message": "Task Breakdown API is running"
}
```

### 2. 检查前端页面

访问 `http://localhost:5173`，应正常显示 mono 应用首页。

### 3. 检查 Supabase 连接

打开浏览器开发者工具（F12），切换到 Console 标签：

```javascript
// 检查 Supabase 是否正确配置
import { supabase } from './src/lib/supabase.ts'
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Client:', supabase)
```

### 4. 测试登录功能

1. 访问 `http://localhost:5173/login`
2. 输入手机号（需确保 Supabase 短信服务已配置）
3. 验证是否能收到验证码并登录

---

## 五、常见问题

### Q: 前端无法连接后端 API？

**A:** 检查以下配置：

1. 后端服务是否已启动（访问 `http://localhost:5000` 确认）
2. 前端 `.env` 中的 `VITE_API_URL` 是否正确
3. 后端 `.env` 中的 `CORS_ORIGINS` 是否包含前端地址

### Q: CORS 错误？

**A:** 确保后端 `.env` 文件中：

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Q: 登录时发送验证码失败？

**A:** 检查：

1. Supabase 项目是否启用了 Phone provider
2. 是否配置了短信服务商（开发环境可以使用 Supabase 内置测试功能）
3. `.env` 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 是否正确

### Q: Supabase 连接失败？

**A:** 确认：

1. Supabase 项目状态是否为 Active
2. API Key 是否过期
3. 浏览器控制台是否有具体错误信息

### Q: 修改环境变量后不生效？

**A:** 完全重启服务：

```bash
# 前端：Ctrl+C 停止后重新运行
npm run dev

# 后端：Ctrl+C 停止后重新运行
python app.py
```

**注意：** 修改 `.env` 文件后，Vite 需要完全重启才能加载新的环境变量。

---

## 六、环境切换清单

### 从生产环境切换到开发环境

- [ ] 前端 `.env` 已配置，`VITE_API_URL=http://localhost:5000`
- [ ] 前端 `.env` 中 Supabase 配置指向开发环境项目
- [ ] 后端 `.env` 中 `FLASK_ENV=development` 和 `FLASK_DEBUG=True`
- [ ] 后端 `.env` 中 `CORS_ORIGINS` 包含本地开发地址
- [ ] 使用 `npm run dev` 启动前端开发服务器
- [ ] 后端使用 `python app.py` 直接启动

### 从开发环境切换到生产环境

- [ ] 前端已执行 `npm run build`，部署 `dist/` 目录静态文件
- [ ] 前端 `.env` 中 `VITE_API_URL` 指向生产后端地址
- [ ] 前端 `.env` 中 Supabase 配置指向生产环境项目
- [ ] 后端 `.env` 中 `FLASK_ENV=production` 和 `FLASK_DEBUG=False`
- [ ] 后端 `.env` 中 `SECRET_KEY` 已更换为强随机密钥
- [ ] 后端 `.env` 中 `CORS_ORIGINS` 仅包含生产域名
- [ ] 后端使用生产服务器（如 Gunicorn + Nginx）部署
- [ ] Supabase 生产环境已正确配置 RLS 策略

---

## 七、附录：生产环境部署参考

### 前端构建

```bash
cd Kimi_Agent_mono/app
npm run build
# 构建产物在 dist/ 目录
```

### 后端生产启动

```bash
cd backend
# 使用 Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/Kimi_Agent_mono/app/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
