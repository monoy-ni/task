"""
Agent 2: 经验水平评估 - 独立测试模块

测试 AI 评估用户在某个领域的经验水平
"""
import os
import sys
from dotenv import load_dotenv

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI

load_dotenv()


class ExperienceAgent:
    """Agent 2: 经验水平评估"""

    def __init__(self):
        api_key = os.getenv("SILICONFLOW_API_KEY")
        print(f"[DEBUG] API Key: {'已配置' if api_key else '未配置'}")

        self.client = OpenAI(
            api_key=api_key,
            base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
        )
        self.model = os.getenv("MODEL_ANALYSIS", "inclusionAI/Ling-flash-2.0")
        print(f"[DEBUG] 使用模型: {self.model}")

    def evaluate(self, goal: str, user_exp: str) -> str:
        """评估经验水平

        Args:
            goal: 用户的目标描述
            user_exp: 用户自评经验 (beginner/intermediate/expert)

        Returns:
            经验水平评估描述
        """
        prompt = f"""根据用户的目标和自评经验，给出更精准的经验水平评估。

目标：{goal}
用户自评：{user_exp}

请判断用户在该领域的真实水平，给出简短评估（50字以内）。

返回格式：水平等级 - 具体描述
例如：零基础 - 完全没有编程经验，需要从基础概念开始"""

        print(f"\n{'='*50}")
        print(f"[Agent 2] 正在评估经验水平...")
        print(f"{'='*50}")
        print(f"目标: {goal}")
        print(f"用户自评: {user_exp}")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=100,
                timeout=30,
            )

            result = response.choices[0].message.content.strip().split('\n')[0][:100]
            print(f"\n[Agent 2] 评估结果:")
            print(f"  {result}")
            print(f"{'='*50}\n")

            return result

        except Exception as e:
            print(f"\n[ERROR] Agent 2 调用失败: {str(e)}")
            print(f"{'='*50}\n")
            raise


def main():
    """测试入口"""
    agent = ExperienceAgent()

    # 测试用例
    test_cases = [
        {
            "goal": "一个月内完成博物馆网页开发",
            "user_exp": "beginner"
        },
        {
            "goal": "三个月学会吉他弹唱",
            "user_exp": "intermediate"
        },
        {
            "goal": "开发一个React Native应用",
            "user_exp": "expert"
        },
    ]

    print("\n" + "="*50)
    print("Agent 2: 经验水平评估 - 测试开始")
    print("="*50 + "\n")

    for i, case in enumerate(test_cases, 1):
        print(f"\n--- 测试用例 {i} ---")
        result = agent.evaluate(case["goal"], case["user_exp"])
        print(f"结果: {result}")

    print("\n" + "="*50)
    print("测试完成")
    print("="*50)


if __name__ == "__main__":
    main()
