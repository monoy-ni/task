import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MonoAvatar } from '../components/Mono';

interface FormData {
  goal: string;
  hasDeadline: string;
  deadline: string;
  experience: string;
  importance: number;
  dailyHours: string;
  workingDays: string[];
  blockers: string;
  resources: string;
  expectations: string[];
}

export default function CreateProject() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    goal: '',
    hasDeadline: 'no',
    deadline: '',
    experience: '',
    importance: 3,
    dailyHours: '',
    workingDays: [],
    blockers: '',
    resources: '',
    expectations: [],
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'workingDays' | 'expectations', value: string) => {
    setFormData((prev) => {
      const array = prev[field];
      const newArray = array.includes(value)
        ? array.filter((item) => item !== value)
        : [...array, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = () => {
    console.log('=== handleSubmit START ===');
    
    try {
      // 基础验证
      if (!formData.goal.trim()) {
        alert('请填写目标');
        return;
      }
      if (!formData.dailyHours) {
        alert('请填写每日可用时间');
        return;
      }

      console.log('验证通过！');
      console.log('表单数据:', formData);
      console.log('navigate函数:', navigate);
      console.log('准备跳转到任务拆解页面...');

      // 直接跳转
      navigate('/task-breakdown', { state: { formData } });
      console.log('navigate函数已调用');
      
    } catch (error) {
      console.error('提交表单时出错:', error);
      alert('提交失败，请查看控制台');
    }
    
    console.log('=== handleSubmit END ===');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4FBF7]/30 via-white to-[#C9F7EF]/30 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 头部 */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <MonoAvatar size="lg" mood="happy" withGlow />
          </div>
          <h1 className="text-4xl font-light text-gray-900 mb-4">创建新目标</h1>
          <p className="text-gray-600 font-light">让mono帮你把目标拆解成可执行的每日任务</p>
        </div>

        {/* 表单 */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#A8F2E7]/10 p-12 space-y-10">
          
          {/* 1. 目标 */}
          <div>
            <label className="block text-lg font-light text-gray-900 mb-3">
              你的目标是什么？ <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => updateField('goal', e.target.value)}
              placeholder="例如：一个月内完成博物馆网页开发、三个月学会吉他弹唱..."
              rows={3}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#7DE3D4] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* 2. 是否有截止日期 */}
          <div>
            <label className="block text-lg font-light text-gray-900 mb-3">
              是否有明确的截止日期？
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => updateField('hasDeadline', 'yes')}
                className={`flex-1 py-3 px-6 rounded-2xl border-2 transition-all ${
                  formData.hasDeadline === 'yes'
                    ? 'bg-[#7DE3D4] border-[#7DE3D4] text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#7DE3D4]/50'
                }`}
              >
                有明确期限
              </button>
              <button
                type="button"
                onClick={() => updateField('hasDeadline', 'no')}
                className={`flex-1 py-3 px-6 rounded-2xl border-2 transition-all ${
                  formData.hasDeadline === 'no'
                    ? 'bg-[#7DE3D4] border-[#7DE3D4] text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#7DE3D4]/50'
                }`}
              >
                无固定期限
              </button>
            </div>
          </div>

          {/* 3. 截止日期（条件显示） */}
          {formData.hasDeadline === 'yes' && (
            <div>
              <label className="block text-lg font-light text-gray-900 mb-3">
                截止日期
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => updateField('deadline', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#7DE3D4] focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* 4. 经验水平 */}
          <div>
            <label className="block text-lg font-light text-gray-900 mb-3">
              在这个领域，你的经验水平如何？
            </label>
            <div className="space-y-3">
              {[
                { value: 'beginner', label: '初学者 - 刚开始接触这个领域' },
                { value: 'intermediate', label: '进阶者 - 有一定基础，需要进一步提升' },
                { value: 'expert', label: '精通者 - 技能熟练，想要突破瓶颈' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField('experience', option.value)}
                  className={`w-full text-left py-3 px-6 rounded-2xl border-2 transition-all ${
                    formData.experience === option.value
                      ? 'bg-[#7DE3D4] border-[#7DE3D4] text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-[#7DE3D4]/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. 重要程度 */}
          <div>
            <label className="block text-lg font-light text-gray-900 mb-3">
              这个目标对你来说有多重要？
            </label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateField('importance', value)}
                  className={`w-14 h-14 rounded-2xl border-2 transition-all font-light ${
                    formData.importance >= value
                      ? 'bg-[#7DE3D4] border-[#7DE3D4] text-white shadow-lg'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-[#7DE3D4]/50'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* 6. 每日可用时间 */}
          <div>
            <label className="block text-lg font-light text-gray-900 mb-3">
              每天可以投入多少时间？ <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={formData.dailyHours}
                onChange={(e) => updateField('dailyHours', e.target.value)}
                min="0.5"
                step="0.5"
                placeholder="2"
                required
                className="w-32 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#7DE3D4] focus:outline-none transition-colors text-center"
              />
              <span className="text-gray-600">小时/天</span>
            </div>
          </div>

          {/* 7. 工作日 */}
          <div>
            <label className="block text-lg font-light text-gray-900 mb-3">
              通常在哪些天工作？（可多选）
            </label>
            <div className="grid grid-cols-4 gap-3">
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleArrayItem('workingDays', day)}
                  className={`py-3 px-4 rounded-2xl border-2 transition-all ${
                    formData.workingDays.includes(day)
                      ? 'bg-[#7DE3D4] border-[#7DE3D4] text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-[#7DE3D4]/50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* 8. 可能的阻碍 */}
          <div>
            <label className="block text-lg font-light text-gray-900 mb-3">
              可能遇到的困难或阻碍？
            </label>
            <textarea
              value={formData.blockers}
              onChange={(e) => updateField('blockers', e.target.value)}
              placeholder="例如：技能不足、时间紧张、需要学习新工具..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#7DE3D4] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* 9. 已有资源 */}
          <div>
            <label className="block text-lg font-light text-gray-900 mb-3">
              你已经准备好的资源？
            </label>
            <textarea
              value={formData.resources}
              onChange={(e) => updateField('resources', e.target.value)}
              placeholder="例如：已购买课程、具备基础知识、拥有必要工具..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#7DE3D4] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* 10. 期望收获 */}
          <div>
            <label className="block text-lg font-light text-gray-900 mb-3">
              你希望从这个目标中获得什么？（可多选）
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '提升专业技能', label: '提升专业技能' },
                { value: '完成作品集', label: '完成作品集' },
                { value: '获得认证或证书', label: '获得认证或证书' },
                { value: '个人成长', label: '个人成长' },
                { value: '职业发展', label: '职业发展' },
                { value: '兴趣爱好', label: '兴趣爱好' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleArrayItem('expectations', option.value)}
                  className={`py-3 px-6 rounded-2xl border-2 transition-all ${
                    formData.expectations.includes(option.value)
                      ? 'bg-[#7DE3D4] border-[#7DE3D4] text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-[#7DE3D4]/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="pt-6">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-4 bg-[#7DE3D4] text-white text-lg font-light rounded-2xl hover:bg-[#5BD4C3] transition-all shadow-lg shadow-[#A8F2E7]/30"
            >
              生成任务拆解
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}