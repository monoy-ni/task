# 快速短期任务模式设计方案

## 一、模式概述

### 1.1 模式定位

**快速任务模式（Quick Task Mode）** — 针对用户临时产生的想法，快速拆解为当天或短期内可执行的微型任务链。

| 对比维度 | 中长期目标模式 | 快速短期任务模式 |
|---------|--------------|----------------|
| **输入特点** | 大目标、模糊愿景 | 突发想法、具体待办 |
| **时间跨度** | 月/季/年度 | 当天/3天内 |
| **拆解粒度** | 多层级嵌套 | 单层扁平任务链 |
| **交互时长** | 需要多轮对话 | 1-2轮快速生成 |
| **执行节奏** | 持续跟踪调整 | 即时完成 |

### 1.2 典型使用场景

```
场景1：突然想到要修一个bug
用户：我刚发现登录页面在Safari上有问题
AI：帮你拆成 → 复现问题 → 定位原因 → 修复 → 测试 → 提交

场景2：临时决定学习某知识点
用户：我想今天学会用Tailwind CSS做响应式布局
AI：帮你拆成 → 官方文档阅读 → 跟随基础教程 → 动手实现案例 → 总结笔记

场景3：临时的小项目
用户：下午想把个人网站的About页面重新设计一下
AI：帮你拆成 → 收集参考 → 确定风格 → 设计稿 → 编码实现 → 部署
```

---

## 二、功能设计

### 2.1 输入设计

#### 快速输入表单

```
┌─────────────────────────────────────────┐
│  💡 有什么想法？快速拆解它！             │
├─────────────────────────────────────────┤
│                                         │
│  [我想做的事情...]                      │
│                                         │
│  预计耗时: ○ 1小时内  ○ 2-4小时  ○ 今天  │
│                                         │
│  [🚀 立即拆解]                          │
└─────────────────────────────────────────┘
```

#### 最小化信息采集

- **必填**：用户的一句话想法
- **选填**：预计耗时、截止时间、优先级

### 2.2 拆解规则

快速模式采用**线性任务链**拆解逻辑：

```
用户想法 → AI分析 → 3-8个顺序步骤 → 每步含预估时间
```

**拆解原则**：

1. **原子化**：每个步骤30分钟-2小时内可完成
2. **可验证**：每步有明确的完成标准
3. **依赖清晰**：标注前后依赖关系
4. **可跳过**：标注非必须步骤

### 2.3 双链路搜索+检测节点 🔍

#### 功能描述

两条独立链路并行工作，最后合并结果：
- **链路A（节点提取）**：搜索"几小时完成XXX"类型文章，提取任务节点框架
- **链路B（量化标准）**：搜索专业教程，为每个节点生成量化完成标准

前端不显示搜索过程，只展示最终合并后的检测节点。

#### 处理流程

```
                    用户想法
                       │
           ┌───────────┴───────────┐
           │                       │
     阶段1️⃣ 并行执行              │
           │                       │
    ┌──────┴──────┐         搜索专业教程
    │             │         (获取原始资料)
Agent A提取节点   Agent B搜索
    │             │
    └──────┬──────┘
           │
       节点框架完成
           │
           ▼
     阶段2️⃣ 串行处理
           │
    Agent B: 根据节点框架 + 搜索结果
           为每个节点生成量化标准
           │
           ▼
       完整检测节点
           │
       返回前端
```

**时序图**：

```
用户想法
    │
    ├───────────────────┐
    │                   │
    ▼                   ▼
Agent A           搜索专业教程
搜索"几小时完成"      (收集资料)
    │                   │
    │                   │
    ▼                   │
节点框架 ────────────────┤
    │                   │
    └───────────────────┤
                        ▼
                   Agent B
              为每个节点生成量化标准
                        │
                        ▼
                   完整检测节点
```

#### 链路A：节点提取链路

**搜索关键词类型**：
- "几小时完成{想法}"
- "{想法}快速上手"
- "{想法}实战教程"
- "一天搞定{想法}"

**提取目标**：
- 任务的整体步骤顺序
- 每个步骤的名称
- 步骤之间的依赖关系
- 每个步骤的预估时间

**输出示例**：
```json
{
  "chain": "A",
  "raw_checkpoints": [
    {
      "id": "cp1",
      "name": "收集设计参考",
      "estimated_time": "20分钟",
      "depends_on": []
    },
    {
      "id": "cp2",
      "name": "确定设计方案",
      "estimated_time": "30分钟",
      "depends_on": ["cp1"]
    },
    {
      "id": "cp3",
      "name": "编写代码实现",
      "estimated_time": "1.5小时",
      "depends_on": ["cp2"]
    },
    {
      "id": "cp4",
      "name": "测试与修复",
      "estimated_time": "40分钟",
      "depends_on": ["cp3"]
    }
  ]
}
```

#### 链路B：量化标准链路

**搜索关键词类型**：
- "{想法}最佳实践"
- "{想法}行业标准"
- "{想法}专业教程"
- "{想法}验收标准"

**提取目标**：
- 每个环节的专业验收标准
- 可量化的指标（数量、质量、性能等）
- 常见的坑点和检查项

**输出示例**：
```json
{
  "chain": "B",
  "standards_by_phase": {
    "收集设计参考": {
      "metrics": [
        {"type": "count", "target": ">=3", "unit": "个参考案例"},
        {"type": "artifact", "target": "参考图已保存", "unit": "张"}
      ],
      "check_method": "self",
      "tips": "优先查看同行业优秀案例"
    },
    "确定设计方案": {
      "metrics": [
        {"type": "list", "target": "配色方案", "unit": "已确定"},
        {"type": "list", "target": "字体选择", "unit": "已确定"},
        {"type": "list", "target": "布局结构", "unit": "已绘制"}
      ],
      "check_method": "self",
      "tips": "确保设计符合品牌规范"
    },
    "编写代码实现": {
      "metrics": [
        {"type": "code", "target": "核心功能", "unit": "已实现"},
        {"type": "style", "target": "代码规范", "unit": "符合"},
        {"type": "range", "target": "代码覆盖率", "unit": ">80%"}
      ],
      "check_method": "tool",
      "tips": "使用ESLint/Prettier检查代码"
    },
    "测试与修复": {
      "metrics": [
        {"type": "test", "target": "功能测试", "unit": "全部通过"},
        {"type": "test", "target": "兼容性测试", "unit": "主流浏览器"},
        {"type": "range", "target": "无明显bug", "unit": "0个"}
      ],
      "check_method": "manual",
      "tips": "重点测试Safari兼容性"
    }
  }
}
```

#### 合并逻辑

```python
def merge_chain_results(chain_a: ChainAResult, chain_b: ChainBResult) -> List[Checkpoint]:
    """
    合并两条链路的结果

    逻辑：
    1. 以链路A的节点为框架
    2. 通过节点名称匹配，从链路B找到对应的量化标准
    3. 如果匹配不到，生成默认的量化标准
    4. 返回完整的检测节点列表
    """
    checkpoints = []
    for raw_cp in chain_a.raw_checkpoints:
        # 尝试从链路B匹配标准
        standard = find_best_match(raw_cp.name, chain_b.standards_by_phase)

        checkpoints.append(Checkpoint(
            id=raw_cp.id,
            name=raw_cp.name,
            quantitative_standard=standard,
            estimated_time=raw_cp.estimated_time,
            depends_on=raw_cp.depends_on,
            check_method=standard.check_method if standard else "self",
            status="pending"
        ))

    return checkpoints
```

#### 核心概念：检测节点（Checkpoint）

**检测节点**是完成任务过程中的关键里程碑点，每个节点包含：
- **节点名称**：简洁描述这个阶段要做什么
- **量化标准**：如何判断这个节点已完成（可测量的指标）
- **预计时间**：完成此节点预计需要的时间
- **依赖关系**：依赖哪些前置节点
- **检测方式**：自查/工具检测/AI检测

#### 示例：用户想法"把登录页面改成Vercel风格"

后端搜索 "Vercel登录页设计"、"极简登录页教程" 等关键词后，提取出的检测节点：

```json
{
  "mode": "quick",
  "original_idea": "把登录页面改成Vercel风格",
  "estimated_total_time": "2-3小时",
  "checkpoints": [
    {
      "id": "cp1",
      "name": "视觉参考收集完成",
      "quantitative_standard": {
        "description": "收集至少3个极简风格登录页参考，并截图保存",
        "metrics": [
          { "type": "count", "target": ">=3", "unit": "个参考案例" },
          { "type": "artifact", "target": "截图已保存", "unit": "张" }
        ]
      },
      "estimated_time": "15分钟",
      "depends_on": [],
      "check_method": "self",
      "status": "pending"
    },
    {
      "id": "cp2",
      "name": "核心设计元素确定",
      "quantitative_standard": {
        "description": "确定并记录配色方案、字体、间距等核心设计元素",
        "metrics": [
          { "type": "list", "target": "配色方案(主色/背景/文字)", "unit": "已定义" },
          { "type": "list", "target": "字体族", "unit": "已选择" },
          { "type": "range", "target": "间距规范", "unit": "已定义(4px/8px/16px)" }
        ]
      },
      "estimated_time": "10分钟",
      "depends_on": ["cp1"],
      "check_method": "self",
      "status": "pending"
    },
    {
      "id": "cp3",
      "name": "Tailwind布局实现",
      "quantitative_standard": {
        "description": "使用Tailwind CSS完成登录页的基本布局结构",
        "metrics": [
          { "type": "code", "target": "容器/表单/按钮组件", "unit": "已实现" },
          { "type": "style", "target": "响应式适配(移动端)", "unit": "已测试" }
        ]
      },
      "estimated_time": "45分钟",
      "depends_on": ["cp2"],
      "check_method": "self",
      "status": "pending"
    },
    {
      "id": "cp4",
      "name": "登录功能验证",
      "quantitative_standard": {
        "description": "确保登录表单功能正常，数据能正确提交",
        "metrics": [
          { "type": "test", "target": "输入验证(邮箱/密码)", "unit": "通过" },
          { "type": "test", "target": "提交接口调用", "unit": "成功" },
          { "type": "test", "target": "错误提示显示", "unit": "正常" }
        ]
      },
      "estimated_time": "30分钟",
      "depends_on": ["cp3"],
      "check_method": "manual",
      "status": "pending"
    },
    {
      "id": "cp5",
      "name": "浏览器兼容性检测",
      "quantitative_standard": {
        "description": "在主流浏览器中测试页面显示和功能",
        "metrics": [
          { "type": "test", "target": "Chrome", "unit": "正常" },
          { "type": "test", "target": "Safari", "unit": "正常" },
          { "type": "test", "target": "Firefox", "unit": "正常" },
          { "type": "test", "target": "移动端Safari/Chrome", "unit": "正常" }
        ]
      },
      "estimated_time": "20分钟",
      "depends_on": ["cp4"],
      "check_method": "manual",
      "status": "pending"
    }
  ],
  "meta": {
    "total_checkpoints": 5,
    "sources_analyzed": 8,
    "confidence": 0.89
  }
}
```

#### 量化标准类型定义

| 类型 | 说明 | 示例 |
|-----|------|------|
| `count` | 数量指标 | 收集>=3个参考案例 |
| `list` | 列表检查项 | 配色/字体/间距已确定 |
| `test` | 测试通过 | 接口调用成功/显示正常 |
| `artifact` | 产出物 | 代码已提交/截图已保存 |
| `range` | 范围指标 | 响应时间<500ms |
| `code` | 代码检查 | 特定功能已实现 |
| `style` | 样式检查 | 布局符合设计稿 |

#### 检测方式

| 方式 | 说明 |
|-----|------|
| `self` | 用户自查，根据标准手动勾选 |
| `manual` | 需要手动测试验证（如浏览器测试） |
| `tool` | 可用工具自动检测（如代码检查） |
| `ai` | AI辅助检测（如截图分析、代码审查） |

### 2.4 输出格式

完整的检测节点响应结构：

```json
{
  "mode": "quick",
  "original_idea": "今天学会用Tailwind CSS做响应式布局",
  "estimated_total_time": "3-4小时",
  "checkpoints": [
    {
      "step": 1,
      "title": "收集参考案例",
      "description": "浏览5-10个优秀的个人About页面，截图并记录喜欢的元素",
      "estimated_time": "30分钟",
      "required": true,
      "status": "pending"
    },
    {
      "step": 2,
      "title": "确定内容框架",
      "description": "列出想展示的内容板块：自我介绍、技能、经历、联系方式",
      "estimated_time": "20分钟",
      "required": true,
      "status": "pending"
    },
    {
      "step": 3,
      "title": "设计草图或Figma稿",
      "description": "画出页面布局，确定配色和字体方案",
      "estimated_time": "1小时",
      "required": true,
      "status": "pending"
    },
    {
      "step": 4,
      "title": "编码实现",
      "description": "使用HTML+Tailwind CSS实现设计",
      "estimated_time": "1.5小时",
      "required": true,
      "status": "pending"
    },
    {
      "step": 5,
      "title": "测试响应式效果",
      "description": "检查手机、平板、桌面端的显示效果",
      "estimated_time": "20分钟",
      "required": true,
      "status": "pending"
    },
    {
      "step": 6,
      "title": "部署上线",
      "description": "推送到仓库，等待自动部署完成",
      "estimated_time": "10分钟",
      "required": false,
      "status": "pending"
    }
  ],
  "tips": [
    "可以先只做桌面端，响应式留到后面",
    "如果时间不够，可以先用简化的设计"
  ]
}
```

---

## 三、AI Agent 设计

### 3.1 Agent A：节点提取专家（阶段1）

```
你是"任务节点提取专家"，专门从"快速上手"类文章中提取任务框架。

你的任务：
1. 分析用户想法，生成搜索关键词
2. 搜索"几小时完成XXX"、"XXX快速上手"类型的文章
3. 从文章中提取任务步骤框架

搜索关键词模板：
- "几小时完成{想法}"
- "{想法}快速上手"
- "{想法}实战教程"
- "一天搞定{想法}"

提取规则：
- 提取文章中的步骤/阶段
- 步骤之间有先后顺序
- 每个步骤有预估时间
- 3-8个步骤为佳

输出格式：
{
  "raw_checkpoints": [
    {
      "id": "cp1",
      "name": "步骤名称",
      "estimated_time": "30分钟",
      "depends_on": []
    }
  ]
}
```

### 3.2 并行搜索：专业资料收集（阶段1）

**在Agent A工作的同时，并行启动搜索**：

搜索关键词：
- "{想法}最佳实践"
- "{想法}行业标准"
- "{想法}专业教程"
- "{想法}验收标准"

目的：收集专业资料，供Agent B使用

### 3.3 Agent B：量化标准专家（阶段2）

```
你是"量化标准专家"，专门为任务节点生成可量化的验收标准。

你的任务：
1. 接收Agent A提取的节点框架
2. 接收专业搜索资料
3. 为每个节点生成可量化的完成标准

输入：
- 用户想法
- 节点名称（来自Agent A）
- 专业参考资料（来自并行搜索）

量化标准类型：
- count: 数量（如：>=3个）
- list: 检查清单（如：配色/字体已确定）
- test: 测试验证（如：测试通过）
- artifact: 产出物（如：代码已提交）
- range: 范围指标（如：>80%）
- code: 代码检查（如：功能已实现）
- style: 样式检查（如：符合规范）

检测方式：self(自查) / manual(手动测试) / tool(工具检测) / ai(AI检测)

输出格式（针对单个节点）：
{
  "description": "标准描述",
  "metrics": [
    {"type": "count", "target": ">=3", "unit": "个参考"}
  ],
  "check_method": "self",
  "tips": "提示信息"
}
```

---

## 四、界面交互流程

```
┌─────────────────────────────────────────────────────────────┐
│  快速任务模式                              [切换到目标模式] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💭 我有一个想法...                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 想把项目的登录页面改成类似Vercel那种极简风格          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⏱️ 预计:  ○ 1小时内  ● 2-4小时  ○ 今天内               │
│                                                             │
│  [🚀 快速拆解]                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ 点击拆解后
┌─────────────────────────────────────────────────────────────┐
│  ✓ 已生成 5 个步骤 · 预计共需 2.5-3 小时                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ 收集Vercel登录页参考并截图          [30分钟]  [○]      │
│     浏览Vercel及类似极简风格登录页，截取关键元素              │
│                                                             │
│  2️⃣ 分析当前登录页的改动点              [20分钟]  [○]      │
│     列出需要保留和修改的功能点                               │
│                                                             │
│  3️⃣ 设计新的页面布局草图                [40分钟]  [○]      │
│     画出布局结构，确定颜色、字体、间距                        │
│                                                             │
│  4️⃣ 编码实现                             [1小时]   [○]      │
│     使用React + Tailwind实现设计稿                           │
│                                                             │
│  5️⃣ 测试功能并部署                     [20分钟]  [○] [可选] │
│     验证登录流程正常，部署到预览环境                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  💡 提示: 如果时间紧张，可以先用现成的登录组件库              │
│                                                             │
│           [保存到今日任务]  [🔄 重新生成]  [✅ 标记完成]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、数据模型

### 5.1 Schema定义

```python
# backend/models/schema.py 新增

from pydantic import BaseModel
from typing import List, Optional, Literal

# ========== 量化指标 ==========

class Metric(BaseModel):
    """量化指标"""
    type: Literal["count", "list", "test", "artifact", "range", "code", "style"]
    target: str                      # 目标描述
    unit: str                        # 单位

class QuantitativeStandard(BaseModel):
    """量化完成标准"""
    description: str                 # 标准描述
    metrics: List[Metric]            # 指标列表

# ========== 检测节点 ==========

class Checkpoint(BaseModel):
    """检测节点"""
    id: str                          # 节点ID，如 "cp1", "cp2"
    name: str                        # 节点名称
    quantitative_standard: QuantitativeStandard  # 量化标准
    estimated_time: str              # 预计时间，如 "30分钟"
    depends_on: List[str] = []       # 依赖的节点ID列表
    check_method: Literal["self", "manual", "tool", "ai"] = "self"  # 检测方式
    status: Literal["pending", "in_progress", "completed", "skipped"] = "pending"

# ========== 快速任务响应 ==========

class QuickTaskMeta(BaseModel):
    """元数据"""
    total_checkpoints: int           # 节点总数
    sources_analyzed: int            # 分析的来源数量
    confidence: float                # 置信度 0-1
    search_time_ms: Optional[int] = None  # 搜索耗时

class QuickTaskResponse(BaseModel):
    """快速任务响应"""
    mode: Literal["quick"]           # 模式标识
    original_idea: str               # 用户原始想法
    estimated_total_time: str        # 总预估时间
    checkpoints: List[Checkpoint]    # 检测节点列表
    meta: QuickTaskMeta              # 元数据

# ========== 请求模型 ==========

class QuickTaskRequest(BaseModel):
    """快速任务请求"""
    idea: str                        # 用户想法
    time_estimate: Optional[str] = None  # 预计耗时
    deadline: Optional[str] = None   # 截止时间
```

### 5.2 双链路服务实现

```python
# backend/services/quick_task_service.py

import httpx
import asyncio
from typing import List, Dict
from models.schema import QuickTaskResponse, Checkpoint, QuickTaskMeta, QuantitativeStandard, Metric

class QuickTaskService:
    """快速任务服务 - 分阶段处理"""

    def __init__(self):
        self.search_api_key = os.getenv("SEARCH_API_KEY")
        self.ai_client = None  # AI客户端

    async def generate_checkpoints(self, idea: str) -> QuickTaskResponse:
        """
        分阶段生成检测节点

        流程：
        阶段1（并行）：
            - Agent A: 搜索"几小时完成XXX" → 提取节点框架
            - 搜索: 搜索专业教程 → 获取原始资料

        阶段2（串行）：
            - Agent B: 根据节点框架 + 搜索结果 → 为每个节点生成量化标准
        """
        start_time = asyncio.get_event_loop().time()

        # ========== 阶段1：并行执行 ==========
        # Agent A提取节点 + 搜索专业资料
        nodes_result, professional_materials = await asyncio.gather(
            self._agent_a_extract_nodes(idea),
            self._search_professional_materials(idea)
        )

        raw_checkpoints = nodes_result["raw_checkpoints"]

        # ========== 阶段2：Agent B生成量化标准 ==========
        # 等待节点框架完成后，根据节点+搜索结果生成量化标准
        checkpoints = await self._agent_b_generate_standards(
            idea,
            raw_checkpoints,
            professional_materials
        )

        search_time = int((asyncio.get_event_loop().time() - start_time) * 1000)

        return QuickTaskResponse(
            mode="quick",
            original_idea=idea,
            estimated_total_time=self._calculate_total_time(checkpoints),
            checkpoints=checkpoints,
            meta=QuickTaskMeta(
                total_checkpoints=len(checkpoints),
                sources_analyzed=nodes_result["sources_count"] + len(professional_materials),
                confidence=0.85,
                search_time_ms=search_time
            )
        )

    # ==================== 阶段1：Agent A ====================

    async def _agent_a_extract_nodes(self, idea: str) -> Dict:
        """
        Agent A：从"快速上手"类文章中提取节点框架
        """
        # 搜索关键词
        keywords = [
            f"几小时完成{idea}",
            f"{idea}快速上手",
            f"{idea}实战教程",
            f"一天搞定{idea}"
        ]

        # 执行搜索
        search_results = await self._search(keywords[:2])

        # AI提取节点框架
        raw_checkpoints = await self._ai_extract_nodes(idea, search_results)

        return {
            "raw_checkpoints": raw_checkpoints,
            "sources_count": len(search_results)
        }

    async def _ai_extract_nodes(self, idea: str, search_results: List[Dict]) -> List[Dict]:
        """AI提取节点框架"""
        summaries = self._extract_summaries(search_results)

        prompt = f"""你是"任务节点提取专家"。

用户想法：{idea}

搜索到的文章摘要：
{chr(10).join(f"- {s}" for s in summaries)}

请从这些"快速上手"类文章中，提取出完成这个想法的任务步骤框架。

要求：
1. 3-8个步骤
2. 步骤之间有先后顺序
3. 每个步骤有预估时间
4. 标注依赖关系

返回JSON：
{{
  "raw_checkpoints": [
    {{
      "id": "cp1",
      "name": "步骤名称",
      "estimated_time": "30分钟",
      "depends_on": []
    }}
  ]
}}"""

        response = await self._call_ai(prompt)
        return self._parse_raw_checkpoints(response)

    # ==================== 阶段1：并行搜索 ====================

    async def _search_professional_materials(self, idea: str) -> List[Dict]:
        """
        搜索专业教程/最佳实践（获取原始资料，供Agent B使用）
        """
        keywords = [
            f"{idea}最佳实践",
            f"{idea}行业标准",
            f"{idea}专业教程",
            f"{idea}验收标准"
        ]

        return await self._search(keywords[:2])

    # ==================== 阶段2：Agent B ====================

    async def _agent_b_generate_standards(
        self,
        idea: str,
        raw_checkpoints: List[Dict],
        professional_materials: List[Dict]
    ) -> List[Checkpoint]:
        """
        Agent B：为每个节点生成量化标准

        输入：
        - raw_checkpoints: Agent A提取的节点框架
        - professional_materials: 搜索到的专业资料

        输出：
        - 完整的检测节点列表（含量化标准）
        """
        # 提取专业资料摘要
        material_summaries = self._extract_summaries(professional_materials)

        # 为每个节点生成量化标准
        checkpoints = []
        for raw_cp in raw_checkpoints:
            # 调用AI为这个节点生成量化标准
            standard = await self._ai_generate_standard_for_node(
                idea=idea,
                node_name=raw_cp["name"],
                material_summaries=material_summaries
            )

            checkpoints.append(Checkpoint(
                id=raw_cp["id"],
                name=raw_cp["name"],
                quantitative_standard=standard,
                estimated_time=raw_cp["estimated_time"],
                depends_on=raw_cp.get("depends_on", []),
                check_method=standard.check_method,
                status="pending"
            ))

        return checkpoints

    async def _ai_generate_standard_for_node(
        self,
        idea: str,
        node_name: str,
        material_summaries: List[str]
    ) -> QuantitativeStandard:
        """AI为单个节点生成量化标准"""

        prompt = f"""你是"量化标准专家"。

用户想法：{idea}

当前节点：{node_name}

专业参考资料：
{chr(10).join(f"- {s}" for s in material_summaries)}

请为这个节点生成可量化的完成标准。

量化标准类型：
- count: 数量（如：>=3个）
- list: 检查清单（如：配色/字体已确定）
- test: 测试验证（如：测试通过）
- artifact: 产出物（如：代码已提交）
- range: 范围指标（如：>80%）
- code: 代码检查（如：功能已实现）
- style: 样式检查（如：符合规范）

检测方式：self(自查) / manual(手动测试) / tool(工具检测) / ai(AI检测)

返回JSON：
{{
  "description": "标准描述",
  "metrics": [
    {{"type": "count", "target": ">=3", "unit": "个参考"}}
  ],
  "check_method": "self",
  "tips": "提示信息"
}}"""

        response = await self._call_ai(prompt)
        return self._parse_standard(response)

    # ==================== 通用方法 ====================

    async def _search(self, keywords: List[str]) -> List[Dict]:
        """执行搜索"""
        async with httpx.AsyncClient() as client:
            tasks = [self._search_single(kw, client) for kw in keywords]
            results = await asyncio.gather(*tasks)
            return self._merge_results(results)

    async def _search_single(self, keyword: str, client: httpx.AsyncClient) -> List[Dict]:
        """搜索单个关键词"""
        url = f"https://api.bing.microsoft.com/v7.0/search"
        headers = {"Ocp-Apim-Subscription-Key": self.search_api_key}
        params = {"q": keyword, "count": 5}

        response = await client.get(url, headers=headers, params=params)
        data = response.json()

        results = []
        for item in data.get("webPages", {}).get("value", []):
            results.append({
                "title": item.get("name"),
                "url": item.get("url"),
                "snippet": item.get("snippet")
            })
        return results

    def _merge_results(self, results_list: List[List[Dict]]) -> List[Dict]:
        """合并去重搜索结果"""
        seen_urls = set()
        merged = []
        for results in results_list:
            for r in results:
                if r["url"] not in seen_urls:
                    seen_urls.add(r["url"])
                    merged.append(r)
        return merged[:10]

    def _extract_summaries(self, search_results: List[Dict]) -> List[str]:
        """提取内容摘要"""
        return [f"标题: {r['title']}\n摘要: {r['snippet']}" for r in search_results]

    async def _call_ai(self, prompt: str) -> str:
        """调用AI"""
        # 使用硅基流动或其他AI API
        pass

    def _parse_raw_checkpoints(self, response: str) -> List[Dict]:
        """解析节点框架"""
        import json
        data = json.loads(response)
        return data.get("raw_checkpoints", [])

    def _parse_standard(self, response: str) -> QuantitativeStandard:
        """解析量化标准"""
        import json
        data = json.loads(response)
        return QuantitativeStandard(
            description=data.get("description", ""),
            metrics=[Metric(**m) for m in data.get("metrics", [])]
        )

    def _calculate_total_time(self, checkpoints: List[Checkpoint]) -> str:
        """计算总时间"""
        total_minutes = 0
        for cp in checkpoints:
            time_str = cp.estimated_time
            if "分钟" in time_str:
                total_minutes += int(time_str.replace("分钟", ""))
            elif "小时" in time_str:
                total_minutes += int(float(time_str.replace("小时", "")) * 60)

        if total_minutes < 60:
            return f"{total_minutes}分钟"
        else:
            hours = total_minutes // 60
            mins = total_minutes % 60
            return f"{hours}小时{mins}分钟" if mins > 0 else f"{hours}小时"
```

### 5.3 API端点

```python
# backend/routes/quick_task.py

from flask import Blueprint, request, jsonify
from services.ai_service import generate_quick_task_chain
from services.search_service import SearchService

quick_task_bp = Blueprint('quick_task', __name__)
search_service = SearchService()

# ==================== 搜索相关 ====================

@quick_task_bp.route('/api/quick-task/search', methods=['POST'])
async def search_references():
    """
    搜索参考资源

    请求体:
    {
        "idea": "把登录页面改成Vercel风格",
        "max_results": 5
    }
    """
    data = request.json
    result = await search_service.search_references(
        idea=data.get('idea'),
        max_results=data.get('max_results', 5)
    )
    return jsonify(result.dict())

@quick_task_bp.route('/api/quick-task/search/url', methods=['POST'])
async def analyze_custom_url():
    """
    分析用户自定义的参考链接

    请求体:
    {
        "url": "https://example.com/some-tutorial",
        "idea": "把登录页面改成Vercel风格"
    }
    """
    data = request.json
    # 获取URL内容并分析
    result = await search_service.analyze_url(
        url=data.get('url'),
        idea=data.get('idea')
    )
    return jsonify(result)

# ==================== 任务生成 ====================

@quick_task_bp.route('/api/quick-task/generate', methods=['POST'])
async def generate_quick_task():
    """
    生成快速任务链

    请求体:
    {
        "idea": "把登录页面改成Vercel风格",
        "time_estimate": "2-4小时",
        "deadline": null,
        "use_search": true,           // 是否使用搜索参考
        "custom_references": []        // 用户自定义的参考链接
    }
    """
    data = request.json
    idea = data.get('idea')

    # 1. 如果启用搜索，先搜索参考
    search_results = None
    if data.get('use_search', True):
        search_results = await search_service.search_references(idea)

    # 2. 生成任务链（如果有搜索结果，作为参考传入）
    result = generate_quick_task_chain(
        idea=idea,
        time_estimate=data.get('time_estimate'),
        deadline=data.get('deadline'),
        search_results=search_results
    )
    return jsonify(result)

# ==================== 任务管理 ====================

@quick_task_bp.route('/api/quick-task/save', methods=['POST'])
def save_quick_task():
    """保存快速任务到用户记录"""
    pass

@quick_task_bp.route('/api/quick-task/list', methods=['GET'])
def list_quick_tasks():
    """获取用户的快速任务列表"""
    pass

@quick_task_bp.route('/api/quick-task/<task_id>', methods=['GET'])
def get_quick_task(task_id):
    """获取单个快速任务详情"""
    pass

@quick_task_bp.route('/api/quick-task/<task_id>/step/<step_id>', methods=['PATCH'])
def update_step_status(task_id, step_id):
    """更新步骤状态"""
    pass
```

---

## 六、前端组件设计

### 6.1 组件结构

```
components/
├── quick-task/
│   ├── QuickTaskInput.tsx         # 快速输入组件
│   ├── SearchReferences.tsx       # 搜索参考结果组件 [新增]
│   ├── ReferenceCard.tsx          # 单个参考卡片组件 [新增]
│   ├── QuickTaskChain.tsx         # 任务链展示组件
│   ├── QuickTaskStep.tsx          # 单个步骤组件
│   └── QuickTaskList.tsx          # 快速任务列表
```

### 6.2 核心组件代码框架

```tsx
// QuickTaskInput.tsx
interface QuickTaskInputProps {
  onGenerate: (idea: string, options?: GenerateOptions) => void;
  isLoading?: boolean;
}

interface GenerateOptions {
  timeEstimate?: string;
  useSearch?: boolean;        // 是否使用搜索参考 [新增]
  customReferences?: string[]; // 自定义参考链接 [新增]
}

// SearchReferences.tsx [新增]
interface SearchReferencesProps {
  results: SearchResult[];
  recommendedIndex: number;
  query: string;
  onSelectReference: (url: string) => void;
  onProceedWithoutSearch: () => void;
  onCustomReference: (url: string) => void;
  isLoading?: boolean;
}

// ReferenceCard.tsx [新增]
interface ReferenceCardProps {
  result: SearchResult;
  isRecommended: boolean;
  onSelect: () => void;
  onReadSummary: () => void;
}

// QuickTaskChain.tsx
interface QuickTaskChainProps {
  taskChain: QuickTaskChain;
  references?: SearchResult[];    // 使用的参考资源 [新增]
  onStepToggle: (step: number) => void;
  onSave: () => void;
}

// QuickTaskStep.tsx
interface QuickTaskStepProps {
  step: QuickTaskStep;
  relatedReference?: string;      // 相关参考链接 [新增]
  onToggle: () => void;
}
```

### 6.3 搜索组件实现框架

```tsx
// SearchReferences.tsx
import { useState } from 'react';
import { Search, ExternalLink, Plus } from 'lucide-react';

export function SearchReferences({
  results,
  recommendedIndex,
  query,
  onSelectReference,
  onProceedWithoutSearch,
  onCustomReference,
  isLoading
}: SearchReferencesProps) {
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  return (
    <div className="search-results">
      <div className="search-header">
        <Search className="icon" />
        <h3>找到了 {results.length} 篇相关参考</h3>
        <span className="search-query">搜索词: {query}</span>
      </div>

      <div className="results-list">
        {results.map((result, index) => (
          <ReferenceCard
            key={result.url}
            result={result}
            isRecommended={index === recommendedIndex}
            onSelect={() => onSelectReference(result.url)}
          />
        ))}
      </div>

      <div className="custom-reference-section">
        {!showCustomInput ? (
          <button onClick={() => setShowCustomInput(true)}>
            <Plus size={16} />
            添加我自己的参考链接
          </button>
        ) : (
          <div className="custom-input">
            <input
              type="url"
              placeholder="粘贴参考链接..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
            <button onClick={() => onCustomReference(customUrl)}>
              使用此链接
            </button>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button onClick={onProceedWithoutSearch} variant="ghost">
          不使用参考，直接拆解
        </button>
        <button onClick={() => onSelectReference(results[recommendedIndex]?.url)}>
          基于推荐参考生成任务链
        </button>
      </div>
    </div>
  );
}

// ReferenceCard.tsx
export function ReferenceCard({ result, isRecommended, onSelect }: ReferenceCardProps) {
  return (
    <div className={`reference-card ${isRecommended ? 'recommended' : ''}`}>
      {isRecommended && <span className="recommended-badge">推荐</span>}

      <div className="card-header" onClick={onSelect}>
        <h4>{result.title}</h4>
        <ExternalLink size={14} />
      </div>

      <div className="card-meta">
        <span className="source">{result.source}</span>
        <span className="read-time">· {result.estimated_read_time}</span>
        <span className="relevance">⭐ {Math.round(result.relevance_score * 100)}%相关</span>
      </div>

      <p className="summary">{result.summary}</p>

      <div className="card-actions">
        <button size="sm" variant="ghost">查看摘要</button>
        <button size="sm" variant="ghost">在新标签页打开</button>
      </div>
    </div>
  );
}
```

### 6.4 完整交互流程

```tsx
// QuickTaskFlow.tsx - 完整流程管理
export function QuickTaskFlow() {
  const [step, setStep] = useState<'input' | 'search' | 'result'>('input');
  const [searchResults, setSearchResults] = useState<SearchResult[]>(null);
  const [taskChain, setTaskChain] = useState<QuickTaskChain>(null);

  // 步骤1: 用户输入
  const handleInput = async (idea: string, options: GenerateOptions) => {
    if (options.useSearch) {
      // 执行搜索
      const results = await api.searchReferences(idea);
      setSearchResults(results);
      setStep('search');
    } else {
      // 直接生成
      const chain = await api.generateTaskChain(idea);
      setTaskChain(chain);
      setStep('result');
    }
  };

  // 步骤2: 用户选择参考或跳过
  const handleSelectReference = async (referenceUrl: string) => {
    const chain = await api.generateTaskChain(idea, { referenceUrl });
    setTaskChain(chain);
    setStep('result');
  };

  const handleSkipSearch = async () => {
    const chain = await api.generateTaskChain(idea);
    setTaskChain(chain);
    setStep('result');
  };

  return (
    <div>
      {step === 'input' && <QuickTaskInput onGenerate={handleInput} />}
      {step === 'search' && (
        <SearchReferences
          results={searchResults}
          onSelectReference={handleSelectReference}
          onProceedWithoutSearch={handleSkipSearch}
        />
      )}
      {step === 'result' && <QuickTaskChain taskChain={taskChain} />}
    </div>
  );
}
```

---

## 七、实现优先级

| 优先级 | 功能 | 工作量 |
|-------|------|-------|
| P0 | 基础Prompt和AI拆解逻辑 | 1天 |
| P0 | 简单的输入输出界面 | 1天 |
| **P0** | **搜索参考功能** | **1天** |
| **P0** | **搜索结果展示组件** | **0.5天** |
| P1 | 任务链保存和历史记录 | 0.5天 |
| P1 | 步骤状态管理和完成跟踪 | 0.5天 |
| **P1** | **自定义参考链接支持** | **0.5天** |
| P2 | 与目标模式的数据互通 | 1天 |
| P2 | 更多自定义选项（优先级、标签） | 0.5天 |

### 搜索功能技术方案选项

| 方案 | 描述 | 优点 | 缺点 | 成本 |
|-----|------|------|------|------|
| **方案A** | Bing Search API | 结果质量高，中文支持好 | 需要付费 | $7/1000次 |
| **方案B** | Google Custom Search | 结果全面 | 配置复杂，有免费配额 | 免费5元/天 |
| **方案C** | 聚合搜索API（如serpapi） | 多引擎，开箱即用 | 第三方依赖 | $50/月起 |
| **方案D** | 自建爬虫+AI筛选 | 完全可控 | 维护成本高，可能违规 | 开发成本高 |

**推荐方案：先使用 Bing Search API 快速验证，后续可切换**

### 配置示例

```bash
# .env
SEARCH_API_KEY=your_bing_search_api_key
SEARCH_ENDPOINT=https://api.bing.microsoft.com/v7.0/search
SEARCH_MAX_RESULTS=5
```

---

## 八、后续优化方向

### 核心优化
1. **智能建议**：根据用户历史行为，预测可能的想法类型
2. **模板库**：常见想法类型的预置模板（学技术、修bug、做设计等）
3. **一键完成**：对于某些简单任务，AI直接生成可执行的代码/命令
4. **团队协作**：支持将快速任务分享给他人
5. **语音输入**：支持语音快速录入想法

### 搜索相关优化
1. **视频教程搜索**：额外搜索B站/YouTube上的视频教程
2. **GitHub项目推荐**：搜索相关的开源项目作为参考
3. **智能摘要生成**：AI生成参考文章的详细摘要
4. **搜索历史缓存**：相同想法直接返回缓存的搜索结果
5. **社区推荐**：用户可以点赞/收藏有用的参考，形成社区推荐
