import { Link } from 'react-router';
import { MonoAvatar } from '../components/mono';

export default function About() {
  const features = [
    {
      title: '智能目标拆解',
      description: 'AI 自动将你的大目标分解为可执行的小任务，让每一步都清晰可见',
      image: '/images/a31a5b22e5cda66a08a83958a74a60dd.png'
    },
    {
      title: '灵活排程',
      description: '根据你的可用时间和工作日，智能安排每日任务，合理分配精力',
      image: '/images/0d2dbfde0c19a77829aa376c0dc4ed50.png'
    },
    {
      title: '多视图管理',
      description: '甘特图、看板、时间线多种视图，满足不同管理偏好',
      image: '/images/8e5051f77ae43afce03ce2af69e3b3ca.jpg'
    },
    {
      title: 'AI 智能助手',
      description: 'mono AI 陪伴你完成目标，提供个性化建议和优化方案',
      image: '/images/cbec3d0283e6f0f95510f39691d79408.png'
    },
    {
      title: '进度追踪',
      description: '实时掌握任务完成情况，可视化展示你的成长轨迹',
      image: '/images/b65b08a0da1ab9f688f1e975df3a0f0e.png'
    },
    {
      title: '历史回顾',
      description: '保存所有项目记录，随时回顾过往成就与经验',
      image: '/images/c232f43fe8b8ea0d73f3c1fa596630e6.png'
    }
  ];

  const steps = [
    {
      step: '01',
      title: '设定目标',
      description: '简单描述你的目标，mono 会引导你补充关键信息',
      image: '/images/305837831e77230c6996a5102adce94f.jpg'
    },
    {
      step: '02',
      title: '智能拆解',
      description: 'AI 将你的目标分解为月度、周度、日度任务',
      image: '/images/aed8c6c704ea7f50f2326aa32dc3aafa.jpg'
    },
    {
      step: '03',
      title: '灵活调整',
      description: '根据实际情况，随时重新生成任务计划',
      image: '/images/c73538f8a23606fa1fa4e1622424091a.jpg'
    },
    {
      step: '04',
      title: '完成目标',
      description: '一步步执行，享受达成目标的成就感',
      image: '/images/8e5051f77ae43afce03ce2af69e3b3ca.jpg'
    }
  ];

  const gallery = [
    '/images/mono-logo-variant.png',
    '/images/305837831e77230c6996a5102adce94f.jpg',
    '/images/bc204816806b3bb94060e77208f76e6c.jpg'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4FBF7]/30 via-white to-[#C9F7EF]/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="absolute inset-0 opacity-10">
          <img
            src="/images/f799cb91bc4d70fbab58cf2e57c55420.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-8">
            <MonoAvatar size="xl" mood="happy" withGlow />
          </div>
          <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6">
            关于 <span className="text-[#7dd3c0] font-medium">mono</span>
          </h1>
          <p className="text-xl text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
            mono 是一款 AI 驱动的任务管理工具，帮助你将宏大目标分解为可执行的小任务，
            让计划变动不再成为困扰，像呼吸一样自然地管理你的人生。
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl shadow-[#A8F2E7]/10 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-light text-gray-900 mb-6">
                  我们的使命
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  在这个信息爆炸、目标多元的时代，我们常常感到焦虑和无所适从。
                  mono 希望通过 AI 技术，帮助每个人更清晰地规划人生目标，
                  将看似遥不可及的梦想，一步步转化为现实的成就。
                </p>
                <p className="text-lg text-gray-600 leading-relaxed mt-4">
                  我们相信，每个大目标都是由小任务组成的。
                  帮你把大目标拆小，把小任务做好，这就是 mono 的价值。
                </p>
              </div>
              <div className="relative">
                <img
                  src="/images/a017d1991091b71e9ccf432306e88900.jpg"
                  alt="mono使命"
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 mb-12 text-center">
            核心功能
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-[#A8F2E7]/10 hover:shadow-xl hover:shadow-[#A8F2E7]/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-48 overflow-hidden bg-gradient-to-br from-[#E4FBF7] to-[#C9F7EF]">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 mb-12 text-center">
            如何使用
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#7dd3c0] to-[#5bd4c3] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 mb-12 text-center">
            产品展示
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {gallery.map((img, index) => (
              <div
                key={index}
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={img}
                  alt={`展示${index + 1}`}
                  className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#E4FBF7] to-[#C9F7EF]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-3xl p-12 shadow-xl">
            <MonoAvatar size="lg" mood="happy" withGlow />
            <h2 className="text-3xl font-light text-gray-900 mt-6 mb-4">
              开始你的目标之旅
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              无论你想学习新技能、完成项目，还是养成好习惯，mono 都会陪伴你一路前行
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/create"
                className="px-8 py-4 bg-[#7dd3c0] text-white text-lg font-medium rounded-full hover:bg-[#5bd4c3] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                立即开始
              </Link>
              <Link
                to="/"
                className="px-8 py-4 bg-white text-gray-700 text-lg font-medium rounded-full hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl border-2 border-[#7dd3c0]/20"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
