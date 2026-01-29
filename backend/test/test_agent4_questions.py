"""
Agent 4: 补充问题生成 - 独立测试模块

测试 AI 生成高价值的补充问题
"""
import os
import sys
import json
from dotenv import load_dotenv

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI

load_dotenv()


class QuestionsAgent:
    """Agent 4: 补充问题生成"""

    def __init__(self):
        api_key = os.getenv("SILICONFLOW_API_KEY")
        print(f"[DEBUG] API Key: {'已配置' if api_key else '未配置'}")

        self.client = OpenAI(
            api_key=api_key,
            base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
        )
        self.model = os.getenv("MODEL_GENERATION", "Qwen/Qwen2.5-72B-Instruct")
        print(f"[DEBUG] 使用模型: {self.model}")

    def generate(self, form_data: dict, analysis: dict) -> list:
        """生成补充问题

        Args:
            form_data: 表单数据
            analysis: AI分析结果

        Returns:
            补充问题列表
        """
        experience_map = {
            "beginner": "初学者",
            "intermediate": "进阶者",
            "expert": "精通者"
        }

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

## 输出要求
生成1~3个高信息增益的补充问题，遵循以下原则：

1. **高信息增益**：优先问若回答会显著改变任务结构或排程的因素
2. **可执行性相关**：问题需围绕时间/范围/质量标准/资源/约束/依赖/风险/优先级/验收方式
3. **避免重复**：不要问用户已经填写过的问题
4. **低回答成本**：优先用single/multiple（给选项），只有必须时才用text
5. **可选语气**：用户可以跳过，不要用强制性语言
6. **保护隐私**：不要索要不必要的个人敏感信息；如必须涉及（如预算），用区间或选项

## 输出格式
只返回JSON数组，不要输出解释、markdown、代码块、额外字段：

[
  {{"id": "q1", "question": "问题文本", "type": "text"}},
  {{"id": "q2", "question": "单选问题", "type": "single", "options": ["选项1", "选项2", "选项3"]}},
  {{"id": "q3", "question": "多选问题", "type": "multiple", "options": ["选项A", "选项B", "选项C"]}}
]"""

        print(f"\n{'='*50}")
        print(f"[Agent 4] 正在生成补充问题...")
        print(f"{'='*50}")
        print(f"目标: {form_data.get('goal', '')}")
        print(f"分析结果: {analysis}")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=4096,
                timeout=120,
            )

            content = response.choices[0].message.content

            # 提取JSON
            if "```json" in content:
                start = content.find("```json") + 7
                end = content.rfind("```")
                content = content[start:end].strip()
            elif "```" in content:
                start = content.find("```") + 3
                end = content.rfind("```")
                content = content[start:end].strip()

            print(f"\n[Agent 4] 原始响应:")
            print(f"  {content[:200]}...")

            try:
                result = json.loads(content)
                if isinstance(result, dict) and "follow_up_questions" in result:
                    result = result["follow_up_questions"]
                if isinstance(result, list):
                    print(f"\n[Agent 4] 生成问题数: {len(result)}")
                    for i, q in enumerate(result, 1):
                        print(f"  问题{i}: {q.get('question', 'N/A')} ({q.get('type', 'text')})")
                    print(f"{'='*50}\n")
                    return result
            except json.JSONDecodeError as e:
                print(f"\n[ERROR] JSON解析失败: {e}")
                print(f"{'='*50}\n")

            return [{"id": "q1", "question": "你的具体期望是什么？", "type": "text"}]

        except Exception as e:
            print(f"\n[ERROR] Agent 4 调用失败: {str(e)}")
            print(f"{'='*50}\n")
            raise


def main():
    """测试入口"""
    agent = QuestionsAgent()

    # 测试用例
    test_cases = [
        {
            "form_data": {
                "goal": "一个月内完成博物馆网页开发",
                "experience": "beginner",
                "daily_hours": "2",
                "working_days": ["周一", "周二", "周三", "周四", "周五"],
                "importance": 4,
                "deadline": None,
                "blockers": "",
                "resources": "",
                "expectations": []
            },
            "analysis": {
                "task_type": "项目开发类 - 网页开发",
                "experience_level": "零基础 - 完全没有编程经验",
                "time_span": "短期(1个月) - 使用周度+日度拆解"
            }
        },
    ]

    print("\n" + "="*50)
    print("Agent 4: 补充问题生成 - 测试开始")
    print("="*50 + "\n")

    for i, case in enumerate(test_cases, 1):
        print(f"\n--- 测试用例 {i} ---")
        result = agent.generate(case["form_data"], case["analysis"])
        print(f"\n结果: {json.dumps(result, ensure_ascii=False, indent=2)}")

    print("\n" + "="*50)
    print("测试完成")
    print("="*50)


if __name__ == "__main__":
    main()
