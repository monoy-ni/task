# 阿里云 + 宝塔面板部署指南

## 服务器信息
- 外网面板: https://60.205.161.213:12624/74a086f2
- 内网面板: https://172.20.46.4:12624/74a086f2
- 用户名: ce2lnjp4

---

## 第一步：登录宝塔面板

1. 浏览器访问 `https://60.205.161.213:12624/74a086f2`
2. 输入用户名和密码登录
3. 首次登录会提示安装套件，选择 **LNMP** 或 **LAMP**
   - Nginx（推荐）
   - MySQL 5.7+
   - PHP 7.4+（不需要但可以装）
   - pm2（Node.js 管理）

---

## 第二步：安装必要软件

在宝塔面板 **软件商店** 安装：

| 软件 | 版本 | 用途 |
|------|------|------|
| Nginx | 最新版 | 反向代理 + 静态文件 |
| Python项目管理器 | 最新版 | 后端 Flask |
| pm2 | 最新版 | Node.js 进程管理 |
| Node.js | 18.x+ | 前端构建 |

---

## 第三步：部署后端 (Flask)

### 3.1 上传代码

1. 点击左侧 **文件**
2. 进入 `/www/wwwroot/`
3. 新建文件夹 `backend`
4. 将 `backend/` 目录下所有文件上传到此文件夹

### 3.2 配置 Python 项目

1. 点击左侧 **Python项目管理器**
2. 点击 **添加项目**
3. 填写配置：
   ```
   项目名称: mono-backend
   项目路径: /www/wwwroot/backend
   Python版本: 3.10+
   框架: Flask
   启动文件: wsgi.py
   端口: 5000
   ```
4. 点击 **提交**

### 3.3 安装依赖

在项目列表中：
1. 找到 `mono-backend`
2. 点击 **模块**
3. 点击 **pip安装**
4. 输入：
   ```
   -r requirements.txt
   ```

### 3.4 配置环境变量

1. 编辑 `/www/wwwroot/backend/.env`
2. 修改 `CORS_ORIGINS` 为你的域名：
   ```
   CORS_ORIGINS=https://your-domain.com
   ```

### 3.5 启动后端

点击项目右侧的 **启动** 按钮

---

## 第四步：部署前端 (React + Vite)

### 4.1 本地构建前端

```bash
cd Kimi_Agent_mono/app

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 4.2 上传构建文件

1. 将 `dist/` 文件夹打包成 `dist.zip`
2. 在宝塔 **文件** 中进入 `/www/wwwroot/`
3. 新建文件夹 `mono`
4. 上传并解压 `dist.zip` 到此文件夹

### 4.3 配置 Nginx

1. 点击左侧 **网站**
2. 点击 **添加站点**
3. 填写配置：
   ```
   域名: your-domain.com (或直接用IP)
   根目录: /www/wwwroot/mono
   PHP版本: 纯静态
   ```
4. 点击 **提交**

### 4.5 配置反向代理（重要！）

1. 在网站列表中找到站点，点击 **设置**
2. 点击 **反向代理**
3. 点击 **添加反向代理**
4. 填写配置：
   ```
   代理名称: api
   目标URL: http://127.0.0.1:5000
   ```
5. 点击 **提交**

### 4.6 修改 Nginx 配置

在 **配置文件** 中添加：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 第五步：配置安全组

在阿里云控制台：

1. 进入 **ECS实例** → **安全组**
2. 添加入方向规则：
   - 端口 80/443（HTTP/HTTPS）
   - 端口 12624（宝塔面板）
   - 端口 5000（后端，可选，建议内网访问）

---

## 第六步：配置 SSL（可选）

1. 在宝塔 **网站设置** → **SSL**
2. 选择 **Let's Encrypt**
3. 申请免费证书
4. 开启 **强制HTTPS**

---

## 常见问题

### 后端启动失败
```bash
# 检查日志
tail -f /www/wwwroot/backend/logs/log.log
```

### 前端刷新后 404
检查 Nginx 配置中是否有 `try_files $uri $uri/ /index.html;`

### CORS 跨域错误
检查后端 `.env` 中的 `CORS_ORIGINS` 是否包含前端域名

### API 请求失败
1. 检查反向代理配置
2. 检查后端服务是否启动
3. 检查 Nginx 错误日志：**网站** → **日志**

---

## 目录结构

```
/www/wwwroot/
├── backend/           # 后端代码
│   ├── app.py
│   ├── wsgi.py
│   ├── requirements.txt
│   └── .env
└── mono/             # 前端构建文件
    ├── index.html
    └── assets/
```

---

## 更新部署

### 后端更新
```bash
# 在宝塔终端中
cd /www/wwwroot/backend
git pull  # 或重新上传文件
# 重启项目
```

### 前端更新
```bash
# 本地重新构建
npm run build

# 重新上传 dist/ 文件夹
```
