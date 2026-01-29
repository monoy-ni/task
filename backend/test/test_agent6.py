"""
Agent 6: 专业任务拆解器 - 将需求拆解成月度→周度→日度的详细任务计划

用法1：初次拆解
    python test_agent6.py "你的需求描述"

示例：
    python test_agent6.py "做一个博物馆网站，4个页面，统一风格，响应式，一个月上线"

用法2：基于补充问题优化任务
    python test_agent6.py --regenerate tasks.json --answers "experience=初学者,priority=前端开发"

可选参数：
    --daily-hours 1     每天可用小时数（默认1）
    --weeks 4           总周数（默认4）
    --deadline 2025-03-01  截止日期
    --json              只输出JSON格式
    --output file.json  保存到文件
    --regenerate file   重新生成模式：基于已有任务和补充答案优化
    --answers k=v,k=v    补充问题答案（配合--regenerate使用）
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from dotenv import load_dotenv
from openai import OpenAI
import httpx

load_dotenv()


class Agent6:
    """Agent 6: 专业任务拆解器"""

    def __init__(self):
        api_key = os.getenv("SILICONFLOW_API_KEY")
        if not api_key:
            raise ValueError("SILICONFLOW_API_KEY 环境变量未设置")

        # 创建自定义 httpx 客户端
        try:
            self.client = OpenAI(
                api_key=api_key,
                base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1"),
                http_client=httpx.Client(
                    verify=False,
                    timeout=120.0
                )
            )
        except Exception as e:
            print(f"[WARNING] 自定义 HTTP 客户端创建失败: {e}")
            self.client = OpenAI(
                api_key=api_key,
                base_url=os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
            )

        # 使用思考模型
        self.model = os.getenv("MODEL_GENERATION", "moonshotai/Kimi-K2-Thinking")

    def _call_llm(self, messages: list, temperature: float = 0.7) -> str:
        """调用 LLM"""
        try:
            print(f"[DEBUG] 调用 AI 模型: {self.model}")
            timeout_val = 600.0 if "Thinking" in self.model or "thinking" in self.model else 120.0

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=4096,
                timeout=timeout_val,
            )
            return response.choices[0].message.content
        except Exception as e:
            raise RuntimeError(f"AI 调用失败: {str(e)}")

    def _get_system_prompt(self) -> str:
        """获取系统提示词"""
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

    def build_prompt(self, requirement: str, daily_hours: str, total_weeks: int, start_date: datetime) -> str:
        """构建用户提示"""
        # 生成日期示例
        date_examples = []
        current = start_date
        for i in range(7):
            date_examples.append(f"Day{i+1}: {current.month}月{current.day}日")
            current += timedelta(days=1)

        prompt = f"""请将以下需求拆解成详细的月度→周度→日度任务计划：

## 用户需求
{requirement}

## 时间约束
- 每天可用时间：{daily_hours} 小时
- 总周期：{total_weeks} 周
- 开始日期：{start_date.year}年{start_date.month}月{start_date.day}日

## 日期格式示例
{', '.join(date_examples)}

## 拆解要求
1. **月度任务**：描述整体目标和最终产出
2. **周度任务**：每周目标 + 明确产出（必须用"产出："开头）
3. **日度任务**：每天1小时内能完成的具体操作，每步都有产出
4. **每周最后一天**：设为"机动"日，用于查漏补缺
5. **任务递进**：从简单到复杂，循序渐进

请严格按照JSON格式输出，不要有其他文字。"""
        return prompt

    def breakdown(self, requirement: str, daily_hours: str = "1", total_weeks: int = 4) -> dict:
        """
        将需求拆解成任务计划

        Args:
            requirement: 需求描述
            daily_hours: 每天可用小时数
            total_weeks: 总周数

        Returns:
            包含月度、周度、日度任务的字典
        """
        start_date = datetime.now()

        prompt = self.build_prompt(requirement, daily_hours, total_weeks, start_date)

        response = self._call_llm(
            [
                {"role": "system", "content": self._get_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        return self.parse_response(response, requirement, daily_hours)

    def parse_response(self, response: str, requirement: str, daily_hours: str) -> dict:
        """解析AI响应"""
        print(f"\n[DEBUG] 原始响应长度: {len(response)} 字符")

        response = response.strip()

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
            # 添加元数据
            result["metadata"] = {
                "requirement": requirement,
                "daily_hours": daily_hours,
                "generated_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            return result
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON解析失败: {e}")
            print(f"[ERROR] 响应内容:\n{response[:500]}")
            return None

    def regenerate(
        self,
        original_tasks: dict,
        answers: dict[str, str],
        daily_hours: str = "1"
    ) -> dict:
        """
        基于已有任务和补充问题答案重新生成任务计划

        Args:
            original_tasks: 原始任务拆解结果
            answers: 补充问题的答案，如 {"q1": "我是初学者", "q2": "每天2小时"}
            daily_hours: 每天可用小时数

        Returns:
            优化后的任务拆解结果
        """
        # 构建已有任务摘要
        monthly_summary = []
        monthly_tasks = original_tasks.get('monthly', {})
        for month, info in monthly_tasks.items():
            monthly_summary.append(f"- {month}: {info.get('goal', '')}")

        weekly_summary = []
        weekly_tasks = original_tasks.get('weekly', {})
        for week, info in weekly_tasks.items():
            weekly_summary.append(f"- {week}: {info.get('goal', '')}")

        daily_summary = []
        daily_tasks = original_tasks.get('daily', {})
        for week, days in list(daily_tasks.items())[:3]:  # 只显示前3周
            daily_summary.append(f"- {week}: {len(days)}天任务")

        # 构建补充信息提示
        answers_text = "\n".join([f"- {k}: {v}" for k, v in answers.items()])

        prompt = f"""请根据用户的补充信息，优化以下任务计划：

## 原始任务计划

月度任务:
{chr(10).join(monthly_summary[:3])}

周度任务:
{chr(10).join(weekly_summary[:3])}

日度任务:
{chr(10).join(daily_summary)}

## 用户补充信息

{answers_text}

请根据这些补充信息，重新调整和优化任务拆解，使其更符合用户的具体情况。

## 优化重点（按优先级）

### 1. 确认关键假设
基于补充信息，识别并调整任务计划中的关键假设：
- 技术选型假设（如：使用特定框架/工具）
- 资源假设（如：团队规模、可用时间、预算）
- 前置条件假设（如：已有知识、设备、环境）

### 2. 选择策略偏好
根据用户补充，明确项目策略方向：
- 速度 vs 质量：快速迭代 vs 精雕细琢
- 自研 vs 采购：自己实现 vs 使用现成方案
- 学习 vs 产出：以学习为主 vs 以结果为主
- 风险态度：激进尝试 vs 稳妥保守

### 3. 识别硬约束/风险
标记并调整任务以应对：
- 时间硬约束：不可移动的截止日期
- 资源硬约束：预算上限、人力限制
- 技术风险：未知领域、复杂集成
- 依赖风险：第三方服务、外部协作

## 调整要求
- 保持原有的月度→周度→日度结构
- 对受影响的任务进行具体调整（不要泛泛而谈）
- 在 weekly 的 output 中明确体现策略选择的变化
- 在 daily 的 description 中标注硬约束和风险点

请严格按照JSON格式输出，不要有其他文字。"""

        response = self._call_llm(
            [
                {"role": "system", "content": self._get_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        return self.parse_response(response, original_tasks.get('metadata', {}).get('requirement', ''), daily_hours)


def format_output(result: dict) -> str:
    """格式化输出结果"""
    if not result:
        return "解析失败，无法格式化输出"

    lines = []
    lines.append("=" * 60)
    lines.append(f"项目名称: {result.get('project_name', 'N/A')}")
    lines.append(f"项目概述: {result.get('overview', 'N/A')}")
    lines.append("=" * 60)

    # 月度任务
    monthly = result.get('monthly', {})
    if monthly:
        lines.append("\n【月度任务】")
        for month, info in monthly.items():
            lines.append(f"\n  {month}")
            lines.append(f"    目标: {info.get('goal', '')}")
            lines.append(f"    产出: {info.get('output', '')}")

    # 周度任务
    weekly = result.get('weekly', {})
    if weekly:
        lines.append("\n【周度任务】")
        for week, info in weekly.items():
            lines.append(f"\n  {week}")
            lines.append(f"    目标: {info.get('goal', '')}")
            lines.append(f"    产出: {info.get('output', '')}")
            lines.append(f"    重点: {info.get('focus', '')}")

    # 日度任务
    daily = result.get('daily', {})
    if daily:
        lines.append("\n【日度任务】")
        for week, days in daily.items():
            lines.append(f"\n  {week}")
            for day, task in days.items():
                lines.append(f"    {day}: {task.get('title', '')}")
                lines.append(f"        描述: {task.get('description', '')}")
                lines.append(f"        {task.get('output', '')}")

    lines.append("\n" + "=" * 60)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Agent 6: 专业任务拆解器")
    parser.add_argument("requirement", nargs='?', help="需求描述")
    parser.add_argument("--daily-hours", default="1", help="每天可用小时数（默认1）")
    parser.add_argument("--weeks", type=int, default=4, help="总周数（默认4）")
    parser.add_argument("--deadline", help="截止日期（格式：YYYY-MM-DD）")
    parser.add_argument("--json", action="store_true", help="只输出JSON格式")
    parser.add_argument("--output", help="保存到文件")
    parser.add_argument("--regenerate", help="重新生成模式：指定已保存的任务JSON文件")
    parser.add_argument("--answers", help="补充问题答案，格式: 'key1=value1,key2=value2'")

    args = parser.parse_args()

    # 重新生成模式
    if args.regenerate:
        print(f"\n{'='*60}")
        print(f"Agent 6: 任务优化模式（基于补充问题重新生成）")
        print(f"{'='*60}")

        # 读取已有任务
        try:
            with open(args.regenerate, 'r', encoding='utf-8') as f:
                original_tasks = json.load(f)
        except Exception as e:
            print(f"[ERROR] 无法读取任务文件: {e}")
            sys.exit(1)

        # 解析答案
        answers = {}
        if args.answers:
            for pair in args.answers.split(','):
                if '=' in pair:
                    key, value = pair.split('=', 1)
                    answers[key] = value

        if not answers:
            print("[WARNING] 没有提供补充答案，将返回原始任务")
            print(f"\n原始任务:\n{format_output(original_tasks)}")
            return

        print(f"原始任务: {args.regenerate}")
        print(f"补充答案: {answers}")
        print(f"{'='*60}\n")

        try:
            agent = Agent6()
            result = agent.regenerate(original_tasks, answers, args.daily_hours)

            if result:
                output = format_output(result)
                print("\n【优化后的任务计划】")
                print(output)
            else:
                print("[ERROR] 优化失败")
                sys.exit(1)
        except Exception as e:
            print(f"[ERROR] {str(e)}")
            sys.exit(1)

        return

    # 正常模式
    if not args.requirement:
        parser.print_help()
        sys.exit(1)

    # 计算周数
    total_weeks = args.weeks
    if args.deadline:
        try:
            deadline_date = datetime.strptime(args.deadline, '%Y-%m-%d')
            total_weeks = max(1, (deadline_date - datetime.now()).days // 7)
            print(f"[INFO] 根据截止日期计算，共 {total_weeks} 周")
        except ValueError:
            print(f"[WARNING] 截止日期格式错误，使用默认周数 {total_weeks}")

    print(f"\n{'='*60}")
    print(f"Agent 6: 专业任务拆解器")
    print(f"{'='*60}")
    print(f"需求: {args.requirement}")
    print(f"每天: {args.daily_hours} 小时")
    print(f"周期: {total_weeks} 周")
    print(f"{'='*60}\n")

    try:
        agent = Agent6()
        result = agent.breakdown(args.requirement, args.daily_hours, total_weeks)

        if result:
            if args.json:
                output = json.dumps(result, ensure_ascii=False, indent=2)
            else:
                output = format_output(result)

            if args.output:
                with open(args.output, 'w', encoding='utf-8') as f:
                    f.write(output)
                print(f"\n[INFO] 结果已保存到: {args.output}")
            else:
                print(output)
        else:
            print("[ERROR] 拆解失败")
            sys.exit(1)

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
