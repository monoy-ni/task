import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MonoAvatar } from '../components/mono';
import { QuickTaskInput } from '../components/quick-task/QuickTaskInput';
import { QuickTaskChain } from '../components/quick-task/QuickTaskChain';
import { QuickTaskResponse, Checkpoint } from '../types/quickTask';
import { generateQuickTask, updateCheckpointStatus } from '../services/quickTaskApi';

interface QuickTaskData extends QuickTaskResponse {
  task_id: string;
}

export default function QuickTask() {
  const navigate = useNavigate();

  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input');
  const [idea, setIdea] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [taskData, setTaskData] = useState<QuickTaskData | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleSubmit = async (submittedIdea: string, submittedTime?: string) => {
    setIdea(submittedIdea);
    setTimeEstimate(submittedTime || '');
    setStep('loading');
    setError(null);

    try {
      const response = await generateQuickTask(submittedIdea, submittedTime);
      if (response.success && response.data) {
        setTaskData(response.data as QuickTaskData);
        setCheckpoints(response.data.checkpoints);
        setStep('result');
      } else {
        throw new Error(response.error || '生成失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成快速任务失败');
      setStep('input');
    }
  };

  const handleStatusChange = async (
    taskId: string,
    stepId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ) => {
    setUpdatingStatus(true);
    try {
      await updateCheckpointStatus(taskId, stepId, status);
      setCheckpoints(prev =>
        prev.map(cp => cp.id === stepId ? { ...cp, status } : cp)
      );
    } catch (err) {
      console.error('更新状态失败:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBack = () => {
    setStep('input');
    setTaskData(null);
    setCheckpoints([]);
    setError(null);
  };

  const handleNewTask = () => {
    setIdea('');
    setTimeEstimate('');
    setStep('input');
    setTaskData(null);
    setCheckpoints([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4FBF7]/30 via-white to-[#C9F7EF]/30 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 头部 */}
        <div className="text-center mb-12 flex flex-col items-center">
          {step === 'input' && (
            <>
              <div className="mb-6">
                <MonoAvatar size="lg" mood="excited" withGlow />
              </div>
              <h1 className="text-4xl font-light text-gray-900 mb-4">快速任务模式</h1>
              <p className="text-gray-600 font-light max-w-md">
                突然有个想法？mono帮你快速拆解成可执行的检测节点
              </p>
            </>
          )}

          {step === 'loading' && (
            <>
              <div className="mb-6">
                <MonoAvatar size="lg" mood="thinking" withGlow />
              </div>
              <h1 className="text-4xl font-light text-gray-900 mb-4">正在分析...</h1>
              <p className="text-gray-600 font-light">
                mono正在搜索专业资料并拆解任务节点
              </p>
            </>
          )}

          {step === 'result' && taskData && (
            <>
              <div className="mb-6 flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="px-3 py-1 rounded-full bg-white shadow-md hover:shadow-lg transition-all text-sm text-gray-600"
                >
                  返回
                </button>
                <MonoAvatar size="md" mood="happy" withGlow />
              </div>
              <h1 className="text-4xl font-light text-gray-900 mb-4">任务拆解完成！</h1>
              <p className="text-gray-600 font-light">
                预计总时长: {taskData.estimated_total_time}
              </p>
            </>
          )}
        </div>

        {/* 内容区 */}
        {step === 'input' && (
          <QuickTaskInput
            initialIdea={idea}
            initialTimeEstimate={timeEstimate}
            onSubmit={handleSubmit}
          />
        )}

        {step === 'loading' && (
          <div className="bg-white rounded-3xl shadow-xl shadow-[#A8F2E7]/10 p-12">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-[#7DE3D4] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-lg font-light text-gray-900">Agent A 正在提取任务节点...</p>
                <p className="text-sm text-gray-500">同时搜索专业教程资料</p>
              </div>
            </div>
          </div>
        )}

        {step === 'result' && taskData && (
          <QuickTaskChain
            taskId={taskData.task_id}
            originalIdea={taskData.original_idea}
            checkpoints={checkpoints}
            meta={taskData.meta}
            onStatusChange={handleStatusChange}
            onNewTask={handleNewTask}
            updatingStatus={updatingStatus}
          />
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <MonoAvatar size="sm" mood="worried" />
              <div>
                <h3 className="font-medium text-red-900 mb-1">出错了</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
