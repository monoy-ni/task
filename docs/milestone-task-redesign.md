# 里程碑-任务系统重构设计

## 一、当前问题

### 现状限制
- 每个时间里程碑节点只对应一个任务节点
- 里程碑与任务是一对一的简单关联
- 缺乏灵活的任务组织能力
- 难以表达复杂的项目分解结构

## 二、新设计模式

### 2.1 核心概念

```
里程碑 (Milestone) ──┐
                     ├──→ 任务组 (TaskGroup) ──┐
                     │                        ├──→ 子任务 (Task)
                     │                        └──→ 子任务 (Task)
                     │
                     ├──→ 任务组 (TaskGroup) ──┐
                     │                        ├──→ 子任务 (Task)
                     │                        └──→ 子任务 (Task)
                     │
                     └──→ 独立任务 (Task) ──→ 依赖任务 (Task)
```

### 2.2 层级关系定义

| 层级 | 说明 | 示例 |
|------|------|------|
| **Level 0** | 项目根节点 | 整个项目 |
| **Level 1** | 里程碑节点 | "Q1目标完成"、"MVP发布" |
| **Level 2** | 任务组/阶段 | "后端开发"、"前端开发"、"测试" |
| **Level 3** | 具体任务 | "用户API设计"、"数据库搭建" |
| **Level 4** | 子任务 | "定义字段"、"编写迁移脚本" |

### 2.3 父子关系规则

```typescript
// 父节点可以包含多个同类型子节点
interface ParentNode {
  id: string;
  type: 'milestone' | 'taskGroup' | 'task';
  children: ChildNode[];
}

// 子节点明确指向父节点
interface ChildNode {
  id: string;
  type: 'taskGroup' | 'task';
  parentId: string;  // 明确的父节点引用
  position?: number; // 在同级中的排序位置
}
```

## 三、数据结构设计

### 3.1 里程碑结构 (增强版)

```typescript
interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;

  // 新增：支持多个任务组
  taskGroups: TaskGroup[];
  // 新增：支持直接关联的独立任务
  standaloneTasks: Task[];

  // 元数据
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  progress: number; // 0-100，基于子任务完成度计算

  // 约束条件
  dependencies?: string[]; // 依赖的前置里程碑ID
  requiredTaskGroups?: number; // 需要完成多少个任务组才算完成此里程碑
}
```

### 3.2 任务组结构 (新增)

```typescript
interface TaskGroup {
  id: string;
  milestoneId: string; // 所属里程碑
  title: string;
  description?: string;
  category: 'development' | 'design' | 'testing' | 'deployment' | 'documentation';

  // 任务列表
  tasks: Task[];

  // 元数据
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
  assignee?: string;
  priority: 1 | 2 | 3 | 4 | 5;

  // 排序
  order: number; // 在同级任务组中的顺序
}
```

### 3.3 任务结构 (增强版)

```typescript
interface Task {
  id: string;
  parentId: string; // 可以是 milestoneId 或 taskGroupId
  parentType: 'milestone' | 'taskGroup'; // 明确父节点类型

  title: string;
  description?: string;

  // 时间信息
  startDate: Date;
  endDate: Date;
  estimatedHours: number;

  // 状态
  status: 'todo' | 'in-progress' | 'blocked' | 'completed';
  progress: number;

  // 关系
  dependencies: string[]; // 依赖的其他任务ID
  children?: Task[]; // 子任务（支持多层级）

  // 属性
  importance: 1 | 2 | 3 | 4 | 5;
  urgency: 1 | 2 | 3 | 4 | 5;
  risk: 1 | 2 | 3 | 4 | 5;

  // 排序
  order: number;
}
```

## 四、关系图示

### 4.1 树形结构示例

```
项目: 构建AI任务管理平台
│
├── 里程碑1: MVP上线 (2024-03-01)
│   │
│   ├── 任务组1: 后端开发
│   │   ├── 任务1.1: 设计API架构
│   │   │   └── 子任务1.1.1: 定义数据模型
│   │   │   └── 子任务1.1.2: 编写接口文档
│   │   │
│   │   ├── 任务1.2: 实现核心API
│   │   └── 任务1.3: 数据库搭建
│   │
│   ├── 任务组2: 前端开发
│   │   ├── 任务2.1: 搭建React项目
│   │   ├── 任务2.2: 实现任务列表组件
│   │   └── 任务2.3: 实现甘特图组件
│   │
│   └── 任务组3: 测试与部署
│       ├── 任务3.1: 单元测试
│       └── 任务3.2: 部署配置
│
├── 里程碑2: Beta发布 (2024-04-15)
│   ├── 任务组1: 功能完善
│   │   ├── 任务1.1: 用户系统
│   │   └── 任务1.2: 权限管理
│   └── 任务组2: 性能优化
│
└── 里程碑3: 正式发布 (2024-06-01)
    └── ...
```

### 4.2 父子关系矩阵

| 父节点类型 | 可包含的子节点类型 | 一对多关系 |
|-----------|------------------|-----------|
| Milestone | TaskGroup, Task | ✅ 一个里程碑可包含多个任务组和任务 |
| TaskGroup | Task | ✅ 一个任务组可包含多个任务 |
| Task | Task | ✅ 一个任务可包含多个子任务 |

## 五、关键约束与规则

### 5.1 唯一性约束
```typescript
// 每个节点只能有一个父节点
interface Node {
  parentId: string | null; // 只能指向单一父节点
}
```

### 5.2 完整性约束
```typescript
// 里程碑完成条件
interface MilestoneCompletionRule {
  // 选项1: 所有任务组完成
  all: boolean;

  // 选项2: 指定数量的任务组完成
  atLeast: number;

  // 选项3: 特定任务组必须完成
  required: string[]; // taskGroupIds
}
```

### 5.3 循环依赖检测
```typescript
function detectCycle(dependencies: string[][]): boolean {
  // 使用DFS检测任务依赖图中是否存在环
  // 防止 A → B → C → A 的循环依赖
}
```

## 六、API 设计

### 6.1 获取里程碑树
```http
GET /api/projects/{projectId}/milestone-tree
```

响应示例：
```json
{
  "projectId": "proj-001",
  "milestones": [
    {
      "id": "ms-001",
      "title": "MVP上线",
      "targetDate": "2024-03-01",
      "taskGroups": [
        {
          "id": "tg-001",
          "title": "后端开发",
          "tasks": [
            {
              "id": "task-001",
              "title": "设计API架构",
              "children": [...]
            }
          ]
        }
      ],
      "standaloneTasks": []
    }
  ]
}
```

### 6.2 创建任务节点
```http
POST /api/milestones/{milestoneId}/task-groups
POST /api/task-groups/{taskGroupId}/tasks
POST /api/tasks/{taskId}/children
```

## 七、前端展示建议

### 7.1 甘特图视图
```
Milestone 1 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
  ├─ TaskGroup 1 ▓▓▓▓▓▓▓
  │   ├─ Task 1.1 ▓▓▓
  │   └─ Task 1.2 ▓▓▓▓
  └─ TaskGroup 2 ▓▓▓▓▓▓▓▓
```

### 7.2 树形列表视图
```
📁 里程碑: MVP上线
  📁 任务组: 后端开发
    📄 任务: 设计API架构
    📄 任务: 实现核心API
  📁 任务组: 前端开发
    📄 任务: 搭建React项目
```

## 八、迁移路径

### 8.1 兼容性处理
```typescript
// 旧数据迁移适配器
function migrateLegacyData(legacyMilestones: LegacyMilestone[]): MilestoneTree {
  return legacyMilestones.map(ms => ({
    ...ms,
    taskGroups: [{
      id: `${ms.id}-default-group`,
      milestoneId: ms.id,
      title: '默认任务组',
      tasks: ms.taskIds.map(id => getTaskById(id))
    }],
    standaloneTasks: []
  }));
}
```

### 8.2 渐进式迁移
1. **阶段1**: 添加新字段，保持向后兼容
2. **阶段2**: 更新创建逻辑使用新结构
3. **阶段3**: 迁移现有数据
4. **阶段4**: 移除旧字段

## 九、状态传播规则

```
子任务完成 → 更新父任务进度 → 更新任务组进度 → 更新里程碑进度
```

```typescript
// 进度计算公式
function calculateProgress(node: ParentNode): number {
  if (node.children.length === 0) return node.progress;

  const totalProgress = node.children.reduce((sum, child) => {
    return sum + calculateProgress(child);
  }, 0);

  return totalProgress / node.children.length;
}
```

## 十、总结

### 改进点
- ✅ 支持里程碑包含多个任务组
- ✅ 支持任务组包含多个任务
- ✅ 明确的父子关系通过 `parentId` 字段
- ✅ 支持多层级任务嵌套
- ✅ 灵活的完成条件配置
- ✅ 自动化的进度计算与传播

### 向后兼容
- 保留原有的 `taskIds` 字段用于过渡
- 提供数据迁移工具
- API 同时支持新旧格式
