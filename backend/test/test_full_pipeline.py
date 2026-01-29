"""
完整流程测试 - 测试所有 Agents 协同工作

模拟真实的任务拆解流程，从表单数据到最终结果
"""
import os
import sys
import json
import uuid
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI

load_dotenv()


class FullPipelineTest:
    """完整流程测试"""

    def __init__(self):
        api_key = os.getenv("SILICONFLOW_API_KEY")
        print(f"[DEBUG] API Key: {'已配置' if api_key else '未配置'}")

        self.client = OpenAI(
            api_key=api_key,
            base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
        )
        self.model_analysis = os.getenv("MODEL_ANALYSIS", "inclusionAI/Ling-flash-2.0")
        self.model_generation = os.getenv("MODEL_GENERATION", "Qwen/Qwen2.5-72B-Instruct")

        print(f"[DEBUG] 分析模型 (Agent 1-3): {self.model_analysis}")
        print(f"[DEBUG] 生成模型 (Agent 4-5): {self.model_generation}")

    def _call_llm(self, messages, temperature=0.7, model=None):
        """调用 LLM"""
        if model is None:
            model = self.model_generation

        timeout_val = 300 if "Thinking" in model or "thinking" in model else 120

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=4096,
                timeout=timeout_val,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[ERROR] AI 调用失败: {str(e)}")
            raise

    # ==================== Agent 1: 任务类型分析 ====================
    def agent_task_type(self, form_data: dict) -> str:
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

        print(f"\n[Agent 1] 开始分析任务类型...")
        response = self._call_llm([{"role": "user", "content": prompt}], temperature=0.3, model=self.model_analysis)
        result = response.strip().split('\n')[0][:100]
        print(f"[Agent 1] 完成: {result}")
        return result

    # ==================== Agent 2: 经验水平评估 ====================
    def agent_experience(self, form_data: dict) -> str:
        """Agent 2: 评估经验水平"""
        user_exp = form_data.get('experience', 'beginner')
        goal = form_data.get('goal', '')

        prompt = f"""根据用户的目标和自评经验，给出更精准的经验水平评估。

目标：{goal}
用户自评：{user_exp}

请判断用户在该领域的真实水平，给出简短评估（50字以内）。

返回格式：水平等级 - 具体描述
例如：零基础 - 完全没有编程经验，需要从基础概念开始"""

        print(f"\n[Agent 2] 开始评估经验水平...")
        response = self._call_llm([{"role": "user", "content": prompt}], temperature=0.3, model=self.model_analysis)
        result = response.strip().split('\n')[0][:100]
        print(f"[Agent 2] 完成: {result}")
        return result

    # ==================== Agent 3: 时间跨度判断 ====================
    def agent_time_span(self, form_data: dict) -> str:
        """Agent 3: 判断时间跨度"""
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

        print(f"\n[Agent 3] 开始分析时间跨度...")
        response = self._call_llm([{"role": "user", "content": prompt}], temperature=0.3, model=self.model_analysis)
        result = response.strip().split('\n')[0][:100]
        print(f"[Agent 3] 完成: {result}")
        return result

    # ==================== Agent 4: 补充问题生成 ====================
    def agent_questions(self, form_data: dict, analysis: dict) -> list:
        """Agent 4: 生成补充问题"""
        experience_map = {
            "beginner": "初学者",
            "intermediate": "进阶者",
            "expert": "精通者"
        }

        prompt = f"""你是补充问题生成器（Follow-up Question Agent）。

## 输入信息
{{
  "goal": "{form_data.get('goal', '')}",
  "user_profile": {{
    "experience_level": "{experience_map.get(form_data.get('experience', 'beginner'), '初学者')}",
    "daily_hours": "{form_data.get('daily_hours', '')}小时",
    "deadline": "{form_data.get('deadline', '无')}"
  }},
  "ai_analysis": {{
    "task_type": "{analysis.get('task_type', '')}",
    "experience_level": "{analysis.get('experience_level', '')}",
    "time_span": "{analysis.get('time_span', '')}"
  }}
}}

## 输出要求
生成1~2个高信息增益的补充问题。

## 输出格式
只返回JSON数组：
[
  {{"id": "q1", "question": "问题文本", "type": "text"}},
  {{"id": "q2", "question": "单选问题", "type": "single", "options": ["选项1", "选项2", "选项3"]}}
]"""

        print(f"\n[Agent 4] 开始生成补充问题...")
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
            if isinstance(result, dict) and "follow_up_questions" in result:
                result = result["follow_up_questions"]
            if isinstance(result, list):
                print(f"[Agent 4] 完成: 生成 {len(result)} 个问题")
                return result
        except:
            pass

        print(f"[Agent 4] 完成: 使用默认问题")
        return [{"id": "q1", "question": "你的具体期望是什么？", "type": "text"}]

    # ==================== Agent 5: 任务拆解 ====================
    def agent_breakdown(self, form_data: dict, analysis: dict) -> dict:
        """Agent 5: 任务拆解"""
        prompt = self._build_breakdown_prompt(form_data, analysis)

        print(f"\n[Agent 5] 开始执行任务拆解...")
        response = self._call_llm(
            [{"role": "system", "content": self._get_breakdown_system_prompt()},
             {"role": "user", "content": prompt}],
            temperature=0.7,
            model=self.model_generation
        )

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
        except:
            result = self._get_fallback_tasks(form_data)

        # 确保所有层级都存在
        if "yearly" not in result:
            result["yearly"] = []
        if "quarterly" not in result:
            result["quarterly"] = {}
        if "monthly" not in result:
            result["monthly"] = {}
        if "weekly" not in result:
            result["weekly"] = {}
        if "daily" not in result:
            result["daily"] = {}

        monthly_count = sum(len(tasks) for tasks in result.get("monthly", {}).values())
        weekly_count = sum(len(tasks) for tasks in result.get("weekly", {}).values())
        daily_count = sum(len(day_tasks) for week in result.get("daily", {}).values() for day_tasks in week.values())

        print(f"[Agent 5] 完成: 月度 {monthly_count} / 周度 {weekly_count} / 日度 {daily_count}")
        return result

    def _get_breakdown_system_prompt(self) -> str:
        """任务拆解系统提示"""
        return """你是一个任务拆解专家，负责将目标拆解成可执行的分层任务。

## 核心要求：嵌套层级结构

**月度层级** - monthly：{"第1个月 - 阶段名称": [任务数组]}
**周度层级** - weekly：{"第1个月 - 第1周": [任务数组], ...}
**日度层级** - daily：{"第1个月 - 第1周": {"1月1日": [任务数组], ...}, ...}

## 输出格式
只返回JSON，不要包含任何解释文字。"""

    def _build_breakdown_prompt(self, form_data: dict, analysis: dict) -> str:
        """构建拆解提示"""
        prompt = f"""请将以下目标拆解成可执行的任务：

## 目标
{form_data.get('goal', '')}

## AI分析结果
- 任务类型：{analysis.get('task_type', '')}
- 经验水平：{analysis.get('experience_level', '')}
- 时间跨度：{analysis.get('time_span', '')}

## 用户信息
- 每日可用时间：{form_data.get('daily_hours', '')}小时
- 工作日：{', '.join(form_data.get('working_days', [])) or '未指定'}

请按照嵌套JSON格式输出 monthly + weekly + daily 三层结构。"""
        return prompt

    def _get_fallback_tasks(self, form_data: dict) -> dict:
        """备用任务结构"""
        return {
            "yearly": [],
            "quarterly": {},
            "monthly": {"第1个月 - 基础学习": [{"id": "m1-1", "title": "学习基础知识"}]},
            "weekly": {"第1周": [{"id": "w1-1", "title": "了解基础概念"}]},
            "daily": {"第1天": [{"id": "d1-1", "title": "环境准备"}]}
        }

    # ==================== 完整流程 ====================
    def run_full_pipeline(self, form_data: dict) -> dict:
        """运行完整流程"""
        print("\n" + "="*60)
        print("开始完整任务拆解流程")
        print("="*60)

        import time
        start_time = time.time()

        # 第一阶段：3个分析Agent并行工作
        print("\n--- 第一阶段：分析 Agents (并行) ---")
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_type = executor.submit(self.agent_task_type, form_data)
            future_experience = executor.submit(self.agent_experience, form_data)
            future_time = executor.submit(self.agent_time_span, form_data)

            task_type = future_type.result()
            experience = future_experience.result()
            time_span = future_time.result()

        analysis = {
            "task_type": task_type,
            "experience_level": experience,
            "time_span": time_span
        }

        print(f"\n--- 分析结果汇总 ---")
        print(f"任务类型: {task_type}")
        print(f"经验水平: {experience}")
        print(f"时间跨度: {time_span}")

        # 第二阶段：任务拆解和问题生成并行
        print("\n--- 第二阶段：生成 Agents (并行) ---")
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_tasks = executor.submit(self.agent_breakdown, form_data, analysis)
            future_questions = executor.submit(self.agent_questions, form_data, analysis)

            tasks = future_tasks.result()
            questions = future_questions.result()

        elapsed = time.time() - start_time

        # 组装结果
        result = {
            "project_id": str(uuid.uuid4()),
            "analysis": analysis,
            "tasks": tasks,
            "follow_up_questions": questions,
            "elapsed_time": f"{elapsed:.2f}s"
        }

        print("\n" + "="*60)
        print(f"流程完成！总耗时: {elapsed:.2f} 秒")
        print("="*60)

        return result


def main():
    """测试入口"""
    pipeline = FullPipelineTest()

    # 测试用例
    test_form_data = {
        "goal": "一个月内完成博物馆网页开发",
        "has_deadline": "no",
        "deadline": None,
        "experience": "beginner",
        "importance": 4,
        "daily_hours": "2",
        "working_days": ["周一", "周二", "周三", "周四", "周五"],
        "blockers": "",
        "resources": "",
        "expectations": []
    }

    # 运行完整流程
    result = pipeline.run_full_pipeline(test_form_data)

    # 打印结果摘要
    print("\n" + "="*60)
    print("结果摘要")
    print("="*60)
    print(f"项目ID: {result['project_id']}")
    print(f"任务层级:")
    print(f"  - monthly: {len(result['tasks'].get('monthly', {}))} 个月")
    print(f"  - weekly: {len(result['tasks'].get('weekly', {}))} 周")
    print(f"  - daily: {len(result['tasks'].get('daily', {}))} 周的日度任务")
    print(f"补充问题: {len(result['follow_up_questions'])} 个")
    print(f"耗时: {result['elapsed_time']}")

    # 保存完整结果到文件
    output_file = "D:/Task Breakdown Tool/backend/test/output_result.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\n完整结果已保存到: {output_file}")


if __name__ == "__main__":
    main()
