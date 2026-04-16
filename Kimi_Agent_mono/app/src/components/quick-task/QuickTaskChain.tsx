import { QuickTaskStep } from './QuickTaskStep';
import { Checkpoint, QuickTaskMeta } from '@/types/quickTask';

interface QuickTaskChainProps {
  taskId: string;
  originalIdea: string;
  checkpoints: Checkpoint[];
  meta: QuickTaskMeta;
  onStatusChange: (
    taskId: string,
    stepId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ) => void;
  onNewTask: () => void;
  updatingStatus: boolean;
}

export function QuickTaskChain({
  taskId,
  originalIdea,
  checkpoints,
  meta,
  onStatusChange,
  onNewTask,
  updatingStatus,
}: QuickTaskChainProps) {
  // 计算进度
  const completedCount = checkpoints.filter((cp) => cp.status === 'completed').length;
  const totalCount = checkpoints.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 判断是否全部完成
  const isAllComplete = completedCount === totalCount && totalCount > 0;

  const handleStatusChange = (
    stepId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ) => {
    onStatusChange(taskId, stepId, status);
  };

  return (
    <div className="space-y-6">
      {/* 进度卡片 */}
      <div className="bg-white rounded-3xl shadow-xl shadow-[#A8F2E7]/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-light text-gray-900">任务进度</h3>
            <p className="text-sm text-gray-500">{completedCount}/{totalCount} 个节点已完成</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-light text-[#7DE3D4]">{progress}</span>
            <span className="text-gray-400">%</span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7DE3D4] to-[#5BD4C3] transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 元数据 */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
          <span>来源分析: {meta.sources_analyzed} 份</span>
          <span>置信度: {Math.round(meta.confidence * 100)}%</span>
          {meta.search_time_ms && (
            <span>搜索耗时: {Math.round(meta.search_time_ms / 1000)}s</span>
          )}
        </div>
      </div>

      {/* 原始想法 */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
        <div>
          <span className="text-xs text-gray-500">原始想法</span>
          <p className="text-sm text-gray-700 mt-1">{originalIdea}</p>
        </div>
      </div>

      {/* 检测节点链 */}
      <div className="space-y-4">
        <h3 className="text-lg font-light text-gray-900 px-2">检测节点</h3>

        {checkpoints.map((checkpoint, index) => (
          <div key={checkpoint.id} className="relative">
            {/* 连接线 */}
            {index < checkpoints.length - 1 && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200 -z-10" />
            )}

            <QuickTaskStep
              checkpoint={checkpoint}
              index={index}
              onStatusChange={handleStatusChange}
              disabled={updatingStatus}
            />
          </div>
        ))}
      </div>

      {/* 完成提示 */}
      {isAllComplete && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-6 text-center">
          <h3 className="text-xl font-medium text-green-900 mb-2">恭喜！所有节点已完成</h3>
          <p className="text-green-700 text-sm mb-4">
            你已经完成了这个快速任务的所有检测节点
          </p>
          <button
            onClick={onNewTask}
            className="px-6 py-3 bg-[#7DE3D4] text-white rounded-2xl hover:bg-[#5BD4C3] transition-all"
          >
            创建新任务
          </button>
        </div>
      )}

      {/* 底部操作 */}
      {!isAllComplete && (
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {checkpoints.filter((cp) => cp.status === 'pending').length} 个节点待完成
          </span>
          <button
            onClick={onNewTask}
            className="text-sm text-[#7DE3D4] hover:text-[#5BD4C3] transition-colors"
          >
            创建新任务
          </button>
        </div>
      )}
    </div>
  );
}
