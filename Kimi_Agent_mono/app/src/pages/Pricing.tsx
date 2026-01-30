import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { TIER_CONFIGS, PACK_CONFIGS } from '../lib/supabase';
import { Check, ArrowRight } from 'lucide-react';

type PaymentMethod = 'wechat' | 'alipay';

const Pricing = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSelectPlan = (planId: string) => {
    if (!userProfile) {
      navigate('/login');
      return;
    }
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePayment = async () => {
    setProcessing(true);

    // Simulate payment process
    // In production, this would integrate with WeChat Pay or Alipay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo purposes, just redirect to profile
    // In production, you would call your backend to create the payment order
    alert('支付功能演示：实际使用需要接入微信/支付宝支付');
    setProcessing(false);
    setShowPayment(false);
  };

  const plans = [
    {
      id: 'free',
      ...TIER_CONFIGS.free,
      features: ['注册即送10次', '永久有效', '体验核心功能'],
      highlight: false,
    },
    {
      id: 'monthly',
      ...TIER_CONFIGS.monthly,
      features: ['每日10次AI对话', '次数包购买享8折', '优先客服支持'],
      highlight: false,
    },
    {
      id: 'yearly',
      ...TIER_CONFIGS.yearly,
      features: ['每日30次AI对话', '次数包购买享5折', '专属客服支持', '节省¥50'],
      highlight: true,
    },
  ];

  const packs = [
    {
      id: 'pack_20',
      ...PACK_CONFIGS.pack_20,
    },
    {
      id: 'pack_100',
      ...PACK_CONFIGS.pack_100,
    },
  ];

  // Calculate price with discount
  const getDiscountedPrice = (basePrice: number, packId?: string) => {
    if (!userProfile) return basePrice;

    const discount = TIER_CONFIGS[userProfile.tier]?.purchaseDiscount || 1;
    let price = basePrice * discount;

    // Apply pack discount
    if (packId === 'pack_20') {
      price = price * discount;
    } else if (packId === 'pack_100') {
      price = price * discount;
    }

    return Math.round(price * 10) / 10;
  };

  return (
    <div className="min-h-screen bg-mono-bg py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-mono-text mb-4">
            选择适合你的方案
          </h1>
          <p className="text-mono-text-secondary max-w-2xl mx-auto">
            无论你是轻度用户还是重度使用者，都有适合的方案
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="mb-16">
          <h2 className="font-display text-xl font-bold text-mono-text mb-6 text-center">
            订阅制
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl p-6 transition-all duration-300 ${
                  plan.highlight
                    ? 'ring-2 ring-mono-primary shadow-soft-lg scale-105'
                    : 'shadow-soft hover:shadow-soft-lg'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-mono-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                      推荐
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="font-display text-lg font-bold text-mono-text mb-2">
                    {plan.name}
                  </h3>
                  {plan.price && (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-mono-primary">
                        ¥{plan.price}
                      </span>
                      <span className="text-mono-text-muted">
                        /{plan.id === 'monthly' ? '月' : '年'}
                      </span>
                    </div>
                  )}
                  {!plan.price && (
                    <div className="text-xl font-bold text-mono-text">
                      免费
                    </div>
                  )}
                  <p className="text-sm text-mono-text-secondary mt-2">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-mono-text">
                      <Check className="w-4 h-4 text-mono-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-mono-primary hover:bg-mono-primary-dark text-white'
                      : 'bg-mono-bg hover:bg-mono-primary/10 text-mono-text'
                  }`}
                >
                  {plan.price ? '立即订阅' : '当前方案'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Packs */}
        <div>
          <h2 className="font-display text-xl font-bold text-mono-text mb-2 text-center">
            次数包
          </h2>
          <p className="text-center text-mono-text-secondary mb-6">
            永不过期，即用即买
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {packs.map((pack) => {
              const discountedPrice = getDiscountedPrice(pack.price, pack.id);
              const hasDiscount = userProfile && userProfile.tier !== 'free' && discountedPrice < pack.price;

              return (
                <div
                  key={pack.id}
                  className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300"
                >
                  <div className="text-center mb-4">
                    <h3 className="font-display text-lg font-bold text-mono-text mb-2">
                      {pack.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-bold text-mono-primary">
                        ¥{discountedPrice}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-mono-text-muted line-through">
                          ¥{pack.price}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-mono-text-secondary mt-1">
                      {pack.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(pack.id)}
                    className="w-full py-3 bg-mono-bg hover:bg-mono-primary/10 text-mono-text rounded-xl font-medium transition-all duration-300"
                  >
                    购买
                  </button>
                </div>
              );
            })}
          </div>

          {userProfile && userProfile.tier !== 'free' && (
            <div className="text-center mt-4">
              <span className="inline-flex items-center gap-1 bg-mono-primary/10 text-mono-primary text-sm px-4 py-2 rounded-full">
                {userProfile.tier === 'monthly' ? '月卡用户享8折' : '年卡用户享5折'}
              </span>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="font-display text-xl font-bold text-mono-text mb-4">
                选择支付方式
              </h3>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('wechat')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'wechat'
                      ? 'border-mono-primary bg-mono-primary/5'
                      : 'border-mono-border hover:border-mono-primary/50'
                  }`}
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">微</span>
                  </div>
                  <span className="font-medium text-mono-text">微信支付</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('alipay')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'alipay'
                      ? 'border-mono-primary bg-mono-primary/5'
                      : 'border-mono-border hover:border-mono-primary/50'
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">支</span>
                  </div>
                  <span className="font-medium text-mono-text">支付宝</span>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-3 bg-mono-bg text-mono-text rounded-xl font-medium hover:bg-mono-bg/80 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="flex-1 py-3 bg-mono-primary text-white rounded-xl font-medium hover:bg-mono-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      确认支付
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
