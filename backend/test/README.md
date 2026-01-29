# AI 服务测试模块

这是用于独立测试各个 Agent 功能的测试模块集合。

## 目录结构

```
test/
├── __init__.py                 # 包初始化文件
├── test_agent1_task_type.py   # Agent 1: 任务类型分析
├── test_agent2_experience.py   # Agent 2: 经验水平评估
├── test_agent3_time_span.py    # Agent 3: 时间跨度判断
├── test_agent4_questions.py    # Agent 4: 补充问题生成
├── test_agent5_breakdown.py    # Agent 5: 任务拆解
├── test_full_pipeline.py       # 完整流程测试
├── run_tests.py                # 测试运行器
└── README.md                   # 本文件
```

## 快速开始

### 方法 1: 使用测试运行器（推荐）

```bash
# 进入 backend 目录
cd D:\Task\ Breakdown\ Tool\backend

# 运行测试运行器（交互模式）
python -m test.run_tests

# 或直接运行特定测试
python -m test.run_tests 1    # 测试 Agent 1
python -m test.run_tests 2    # 测试 Agent 2
python -m test.run_tests 6    # 测试完整流程
```

### 方法 2: 直接运行单个测试模块

```bash
# 进入 backend 目录
cd D:\Task\ Breakdown\ Tool\backend

# 测试 Agent 1: 任务类型分析
python -m test.test_agent1_task_type

# 测试 Agent 2: 经验水平评估
python -m test.test_agent2_experience

# 测试 Agent 3: 时间跨度判断
python -m test.test_agent3_time_span

# 测试 Agent 4: 补充问题生成
python -m test.test_agent4_questions

# 测试 Agent 5: 任务拆解
python -m test.test_agent5_breakdown

# 测试完整流程
python -m test.test_full_pipeline
```

## 各模块说明

### Agent 1: 任务类型分析 (test_agent1_task_type.py)

分析目标属于哪种任务类型。

**测试用例:**
- 一个月内完成博物馆网页开发
- 三个月学会吉他弹唱
- 半年减肥10公斤
- 一年内通过CPA考试
- 读完20本技术书籍

### Agent 2: 经验水平评估 (test_agent2_experience.py)

评估用户在某个领域的经验水平。

**测试用例:**
- 网页开发 + beginner
- 吉他弹唱 + intermediate
- React Native开发 + expert

### Agent 3: 时间跨度判断 (test_agent3_time_span.py)

判断应该用什么时间跨度来拆解任务。

**测试用例:**
- 无截止期限的项目
- 有截止日期的短期项目
- 长期备考项目

### Agent 4: 补充问题生成 (test_agent4_questions.py)

生成高价值的补充问题。

**测试用例:**
- 完整的表单数据 + AI分析结果

### Agent 5: 任务拆解 (test_agent5_breakdown.py)

将目标拆解成可执行的分层任务。

**测试用例:**
- 网页开发项目

### 完整流程测试 (test_full_pipeline.py)

测试所有 Agents 的协同工作，模拟真实的任务拆解流程。

**流程:**
1. 第一阶段：Agent 1-3 并行分析
2. 第二阶段：Agent 4-5 并行生成

**输出:**
- 控制台输出详细日志
- 结果保存到 `output_result.json`

## 注意事项

1. **环境配置**: 确保在 `backend` 目录下有 `.env` 文件，配置了 `SILICONFLOW_API_KEY`

2. **依赖安装**: 需要安装以下依赖：
   ```
   openai
   python-dotenv
   ```

3. **超时设置**: Agent 5（任务拆解）可能需要较长时间，超时设置为 300 秒

4. **并发限制**: 完整流程测试使用 ThreadPoolExecutor 实现并行调用，注意 API 的速率限制
