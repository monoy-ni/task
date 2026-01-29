"""
Agent 3: 时间跨度判断 - 独立测试模块

测试 AI 判断应该用什么时间跨度来拆解任务
"""
import os
import sys
from dotenv import load_dotenv
from datetime import datetime

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI

load_dotenv()


class TimeSpanAgent:
    """Agent 3: 时间跨度判断"""

    def __init__(self):
        api_key = os.getenv("SILICONFLOW_API_KEY")
        print(f"[DEBUG] API Key: {'已配置' if api_key else '未配置'}")

        self.client = OpenAI(
            api_key=api_key,
            base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
        )
        self.model = os.getenv("MODEL_ANALYSIS", "inclusionAI/Ling-flash-2.0")
        print(f"[DEBUG] 使用模型: {self.model}")

    def analyze(self, goal: str, deadline: str = None, daily_hours: str = "2") -> str:
        """判断时间跨度

        Args:
            goal: 用户的目标描述
            deadline: 截止日期 (YYYY-MM-DD 格式)
            daily_hours: 每日可用小时数

        Returns:
            时间跨度建议
        """
        # 计算时间信息
        if deadline:
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

        print(f"\n{'='*50}")
        print(f"[Agent 3] 正在分析时间跨度...")
        print(f"{'='*50}")
        print(f"目标: {goal}")
        print(f"时间情况: {time_info}")
        print(f"每日可用: {daily_hours}小时")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=100,
                timeout=30,
            )

            result = response.choices[0].message.content.strip().split('\n')[0][:100]
            print(f"\n[Agent 3] 分析结果:")
            print(f"  {result}")
            print(f"{'='*50}\n")

            return result

        except Exception as e:
            print(f"\n[ERROR] Agent 3 调用失败: {str(e)}")
            print(f"{'='*50}\n")
            raise


def main():
    """测试入口"""
    agent = TimeSpanAgent()

    # 测试用例
    test_cases = [
        {
            "goal": "一个月内完成博物馆网页开发",
            "deadline": None,
            "daily_hours": "2"
        },
        {
            "goal": "三个月学会吉他弹唱",
            "deadline": "2025-04-30",
            "daily_hours": "1"
        },
        {
            "goal": "考研准备",
            "deadline": "2025-12-25",
            "daily_hours": "4"
        },
    ]

    print("\n" + "="*50)
    print("Agent 3: 时间跨度判断 - 测试开始")
    print("="*50 + "\n")

    for i, case in enumerate(test_cases, 1):
        print(f"\n--- 测试用例 {i} ---")
        result = agent.analyze(case["goal"], case["deadline"], case["daily_hours"])
        print(f"结果: {result}")

    print("\n" + "="*50)
    print("测试完成")
    print("="*50)


if __name__ == "__main__":
    main()
