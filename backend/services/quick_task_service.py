"""
快速任务服务 - 双链路处理
Agent A: 提取节点框架
Agent B: 生成操作指南
"""
import json
import uuid
from typing import List, Dict, Any
from openai import OpenAI
import httpx
import os
from dotenv import load_dotenv

from models.schema import (
    Checkpoint, QuickTaskResponse, QuickTaskMeta,
    RawCheckpoint, StepGuide
)

load_dotenv()


class QuickTaskService:
    """快速任务服务 - 分阶段处理"""

    def __init__(self):
        self.api_key = os.getenv("SILICONFLOW_API_KEY")
        self.base_url = os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")

    def get_client(self) -> OpenAI:
        """获取 OpenAI 客户端"""
        return OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            http_client=httpx.Client(verify=False, timeout=120.0)
        )

    def generate_checkpoints(self, idea: str, time_estimate: str = None) -> Dict[str, Any]:
        """
        生成检测节点（同步版本，使用线程池模拟并行）

        流程：
        阶段1（并行）：
            - Agent A: 提取节点框架
            - 搜索专业资料（使用 AI 内置知识）

        阶段2（串行）：
            - Agent B: 为每个节点生成量化标准
        """
        import concurrent.futures

        print(f"[QuickTask] 开始处理: {idea}")

        # 阶段1：并行执行
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_nodes = executor.submit(self._agent_a_extract_nodes, idea)
            future_materials = executor.submit(self._search_professional_materials, idea)

            raw_checkpoints = future_nodes.result()
            professional_summaries = future_materials.result()

        print(f"[QuickTask] Agent A 提取了 {len(raw_checkpoints)} 个节点")

        # 阶段2：Agent B 生成量化标准
        checkpoints = self._agent_b_generate_standards(
            idea=idea,
            raw_checkpoints=raw_checkpoints,
            professional_summaries=professional_summaries
        )

        # 计算总时间
        total_time = self._calculate_total_time(checkpoints)

        result = {
            "mode": "quick",
            "original_idea": idea,
            "estimated_total_time": total_time,
            "checkpoints": [
                {
                    "id": cp.id,
                    "name": cp.name,
                    "step_guide": {
                        "description": cp.step_guide.description,
                        "steps": cp.step_guide.steps,
                        "completion_criteria": cp.step_guide.completion_criteria,
                        "pain_points": cp.step_guide.pain_points
                    },
                    "estimated_time": cp.estimated_time,
                    "depends_on": cp.depends_on,
                    "check_method": cp.check_method,
                    "status": cp.status
                }
                for cp in checkpoints
            ],
            "meta": {
                "total_checkpoints": len(checkpoints),
                "sources_analyzed": len(professional_summaries),
                "confidence": 0.85
            }
        }

        print(f"[QuickTask] 生成完成，共 {len(checkpoints)} 个检测节点")
        return result

    # ==================== 阶段1：Agent A ====================

    def _agent_a_extract_nodes(self, idea: str) -> List[RawCheckpoint]:
        """Agent A：提取节点框架"""
        client = self.get_client()

        prompt = f"""你是"任务节点提取专家"，专门从"快速上手"类文章中提取任务框架。

用户想法：{idea}

请根据这个想法，提取出完成它的任务步骤框架。

要求：
1. 3-8个步骤
2. 步骤之间有先后顺序
3. 每个步骤有预估时间（15分钟-2小时）
4. 标注依赖关系（后面的步骤依赖前面的）
5. 步骤名称要简洁明确

返回JSON格式：
{{
  "raw_checkpoints": [
    {{
      "id": "cp1",
      "name": "步骤名称",
      "estimated_time": "30分钟",
      "depends_on": []
    }},
    {{
      "id": "cp2",
      "name": "步骤名称2",
      "estimated_time": "1小时",
      "depends_on": ["cp1"]
    }}
  ]
}}

只返回JSON，不要有其他内容。"""

        response = client.chat.completions.create(
            model="inclusionAI/Ling-flash-2.0",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=4096
        )

        content = response.choices[0].message.content.strip()
        return self._parse_raw_checkpoints(content)

    def _parse_raw_checkpoints(self, response: str) -> List[RawCheckpoint]:
        """解析节点框架"""
        # 提取JSON
        if "```json" in response:
            start = response.find("```json") + 7
            end = response.rfind("```")
            if end != -1:
                response = response[start:end].strip()
        elif "```" in response:
            start = response.find("```") + 3
            end = response.find("```", start)
            if end != -1:
                response = response[start:end].strip()

        try:
            data = json.loads(response)
            if "raw_checkpoints" in data:
                raw_checkpoints = data["raw_checkpoints"]
            else:
                raw_checkpoints = data

            return [
                RawCheckpoint(
                    id=cp.get("id", f"cp{i+1}"),
                    name=cp.get("name", ""),
                    estimated_time=cp.get("estimated_time", "30分钟"),
                    depends_on=cp.get("depends_on", [])
                )
                for i, cp in enumerate(raw_checkpoints)
            ]
        except Exception as e:
            print(f"[ERROR] 解析节点框架失败: {e}")
            return self._get_default_checkpoints()

    def _get_default_checkpoints(self) -> List[RawCheckpoint]:
        """默认节点框架"""
        return [
            RawCheckpoint(id="cp1", name="准备与规划", estimated_time="20分钟", depends_on=[]),
            RawCheckpoint(id="cp2", name="执行核心任务", estimated_time="1小时", depends_on=["cp1"]),
            RawCheckpoint(id="cp3", name="检查与验证", estimated_time="20分钟", depends_on=["cp2"]),
            RawCheckpoint(id="cp4", name="总结与复盘", estimated_time="15分钟", depends_on=["cp3"])
        ]

    # ==================== 阶段1：并行搜索 ====================

    def _search_professional_materials(self, idea: str) -> List[str]:
        """搜索专业教程资料（使用 AI 内置知识）"""
        client = self.get_client()

        prompt = f"""你是"专业知识整理专家"。

用户想法：{idea}

请提供关于完成这个想法的专业建议，包括：
1. 最佳实践
2. 常见的验收标准
3. 每个环节应该注意的关键点
4. 量化指标的参考

返回5-8条专业建议，每条50字以内。用列表格式返回，每条格式为：
- 建议内容

只返回列表，不要其他内容。"""

        try:
            response = client.chat.completions.create(
                model="inclusionAI/Ling-flash-2.0",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2048
            )

            content = response.choices[0].message.content.strip()

            # 解析列表
            summaries = []
            for line in content.split('\n'):
                line = line.strip()
                if line.startswith('-'):
                    summaries.append(line[1:].strip())
                elif line and '：' in line or ':' in line:
                    summaries.append(line)

            return summaries[:8] if summaries else self._get_default_materials()

        except Exception as e:
            print(f"[ERROR] 搜索专业资料失败: {e}")
            return self._get_default_materials()

    def _get_default_materials(self) -> List[str]:
        """默认专业资料"""
        return [
            "开始前明确目标和验收标准",
            "将大任务拆解为小步骤，逐个完成",
            "每个步骤都要有可验证的产出",
            "遇到问题及时记录和解决",
            "完成后进行复盘总结"
        ]

    # ==================== 阶段2：Agent B ====================

    def _agent_b_generate_standards(
        self,
        idea: str,
        raw_checkpoints: List[RawCheckpoint],
        professional_summaries: List[str]
    ) -> List[Checkpoint]:
        """Agent B：为每个节点生成操作指南"""
        checkpoints = []

        for raw_cp in raw_checkpoints:
            guide = self._ai_generate_guide_for_node(
                idea=idea,
                node_name=raw_cp.name,
                professional_summaries=professional_summaries
            )

            checkpoints.append(Checkpoint(
                id=raw_cp.id,
                name=raw_cp.name,
                step_guide=guide,
                estimated_time=raw_cp.estimated_time,
                depends_on=raw_cp.depends_on,
                check_method="self",
                status="pending"
            ))

        return checkpoints

    def _ai_generate_guide_for_node(
        self,
        idea: str,
        node_name: str,
        professional_summaries: List[str]
    ) -> StepGuide:
        """AI为单个节点生成操作指南"""
        client = self.get_client()

        materials_text = "\n".join([f"- {s}" for s in professional_summaries])

        prompt = f"""你是"任务执行专家"，专门为任务节点生成具体的操作指南。

用户想法：{idea}

当前节点：{node_name}

专业参考资料：
{materials_text}

请为这个节点生成具体的操作指南，告诉用户"如何做"。

返回JSON格式：
{{
  "description": "节点概述，一两句话说明这个节点要做什么",
  "steps": [
    "具体的操作步骤1",
    "具体的操作步骤2",
    "具体的操作步骤3"
  ],
  "completion_criteria": [
    "完成标准1（如何判断做完了）",
    "完成标准2"
  ],
  "pain_points": [
    "常见错误或容易遗漏的点1",
    "需要注意的关键点2"
  ]
}}

要求：
- steps: 3-6个具体的、可执行的步骤
- completion_criteria: 2-4条清晰的验收标准
- pain_points: 2-4条实用提醒

只返回JSON，不要其他内容。"""

        try:
            response = client.chat.completions.create(
                model="inclusionAI/Ling-flash-2.0",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2048
            )

            content = response.choices[0].message.content.strip()
            return self._parse_guide(content)

        except Exception as e:
            print(f"[ERROR] 生成操作指南失败: {e}")
            return self._get_default_guide(node_name)

    def _parse_guide(self, response: str) -> StepGuide:
        """解析操作指南"""
        # 提取JSON
        if "```json" in response:
            start = response.find("```json") + 7
            end = response.rfind("```")
            if end != -1:
                response = response[start:end].strip()
        elif "```" in response:
            start = response.find("```") + 3
            end = response.find("```", start)
            if end != -1:
                response = response[start:end].strip()

        try:
            data = json.loads(response)
            return StepGuide(
                description=data.get("description", ""),
                steps=data.get("steps", []),
                completion_criteria=data.get("completion_criteria", []),
                pain_points=data.get("pain_points", [])
            )
        except:
            return self._get_default_guide("")

    def _get_default_guide(self, node_name: str = "") -> StepGuide:
        """默认操作指南"""
        return StepGuide(
            description=f"完成{node_name}的相关工作",
            steps=[
                f"开始执行{node_name}",
                "按照要求完成任务",
                "检查并确认结果"
            ],
            completion_criteria=[
                "任务已完成",
                "结果符合要求"
            ],
            pain_points=[
                "注意细节，不要遗漏关键点",
                "完成后记得测试验证"
            ]
        )

    def _calculate_total_time(self, checkpoints: List[Checkpoint]) -> str:
        """计算总时间"""
        total_minutes = 0
        for cp in checkpoints:
            time_str = cp.estimated_time
            if "分钟" in time_str:
                total_minutes += int(float(time_str.replace("分钟", "")))
            elif "小时" in time_str:
                total_minutes += int(float(time_str.replace("小时", "")) * 60)

        if total_minutes < 60:
            return f"{total_minutes}分钟"
        else:
            hours = total_minutes // 60
            mins = total_minutes % 60
            return f"{hours}小时{mins}分钟" if mins > 0 else f"{hours}小时"


# 单例
_quick_task_service = None


def get_quick_task_service() -> QuickTaskService:
    """获取快速任务服务单例"""
    global _quick_task_service
    if _quick_task_service is None:
        _quick_task_service = QuickTaskService()
    return _quick_task_service
