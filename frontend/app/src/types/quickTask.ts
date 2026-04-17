/**
 * 快速任务模式类型定义
 */

// 节点操作指南
export interface StepGuide {
  description: string;
  steps: string[];
  completion_criteria: string[];
  pain_points: string[];
}

// 检测节点
export interface Checkpoint {
  id: string;
  name: string;
  step_guide: StepGuide;
  estimated_time: string;
  depends_on: string[];
  check_method: 'self' | 'manual' | 'tool' | 'ai';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

// 快速任务元数据
export interface QuickTaskMeta {
  total_checkpoints: number;
  sources_analyzed: number;
  confidence: number;
  search_time_ms?: number;
}

// 快速任务响应
export interface QuickTaskData {
  mode: 'quick';
  original_idea: string;
  estimated_total_time: string;
  checkpoints: Checkpoint[];
  meta: QuickTaskMeta;
}

export interface QuickTaskResult extends QuickTaskData {
  task_id: string;
}

// API 响应
export interface QuickTaskResponse {
  success: boolean;
  data?: QuickTaskResult;
  error?: string;
}

// 快速任务请求
export interface QuickTaskRequest {
  idea: string;
  time_estimate?: string;
}

// 快速任务列表项
export interface QuickTaskListItem {
  task_id: string;
  idea: string;
  original_idea: string;
  estimated_total_time: string;
  checkpoints_count: number;
  created_at: string;
}
