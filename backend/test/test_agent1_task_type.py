"""
Agent 1: 任务类型分析 - 独立测试模块

测试 AI 分析目标属于哪种任务类型
"""
import os
import sys
from dotenv import load_dotenv

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI

load_dotenv()


class TaskTypeAgent:
    """Agent 1: 任务类型分析"""

    def __init__(self):
        api_key = os.getenv("SILICONFLOW_API_KEY")
        print(f"[DEBUG] API Key: {'已配置' if api_key else '未配置'}")

        self.client = OpenAI(
            api_key=api_key,
            base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
        )
        self.model = os.getenv("MODEL_ANALYSIS", "inclusionAI/Ling-flash-2.0")
        print(f"[DEBUG] 使用模型: {self.model}")

    def analyze(self, goal: str) -> str:
        """分析任务类型

        Args:
            goal: 用户的目标描述

        Returns:
            任务类型描述
        """
        prompt = f"""分析以下目标属于哪种任务类型，只返回类型名称和简短描述（50字以内）。

目标：{goal}

常见任务类型：
- 技能学习类：学习编程、学习语言、学习乐器等
- 项目开发类：开发网站、开发APP、写毕业论文等
- 健康健身类：减肥、增肌、跑步训练等
- 考试备考类：考研、考公、考证等
- 阅读写作类：读完N本书、写小说等
- 生活目标类：装修房子、旅行规划等

返回格式：类型名称 - 简短描述
例如：技能学习类 - 网页开发"""

        print(f"\n{'='*50}")
        print(f"[Agent 1] 正在分析任务类型...")
        print(f"{'='*50}")
        print(f"输入目标: {goal}")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=100,
                timeout=30,
            )

            result = response.choices[0].message.content.strip().split('\n')[0][:100]
            print(f"\n[Agent 1] 分析结果:")
            print(f"  {result}")
            print(f"{'='*50}\n")

            return result

        except Exception as e:
            print(f"\n[ERROR] Agent 1 调用失败: {str(e)}")
            print(f"{'='*50}\n")
            raise


def main():
    """测试入口"""
    agent = TaskTypeAgent()

    # 测试用例
    test_cases = [
        "一个月内完成博物馆网页开发",
        "三个月学会吉他弹唱",
        "半年减肥10公斤",
        "一年内通过CPA考试",
        "读完20本技术书籍",
    ]

    print("\n" + "="*50)
    print("Agent 1: 任务类型分析 - 测试开始")
    print("="*50 + "\n")

    for i, goal in enumerate(test_cases, 1):
        print(f"\n--- 测试用例 {i} ---")
        result = agent.analyze(goal)
        print(f"结果: {result}")

    print("\n" + "="*50)
    print("测试完成")
    print("="*50)


if __name__ == "__main__":
    main()
