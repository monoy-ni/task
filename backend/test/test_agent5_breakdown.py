"""
Agent 5: 任务拆解 - 独立测试模块

测试 AI 将目标拆解成可执行的分层任务
"""
import os
import sys
import json
from dotenv import load_dotenv
from datetime import datetime, timedelta

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI

load_dotenv()


class BreakdownAgent:
    """Agent 5: 任务拆解"""

    def __init__(self):
        api_key = os.getenv("SILICONFLOW_API_KEY")
        print(f"[DEBUG] API Key: {'已配置' if api_key else '未配置'}")

        self.client = OpenAI(
            api_key=api_key,
            base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
        )
        self.model = os.getenv("MODEL_GENERATION", "Qwen/Qwen2.5-72B-Instruct")
        print(f"[DEBUG] 使用模型: {self.model}")

    def get_system_prompt(self) -> str:
        """任务拆解Agent的系统提示"""
        return """你是一个任务拆解专家，负责将目标拆解成可执行的分层任务。

## 核心要求：嵌套层级结构

你必须按照以下嵌套关系生成任务：

**月度层级** - monthly：每个月的高层目标
- 格式：{"第1个月 - 阶段名称": [任务数组]}
- 每个月包含该月需要完成的核心任务

**周度层级** - weekly：隶属于某月的第N周
- 格式：{"第1个月 - 第1周": [任务数组], "第1个月 - 第2周": [任务数组], ...}
- 关键：每周key必须包含"月份 - 周数"，例如"第1个月 - 第1周"
- 每个月约4周，必须覆盖整个月的周数

**日度层级** - daily：隶属于某周的具体日期任务
- 格式：{"第1个月 - 第1周": {"1月1日": [任务数组], "1月2日": [任务数组], ...}, ...}
- 关键：daily是嵌套结构，外层key是"月份 - 周"，内层key是具体日期（如"1月1日"）
- 每周必须包含该周有任务的所有日期

## 输出格式示例

```json
{
  "monthly": {
    "第1个月 - 基础学习": [
      {"id": "m1-1", "title": "学习HTML基础", "description": "掌握HTML标签和语法", "estimated_hours": 15}
    ]
  },
  "weekly": {
    "第1个月 - 第1周": [
      {"id": "w1-1", "title": "环境搭建与HTML入门", "description": "安装开发工具，学习HTML基础"}
    ],
    "第1个月 - 第2周": [
      {"id": "w1-2", "title": "CSS样式学习", "description": "学习CSS选择器和基础样式"}
    ],
    "第1个月 - 第3周": [
      {"id": "w1-3", "title": "JavaScript基础", "description": "学习JS变量和函数"}
    ],
    "第1个月 - 第4周": [
      {"id": "w1-4", "title": "综合练习", "description": "制作第一个网页"}
    ]
  },
  "daily": {
    "第1个月 - 第1周": {
      "1月1日": [
        {"id": "d1-1", "title": "安装VS Code", "description": "下载安装代码编辑器", "estimated_hours": 1}
      ],
      "1月2日": [
        {"id": "d1-2", "title": "学习HTML标签", "description": "掌握h1,p,div等常用标签", "estimated_hours": 2}
      ],
      "1月3日": [
        {"id": "d1-3", "title": "编写第一个HTML页面", "description": "创建简单网页结构", "estimated_hours": 2}
      ]
    },
    "第1个月 - 第2周": {
      "1月8日": [
        {"id": "d2-1", "title": "CSS基础语法", "description": "学习选择器和样式规则", "estimated_hours": 2}
      ]
    }
  }
}
```

## 重要规则

1. **层级对应关系**：weekly的key必须对应monthly的月份，daily的key必须对应weekly的周
2. **日期格式**：使用"M月D日"格式，如"1月1日"、"1月15日"
3. **覆盖完整周期**：如果是1个月项目，生成4周；如果是1周项目，生成7天
4. **每日任务具体可执行**：如"安装VS Code"而非"学习安装"
5. **只返回需要的层级**：根据项目时长决定返回monthly+weekly+daily或weekly+daily

输出纯JSON，不要包含任何解释文字。"""

    def build_prompt(self, form_data: dict, analysis: dict) -> str:
        """构建任务拆解提示"""
        start_date = datetime.now()
        deadline = form_data.get('deadline')

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
        for _ in range(min(7, days_left)):
            date_examples.append(f"{current.month}月{current.day}日")
            current += timedelta(days=1)

        prompt = f"""请将以下目标拆解成可执行的任务：

## 目标
{form_data.get('goal', '')}

## 时间规划（重要）
- 开始日期：{start_date.year}年{start_date.month}月{start_date.day}日
- 截止日期：{deadline_date.year}年{deadline_date.month}月{deadline_date.day}日
- 总天数：约 {days_left} 天
- 需要拆解：{months_count} 个月，{weeks_count} 周
- 日期格式示例：{', '.join(date_examples[:5])}

## AI分析结果
- 任务类型：{analysis.get('task_type', '')}
- 经验水平：{analysis.get('experience_level', '')}
- 时间跨度：{analysis.get('time_span', '')}

## 用户信息
- 每日可用时间：{form_data.get('daily_hours', '')}小时
- 工作日：{', '.join(form_data.get('working_days', [])) or '未指定'}"""

        if form_data.get('blockers'):
            prompt += f"\n- 可能阻碍：{form_data.get('blockers')}"

        if form_data.get('resources'):
            prompt += f"\n- 已有资源：{form_data.get('resources')}"

        prompt += f"""

## 拆解要求
1. 月度任务：生成 {months_count} 个月的月度目标
2. 周度任务：每个月生成4周（第1周、第2周、第3周、第4周），周key格式为"第X个月 - 第Y周"
3. 日度任务：每周生成具体日期的任务，日期格式为"M月D日"（如"1月1日"），日度key格式为"第X个月 - 第Y周"
4. 日度任务外层是周，内层是日期，如 {{"第1个月 - 第1周": {{"1月1日": [...任务], "1月2日": [...任务]}}}}

请严格按照嵌套JSON格式输出。"""
        return prompt

    def breakdown(self, form_data: dict, analysis: dict) -> dict:
        """执行任务拆解

        Args:
            form_data: 表单数据
            analysis: AI分析结果

        Returns:
            拆解后的任务结构
        """
        prompt = self.build_prompt(form_data, analysis)

        print(f"\n{'='*50}")
        print(f"[Agent 5] 正在执行任务拆解...")
        print(f"{'='*50}")
        print(f"目标: {form_data.get('goal', '')}")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4096,
                timeout=300,
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

            print(f"\n[Agent 5] 原始响应长度: {len(content)} 字符")

            try:
                result = json.loads(content)

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

                # 统计任务数量
                monthly_count = sum(len(tasks) for tasks in result.get("monthly", {}).values())
                weekly_count = sum(len(tasks) for tasks in result.get("weekly", {}).values())
                daily_count = sum(len(day_tasks) for week in result.get("daily", {}).values() for day_tasks in week.values())

                print(f"\n[Agent 5] 拆解统计:")
                print(f"  月度任务: {monthly_count} 个")
                print(f"  周度任务: {weekly_count} 个")
                print(f"  日度任务: {daily_count} 个")
                print(f"{'='*50}\n")

                return result

            except json.JSONDecodeError as e:
                print(f"\n[ERROR] JSON解析失败: {e}")
                print(f"原始内容前500字符: {content[:500]}")
                print(f"{'='*50}\n")

                # 返回备用结构
                return self._get_fallback_tasks(form_data)

        except Exception as e:
            print(f"\n[ERROR] Agent 5 调用失败: {str(e)}")
            print(f"{'='*50}\n")
            raise

    def _get_fallback_tasks(self, form_data: dict) -> dict:
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


def main():
    """测试入口"""
    agent = BreakdownAgent()

    # 测试用例
    test_cases = [
        {
            "form_data": {
                "goal": "一个月内完成博物馆网页开发",
                "experience": "beginner",
                "daily_hours": "2",
                "working_days": ["周一", "周二", "周三", "周四", "周五"],
                "deadline": None,
                "blockers": "",
                "resources": "",
            },
            "analysis": {
                "task_type": "项目开发类 - 网页开发",
                "experience_level": "零基础 - 完全没有编程经验",
                "time_span": "短期(1个月) - 使用周度+日度拆解"
            }
        },
    ]

    print("\n" + "="*50)
    print("Agent 5: 任务拆解 - 测试开始")
    print("="*50 + "\n")

    for i, case in enumerate(test_cases, 1):
        print(f"\n--- 测试用例 {i} ---")
        result = agent.breakdown(case["form_data"], case["analysis"])
        print(f"\n结果预览:")
        print(f"  monthly keys: {list(result.get('monthly', {}).keys())}")
        print(f"  weekly keys: {list(result.get('weekly', {}).keys())}")
        print(f"  daily keys: {list(result.get('daily', {}).keys())}")

    print("\n" + "="*50)
    print("测试完成")
    print("="*50)


if __name__ == "__main__":
    main()
