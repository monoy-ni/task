#!/bin/bash
# 阿里云部署脚本
# 在服务器上执行此脚本

set -e

echo "=========================================="
echo "开始部署 mono 项目到阿里云"
echo "=========================================="

# 1. 更新系统并安装必要工具
echo ">>> [1/7] 更新系统并安装必要工具..."
yum update -y || apt-get update -y
yum install -y git curl wget || apt-get install -y git curl wget

# 2. 安装 Node.js 18.x
echo ">>> [2/7] 安装 Node.js 18.x..."
if command -v yum &> /dev/null; then
    # CentOS/RHEL
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
else
    # Ubuntu/Debian
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

node --version
npm --version

# 3. 安装 Python 3.10+
echo ">>> [3/7] 检查 Python 版本..."
python3 --version

# 安装 pip
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py

# 4. 创建项目目录
echo ">>> [4/7] 创建项目目录..."
mkdir -p /www/wwwroot
cd /www/wwwroot

# 5. 克隆或更新代码
echo ">>> [5/7] 获取代码..."
if [ -d "task" ]; then
    echo "项目已存在，正在更新..."
    cd task
    git pull
else
    echo "克隆项目..."
    # TODO: 替换为你的 Git 仓库地址
    # git clone https://your-repo.git task
    echo "请手动上传代码到 /www/wwwroot/task"
fi

# 6. 安装后端依赖
echo ">>> [6/7] 安装后端依赖..."
cd /www/wwwroot/task/backend
pip3 install -r requirements.txt

# 7. 配置环境变量
echo ">>> [7/7] 配置环境变量..."
cat > .env << 'EOF'
# 硅基流动 API 配置
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# 模型配置
MODEL_ANALYSIS=inclusionAI/Ling-flash-2.0
MODEL_GENERATION=inclusionAI/Ling-flash-2.0

# Flask 配置
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=change_this_to_random_string
PORT=5000

# CORS 配置 - 修改为你的域名
CORS_ORIGINS=http://60.205.161.213,https://your-domain.com

# 日志级别
LOG_LEVEL=INFO
EOF

echo "=========================================="
echo "部署脚本执行完成！"
echo "=========================================="
echo ""
echo "接下来需要："
echo "1. 上传代码到 /www/wwwroot/task"
echo "2. 修改 backend/.env 中的配置"
echo "3. 构建前端（在本地执行 npm run build）"
echo "4. 启动后端服务"
echo ""
