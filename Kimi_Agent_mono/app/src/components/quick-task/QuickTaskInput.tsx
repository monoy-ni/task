import { useState, FormEvent } from 'react';

interface QuickTaskInputProps {
  initialIdea?: string;
  initialTimeEstimate?: string;
  onSubmit: (idea: string, timeEstimate?: string) => void;
}

const TIME_ESTIMATES = [
  { label: '30分钟内', value: '30分钟' },
  { label: '1小时内', value: '1小时' },
  { label: '2小时内', value: '2小时' },
  { label: '半天内', value: '4小时' },
  { label: '不限制', value: '' },
];

const EXAMPLES = [
  '把登录页面改成 Vercel 风格',
  '添加用户头像上传功能',
  '实现深色模式切换',
  '修复移动端导航栏问题',
  '优化首屏加载速度',
];

export function QuickTaskInput({
  initialIdea = '',
  initialTimeEstimate = '',
  onSubmit,
}: QuickTaskInputProps) {
  const [idea, setIdea] = useState(initialIdea);
  const [timeEstimate, setTimeEstimate] = useState(initialTimeEstimate);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (idea.trim()) {
      onSubmit(idea.trim(), timeEstimate || undefined);
    }
  };

  const selectExample = (example: string) => {
    setIdea(example);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 主输入区 */}
      <div className="bg-white rounded-3xl shadow-xl shadow-[#A8F2E7]/10 p-8">
        <h2 className="text-xl font-light text-gray-900 mb-6">你的想法是什么？</h2>

        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="例如：把登录页面改成 Vercel 风格、添加用户头像上传功能..."
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#7DE3D4] focus:outline-none transition-colors resize-none text-lg"
          autoFocus
        />

        {/* 时间预估 */}
        <div className="mt-6">
          <label className="block text-sm font-light text-gray-700 mb-3">
            希望在多长时间内完成？
          </label>
          <div className="flex flex-wrap gap-2">
            {TIME_ESTIMATES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTimeEstimate(option.value)}
                className={`px-4 py-2 rounded-xl border-2 transition-all text-sm ${
                  timeEstimate === option.value
                    ? 'bg-[#7DE3D4] border-[#7DE3D4] text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#7DE3D4]/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 示例区 */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
        <span className="text-sm font-medium text-gray-700">试试这些示例</span>
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => selectExample(example)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-[#7DE3D4]/50 hover:text-[#7DE3D4] transition-all"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={!idea.trim()}
        className="w-full py-4 bg-[#7DE3D4] text-white text-lg font-light rounded-2xl hover:bg-[#5BD4C3] transition-all shadow-lg shadow-[#A8F2E7]/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        快速拆解
      </button>
    </form>
  );
}
