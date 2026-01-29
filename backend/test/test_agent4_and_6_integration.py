"""
Agent 4 & Agent 6 联调测试 - 支持多轮循环模式

测试流程：

【单轮模式】
【阶段1 - 并行】Agent 4 生成补充问题 + Agent 6 初次任务拆解
【阶段2】用户回答补充问题
【阶段3】Agent 6 基于答案优化任务计划

【多轮模式】上下文累加循环：
【第1轮】阶段1(并行): Agent 4 生成问题 + Agent 6 初次拆解
        → 阶段2: 用户回答
        → 阶段3: Agent 6 优化 + Agent 4 生成新问题
【后续轮】阶段2: 用户回答补充问题
        → 阶段3: Agent 6 优化任务 + Agent 4 生成新问题
        → 循环...

上下文每轮累加：所有历史问题 + 所有历史答案

用法：
    # 单轮测试 (默认)
    python test_agent4_and_6_integration.py

    # 多轮测试（例如5轮）
    python test_agent4_and_6_integration.py --rounds 5

    # 无限循环模式（手动 Ctrl+C 停止）
    python test_agent4_and_6_integration.py --rounds 0

    # 指定测试用例
    python test_agent4_and_6_integration.py --rounds 3 --case 2
"""
import os
import sys
import json
import time
import argparse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入 Agent 4 和 Agent 6
from test_agent4_questions import QuestionsAgent
from test_agent6 import Agent6

load_dotenv()


class Agent4And6IntegrationTest:
    """Agent 4 和 Agent 6 联调测试"""

    def __init__(self):
        print("\n" + "=" * 70)
        print("Agent 4 & Agent 6 联调测试初始化")
        print("=" * 70)

        self.agent4 = QuestionsAgent()
        self.agent6 = Agent6()

        print(f"[INFO] Agent 4 (补充问题生成器): 已初始化")
        print(f"[INFO] Agent 6 (专业任务拆解器): 已初始化")
        print("=" * 70 + "\n")

    def run_full_integration_test(
        self,
        goal: str,
        form_data: dict,
        analysis: dict,
        user_answers: dict = None
    ) -> dict:
        """
        运行完整联调测试流程（单轮模式）

        Args:
            goal: 用户目标描述
            form_data: 表单数据
            analysis: AI分析结果 (task_type, experience_level, time_span)
            user_answers: 用户对补充问题的答案

        Returns:
            包含问题、答案和优化后任务的完整结果
        """
        print("\n" + "=" * 70)
        print("开始 Agent 4 & Agent 6 联调流程（并行模式）")
        print("=" * 70)

        result = {
            "goal": goal,
            "form_data": form_data,
            "analysis": analysis,
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        # 计算时间参数
        daily_hours = form_data.get('daily_hours', '2')
        deadline = form_data.get('deadline')
        if deadline:
            try:
                deadline_date = datetime.strptime(deadline, '%Y-%m-%d')
                total_weeks = max(1, (deadline_date - datetime.now()).days // 7)
            except:
                total_weeks = 4
        else:
            total_weeks = 4

        # ========== 阶段1: Agent 4 和 Agent 6 并行工作 ==========
        print("\n【阶段 1/3】并行执行: Agent 4 (生成问题) + Agent 6 (初次拆解)")
        print("-" * 70)

        start_time = time.time()

        questions = None
        initial_tasks = None

        # 使用线程池并行执行
        with ThreadPoolExecutor(max_workers=2) as executor:
            # 提交 Agent 4 任务
            future_questions = executor.submit(
                self.agent4.generate,
                form_data,
                analysis
            )
            print(f"[并行] Agent 4 任务已提交...")

            # 提交 Agent 6 任务
            future_tasks = executor.submit(
                self.agent6.breakdown,
                goal,
                daily_hours,
                total_weeks
            )
            print(f"[并行] Agent 6 任务已提交...")

            # 等待并获取结果
            questions = future_questions.result()
            print(f"[并行] Agent 4 完成: 生成 {len(questions)} 个问题")

            initial_tasks = future_tasks.result()
            print(f"[并行] Agent 6 完成: 初次任务拆解完成")

        parallel_time = time.time() - start_time
        print(f"\n[并行阶段] 总耗时: {parallel_time:.2f} 秒")

        result["follow_up_questions"] = questions
        result["initial_tasks"] = initial_tasks

        # 打印补充问题
        print(f"\n>>> Agent 4 生成补充问题:")
        for i, q in enumerate(questions, 1):
            print(f"  问题 {i} ({q.get('id', 'N/A')}): {q.get('question', 'N/A')[:50]}...")
            if q.get('options'):
                print(f"    选项: {q.get('options')}")

        # 打印初次任务摘要
        self._print_task_summary("Agent 6 初次任务拆解", initial_tasks)

        # ========== 阶段2: 模拟用户回答补充问题 ==========
        print("\n【阶段 2/3】模拟用户回答补充问题")
        print("-" * 70)

        # 如果没有提供答案，生成默认答案
        if user_answers is None:
            user_answers = self._generate_default_answers(questions)

        result["user_answers"] = user_answers

        print("\n用户答案:")
        for q_id, answer in user_answers.items():
            # 找到对应的问题
            question = next((q for q in questions if q.get('id') == q_id), None)
            question_text = question.get('question', 'N/A') if question else 'N/A'
            print(f"  {q_id}: {question_text[:40]}...")
            print(f"    -> 答案: {answer}")

        # ========== 阶段3: Agent 6 基于答案优化任务 ==========
        print("\n【阶段 3/3】Agent 6: 基于补充答案优化任务")
        print("-" * 70)

        optimize_start = time.time()
        optimized_tasks = self.agent6.regenerate(initial_tasks, user_answers, daily_hours)
        optimize_time = time.time() - optimize_start

        result["optimized_tasks"] = optimized_tasks

        print(f"[优化阶段] 耗时: {optimize_time:.2f} 秒")
        self._print_task_summary("Agent 6 优化后任务拆解", optimized_tasks)

        # ========== 对比分析 ==========
        print("\n【对比分析】初次 vs 优化")
        print("-" * 70)

        self._compare_tasks(initial_tasks, optimized_tasks)

        # ========== 完成 ==========
        total_time = parallel_time + optimize_time
        print("\n" + "=" * 70)
        print(f"联调流程完成! 总耗时: {total_time:.2f} 秒")
        print(f"  - 并行阶段 (Agent4 + Agent6): {parallel_time:.2f} 秒")
        print(f"  - 优化阶段 (Agent6 regenerate): {optimize_time:.2f} 秒")
        print("=" * 70)

        return result

    def run_multi_round_test(
        self,
        goal: str,
        form_data: dict,
        analysis: dict,
        max_rounds: int = 5
    ) -> dict:
        """
        运行多轮循环测试，测试 Agent 4 在多轮对话中的表现

        流程：
        【第1轮】阶段1(并行): Agent 4 生成问题 + Agent 6 初次拆解 → 阶段2: 用户回答 → 阶段3: Agent 6 优化 + Agent 4 生成新问题
        【后续轮】阶段2: 用户回答 → 阶段3: Agent 6 优化 + Agent 4 生成新问题

        上下文每轮累加（历史问题 + 答案）

        Args:
            goal: 用户目标描述
            form_data: 表单数据
            analysis: AI分析结果
            max_rounds: 最大轮数，0 表示无限循环（需要手动停止）

        Returns:
            包含所有轮次结果的完整数据
        """
        print("\n" + "=" * 70)
        print(f"多轮循环测试模式 (max_rounds={max_rounds}, 0=无限)")
        print("=" * 70)

        # 计算时间参数
        daily_hours = form_data.get('daily_hours', '2')
        deadline = form_data.get('deadline')
        if deadline:
            try:
                deadline_date = datetime.strptime(deadline, '%Y-%m-%d')
                total_weeks = max(1, (deadline_date - datetime.now()).days // 7)
            except:
                total_weeks = 4
        else:
            total_weeks = 4

        result = {
            "goal": goal,
            "form_data": form_data,
            "analysis": analysis,
            "start_time": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "max_rounds": max_rounds,
            "rounds": []
        }

        # ========== 第1轮：阶段1 并行执行 ==========
        print("\n【第 1 轮 - 阶段1】并行执行: Agent 4 (生成问题) + Agent 6 (初次拆解)")
        print("-" * 70)

        start_time = time.time()

        initial_questions = None
        initial_tasks = None

        # 并行执行 Agent 4 和 Agent 6
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_questions = executor.submit(
                self.agent4.generate,
                form_data,
                analysis
            )
            print(f"[并行] Agent 4 任务已提交...")

            future_tasks = executor.submit(
                self.agent6.breakdown,
                goal,
                daily_hours,
                total_weeks
            )
            print(f"[并行] Agent 6 任务已提交...")

            initial_questions = future_questions.result()
            print(f"[并行] Agent 4 完成: 生成 {len(initial_questions)} 个问题")

            initial_tasks = future_tasks.result()
            print(f"[并行] Agent 6 完成: 初次任务拆解完成")

        parallel_time = time.time() - start_time
        print(f"\n[并行阶段] 耗时: {parallel_time:.2f} 秒")

        # 保存初始任务
        result["initial_tasks"] = initial_tasks

        # 打印初始问题
        print(f"\n>>> Agent 4 生成补充问题:")
        for i, q in enumerate(initial_questions, 1):
            print(f"  问题 {i} ({q.get('id', 'N/A')}): {q.get('question', 'N/A')[:60]}...")
            if q.get('options'):
                print(f"    选项: {q.get('options')}")

        self._print_task_summary("Agent 6 初次任务拆解", initial_tasks)

        # ========== 上下文累加器 ==========
        all_questions_history = initial_questions[:]  # 所有历史问题
        all_answers_history = {}  # 所有历史答案
        current_tasks = initial_tasks

        # ========== 第1轮：阶段2+3 ==========
        print("\n【第 1 轮 - 阶段2】用户回答补充问题")
        print("-" * 70)

        round_answers = self._generate_default_answers(initial_questions)

        # 合并到总答案历史
        for q_id, answer in round_answers.items():
            all_answers_history[q_id] = answer

        print("\n用户答案:")
        for q_id, answer in round_answers.items():
            question = next((q for q in initial_questions if q.get('id') == q_id), None)
            question_text = question.get('question', 'N/A') if question else 'N/A'
            print(f"  {q_id}: {question_text[:50]}...")
            print(f"    -> 答案: {answer}")

        print("\n【第 1 轮 - 阶段3】Agent 6: 基于答案优化任务 + Agent 4: 生成新问题")
        print("-" * 70)

        # Agent 6 优化任务
        optimize_start = time.time()
        current_tasks = self.agent6.regenerate(current_tasks, round_answers, daily_hours)
        optimize_time = time.time() - optimize_start

        print(f"[优化] 耗时: {optimize_time:.2f} 秒")
        self._print_task_summary("第 1 轮优化后", current_tasks)

        # Agent 4 生成新问题（基于历史问题避免重复）
        print(f"\n>>> Agent 4: 基于历史问题生成新问题...")
        new_questions = self.agent4.generate(form_data, analysis)

        # 检测重复并统计
        new_count, duplicate_count = self._analyze_questions(new_questions, all_questions_history)

        print(f"生成问题: {len(new_questions)} 个 (新: {new_count}, 重复: {duplicate_count})")
        for i, q in enumerate(new_questions, 1):
            is_dup = self._is_duplicate_question(q, all_questions_history)
            dup_mark = " [重复!]" if is_dup else ""
            print(f"  Q{i} ({q.get('id', 'N/A')}): {q.get('question', 'N/A')[:60]}...{dup_mark}")

        # 累加到历史
        all_questions_history.extend(new_questions)

        # 记录本轮结果
        round_result = {
            "round": 1,
            "phase": "阶段2+3",
            "questions": new_questions,
            "new_questions_count": new_count,
            "duplicate_questions_count": duplicate_count,
            "answers": round_answers,
            "tasks_after": self._get_task_summary(current_tasks),
            "optimize_time": optimize_time,
            "total_questions_history": len(all_questions_history),
            "total_answers_history": len(all_answers_history)
        }
        result["rounds"].append(round_result)

        # 检查是否应该继续
        if max_rounds > 0 and max_rounds == 1:
            self._print_multi_round_summary(result)
            return result

        if new_count == 0 and duplicate_count > 0:
            print("\n  ⚠️ 所有问题都与之前重复，测试建议结束")
            if max_rounds != 0:
                user_input = input("  是否继续下一轮? (y/n): ").strip().lower()
                if user_input != 'y':
                    self._print_multi_round_summary(result)
                    return result

        # ========== 后续轮：阶段2+3 循环 ==========
        round_num = 1
        while max_rounds == 0 or round_num < max_rounds:
            round_num += 1

            print("\n" + "=" * 70)
            print(f"【第 {round_num} 轮 - 阶段2】用户回答补充问题")
            print("-" * 70)

            # 如果没有新问题，提示并询问是否继续
            if len(new_questions) == 0:
                print("  ⚠️ 上一轮没有生成新问题")
                if max_rounds != 0:
                    continue_input = input("  继续下一轮? (y/n): ").strip().lower()
                    if continue_input != 'y':
                        break

                # 强制尝试生成一个问题
                print("  >>> 尝试强制生成一个问题...")
                new_questions = self.agent4.generate(form_data, analysis)

                if len(new_questions) == 0:
                    print("  ⚠️ 仍然无法生成问题，测试结束")
                    break

                new_count, duplicate_count = self._analyze_questions(new_questions, all_questions_history)
                all_questions_history.extend(new_questions)

            # 用户回答
            round_answers = self._generate_default_answers(new_questions)

            for q_id, answer in round_answers.items():
                all_answers_history[q_id] = answer

            print("\n用户答案:")
            for q_id, answer in round_answers.items():
                question = next((q for q in new_questions if q.get('id') == q_id), None)
                question_text = question.get('question', 'N/A') if question else 'N/A'
                print(f"  {q_id}: {question_text[:50]}...")
                print(f"    -> 答案: {answer}")

            # 阶段3：Agent 6 优化 + Agent 4 生成新问题
            print(f"\n【第 {round_num} 轮 - 阶段3】Agent 6: 基于答案优化任务 + Agent 4: 生成新问题")
            print("-" * 70)

            # Agent 6 优化
            optimize_start = time.time()
            current_tasks = self.agent6.regenerate(current_tasks, round_answers, daily_hours)
            optimize_time = time.time() - optimize_start

            print(f"[优化] 耗时: {optimize_time:.2f} 秒")
            self._print_task_summary(f"第 {round_num} 轮优化后", current_tasks)

            # Agent 4 生成新问题（基于所有历史问题）
            print(f"\n>>> Agent 4: 基于历史问题生成新问题...")
            print(f"  当前历史问题数: {len(all_questions_history)}")
            print(f"  当前历史答案数: {len(all_answers_history)}")

            new_questions = self.agent4.generate(form_data, analysis)

            # 检测重复
            new_count, duplicate_count = self._analyze_questions(new_questions, all_questions_history)

            print(f"生成问题: {len(new_questions)} 个 (新: {new_count}, 重复: {duplicate_count})")
            for i, q in enumerate(new_questions, 1):
                is_dup = self._is_duplicate_question(q, all_questions_history)
                dup_mark = " [重复!]" if is_dup else ""
                print(f"  Q{i} ({q.get('id', 'N/A')}): {q.get('question', 'N/A')[:60]}...{dup_mark}")

            # 累加到历史
            all_questions_history.extend(new_questions)

            # 记录本轮结果
            round_result = {
                "round": round_num,
                "phase": "阶段2+3",
                "questions": new_questions,
                "new_questions_count": new_count,
                "duplicate_questions_count": duplicate_count,
                "answers": round_answers,
                "tasks_after": self._get_task_summary(current_tasks),
                "optimize_time": optimize_time,
                "total_questions_history": len(all_questions_history),
                "total_answers_history": len(all_answers_history)
            }
            result["rounds"].append(round_result)

            # 检查是否应该继续
            if max_rounds > 0 and round_num >= max_rounds:
                break

            # 如果没有新问题，询问是否继续
            if new_count == 0:
                print(f"\n  ⚠️ 第 {round_num} 轮没有生成新问题")
                if max_rounds != 0:
                    continue_input = input("  继续下一轮? (y/n): ").strip().lower()
                    if continue_input != 'y':
                        break

        # ========== 完成 ==========
        result["end_time"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        result["total_rounds"] = round_num

        self._print_multi_round_summary(result)

        return result

    def _analyze_questions(self, new_questions: list, history: list) -> tuple[int, int]:
        """分析新问题，返回 (新问题数, 重复问题数)"""
        new_count = 0
        duplicate_count = 0

        for q in new_questions:
            is_duplicate = self._is_duplicate_question(q, history)
            if is_duplicate:
                duplicate_count += 1
            else:
                new_count += 1

        return new_count, duplicate_count

    def _is_duplicate_question(self, question: dict, history: list) -> bool:
        """判断问题是否与历史中的某个问题重复"""
        q_text = question.get('question', '').lower().strip()

        for prev_q in history:
            prev_text = prev_q.get('question', '') if isinstance(prev_q, dict) else prev_q
            prev_text_lower = prev_text.lower().strip()

            # 完全相同
            if q_text == prev_text_lower:
                return True

            # 关键词重叠度检测
            words1 = set(q_text.split())
            words2 = set(prev_text_lower.split())

            if words1 and words2:
                intersection = words1 & words2
                union = words1 | words2
                similarity = len(intersection) / len(union)

                if similarity >= 0.6:  # 60% 相似度认为是重复
                    return True

        return False

    def _are_questions_similar(self, q1: str, q2: str, threshold: float = 0.7) -> bool:
        """判断两个问题是否相似（简单版本）"""
        q1_lower = q1.lower().strip()
        q2_lower = q2.lower().strip()

        # 完全相同
        if q1_lower == q2_lower:
            return True

        # 检查关键词重叠
        words1 = set(q1_lower.split())
        words2 = set(q2_lower.split())

        if not words1 or not words2:
            return False

        intersection = words1 & words2
        union = words1 | words2

        similarity = len(intersection) / len(union)

        return similarity >= threshold

    def _get_task_summary(self, tasks: dict) -> dict:
        """获取任务摘要信息"""
        if not tasks:
            return {}

        monthly = tasks.get('monthly', {})
        weekly = tasks.get('weekly', {})
        daily = tasks.get('daily', {})

        return {
            "monthly_count": len(monthly) if isinstance(monthly, dict) else 0,
            "weekly_count": len(weekly) if isinstance(weekly, dict) else 0,
            "daily_count": len(daily) if isinstance(daily, dict) else 0,
            "project_name": tasks.get('project_name', ''),
            "overview": tasks.get('overview', '')
        }

    def _generate_default_answers(self, questions: list) -> dict:
        """为问题生成默认答案（用于测试）"""
        answers = {}
        for q in questions:
            q_id = q.get('id', 'unknown')
            q_type = q.get('type', 'text')
            options = q.get('options', [])

            if q_type == 'single' and options:
                answers[q_id] = options[0]  # 选择第一个选项
            elif q_type == 'multiple' and options:
                answers[q_id] = ', '.join(options[:2])  # 选择前两个选项
            else:
                # 根据问题内容生成智能默认答案
                question = q.get('question', '').lower()
                if '时间' in question or '投入' in question:
                    answers[q_id] = "每天2小时，周末可以多投入"
                elif '程度' in question or '标准' in question:
                    answers[q_id] = "MVP最小可用版本即可"
                elif '优先' in question or '看重' in question:
                    answers[q_id] = "快速出结果"
                elif '兴趣' in question or '方向' in question:
                    answers[q_id] = "更偏向实战项目，理论基础够用就行"
                else:
                    answers[q_id] = "按正常节奏进行"

        return answers

    def _print_task_summary(self, title: str, tasks: dict):
        """打印任务摘要"""
        if not tasks:
            print(f"\n{title}: 无任务数据")
            return

        print(f"\n{title}:")
        print(f"  项目名称: {tasks.get('project_name', 'N/A')}")
        print(f"  项目概述: {tasks.get('overview', 'N/A')}")

        monthly = tasks.get('monthly', {})
        if monthly:
            print(f"\n  月度任务: {len(monthly)} 个月")
            for month, info in list(monthly.items())[:2]:  # 只显示前2个月
                if isinstance(info, dict):
                    print(f"    - {month}: {info.get('goal', 'N/A')}")

        weekly = tasks.get('weekly', {})
        if weekly:
            print(f"\n  周度任务: {len(weekly)} 周")
            for week, info in list(weekly.items())[:3]:  # 只显示前3周
                if isinstance(info, dict):
                    print(f"    - {week}: {info.get('goal', 'N/A')}")

        daily = tasks.get('daily', {})
        if daily:
            total_days = sum(len(days) for days in daily.values())
            print(f"\n  日度任务: {len(daily)} 周的计划，共 {total_days} 天")

    def _compare_tasks(self, initial: dict, optimized: dict):
        """对比初次任务和优化后任务的差异"""
        if not initial or not optimized:
            print("  无法对比: 任务数据不完整")
            return

        # 对比月度任务
        initial_monthly = initial.get('monthly', {})
        optimized_monthly = optimized.get('monthly', {})

        print(f"\n  月度任务对比:")
        print(f"    初次: {len(initial_monthly)} 个月")
        print(f"    优化: {len(optimized_monthly)} 个月")

        # 对比周度任务
        initial_weekly = initial.get('weekly', {})
        optimized_weekly = optimized.get('weekly', {})

        print(f"\n  周度任务对比:")
        print(f"    初次: {len(initial_weekly)} 周")
        print(f"    优化: {len(optimized_weekly)} 周")

        # 对比日度任务
        initial_daily = initial.get('daily', {})
        optimized_daily = optimized.get('daily', {})

        initial_days = sum(len(days) for days in initial_daily.values())
        optimized_days = sum(len(days) for days in optimized_daily.values())

        print(f"\n  日度任务对比:")
        print(f"    初次: {initial_days} 天")
        print(f"    优化: {optimized_days} 天")

        # 对比概述变化
        if initial.get('overview') != optimized.get('overview'):
            print(f"\n  概述变化:")
            print(f"    初次: {initial.get('overview', 'N/A')}")
            print(f"    优化: {optimized.get('overview', 'N/A')}")

    def _print_multi_round_summary(self, result: dict) -> None:
        """打印多轮测试统计摘要"""
        total_questions = sum(len(r.get("questions", [])) if isinstance(r.get("questions"), list) else 0 for r in result["rounds"])
        total_duplicates = sum(r.get("duplicate_questions_count", 0) for r in result["rounds"])
        total_new = sum(r.get("new_questions_count", 0) for r in result["rounds"])

        print("\n" + "=" * 70)
        print(f"多轮测试完成! 共 {result.get('total_rounds', len(result.get('rounds', [])))} 轮")
        print(f"  总生成问题: {total_questions} 个")
        print(f"  新问题: {total_new} 个")
        f"  重复问题: {total_duplicates} 个"
        if total_questions > 0:
            print(f"  重复率: {total_duplicates/total_questions*100:.1f}%")
        print(f"  历史上下文: {result['rounds'][-1].get('total_questions_history', 0)} 个问题, {result['rounds'][-1].get('total_answers_history', 0)} 个答案")
        print("=" * 70)

    def save_result(self, result: dict, filename: str = None):
        """保存测试结果到文件"""
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            if "rounds" in result:
                filename = f"test_agent4_6_multi_round_{timestamp}.json"
            else:
                filename = f"test_agent4_6_result_{timestamp}.json"

        filepath = os.path.join(os.path.dirname(__file__), filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"\n测试结果已保存到: {filepath}")


def main():
    """测试入口"""
    parser = argparse.ArgumentParser(description="Agent 4 & 6 联调测试")
    parser.add_argument(
        '--rounds',
        type=int,
        default=1,
        help='测试轮数 (默认1=单轮测试, 0=无限循环模式)'
    )
    parser.add_argument(
        '--case',
        type=str,
        default='1',
        choices=['1', '2'],
        help='测试用例 (1=Python爬虫, 2=博物馆网站)'
    )

    args = parser.parse_args()

    # 创建测试实例
    test = Agent4And6IntegrationTest()

    # 测试用例定义
    test_cases = {
        "1": {
            "goal": "六个月内学会Python爬虫+数据分析，能独立做电商数据爬取项目",
            "form_data": {
                "goal": "六个月内学会Python爬虫+数据分析，能独立做电商数据爬取项目",
                "experience": "advanced_beginner",
                "daily_hours": "2-3",
                "working_days": ["周一", "周二", "周四", "周五", "周日"],
                "importance": 4,
                "deadline": "2025-12-31",
                "blockers": "工作日晚上易被加班打断，无系统学习路径",
                "resources": "《Python爬虫实战》书籍、Anaconda环境、jupyter notebook",
                "expectations": ["分阶段学（爬虫→数据分析→项目）", "每周留1天做实战练习"]
            },
            "analysis": {
                "task_type": "技能学习类 - 编程技能进阶",
                "experience_level": "入门基础 - 掌握核心语法，无框架/项目经验",
                "time_span": "中期(6个月) - 使用月度+周度+日度三层拆解"
            }
        },
        "2": {
            "goal": "一个月内完成博物馆网页开发，4个页面，统一风格，响应式设计",
            "form_data": {
                "goal": "一个月内完成博物馆网页开发，4个页面，统一风格，响应式设计",
                "experience": "beginner",
                "daily_hours": "2",
                "working_days": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
                "importance": 5,
                "deadline": "2025-03-01",
                "blockers": "",
                "resources": "VS Code, Chrome浏览器",
                "expectations": ["界面美观", "响应式布局", "代码规范"]
            },
            "analysis": {
                "task_type": "项目开发类 - 网页开发",
                "experience_level": "零基础 - 完全没有编程经验",
                "time_span": "短期(1个月) - 使用周度+日度两层拆解"
            }
        }
    }

    test_case = test_cases[args.case]

    if args.rounds == 1:
        # 单轮测试
        print("\n" + "=" * 70)
        print(f"【单轮测试】用例 {args.case}")
        print("=" * 70)

        result = test.run_full_integration_test(
            goal=test_case["goal"],
            form_data=test_case["form_data"],
            analysis=test_case["analysis"]
        )
        test.save_result(result, f"test_agent4_6_case{args.case}_result.json")

    else:
        # 多轮测试
        print("\n" + "=" * 70)
        print(f"【多轮测试】用例 {args.case}, 轮数: {args.rounds if args.rounds > 0 else '无限'}")
        print("=" * 70)

        result = test.run_multi_round_test(
            goal=test_case["goal"],
            form_data=test_case["form_data"],
            analysis=test_case["analysis"],
            max_rounds=args.rounds
        )
        test.save_result(result, f"test_agent4_6_multi_round_case{args.case}_result.json")

    print("\n" + "=" * 70)
    print("测试完成!")
    print("=" * 70)


if __name__ == "__main__":
    main()
