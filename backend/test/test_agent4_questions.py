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
7.细节：根据不同的目标，更加深入的给予用户知识点，用于询问用户对目标的具体方向，如：想要做出什么产品，学到什么程度，是否期待知识延申或者扩展
## 输出格式
只返回JSON数组，不要输出解释、markdown、代码块、额外字段：

[{{
  "id": "q1",
  "question": "单选问题",
  "type": "single",
  "options": ["选项1", "选项2", "选项3"]
}}, {{
  "id": "q2",
  "question": "多选问题",
  "type": "multiple",
  "options": ["选项A", "选项B", "选项C"]
}}]"""

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
        "goal": "六个月内学会Python爬虫+数据分析，能独立做电商数据爬取项目",
        "experience": "advanced_beginner",  # 入门级（会基础语法，不会框架）
        "daily_hours": "2-3",  # 灵活时长（工作日2h，周末3h）
        "working_days": ["周一", "周二", "周四", "周五", "周日"],
        "importance": 4,
        "deadline": "2026-09-30",
        "blockers": "工作日晚上易被加班打断，无系统学习路径",
        "resources": "《Python爬虫实战》书籍、Anaconda环境、jupyter notebook",
        "expectations": ["分阶段学（爬虫→数据分析→项目）", "每周留1天做实战练习"]
    },
    "analysis": {
        "task_type": "技能学习类 - 编程技能进阶",
        "experience_level": "入门基础 - 掌握核心语法，无框架/项目经验",
        "time_span": "中期(6个月) - 使用月度+周度拆解，日度做细化"
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
