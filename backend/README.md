# Task Breakdown Tool - Backend API

基于 Flask 的任务拆解工具后端服务，使用硅基流动 AI 模型进行智能任务拆解。

## 功能特性

- 📋 接收前端表单数据，生成多层级任务拆解
- 🤖 集成硅基流动 AI 模型（支持 Qwen、DeepSeek 等）
- 📅 生成年度、季度、月度、周度、日度任务
- ❓ 根据任务拆解结果生成补充问题
- 🔄 支持根据补充问题答案重新生成任务

## 项目结构

```
backend/
├── .env                # 环境配置（需要自行创建）
├── .env.example        # 环境配置示例
├── .gitignore
├── app.py              # Flask 主应用
├── requirements.txt    # Python 依赖
├── models/
│   ├── __init__.py
│   └── schema.py       # 数据模型定义
└── services/
    ├── __init__.py
    └── ai_service.py   # AI 服务层
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 硅基流动 API 配置
# 获取 API Key: https://cloud.siliconflow.cn/account/ak
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# 多Agent模型配置
# Agent 1-3 (任务类型/经验水平/时间跨度分析) - 使用快速模型
MODEL_ANALYSIS=inclusionAI/Ling-flash-2.0
# Agent 4-5 (补充问题/任务拆解) - 使用思考模型
MODEL_GENERATION=moonshotai/Kimi-K2-Thinking

# Flask 配置
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-change-this

# CORS 配置
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. 启动服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动。

## API 接口

### 1. 健康检查

```
GET /
```

### 2. 创建任务拆解

```
POST /api/breakdown

Request Body:
{
    "form_data": {
        "goal": "一个月内完成博物馆网页开发",
        "has_deadline": "yes",
        "deadline": "2025-04-01",
        "experience": "beginner",
        "importance": 4,
        "daily_hours": "2",
        "working_days": ["周一", "周二", "周三", "周四", "周五"],
        "blockers": "时间紧张，技能不足",
        "resources": "已完成基础课程学习",
        "expectations": ["提升专业技能", "完成作品集"]
    }
}

Response:
{
    "success": true,
    "data": {
        "project_id": "uuid",
        "tasks": {
            "yearly": [...],
            "quarterly": {...},
            "monthly": {...},
            "weekly": {...},
            "daily": {...}
        },
        "follow_up_questions": [...],
        "created_at": "2025-01-28T..."
    }
}
```

### 3. 获取项目详情

```
GET /api/projects/{project_id}
```

### 4. 更新补充问题答案

```
POST /api/projects/{project_id}/answers

Request Body:
{
    "answers": {
        "q1": "我更喜欢视频教程",
        "q2": ["技能指导", "资源推荐"]
    }
}
```

### 5. 重新生成任务

```
POST /api/projects/{project_id}/regenerate

Request Body:
{
    "answers": {
        "q1": "我更喜欢视频教程"
    }
}
```

### 6. 获取所有项目

```
GET /api/projects
```

## 硅基流动模型支持

本服务使用多Agent架构，不同Agent使用不同模型：

| Agent | 职责 | 默认模型 | 配置项 |
|-------|------|----------|--------|
| Agent 1 | 任务类型分析 | `inclusionAI/Ling-flash-2.0` | `MODEL_ANALYSIS` |
| Agent 2 | 经验水平评估 | `inclusionAI/Ling-flash-2.0` | `MODEL_ANALYSIS` |
| Agent 3 | 时间跨度判断 | `inclusionAI/Ling-flash-2.0` | `MODEL_ANALYSIS` |
| Agent 4 | 补充问题生成 | `moonshotai/Kimi-K2-Thinking` | `MODEL_GENERATION` |
| Agent 5 | 任务拆解 | `moonshotai/Kimi-K2-Thinking` | `MODEL_GENERATION` |

可在 `.env` 中自定义模型：

- 快速模型选项：`inclusionAI/Ling-flash-2.0`, `Qwen/Qwen2.5-7B-Instruct`
- 思考模型选项：`moonshotai/Kimi-K2-Thinking`, `Qwen/Qwen2.5-72B-Instruct`, `deepseek-ai/DeepSeek-V3`
- 更多模型请参考：https://docs.siliconflow.cn/

## 开发说明

- 当前版本使用内存存储，重启后数据会丢失
- 生产环境建议接入数据库（如 SQLite、PostgreSQL）
- 可添加 JWT 认证保护 API 接口
- 建议添加日志记录和错误监控

## 错误处理

API 返回标准 HTTP 状态码：

- `200` - 成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

错误响应格式：

```json
{
    "error": "错误描述",
    "message": "用户友好的错误信息"
}
```
