import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { TIER_CONFIGS } from '../lib/supabase';
import { LogOut, User, CreditCard, History, Settings, ArrowRight } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-mono-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-mono-text-secondary mb-4">请先登录</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-mono-primary text-white px-6 py-2 rounded-lg"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  const tierInfo = TIER_CONFIGS[userProfile.tier];
  const remainingDaily = userProfile.tier !== 'free'
    ? Math.max(0, userProfile.daily_quota - userProfile.daily_used)
    : 0;
  const remainingPurchased = Math.max(0, userProfile.total_purchased - userProfile.total_purchased_used);
  const totalRemaining = remainingDaily + remainingPurchased;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-mono-bg py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-bold text-mono-text">个人中心</h1>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 text-mono-text-secondary hover:text-mono-text transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出
          </button>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-mono-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-mono-primary" />
            </div>
            <div className="flex-1">
              <div className="font-display text-lg font-bold text-mono-text">
                {userProfile.email || user.email || '用户'}
              </div>
              <div className="text-sm text-mono-text-secondary">
                {tierInfo.name}
              </div>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-2 bg-mono-primary hover:bg-mono-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              {userProfile.tier === 'free' ? '升级会员' : '续费'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-mono-primary" />
            <h2 className="font-display text-lg font-bold text-mono-text">
              使用情况
            </h2>
          </div>

          {/* Daily Quota (for subscribers) */}
          {userProfile.tier !== 'free' && (
            <div className="mb-6 p-4 bg-mono-primary/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-mono-text">今日额度</span>
                <span className="text-sm font-medium text-mono-primary">
                  {remainingDaily} / {userProfile.daily_quota}
                </span>
              </div>
              <div className="h-2 bg-mono-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-mono-primary rounded-full transition-all"
                  style={{
                    width: `${(userProfile.daily_used / userProfile.daily_quota) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Purchased Quota */}
          <div className="p-4 bg-mono-bg rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-mono-text">购买次数</span>
              <span className="text-sm font-medium text-mono-primary">
                {remainingPurchased} 次
              </span>
            </div>
            <div className="text-xs text-mono-text-muted">
              已使用 {userProfile.total_purchased_used} / 总计 {userProfile.total_purchased}
            </div>
          </div>

          {/* Total Remaining */}
          <div className="mt-4 text-center">
            <span className="text-sm text-mono-text-muted">
              剩余可用次数: <span className="font-bold text-mono-primary">{totalRemaining}</span> 次
            </span>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-mono-primary" />
            <h2 className="font-display text-lg font-bold text-mono-text">
              订阅信息
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-mono-border">
              <span className="text-sm text-mono-text-secondary">当前方案</span>
              <span className="text-sm font-medium text-mono-text">
                {tierInfo.name}
              </span>
            </div>

            {userProfile.tier !== 'free' && userProfile.subscription_expires_at && (
              <div className="flex items-center justify-between py-2 border-b border-mono-border">
                <span className="text-sm text-mono-text-secondary">到期时间</span>
                <span className="text-sm font-medium text-mono-text">
                  {new Date(userProfile.subscription_expires_at).toLocaleDateString('zh-CN')}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-b border-mono-border">
              <span className="text-sm text-mono-text-secondary">购买折扣</span>
              <span className="text-sm font-medium text-mono-primary">
                {userProfile.tier === 'monthly' ? '8折' : userProfile.tier === 'yearly' ? '5折' : '无折扣'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-mono-text-secondary">注册时间</span>
              <span className="text-sm font-medium text-mono-text">
                {new Date(userProfile.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full flex items-center justify-between p-4 hover:bg-mono-bg transition-colors border-b border-mono-border"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-mono-primary" />
              <span className="text-mono-text">购买订阅或次数</span>
            </div>
            <ArrowRight className="w-5 h-5 text-mono-text-muted" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-mono-bg transition-colors border-b border-mono-border">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-mono-primary" />
              <span className="text-mono-text">使用记录</span>
            </div>
            <ArrowRight className="w-5 h-5 text-mono-text-muted" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-mono-bg transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-mono-primary" />
              <span className="text-mono-text">设置</span>
            </div>
            <ArrowRight className="w-5 h-5 text-mono-text-muted" />
          </button>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="font-display text-lg font-bold text-mono-text mb-2">
                确认退出
              </h3>
              <p className="text-mono-text-secondary mb-6">
                退出登录后，你仍然可以在本设备使用已购买的次数。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-mono-bg text-mono-text rounded-xl font-medium hover:bg-mono-bg/80 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-mono-primary text-white rounded-xl font-medium hover:bg-mono-primary-dark transition-all"
                >
                  确认退出
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
