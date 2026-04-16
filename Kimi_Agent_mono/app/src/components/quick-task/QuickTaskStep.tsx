import { useState } from 'react';
import { Checkpoint as CheckpointType } from '@/types/quickTask';

interface QuickTaskStepProps {
  checkpoint: CheckpointType;
  index: number;
  onStatusChange: (stepId: string, status: 'pending' | 'in_progress' | 'completed' | 'skipped') => void;
  disabled?: boolean;
}

const STATUS_CONFIG = {
  pending: {
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: '待开始',
  },
  in_progress: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    label: '进行中',
  },
  completed: {
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    label: '已完成',
  },
  skipped: {
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    label: '已跳过',
  },
};

export function QuickTaskStep({ checkpoint, index, onStatusChange, disabled }: QuickTaskStepProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const config = STATUS_CONFIG[checkpoint.status];

  const canStart = checkpoint.status === 'pending';
  const canComplete = checkpoint.status === 'in_progress';
  const canSkip = checkpoint.status === 'pending' || checkpoint.status === 'in_progress';

  const handleStart = () => {
    if (canStart && !disabled) {
      onStatusChange(checkpoint.id, 'in_progress');
      setIsExpanded(true);
    }
  };

  const handleComplete = () => {
    if (canComplete && !disabled) {
      onStatusChange(checkpoint.id, 'completed');
    }
  };

  const handleSkip = () => {
    if (canSkip && !disabled) {
      onStatusChange(checkpoint.id, 'skipped');
    }
  };

  return (
    <div
      className={`border-2 ${config.borderColor} ${config.bgColor} rounded-2xl overflow-hidden transition-all`}
    >
      {/* 步骤头部 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/30 transition-colors"
      >
        {/* 序号 */}
        <div className="w-8 h-8 flex items-center justify-center">
          <span
            className={`text-sm font-medium ${
              checkpoint.status === 'completed' ? 'text-green-500' :
              checkpoint.status === 'pending' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {index + 1}
          </span>
        </div>

        {/* 步骤名称和时间 */}
        <div className="flex-1 text-left">
          <h3
            className={`font-medium ${
              checkpoint.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
          >
            {checkpoint.name}
          </h3>
          <p className="text-sm text-gray-500">
            {checkpoint.estimated_time}
          </p>
        </div>

        {/* 状态标签 */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            checkpoint.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : checkpoint.status === 'in_progress'
                ? 'bg-blue-100 text-blue-700'
                : checkpoint.status === 'skipped'
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-gray-100 text-gray-600'
          }`}
        >
          {config.label}
        </span>

        {/* 展开指示 */}
        <span className="text-xs text-gray-400">
          {isExpanded ? '收起' : '展开'}
        </span>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-200/50 space-y-4">
          {/* 节点概述 */}
          <div>
            <p className="text-sm text-gray-600">
              {checkpoint.step_guide.description}
            </p>
          </div>

          {/* 具体操作步骤 */}
          {checkpoint.step_guide.steps && checkpoint.step_guide.steps.length > 0 && (
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">操作步骤</h4>
              <ol className="space-y-2">
                {checkpoint.step_guide.steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-[#7DE3D4]/10 text-[#7DE3D4] rounded-full flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 完成标准 */}
          {checkpoint.step_guide.completion_criteria && checkpoint.step_guide.completion_criteria.length > 0 && (
            <div className="p-3 bg-green-50 rounded-xl border border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-2">完成标准</h4>
              <div className="space-y-1">
                {checkpoint.step_guide.completion_criteria.map((criteria, idx) => (
                  <p key={idx} className="text-xs text-green-700">
                    {criteria}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 痛点难点 */}
          {checkpoint.step_guide.pain_points && checkpoint.step_guide.pain_points.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-2">注意避坑</h4>
              <div className="space-y-1">
                {checkpoint.step_guide.pain_points.map((point, idx) => (
                  <p key={idx} className="text-xs text-amber-700">
                    {point}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            {canStart && (
              <button
                type="button"
                onClick={handleStart}
                disabled={disabled}
                className="px-4 py-2 bg-[#7DE3D4] text-white rounded-xl hover:bg-[#5BD4C3] transition-all text-sm disabled:opacity-50"
              >
                开始执行
              </button>
            )}
            {canComplete && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={disabled}
                className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all text-sm disabled:opacity-50"
              >
                标记完成
              </button>
            )}
            {canSkip && !canStart && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={disabled}
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-all text-sm disabled:opacity-50"
              >
                跳过
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
