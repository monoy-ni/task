"""
AI 服务 - 使用硅基流动模型生成任务拆解
"""
import os
import json
import uuid
import ssl
from typing import List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv
import httpx

load_dotenv()


class AIService:
    """硅基流动 AI 服务"""

    def __init__(self):
        api_key = os.getenv("SILICONFLOW_API_KEY")
        print(f"[DEBUG] API Key configured: {bool(api_key)}")  # 调试
        print(f"[DEBUG] API Key prefix: {api_key[:8] if api_key else 'None'}...")  # 调试

        # 创建自定义 httpx 客户端，禁用 SSL 证书吊销检查（Windows 上的问题）
        # 在生产环境中，应该正确配置证书而不是禁用验证
        try:
            # 尝试创建一个带有自定义 SSL 上下文的客户端
            self.client = OpenAI(
                api_key=api_key,
                base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1"),
                http_client=httpx.Client(
                    verify=False,  # 临时禁用 SSL 验证以解决 Windows 上的连接问题
                    timeout=120.0
                )
            )
            print("[DEBUG] 使用自定义 HTTP 客户端（SSL 验证已禁用）")
        except Exception as e:
            print(f"[WARNING] 自定义 HTTP 客户端创建失败: {e}")
            print("[DEBUG] 使用默认 HTTP 客户端")
            self.client = OpenAI(
                api_key=api_key,
                base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
            )

        # 不同Agent使用不同的模型
        # 前3个分析Agent使用快速模型
        self.model_analysis = os.getenv("MODEL_ANALYSIS", "inclusionAI/Ling-flash-2.0")
        # 后2个生成Agent使用思考模型
        self.model_generation = os.getenv("MODEL_GENERATION", "moonshotai/Kimi-K2-Thinking")

        print(f"[DEBUG] Analysis model (Agent 1-3): {self.model_analysis}")  # 调试
        print(f"[DEBUG] Generation model (Agent 4-5): {self.model_generation}")  # 调试

    def _call_llm(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        model: str | None = None,
        max_retries: int = 3
    ) -> str:
        """调用 LLM

        Args:
            messages: 消息列表
            temperature: 温度参数
            model: 指定模型，None则使用默认生成模型
            max_retries: 最大重试次数
        """
        if model is None:
            model = self.model_generation

        import time
        from openai import APIConnectionError, APIError, RateLimitError

        # 思考模型需要更长时间，设置 10 分钟超时
        timeout_val = 600.0 if "Thinking" in model or "thinking" in model else 120.0

        last_error = None
        for attempt in range(max_retries):
            try:
                print(f"[DEBUG] 调用 AI 模型: {model} (尝试 {attempt + 1}/{max_retries})")  # 调试
                # 根据模型类型设置不同的 max_tokens
                # Thinking 模型可能需要更多 tokens
                if "Thinking" in model or "thinking" in model:
                    max_t = 16384
                else:
                    max_t = 8192
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_t,
                    timeout=timeout_val,
                )
                print(f"[DEBUG] AI 响应成功")  # 调试
                return response.choices[0].message.content
            except APIConnectionError as e:
                last_error = e
                print(f"[ERROR] 连接错误 (尝试 {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # 指数退避: 1s, 2s, 4s
                    print(f"[INFO] 等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
            except RateLimitError as e:
                last_error = e
                print(f"[ERROR] API 速率限制: {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = 5  # 速率限制时等待更长时间
                    print(f"[INFO] 等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
            except APIError as e:
                last_error = e
                print(f"[ERROR] API 错误: {str(e)}")
                # API 错误通常是服务器问题，值得重试
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"[INFO] 等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
            except Exception as e:
                # 其他类型的错误（如超时、网络中断）也值得重试
                last_error = e
                print(f"[ERROR] 未知错误 (尝试 {attempt + 1}/{max_retries}): {type(e).__name__} - {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"[INFO] 等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)

        # 所有重试都失败后，抛出最后一个错误
        print(f"[ERROR] AI 调用失败：已重试 {max_retries} 次，仍然失败")
        raise RuntimeError(f"AI 调用失败: {str(last_error)}")

    def generate_task_breakdown(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成任务拆解 - 多Agent并行工作"""
        print(f"[DEBUG] 开始多Agent任务拆解")

        # 并行调用多个Agent
        import concurrent.futures

        # 第一阶段：3个分析Agent并行工作
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_type = executor.submit(self._agent_task_type, form_data)
            future_experience = executor.submit(self._agent_experience, form_data)
            future_time = executor.submit(self._agent_time_span, form_data)

            task_type_result = future_type.result()
            experience_result = future_experience.result()
            time_result = future_time.result()

        print(f"[DEBUG] 分析Agent完成:")
        print(f"  - 任务类型: {task_type_result}")
        print(f"  - 经验水平: {experience_result}")
        print(f"  - 时间跨度: {time_result}")

        # 汇总分析结果
        analysis = {
            "task_type": task_type_result,
            "experience_level": experience_result,
            "time_span": time_result
        }

        # 第二阶段：任务拆解Agent和问题生成Agent并行工作
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_tasks = executor.submit(self._agent_breakdown, form_data, analysis)
            future_questions = executor.submit(self._agent_questions, form_data, analysis)

            tasks = future_tasks.result()
            questions_result = future_questions.result()

        print(f"[DEBUG] 生成Agent完成:")
        print(f"  - tasks keys: {list(tasks.keys())}")
        print(f"  - monthly 任务数: {len(tasks.get('monthly', {}))}")
        print(f"  - weekly 任务数: {len(tasks.get('weekly', {}))}")
        print(f"  - daily 任务数: {len(tasks.get('daily', {}))}")
        print(f"  - questions 数量: {len(questions_result)}")

        # 组装结果
        project_id = str(uuid.uuid4())

        return {
            "project_id": project_id,
            "analysis": analysis,
            "tasks": tasks,
            "follow_up_questions": questions_result
        }

    # ==================== Agent 1: 任务类型分析 ====================
    def _agent_task_type(self, form_data: Dict[str, Any]) -> str:
        """Agent 1: 分析任务类型"""
        prompt = f"""分析以下目标属于哪种任务类型，只返回类型名称和简短描述（50字以内）。

目标：{form_data.get('goal', '')}

常见任务类型：
- 技能学习类：学习编程、学习语言、学习乐器等
- 项目开发类：开发网站、开发APP、写毕业论文等
- 健康健身类：减肥、增肌、跑步训练等
- 考试备考类：考研、考公、考证等
- 阅读写作类：读完N本书、写小说等
- 生活目标类：装修房子、旅行规划等

返回格式：类型名称 - 简短描述
例如：技能学习类 - 网页开发"""
        response = self._call_llm([{"role": "user", "content": prompt}], temperature=0.3, model=self.model_analysis)
        # 清理响应
        return response.strip().split('\n')[0][:100]

    # ==================== Agent 2: 经验水平评估 ====================
    def _agent_experience(self, form_data: Dict[str, Any]) -> str:
        """Agent 2: 评估用户经验水平"""
        user_exp = form_data.get('experience', 'beginner')
        goal = form_data.get('goal', '')

        prompt = f"""根据用户的目标和自评经验，给出更精准的经验水平评估。

目标：{goal}
用户自评：{user_exp}

请判断用户在该领域的真实水平，给出简短评估（50字以内）。

返回格式：水平等级 - 具体描述
例如：零基础 - 完全没有编程经验，需要从基础概念开始"""
        response = self._call_llm([{"role": "user", "content": prompt}], temperature=0.3, model=self.model_analysis)
        return response.strip().split('\n')[0][:100]

    # ==================== Agent 3: 时间跨度判断 ====================
    def _agent_time_span(self, form_data: Dict[str, Any]) -> str:
        """Agent 3: 判断时间跨度并确定拆解层级"""
        deadline = form_data.get('deadline')
        daily_hours = form_data.get('daily_hours', '2')
        goal = form_data.get('goal', '')

        if deadline:
            from datetime import datetime
            try:
                deadline_date = datetime.strptime(deadline, '%Y-%m-%d')
                days_left = (deadline_date - datetime.now()).days
                time_info = f"距离截止{days_left}天"
            except:
                time_info = "有截止日期"
        else:
            time_info = "无固定截止日期"

        prompt = f"""根据目标、截止日期和每日可用时间，判断应该用什么时间跨度来拆解任务。

目标：{goal}
时间情况：{time_info}
每日可用：{daily_hours}小时

请判断：
1. 时间跨度：长期(半年以上) / 中期(1-6个月) / 短期(1个月内)
2. 拆解层级：应该用哪些层级（年度/季度/月度/周度/日度）

返回格式：时间跨度 - 拆解层级建议
例如：中期(3个月) - 使用月度+周度+日度三层拆解"""
        response = self._call_llm([{"role": "user", "content": prompt}], temperature=0.3, model=self.model_analysis)
        return response.strip().split('\n')[0][:100]

    # ==================== Agent 4: 补充问题生成 ====================
    def _agent_questions(self, form_data: Dict[str, Any], analysis: Dict[str, str], previous_questions: list = None) -> list:
        """Agent 4: 生成补充问题（基于表单信息和分析结果）

        Args:
            form_data: 表单数据
            analysis: AI分析结果
            previous_questions: 之前生成的问题列表（用于避免重复）

        Returns:
            补充问题列表
        """
        experience_map = {
            "beginner": "初学者",
            "intermediate": "进阶者",
            "expert": "精通者"
        }

        # 检查哪些信息已有，避免重复提问
        has_deadline = bool(form_data.get('deadline'))
        has_daily_hours = bool(form_data.get('daily_hours'))
        has_blockers = bool(form_data.get('blockers') and form_data.get('blockers') != '无')
        has_resources = bool(form_data.get('resources') and form_data.get('resources') != '无')

        # 构建之前问题的摘要（如果有）
        previous_questions_text = ""
        if previous_questions and len(previous_questions) > 0:
            prev_q_list = []
            for q in previous_questions:
                q_text = q.get('question', '')
                # 如果用户已经回答了这个问题，也包括答案
                # 这里我们只需要问题文本来避免重复
                prev_q_list.append(f"- {q_text}")
            previous_questions_text = f"""
## 已问过的问题（请避免重复或高度相似）
{chr(10).join(prev_q_list)}
"""

        prompt = f"""你是补充问题生成器（Follow-up Question Agent）。

## 你的职责
你不负责生成计划，也不负责修改任务；你只负责提出高价值的补充问题，帮助下一步让计划更准确、更可执行。

## 输入信息
{{
  "goal": "{form_data.get('goal', '')}",
  "user_profile": {{
    "experience_level": "{experience_map.get(form_data.get('experience', 'beginner'), '初学者')}",
    "daily_hours": "{form_data.get('daily_hours', '')}小时",
    "working_days": {json.dumps(form_data.get('working_days', []), ensure_ascii=False)},
    "importance": "{form_data.get('importance', 3)}/5",
    "deadline": "{form_data.get('deadline', '无')}"
  }},
  "context": {{
    "blockers": "{form_data.get('blockers', '无')}",
    "resources": "{form_data.get('resources', '无')}",
    "expectations": {json.dumps(form_data.get('expectations', []), ensure_ascii=False)}
  }},
  "ai_analysis": {{
    "task_type": "{analysis.get('task_type', '')}",
    "experience_level": "{analysis.get('experience_level', '')}",
    "time_span": "{analysis.get('time_span', '')}"
  }}
}}
{previous_questions_text}
## 输出要求
生成1~3个高信息增益的补充问题，遵循以下原则：
### 🎯 个人偏好维度（挖掘学习习惯与风格）
对哪一环节，知识点，知识面，学习方式更感兴趣
喜欢极速还是一步一步慢慢来
喜欢直接挑战还是喜欢先简单后难

### 🧠 个人基础维度（了解能力现状与潜力）
**探索角度**：
- 相关经验：类似项目的成功/失败经历
- 技能迁移：其他领域的可借鉴能力
- 学习模式：过往最有效的学习方法
- 资源偏好：书籍vs视频vs实操vs导师指导
- 工具熟悉度：相关软件/平台的使用经验

### ⚖️ 任务优先级维度（明确价值判断与取舍）
**探索角度**：
- 质量标准：哪些方面可以妥协，哪些绝不能降低要求
- 时间分配：愿意在哪个知识点投入更多精力
- 成果期待：理想状态vs可接受的最低标准

输出规则：
1. **高信息增益**：优先问若回答会显著改变任务结构或排程的因素
2. **可执行性相关**：问题需围绕时间/范围/质量标准/资源/约束/依赖/风险/优先级/验收方式
3. **避免重复**：不要问用户已经填写过的问题
5. **可选语气**：用户可以跳过，不要用强制性语言
6. **保护隐私**：不要索要不必要的个人敏感信息；如必须涉及（如预算），用区间或选项
7. 细节：根据不同的目标，更加深入的给予用户知识点，用于询问用户对目标的具体方向，如：想要做出什么产品，学到什么程度，是否期待知识延申或者扩展

## 输出格式
只返回JSON数组，不要输出解释、markdown、代码块、额外字段：

[{{"id": "q1", "question": "单选问题", "type": "single", "options": ["选项1", "选项2", "选项3"]}}, {{"id": "q2", "question": "多选问题", "type": "multiple", "options": ["选项A", "选项B", "选项C"]}}]"""
        response = self._call_llm([{"role": "user", "content": prompt}], temperature=0.7, model=self.model_generation)
        # 提取JSON
        if "```json" in response:
            start = response.find("```json") + 7
            end = response.rfind("```")
            response = response[start:end].strip()
        elif "```" in response:
            start = response.find("```") + 3
            end = response.rfind("```")
            response = response[start:end].strip()

        try:
            result = json.loads(response)
            # 兼容不同的返回格式
            if isinstance(result, dict) and "follow_up_questions" in result:
                result = result["follow_up_questions"]
            if isinstance(result, list):
                # 确保每个问题都有category字段
                result = self._ensure_category_fields(result)
                return result
            return self._get_default_questions()
        except Exception as e:
            print(f"[ERROR] 解析补充问题失败: {e}")
            return self._get_default_questions()

    def _ensure_category_fields(self, questions: list) -> list:
        """确保每个问题都有category字段，基于问题内容智能推断"""
        # 定义关键词映射（新三个维度）
        preference_keywords = [
            '学习', '方式', '偏好', '喜欢', '倾向', '风格', '习惯',
            '极速', '慢慢', '挑战', '简单', '难度', '兴趣', '环节', '知识点'
        ]
        foundation_keywords = [
            '经验', '基础', '能力', '技能', '迁移', '模式', '有效',
            '资源', '书籍', '视频', '实操', '导师', '工具', '平台', '类似', '项目'
        ]
        priority_keywords = [
            '优先级', '质量', '标准', '妥协', '要求', '时间', '分配',
            '精力', '成果', '期待', '理想', '最低', '交付', '完成', '快速', '打磨'
        ]

        for q in questions:
            if 'category' not in q or not q['category']:
                question_text = q.get('question', '').lower()

                # 基于关键词判断类别
                category = 'priority'  # 默认任务优先级
                if any(kw in question_text for kw in preference_keywords):
                    category = 'preference'
                elif any(kw in question_text for kw in foundation_keywords):
                    category = 'foundation'
                elif any(kw in question_text for kw in priority_keywords):
                    category = 'priority'

                q['category'] = category

        # 确保三个维度都有覆盖（如果问题数量>=3）
        if len(questions) >= 3:
            categories = [q.get('category', 'priority') for q in questions]
            if 'preference' not in categories:
                questions[0]['category'] = 'preference'
            if 'foundation' not in categories:
                questions[1]['category'] = 'foundation'
            if 'priority' not in categories:
                questions[2]['category'] = 'priority'

        return questions

    def _get_default_questions(self) -> list:
        """获取默认的补充问题（涵盖三个维度）"""
        return [
            {
                "id": "q1",
                "category": "preference",
                "question": "你更倾向于哪种学习方式？",
                "type": "single",
                "options": ["理论先行再实践", "边做边学", "先模仿再创造"]
            },
            {
                "id": "q2",
                "category": "foundation",
                "question": "你之前有类似项目的经验吗？",
                "type": "single",
                "options": ["完全没有", "有一些了解", "做过类似项目"]
            },
            {
                "id": "q3",
                "category": "priority",
                "question": "你对成果的期待是？",
                "type": "single",
                "options": ["快速出可用的成果", "质量优先慢慢打磨", "在保证质量的前提下尽快完成"]
            }
        ]

    # ==================== Agent 6: 专业任务拆解器 ====================
    def _agent_breakdown(self, form_data: Dict[str, Any], analysis: Dict[str, str]) -> Dict[str, Any]:
        """Agent 6: 专业任务拆解器 - 将需求拆解成月度→周度→日度的详细任务计划"""
        prompt = self._build_breakdown_prompt(form_data, analysis)
        response = self._call_llm(
            [{"role": "system", "content": self._get_breakdown_system_prompt()},
             {"role": "user", "content": prompt}],
            temperature=0.7,
            model=self.model_generation
        )
        return self._parse_breakdown_response(response, form_data)

    def _get_breakdown_system_prompt(self) -> str:
        """Agent 6 任务拆解系统提示"""
        return """你是 Agent 6 - 专业任务拆解器。你的核心能力是将任何需求拆解成可执行的月度→周度→日度任务计划。

## 你的输出格式

严格按照以下JSON格式输出：

```json
{
  "project_name": "项目名称",
  "overview": "项目概述（1-2句话）",
  "monthly": {
    "第1个月": {
      "goal": "月度目标概述",
      "output": "该月的最终产出",
      "weeks": ["第1周", "第2周", "第3周", "第4周"]
    }
  },
  "weekly": {
    "第1周": {
      "goal": "本周目标",
      "output": "本周明确产出（如：产出：4个页面能互相跳转）",
      "focus": "本周重点领域"
    },
    "第2周": {
      "goal": "静态内容完成",
      "output": "产出：每个页面像样、信息完整",
      "focus": "内容与排版"
    }
  },
  "daily": {
    "第1周": {
      "Day1": {
        "title": "定主题与素材",
        "description": "选博物馆风格 + 找20张图片素材，建本地文件夹",
        "hours": 1,
        "output": "产出：选定风格 + 20张素材"
      },
      "Day2": {
        "title": "建项目结构",
        "description": "创建pages/css/js/img文件夹，建4个html文件并互相链接",
        "hours": 1,
        "output": "产出：项目骨架完成"
      }
    },
    "第2周": {
      "Day1": {
        "title": "展览页卡片布局",
        "description": "做4-8个展览卡片列表布局",
        "hours": 1,
        "output": "产出：卡片布局完成"
      }
    }
  }
}
```

## 拆解原则

### 月度任务
- 描述该月的整体目标
- 说明该月的最终产出
- 列出包含的周次

### 周度任务
- 明确本周要达成什么
- **必须用"产出："开头描述具体成果**
- 说明本周的重点领域

### 日度任务
- 每天任务必须在1小时内完成
- 描述要具体可执行（不是"学习XX"而是"做XX卡片布局"）
- 每天都有明确的产出
- 每周最后一天设为"机动"日，用于查漏补缺

## 重要规则

1. **每日任务必须可执行**：避免模糊的描述，如"学习"、"了解"，要用具体的动作
2. **产出导向**：每个周度任务和日度任务都要有明确的产出
3. **时间约束**：假设每天只有1小时可用时间
4. **渐进式**：任务要从简单到复杂，循序渐进
5. **机动日**：每周最后一天设为机动日

只返回JSON，不要有任何其他文字。"""

    def _build_breakdown_prompt(self, form_data: Dict[str, Any], analysis: Dict[str, str]) -> str:
        """构建任务拆解的用户提示"""
        from datetime import datetime, timedelta

        # 计算日期范围
        start_date = datetime.now()
        deadline = form_data.get('deadline')
        daily_hours = form_data.get('daily_hours', '1')

        if deadline:
            try:
                deadline_date = datetime.strptime(deadline, '%Y-%m-%d')
                days_left = (deadline_date - start_date).days
                weeks_count = max(1, days_left // 7)
                months_count = max(1, days_left // 30)
            except:
                days_left = 30
                weeks_count = 4
                months_count = 1
                deadline_date = start_date + timedelta(days=30)
        else:
            days_left = 30
            weeks_count = 4
            months_count = 1
            deadline_date = start_date + timedelta(days=30)

        # 生成日期示例
        date_examples = []
        current = start_date
        for i in range(min(7, days_left)):
            date_examples.append(f"Day{i+1}: {current.month}月{current.day}日")
            current += timedelta(days=1)

        prompt = f"""请将以下需求拆解成详细的月度→周度→日度任务计划：

## 用户需求
{form_data.get('goal', '')}

## 时间约束
- 每天可用时间：{daily_hours} 小时
- 总周期：{weeks_count} 周
- 开始日期：{start_date.year}年{start_date.month}月{start_date.day}日

## 日期格式示例
{', '.join(date_examples)}

## AI分析结果
- 任务类型：{analysis.get('task_type', '')}
- 经验水平：{analysis.get('experience_level', '')}
- 时间跨度：{analysis.get('time_span', '')}

## 拆解要求
1. **月度任务**：描述整体目标和最终产出
2. **周度任务**：每周目标 + 明确产出（必须用"产出："开头）
3. **日度任务**：每天1小时内能完成的具体操作，每步都有产出
4. **每周最后一天**：设为"机动"日，用于查漏补缺
5. **任务递进**：从简单到复杂，循序渐进

请严格按照JSON格式输出，不要有其他文字。"""
        return prompt

    def _parse_breakdown_response(self, response: str, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """解析任务拆解响应"""
        print(f"\n[DEBUG] ============ 解析任务拆解响应 ============")
        print(f"[DEBUG] 响应长度: {len(response)} 字符")

        # 打印原始响应的前500个字符用于调试
        print(f"[DEBUG] 响应内容预览: {response[:500]}")

        response = response.strip()

        # 提取JSON
        if "```json" in response:
            start = response.find("```json") + 7
            # 找到这个代码块之后的 ```
            end = response.find("```", start)
            if end != -1:
                response = response[start:end].strip()
                print(f"[DEBUG] 提取了 ```json 代码块，长度: {len(response)}")
            else:
                # 没有找到结束标记，可能是响应被截断
                response = response[start:].strip()
                print(f"[DEBUG] 提取了 ```json 代码块（无结束标记，响应可能被截断），长度: {len(response)}")
        elif "```" in response:
            start = response.find("```") + 3
            end = response.find("```", start)
            if end != -1:
                response = response[start:end].strip()
                print(f"[DEBUG] 提取了 ``` 代码块")
            else:
                response = response[start:].strip()
                print(f"[DEBUG] 提取了 ``` 代码块（无结束标记），长度: {len(response)}")

        # 如果响应过短，可能解析会失败
        if len(response) < 100:
            print(f"[WARNING] 提取后的响应过短: {len(response)} 字符")
            print(f"[DEBUG] 响应内容: {response}")
            print(f"[DEBUG] 使用 fallback 任务结构")
            return self._get_fallback_tasks(form_data)

        # 尝试修复截断的JSON
        try:
            result = json.loads(response)
        except json.JSONDecodeError as e:
            print(f"[WARNING] JSON解析失败，尝试修复截断的JSON: {e}")
            # 尝试修复：统计未闭合的括号并补全
            response_fixed = self._fix_truncated_json(response)
            if response_fixed:
                try:
                    result = json.loads(response_fixed)
                    print(f"[DEBUG] JSON修复成功")
                except:
                    print(f"[DEBUG] JSON修复失败，使用 fallback")
                    return self._get_fallback_tasks(form_data)
            else:
                print(f"[DEBUG] 无法修复截断的JSON，使用 fallback")
                return self._get_fallback_tasks(form_data)

        # 解析成功，打印调试信息并转换
        print(f"[DEBUG] JSON解析成功，keys: {list(result.keys()) if isinstance(result, dict) else type(result)}")

        # 打印monthly/weekly/daily的内容
        if isinstance(result, dict):
            if 'monthly' in result:
                print(f"[DEBUG] monthly keys: {list(result.get('monthly', {}).keys())}")
            if 'weekly' in result:
                print(f"[DEBUG] weekly keys: {list(result.get('weekly', {}).keys())}")
            if 'daily' in result:
                print(f"[DEBUG] daily keys: {list(result.get('daily', {}).keys())}")

        # 将Agent6格式转换为前端期望的格式
        print(f"[DEBUG] 开始转换 Agent6 格式...")
        converted = self._convert_agent6_format(result)
        print(f"[DEBUG] _parse_breakdown_response 转换后的daily keys: {list(converted.get('daily', {}).keys())}")
        print(f"[DEBUG] _parse_breakdown_response 转换后的weekly keys: {list(converted.get('weekly', {}).keys())}")
        print(f"[DEBUG] _parse_breakdown_response 转换后的monthly keys: {list(converted.get('monthly', {}).keys())}")
        print(f"[DEBUG] ============ 解析完成 ============\n")
        return converted

    def _convert_agent6_format(self, agent6_result: Dict[str, Any]) -> Dict[str, Any]:
        """将Agent6格式转换为前端期望的嵌套格式"""
        from datetime import datetime, timedelta

        print(f"[DEBUG] _convert_agent6_format 输入keys: {list(agent6_result.keys())}")
        print(f"[DEBUG] _convert_agent6_format 输入内容: {str(agent6_result)[:1000]}")

        # 如果已经是前端格式，直接返回
        if all(key in agent6_result for key in ['yearly', 'quarterly', 'monthly', 'weekly', 'daily']):
            print(f"[DEBUG] 检测到前端格式，直接返回")
            return agent6_result

        converted = {
            "yearly": [],
            "quarterly": {},
            "monthly": {},
            "weekly": {},
            "daily": {}
        }

        # 处理monthly
        monthly = agent6_result.get('monthly', {})
        print(f"[DEBUG] monthly类型: {type(monthly)}, 内容: {str(monthly)[:200]}")
        if isinstance(monthly, dict):
            for month_key, month_info in monthly.items():
                # 生成月度任务列表
                if isinstance(month_info, dict):
                    title = month_info.get('goal', month_key)
                    description = month_info.get('output', '')
                elif isinstance(month_info, list):
                    # 已经是前端格式列表
                    converted["monthly"][month_key] = month_info
                    continue
                else:
                    title = str(month_info)
                    description = ''
                month_tasks = [{
                    "id": f"m-{month_key}",
                    "title": title,
                    "description": description,
                    "estimated_hours": 40
                }]
                converted["monthly"][month_key] = month_tasks

        # 处理weekly
        weekly = agent6_result.get('weekly', {})
        print(f"[DEBUG] weekly类型: {type(weekly)}, 内容: {str(weekly)[:200]}")
        if isinstance(weekly, dict):
            for week_key, week_info in weekly.items():
                if isinstance(week_info, dict):
                    title = week_info.get('goal', week_key)
                    description = week_info.get('output', '')
                elif isinstance(week_info, list):
                    # 已经是前端格式列表
                    converted["weekly"][week_key] = week_info
                    continue
                else:
                    title = str(week_info)
                    description = ''
                week_tasks = [{
                    "id": f"w-{week_key}",
                    "title": title,
                    "description": description,
                    "estimated_hours": 10
                }]
                converted["weekly"][week_key] = week_tasks

        # 处理daily - 转换为嵌套结构
        daily = agent6_result.get('daily', {})
        print(f"[DEBUG] daily类型: {type(daily)}, 内容: {str(daily)[:300]}")
        current_date = datetime.now()

        if isinstance(daily, dict):
            for week_key, week_days in daily.items():
                # 提取周数，如"第1周" -> 1
                week_num = 1
                for num in range(1, 10):
                    if f"第{num}周" in week_key:
                        week_num = num
                        break

                # 创建周级别的daily结构
                week_daily_data = {}
                day_offset = 0

                if isinstance(week_days, dict):
                    for day_key, day_task in week_days.items():
                        # 计算实际日期
                        target_date = current_date + timedelta(days=(week_num - 1) * 7 + day_offset)
                        date_str = f"{target_date.month}月{target_date.day}日"

                        # 转换任务格式
                        if isinstance(day_task, dict):
                            task_list = [{
                                "id": f"d-{week_key}-{day_key}",
                                "title": day_task.get('title', ''),
                                "description": day_task.get('description', ''),
                                "output": day_task.get('output', ''),
                                "estimated_hours": day_task.get('hours', 1)
                            }]
                        elif isinstance(day_task, list):
                            # 已经是前端格式列表
                            task_list = day_task
                        else:
                            task_list = [{
                                "id": f"d-{week_key}-{day_key}",
                                "title": str(day_task),
                                "description": '',
                                "output": '',
                                "estimated_hours": 1
                            }]

                        week_daily_data[date_str] = task_list
                        day_offset += 1

                    # 使用"第X个月-第X周"作为key
                    month_num = (week_num - 1) // 4 + 1
                    nested_key = f"第{month_num}个月-第{week_num}周"
                    converted["daily"][nested_key] = week_daily_data
                elif isinstance(week_days, list):
                    # 已经是前端格式的列表结构 {"第1天": [tasks]}
                    # 需要转换为嵌套结构
                    week_daily_data = {}
                    day_idx = 0
                    for day_task in week_days:
                        target_date = current_date + timedelta(days=(week_num - 1) * 7 + day_idx)
                        date_str = f"{target_date.month}月{target_date.day}日"
                        if isinstance(day_task, list):
                            week_daily_data[date_str] = day_task
                        else:
                            week_daily_data[date_str] = [day_task]
                        day_idx += 1

                    month_num = (week_num - 1) // 4 + 1
                    nested_key = f"第{month_num}个月-第{week_num}周"
                    converted["daily"][nested_key] = week_daily_data

        print(f"[DEBUG] _convert_agent6_format 转换完成")
        print(f"[DEBUG] 转换后的monthly: {list(converted['monthly'].keys())}")
        print(f"[DEBUG] 转换后的weekly: {list(converted['weekly'].keys())}")
        print(f"[DEBUG] 转换后的daily: {list(converted['daily'].keys())}")

        # 检查是否有实际内容，如果没有则返回None表示需要fallback
        has_content = (
            len(converted["monthly"]) > 0 or
            len(converted["weekly"]) > 0 or
            len(converted["daily"]) > 0
        )

        if not has_content:
            print(f"[ERROR] _convert_agent6_format 转换后无内容")
            raise ValueError("转换后的任务结构为空，无法生成有效任务")

        return converted

    def _fix_truncated_json(self, json_str: str) -> str:
        """尝试修复截断的JSON字符串"""
        if not json_str or len(json_str.strip()) < 10:
            return None

        json_str = json_str.strip()

        # 统计括号，补全未闭合的部分
        open_braces = json_str.count('{') - json_str.count('}')
        open_brackets = json_str.count('[') - json_str.count(']')

        if open_braces > 0 or open_brackets > 0:
            print(f"[DEBUG] 检测到截断的JSON: 缺少 {open_braces} 个 }} 和 {open_brackets} 个 ]")
            # 补全括号
            fixed = json_str + '}' * open_braces + ']' * open_brackets
            try:
                json.loads(fixed)
                print(f"[DEBUG] JSON修复成功，补全了 {open_braces} 个 }} 和 {open_brackets} 个 ]")
                return fixed
            except:
                pass

        # 如果直接修复失败，尝试找到最后一个完整的对象
        # 找到所有完整的顶层键
        lines = json_str.split('\n')
        fixed_lines = []
        depth = 0
        in_string = False
        escape_next = False

        for line in lines:
            i = 0
            while i < len(line):
                char = line[i]
                if escape_next:
                    escape_next = False
                elif char == '\\' and in_string:
                    escape_next = True
                elif char == '"' and not escape_next:
                    in_string = not in_string
                elif not in_string:
                    if char == '{' or char == '[':
                        depth += 1
                    elif char == '}' or char == ']':
                        depth -= 1
                i += 1
            fixed_lines.append(line)
            # 当回到顶层且遇到闭合括号时停止
            if depth == 0 and ('}' in line or ']' in line):
                # 检查这行是否是顶层闭合
                if line.rstrip().endswith('}') or line.rstrip().endswith(']'):
                    break

        fixed = '\n'.join(fixed_lines)
        # 确保以正确的括号结束
        if not fixed.rstrip().endswith('}'):
            fixed += '\n}'

        try:
            json.loads(fixed)
            print(f"[DEBUG] JSON截断修复成功")
            return fixed
        except:
            print(f"[DEBUG] 无法修复截断的JSON")
            return None

    def _get_fallback_tasks(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """备用任务结构"""
        daily_hours = float(form_data.get('daily_hours', 2))
        return {
            "yearly": [],
            "quarterly": {},
            "monthly": {
                "第1个月 - 基础学习": [
                    {"id": "m1-1", "title": "学习基础知识", "description": "学习相关领域的基础知识", "estimated_hours": daily_hours * 10}
                ]
            },
            "weekly": {
                "第1周 - 入门": [
                    {"id": "w1-1", "title": "了解基础概念", "description": "了解该领域的基本概念和术语"}
                ]
            },
            "daily": {
                "第1天": [
                    {"id": "d1-1", "title": "环境准备", "description": "准备学习所需的工具和环境", "estimated_hours": daily_hours}
                ]
            }
        }

    def _get_system_prompt(self) -> str:
        """获取系统提示词"""
        return """你是一个专业的任务拆解助手，擅长将用户的目标拆解成可执行的分层任务。

## 拆解流程（请严格按此顺序思考）

### 第一步：判断任务类型
首先分析用户的目标属于哪种类型，常见类型包括：
- **技能学习类**：学习编程、学习语言、学习乐器等
- **项目开发类**：开发网站、开发APP、写毕业论文等
- **健康健身类**：减肥、增肌、跑步训练等
- **考试备考类**：考研、考公、考证等
- **阅读写作类**：读完N本书、写小说等
- **生活目标类**：装修房子、旅行规划等

### 第二步：评估经验水平
根据用户描述，判断其基础水平：
- **零基础**：完全没接触过，需要从基础概念开始
- **初学者**：了解基本概念，但缺乏实践经验
- **进阶者**：有一定基础，需要进一步提升
- **精通者**：技能熟练，想要突破瓶颈

### 第三步：确定时间跨度
根据用户提供的截止日期和每日可用时间，确定拆解的层级：
- **超过6个月**：考虑使用年度+月度+周度+日度
- **3-6个月**：使用月度+周度+日度
- **1-3个月**：使用周度+日度（或简化月度+周度+日度）
- **少于1个月**：使用周度+日度，或直接日度

### 第四步：从高到低逐级拆解
按照确定的时间跨度，从最高层级开始，逐级向下拆解：
1. 先拆解最高层级（如月度目标）
2. 再将每个高层级任务拆解为下层级（如周度任务）
3. 最后拆解到每日可执行的具体行动

## 输出格式要求

根据第三步确定的时间跨度，返回对应层级的任务。如果不确定，默认返回月度+周度+日度三层：

```json
{
  "analysis": {
    "task_type": "任务类型（如：技能学习类 - 网页开发）",
    "experience_level": "经验水平评估",
    "time_span": "时间跨度判断（如：3个月，使用月度+周度+日度）"
  },
  "tasks": {
    "monthly": {
      "第1个月 - 基础阶段": [
        {"id": "m1-1", "title": "任务标题", "description": "详细描述", "estimated_hours": 20}
      ]
    },
    "weekly": {
      "第1周 - 环境准备": [
        {"id": "w1-1", "title": "任务标题", "description": "详细描述"}
      ]
    },
    "daily": {
      "第1天": [
        {"id": "d1-1", "title": "具体可执行的行动", "description": "具体步骤", "estimated_hours": 2}
      ]
    }
  },
  "follow_up_questions": [
    {"id": "q1", "question": "补充问题", "type": "text|single|multiple", "options": null}
  ]
}
```

## 重要注意事项

1. **任务ID规则**：使用层级前缀（m=月，w=周，d=日）+ 序号，如 m1-1, w1-1, d1-1
2. **estimated_hours**：以小时为单位，根据用户每日可用时间合理分配
3. **根据经验调整**：零基础需要更多学习时间，精通者可以更紧凑
4. **补充问题**：针对任务类型提出有价值的后续问题
5. **问题类型**：text(文本)、single(单选)、multiple(多选)
6. **JSON格式**：确保可被直接解析，不要有多余的说明文字
7. **每日任务要具体**：必须是可以直接执行的行动，如"安装VS Code"而不是"学习安装"

只返回用户时间跨度需要的层级，不需要返回所有层级。例如短期目标可以只返回weekly和daily。"""

    def _build_user_prompt(self, form_data: Dict[str, Any]) -> str:
        """构建用户提示词"""
        experience_map = {
            "beginner": "初学者 - 刚开始接触这个领域",
            "intermediate": "进阶者 - 有一定基础，需要进一步提升",
            "expert": "精通者 - 技能熟练，想要突破瓶颈"
        }

        importance_desc = {
            1: "不太重要，可以灵活调整",
            2: "一般重要",
            3: "中等重要",
            4: "比较重要，需要认真对待",
            5: "非常重要，是当前的核心目标"
        }

        prompt = f"""请帮我将以下目标拆解成可执行的任务计划：

## 目标信息
- 目标：{form_data.get('goal', '')}
- 截止日期：{form_data.get('deadline', '无固定期限')}
- 经验水平：{experience_map.get(form_data.get('experience'), '一般')}
- 重要程度：{form_data.get('importance', 3)}分 - {importance_desc.get(form_data.get('importance', 3), '')}
- 每日可用时间：{form_data.get('daily_hours', '')}小时
- 工作日：{', '.join(form_data.get('working_days', [])) or '未指定'}
"""

        if form_data.get('blockers'):
            prompt += f"\n- 可能的阻碍：{form_data.get('blockers')}"

        if form_data.get('resources'):
            prompt += f"\n- 已有资源：{form_data.get('resources')}"

        if form_data.get('expectations'):
            prompt += f"\n- 期望收获：{', '.join(form_data.get('expectations', []))}"

        deadline = form_data.get('deadline')
        if deadline:
            from datetime import datetime
            try:
                deadline_date = datetime.strptime(deadline, '%Y-%m-%d')
                today = datetime.now()
                days_left = (deadline_date - today).days
                weeks_left = days_left // 7
                prompt += f"\n\n## 时间规划\n距离截止日期还有约 {days_left} 天（{weeks_left} 周），请合理规划各阶段任务。"
            except:
                pass
        else:
            prompt += "\n\n## 时间规划\n无固定截止日期，请按 3 个月（约 12 周）的时间跨度来规划任务。"

        prompt += "\n\n请严格按照要求的 JSON 格式输出任务拆解结果。"

        return prompt

    def _parse_task_response(self, response: str, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """解析 AI 响应"""
        # 尝试提取 JSON
        response = response.strip()

        # 查找 JSON 代码块
        if "```json" in response:
            start = response.find("```json") + 7
            end = response.rfind("```")
            response = response[start:end].strip()
        elif "```" in response:
            start = response.find("```") + 3
            end = response.rfind("```")
            response = response[start:end].strip()

        try:
            result = json.loads(response)

            # 确保任务结构完整（兼容前端期望的格式）
            tasks = result.get("tasks", {})
            if "yearly" not in tasks:
                tasks["yearly"] = []
            if "quarterly" not in tasks:
                tasks["quarterly"] = {}
            if "monthly" not in tasks:
                tasks["monthly"] = {}
            if "weekly" not in tasks:
                tasks["weekly"] = {}
            if "daily" not in tasks:
                tasks["daily"] = {}

            # 生成项目 ID
            project_id = str(uuid.uuid4())

            return {
                "project_id": project_id,
                "analysis": result.get("analysis"),  # 保留 AI 的分析结果
                "tasks": tasks,
                "follow_up_questions": result.get("follow_up_questions", [])
            }
        except json.JSONDecodeError:
            # 如果解析失败，返回默认结构
            return self._get_fallback_structure(form_data, "JSON解析失败")

    def _add_task_dates(self, result: Dict, form_data: Dict[str, Any]) -> Dict:
        """为任务添加日期信息"""
        from datetime import datetime, timedelta

        start_date = datetime.now()
        deadline = form_data.get('deadline')
        if deadline:
            try:
                end_date = datetime.strptime(deadline, '%Y-%m-%d')
            except:
                end_date = start_date + timedelta(days=90)
        else:
            end_date = start_date + timedelta(days=90)

        # 为年度任务添加日期
        for task in result.get("tasks", {}).get("yearly", []):
            task["start_date"] = start_date.strftime('%Y-%m-%d')
            task["end_date"] = end_date.strftime('%Y-%m-%d')

        return result

    def _get_fallback_structure(self, form_data: Dict[str, Any], error: str) -> Dict:
        """获取备用结构（当 AI 解析失败时）"""
        import uuid
        goal = form_data.get('goal', '目标')
        daily_hours = float(form_data.get('daily_hours', 2))
        project_id = str(uuid.uuid4())

        return {
            "project_id": project_id,
            "tasks": {
                "monthly": {
                    "第1个月 - 基础学习": [
                        {"id": "m1-1", "title": "学习基础知识", "description": "学习网页开发的基础知识（HTML、CSS、JavaScript）", "estimated_hours": daily_hours * 10},
                        {"id": "m1-2", "title": "环境搭建与练习", "description": "搭建开发环境并完成练习项目", "estimated_hours": daily_hours * 8}
                    ],
                    "第2个月 - 核心开发": [
                        {"id": "m2-1", "title": "页面设计", "description": "设计博物馆网页的页面结构和布局", "estimated_hours": daily_hours * 15},
                        {"id": "m2-2", "title": "功能实现", "description": "实现网页的核心功能", "estimated_hours": daily_hours * 12}
                    ],
                    "第3个月 - 完善上线": [
                        {"id": "m3-1", "title": "测试优化", "description": "测试网页功能并进行优化", "estimated_hours": daily_hours * 10},
                        {"id": "m3-2", "title": "部署上线", "description": "将网页部署到服务器", "estimated_hours": daily_hours * 5}
                    ],
                    "第4个月 - 迭代改进": [
                        {"id": "m4-1", "title": "收集反馈", "description": "收集用户反馈并进行改进", "estimated_hours": daily_hours * 8}
                    ]
                },
                "weekly": {
                    "第1周 - 环境准备": [
                        {"id": "w1-1", "title": "安装开发工具", "description": "安装代码编辑器和浏览器"},
                        {"id": "w1-2", "title": "学习HTML基础", "description": "掌握HTML的基本语法和常用标签"}
                    ],
                    "第2周 - CSS学习": [
                        {"id": "w2-1", "title": "CSS基础", "description": "学习CSS选择器和样式"},
                        {"id": "w2-2", "title": "布局练习", "description": "练习常见的页面布局"}
                    ],
                    "第3周 - JavaScript入门": [
                        {"id": "w3-1", "title": "JS基础语法", "description": "学习JavaScript变量、函数、条件判断"},
                        {"id": "w3-2", "title": "DOM操作", "description": "学习如何操作网页元素"}
                    ],
                    "第4周 - 项目实践": [
                        {"id": "w4-1", "title": "制作简单网页", "description": "制作一个简单的个人网页"}
                    ]
                },
                "daily": {
                    "第1天": [
                        {"id": "d1-1", "title": "安装VS Code", "description": "下载并安装VS Code编辑器", "estimated_hours": daily_hours}
                    ],
                    "第2天": [
                        {"id": "d2-1", "title": "学习HTML标签", "description": "学习h1, p, div, span等常用标签", "estimated_hours": daily_hours}
                    ],
                    "第3天": [
                        {"id": "d3-1", "title": "CSS样式练习", "description": "练习设置颜色、字体、边距等样式", "estimated_hours": daily_hours}
                    ],
                    "第4天": [
                        {"id": "d4-1", "title": "JavaScript变量", "description": "学习变量声明和基本数据类型", "estimated_hours": daily_hours}
                    ],
                    "第5天": [
                        {"id": "d5-1", "title": "综合练习", "description": "制作一个包含HTML、CSS、JS的小页面", "estimated_hours": daily_hours}
                    ]
                }
            },
            "follow_up_questions": [
                {"id": "q1", "question": "你有自己的电脑吗？需要准备什么工具？", "type": "text", "options": None}
            ],
            "error": error
        }

    def regenerate_with_answers(
        self,
        form_data: Dict[str, Any],
        answers: Dict[str, Any],
        previous_tasks: Dict[str, Any],
        analysis: Dict[str, str] = None,
        previous_questions: list = None
    ) -> Dict[str, Any]:
        """根据补充问题的答案重新生成任务（基于已有任务结构进行优化）

        Args:
            form_data: 原始表单数据
            answers: 用户对补充问题的答案
            previous_tasks: 之前的任务结构
            analysis: AI分析结果
            previous_questions: 之前生成的补充问题列表（用于避免重复）

        Returns:
            包含新任务和新补充问题的字典
        """

        # 构建已有任务摘要
        monthly_summary = []
        monthly_tasks = previous_tasks.get('monthly', {})
        for month, info in monthly_tasks.items():
            if isinstance(info, list) and len(info) > 0:
                # 前端格式: [{"title": "", "description": ""}]
                monthly_summary.append(f"- {month}: {info[0].get('title', '')}")
            elif isinstance(info, dict):
                # Agent6 原始格式: {"goal": "", "output": ""}
                monthly_summary.append(f"- {month}: {info.get('goal', '')}")

        weekly_summary = []
        weekly_tasks = previous_tasks.get('weekly', {})
        for week, info in weekly_tasks.items():
            if isinstance(info, list) and len(info) > 0:
                weekly_summary.append(f"- {week}: {info[0].get('title', '')}")
            elif isinstance(info, dict):
                weekly_summary.append(f"- {week}: {info.get('goal', '')}")

        daily_summary = []
        daily_tasks = previous_tasks.get('daily', {})
        for week, days in list(daily_tasks.items())[:4]:  # 只显示前4周
            if isinstance(days, dict):
                # 嵌套格式: {"第1个月-第1周": {"1月1日": [tasks]}}
                day_count = len(days)
            elif isinstance(days, list):
                # 简单格式
                day_count = len(days)
            else:
                day_count = 0
            daily_summary.append(f"- {week}: {day_count}天任务")

        # 构建补充信息文本
        answers_text = "\n".join([
            f"- {key}: {value}"
            for key, value in answers.items()
            if value
        ])

        # 构建优化提示（匹配 test_agent6.py 的 regenerate 逻辑）
        prompt = f"""请根据用户的补充信息，重新生成完整的任务计划：

## 用户原始需求
{form_data.get('goal', '')}

## AI分析结果
- 任务类型：{analysis.get('task_type', '') if analysis else ''}
- 经验水平：{analysis.get('experience_level', '') if analysis else ''}
- 时间跨度：{analysis.get('time_span', '') if analysis else ''}

## 原始任务计划摘要

月度任务:
{chr(10).join(monthly_summary[:6]) if monthly_summary else '- 无'}

周度任务:
{chr(10).join(weekly_summary[:8]) if weekly_summary else '- 无'}

日度任务:
{chr(10).join(daily_summary) if daily_summary else '- 无'}

## 用户补充信息（用于优化任务）

{answers_text}

## 输出要求

请重新生成一个**完整的**任务拆解计划，包含所有月份、所有周、所有天的任务。

**必须严格按照以下JSON格式输出：**

```json
{{
  "project_name": "项目名称",
  "overview": "项目概述（1-2句话）",
  "monthly": {{
    "第1个月": {{
      "goal": "月度目标概述",
      "output": "该月的最终产出",
      "weeks": ["第1周", "第2周", "第3周", "第4周"]
    }}
  }},
  "weekly": {{
    "第1周": {{
      "goal": "本周目标",
      "output": "产出：本周明确产出",
      "focus": "本周重点领域"
    }},
    "第2周": {{
      "goal": "周度目标",
      "output": "产出：...",
      "focus": "..."
    }}
    // ... 所有周
  }},
  "daily": {{
    "第1周": {{
      "Day1": {{
        "title": "任务标题",
        "description": "具体任务描述",
        "hours": 1,
        "output": "产出：明确产出"
      }},
      "Day2": {{ ... }},
      // ... Day3-Day7
    }},
    "第2周": {{ ... }},
    // ... 所有周
  }}
}}
```

## 重要提示

1. **必须输出完整结构**：包含所有月份、所有周（通常4周）、每周7天
2. **每周最后一天是"机动日"**：用于查漏补缺
3. **每个任务都有明确产出**：用"产出："开头描述
4. **根据补充信息调整**：考虑用户的硬约束、策略偏好、验收标准等

请严格按照上述JSON格式输出完整的任务计划，不要省略任何内容。"""

        print(f"[DEBUG] regenerate_with_answers prompt 长度: {len(prompt)}")

        response = self._call_llm(
            [{"role": "system", "content": self._get_breakdown_system_prompt()},
             {"role": "user", "content": prompt}],
            temperature=0.7,
            model=self.model_generation
        )

        print(f"[DEBUG] regenerate_with_answers LLM 响应长度: {len(response) if response else 0}")
        if not response or len(response.strip()) < 100:
            print(f"[WARNING] regenerate_with_answers LLM 响应过短或为空!")
            print(f"[DEBUG] 响应内容: {response}")

        # 解析任务
        tasks = self._parse_breakdown_response(response, form_data)

        # 重新生成补充问题（基于答案，避免重复之前的问题）
        try:
            new_questions = self._agent_questions(
                form_data=form_data,
                analysis=analysis or {},
                previous_questions=previous_questions
            )
        except Exception as e:
            print(f"[ERROR] 重新生成补充问题失败: {e}")
            import traceback
            traceback.print_exc()
            # 补充问题生成失败时，使用默认问题或空列表
            new_questions = self._get_default_questions()

        # 返回与 generate_task_breakdown 相同的结构
        return {
            "tasks": tasks,
            "follow_up_questions": new_questions
        }


# 单例
_ai_service = None


def get_ai_service() -> AIService:
    """获取 AI 服务单例"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
