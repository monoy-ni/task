/**
 * 快速任务 API 服务
 */

import { QuickTaskRequest, QuickTaskResponse, QuickTaskListItem } from '@/types/quickTask';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * 生成快速任务检测节点
 */
export async function generateQuickTask(
  idea: string,
  timeEstimate?: string
): Promise<QuickTaskResponse> {
  const response = await fetch(`${API_BASE}/api/quick-task/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idea,
      time_estimate: timeEstimate
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '生成快速任务失败');
  }

  return response.json();
}

/**
 * 获取快速任务详情
 */
export async function getQuickTask(taskId: string): Promise<QuickTaskResponse> {
  const response = await fetch(`${API_BASE}/api/quick-task/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取任务失败');
  }

  return response.json();
}

/**
 * 获取所有快速任务列表
 */
export async function listQuickTasks(): Promise<{ success: boolean; data: QuickTaskListItem[] }> {
  const response = await fetch(`${API_BASE}/api/quick-task`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取任务列表失败');
  }

  return response.json();
}

/**
 * 更新检测节点状态
 */
export async function updateCheckpointStatus(
  taskId: string,
  stepId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/quick-task/${taskId}/step/${stepId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('更新状态失败');
  }

  return response.json();
}
