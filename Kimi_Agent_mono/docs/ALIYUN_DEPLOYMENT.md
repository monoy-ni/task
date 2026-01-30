# mono 应用阿里云部署方案

## 目录

1. [架构概览](#架构概览)
2. [服务清单](#服务清单)
3. [前置准备](#前置准备)
4. [后端部署（ECS）](#后端部署ecs)
5. [前端部署（OSS + CDN）](#前端部署oss--cdn)
6. [域名与SSL配置](#域名与ssl配置)
7. [监控与日志](#监控与日志)
8. [成本估算](#成本估算)

---

## 架构概览

```
                          ┌─────────────┐
                          │   用户访问   │
                          └──────┬──────┘
                                 │
                    ┌────────────┴────────────┐
                    │     阿里云 CDN (HTTPS)   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼──────────┐  ┌──────────▼──────────┐
         │    静态资源 (OSS)    │  │    API请求          │
         │  前端构建产物        │  │    转发到后端       │
         └─────────────────────┘  └──────────┬──────────┘
                                             │
                                  ┌──────────▼──────────┐
                                  │   ECS (后端服务)    │
                                  │   + Nginx 反向代理  │
                                  │   + Gunicorn        │
                                  │   + Flask App       │
                                  └──────────┬──────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
         ┌──────────▼──────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
         │   Supabase Cloud    │  │  硅基流动 API     │  │   (可选) RDS      │
         │   用户认证 + 数据库  │  │  AI 模型服务      │  │   持久化存储      │
         └─────────────────────┘  └───────────────────┘  └───────────────────┘
```

---

## 服务清单

### 核心服务

| 服务 | 用途 | 配置建议 |
|------|------|----------|
| **ECS** | 后端 API 服务 | 2核4GB，按量付费或包年包月 |
| **OSS** | 前端静态文件存储 | 标准存储，40GB 起步 |
| **CDN** | 加速访问 + HTTPS | 按流量计费 |
| **域名** | 访问入口 | 已有域名或在阿里云购买 |

### 可选服务

| 服务 | 用量 | 说明 |
|------|------|------|
| **RDS MySQL** | 数据持久化 | 替代后端内存存储 |
| **SLB** | 负载均衡 | 多实例部署时使用 |
| **云监控** | 服务监控 | 免费版即可 |

### 第三方服务

| 服务 | 用途 |
|------|------|
| **Supabase** | 用户认证 + 数据库 |
| **硅基流动** | AI 模型 API |

---

## 前置准备

### 1. 购买阿里云 ECS

**推荐配置：**

| 项目 | 规格 |
|------|------|
| 实例规格 | 2核4GB (ecs.t6-c1m2.large 或更高) |
| 操作系统 | Ubuntu 22.04 64位 |
| 网络类型 | 专有网络 VPC |
| 公网带宽 | 按使用付费（3-5Mbps） |

**安全组配置：**

```
入方向规则：
- SSH 22          : 你的IP/32        (用于远程登录)
- HTTP 80         : 0.0.0.0/0        (临时测试用)
- HTTPS 443       : 0.0.0.0/0        (生产环境)
- 自定义 5000     : 127.0.0.1/32     (后端服务，仅本地访问)
```

### 2. 域名准备

```
your-domain.com          # 主域名
api.your-domain.com      # API 子域名（可选，也可用路径区分）
www.your-domain.com      # 前端访问域名
```

### 3. 本地工具准备

```bash
# 确保本地安装了 SSH 客户端
ssh -V

# 安装 SCP 工具（用于文件传输）
# Windows: 使用 WinSCP 或 PowerShell 的 scp 命令
# Mac/Linux: 系统自带
```

---

## 后端部署（ECS）

### 1. 登录服务器

```bash
# 替换为你的 ECS 公网 IP
ssh root@your-ecs-ip

# 或使用密钥对登录
ssh -i /path/to/key.pem root@your-ecs-ip
```

### 2. 安装基础环境

```bash
# 更新系统
apt update && apt upgrade -y

# 安装必要工具
apt install -y python3 python3-pip python3-venv nginx git certbot

# 创建应用目录
mkdir -p /var/www/mono
cd /var/www/mono
```

### 3. 上传后端代码

**方式一：使用 Git（推荐）**

```bash
# 如果代码在 Git 仓库
git clone https://your-repo-url.git backend
cd backend
```

**方式二：使用 SCP 上传**

```bash
# 在本地执行，替换为你的 ECS IP
cd /d/Task/task
scp -r backend root@your-ecs-ip:/var/www/mono/
```

### 4. 配置 Python 环境

```bash
cd /var/www/mono/backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 安装 Gunicorn（生产服务器）
pip install gunicorn
```

### 5. 配置生产环境变量

```bash
# 创建生产环境配置
nano .env.production
```

```env
# 硅基流动 API 配置
SILICONFLOW_API_KEY=your_production_api_key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# 模型配置
MODEL_ANALYSIS=inclusionAI/Ling-flash-2.0
MODEL_GENERATION=moonshotai/Kimi-K2-Thinking

# Flask 生产环境配置
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=生成的强随机密钥_用下方命令生成

# CORS 配置（生产域名）
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# 日志级别
LOG_LEVEL=INFO

# 服务端口
PORT=5000
```

**生成强随机密钥：**

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 6. 创建 Systemd 服务

```bash
nano /etc/systemd/system/mono-api.service
```

```ini
[Unit]
Description=mono API Service
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/mono/backend
Environment="PATH=/var/www/mono/backend/venv/bin"
EnvironmentFile=/var/www/mono/backend/.env.production
ExecStart=/var/www/mono/backend/venv/bin/gunicorn \
    --workers 2 \
    --bind 127.0.0.1:5000 \
    --timeout 120 \
    --access-logfile /var/log/mono/access.log \
    --error-logfile /var/log/mono/error.log \
    --log-level info \
    app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 创建日志目录
mkdir -p /var/log/mono
chown www-data:www-data /var/log/mono

# 启动服务
systemctl daemon-reload
systemctl enable mono-api
systemctl start mono-api

# 检查状态
systemctl status mono-api
```

### 7. 配置 Nginx 反向代理

```bash
nano /etc/nginx/sites-available/mono-api
```

```nginx
# API 反向代理配置
server {
    listen 80;
    server_name api.your-domain.com your-domain.com;

    # API 请求代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置（AI 请求可能较慢）
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # 健康检查端点
    location /health {
        proxy_pass http://127.0.0.1:5000/;
        access_log off;
    }
}
```

```bash
# 启用配置
ln -s /etc/nginx/sites-available/mono-api /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

### 8. 测试后端服务

```bash
# 本地测试
curl http://localhost:5000/

# 应返回
# {"status":"ok","service":"Task Breakdown API",...}
```

---

## 前端部署（OSS + CDN）

### 1. 本地构建前端

```bash
cd D:/Task/task/Kimi_Agent_mono/app

# 安装依赖
npm install

# 创建生产环境配置
cat > .env.production << EOF
VITE_API_URL=https://api.your-domain.com
VITE_SUPABASE_URL=你的生产Supabase URL
VITE_SUPABASE_ANON_KEY=你的生产Supabase Anon Key
EOF

# 构建
npm run build
```

### 2. 开通阿里云 OSS

1. 登录阿里云控制台
2. 进入「对象存储 OSS」
3. 创建 Bucket：
   - Bucket 名称：`mono-frontend`（全局唯一）
   - 区域：选择与 ECS 相同区域
   - 存储类型：标准存储
   - 读写权限：**公共读**

### 3. 上传构建产物

**方式一：使用 OSS 控制台**

1. 进入 Bucket → 文件管理
2. 上传 `app/dist/` 目录下所有文件
3. 将 `index.html` 等文件直接放在根目录

**方式二：使用 ossutil（推荐）**

```bash
# 在 ECS 上安装 ossutil
wget http://gosspublic.alicdn.com/ossutil/1.7.15/ossutil64
chmod 755 ossutil64
sudo mv ossutil64 /usr/local/bin/ossutil

# 配置 ossutil
ossutil config

# 根据提示配置：
# - Endpoint: 如 oss-cn-hangzhou.aliyuncs.com
# - AccessKeyID: 你的 AccessKey
# - AccessKeySecret: 你的 AccessSecret

# 上传构建产物（在本地执行）
# 或者先上传到 ECS 再从 ECS 上传到 OSS
```

### 4. 配置 CDN 加速

1. 进入「CDN」控制台
2. 添加域名：
   - 加速域名：`www.your-domain.com`
   - 业务类型：图片小文件
   - 源站信息：OSS 域名（如 `mono-frontend.oss-cn-hangzhou.aliyuncs.com`）
3. 配置完成后，CDN 会生成一个 CNAME 记录

### 5. 配置域名解析

在「云解析 DNS」控制台：

```
A 记录：
@     -> your-ecs-ip          (主域名指向服务器)
api   -> your-ecs-ip          (API 子域名)
www   -> cdn-cname-record     (前端 CDN 加速)
```

### 6. 配置 HTTPS（SSL 证书）

**方式一：使用 Let's Encrypt 免费证书**

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 自动配置 Nginx HTTPS
certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# 自动续期（已自动添加 cron）
certbot renew --dry-run
```

**方式二：使用阿里云免费 SSL**

1. 进入「SSL 证书」控制台
2. 申请免费证书（3个月有效期，需续期）
3. 下载 Nginx 版本证书
4. 上传到服务器 `/etc/nginx/ssl/`
5. 修改 Nginx 配置：

```nginx
server {
    listen 443 ssl http2;
    server_name www.your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # 前端重定向到 OSS/CDN 或直接托管
    location / {
        root /var/www/mono/frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 域名与SSL配置

### 完整的 Nginx 配置示例

```bash
nano /etc/nginx/sites-available/mono-complete
```

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# 主站 HTTPS（前端）
server {
    listen 443 ssl http2;
    server_name www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    # 前端静态文件（从 OSS 拉取或本地托管）
    location / {
        proxy_pass https://mono-frontend.oss-cn-hangzhou.aliyuncs.com;
        proxy_set_header Host mono-frontend.oss-cn-hangzhou.aliyuncs.com;
        proxy_cache_valid 200 1h;
    }

    # API 请求代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}

# API 子域名（可选，独立配置）
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

---

## 监控与日志

### 1. 配置日志轮转

```bash
nano /etc/logrotate.d/mono
```

```
/var/log/mono/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload mono-api > /dev/null 2>&1 || true
    endscript
}
```

### 2. 设置阿里云云监控

1. 进入「云监控」控制台
2. 主机监控 → 安装监控插件
3. 配置告警规则：
   - CPU 使用率 > 80%
   - 内存使用率 > 85%
   - 磁盘使用率 > 90%

---

## 成本估算（月费用）

### 小型部署（适合初期）

| 项目 | 规格 | 估算费用 |
|------|------|----------|
| ECS | 2核4GB，按量付费 | ¥80-120 |
| OSS | 40GB 标准存储 + 请求次数 | ¥5-10 |
| CDN | 100GB 流量 | ¥20-30 |
| 域名 | .com 一年 | ¥50-80 /年 |
| SSL | Let's Encrypt | 免费 |
| **合计** | | **¥105-160/月** |

### 优化建议

1. **ECS 包年包月**：比按量付费便宜 40-60%
2. **CDN 按需开通**：流量较小时可不使用 CDN
3. **OSS 使用低频存储**：不常访问的资源可使用低频存储

---

## 部署检查清单

### 后端部署

- [ ] ECS 已购买并可 SSH 登录
- [ ] Python 环境已配置
- [ ] 代码已上传到服务器
- [ ] `.env.production` 已配置
- [ ] Systemd 服务已创建并启动
- [ ] Nginx 反向代理已配置
- [ ] API 健康检查正常

### 前端部署

- [ ] 前端已构建（`npm run build`）
- [ ] OSS Bucket 已创建
- [ ] 构建产物已上传到 OSS
- [ ] CDN 已配置（可选）
- [ ] 域名解析已配置
- [ ] HTTPS 证书已配置

### 验证测试

- [ ] `https://www.your-domain.com` 可访问前端
- [ ] `https://api.your-domain.com/health` 返回正常
- [ ] 用户登录注册功能正常
- [ ] 任务拆解功能正常

---

## 常见问题

### Q: ECS 连接不上？

```bash
# 检查安全组规则
# 确保开放了 SSH 22 端口

# 检查实例状态
# 在 ECS 控制台确认实例为「运行中」
```

### Q: 502 Bad Gateway？

```bash
# 检查后端服务状态
systemctl status mono-api

# 查看后端日志
tail -f /var/log/mono/error.log

# 检查端口是否正常
netstat -tlnp | grep 5000
```

### Q: CORS 错误？

检查后端 `.env.production` 中的 `CORS_ORIGINS` 是否包含前端域名。

### Q: 静态文件 404？

检查 OSS Bucket 权限是否为「公共读」，或检查 Nginx 配置。
