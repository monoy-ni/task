import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { sendOtp, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入正确的邮箱地址');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendOtp(email);
      setStep('otp');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || '发送验证码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const otpInput = document.getElementById('otp-input') as HTMLInputElement;
      await signIn(email, otpInput?.value || '');
      navigate('/');
    } catch (err: any) {
      setError(err.message || '验证码错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mono-primary/20 via-white to-mono-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-mono-primary rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">m</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-mono-text">mono</h1>
          <p className="text-mono-text-secondary mt-1">把大目标变成一步步可走的路</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-soft-lg p-8">
          {step === 'email' ? (
            <>
              <h2 className="font-display text-xl font-bold text-mono-text mb-2">
                邮箱登录
              </h2>
              <p className="text-sm text-mono-text-secondary mb-6">
                未注册的邮箱将自动创建账号
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-mono-text mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-mono-bg rounded-xl border border-mono-border focus:border-mono-primary focus:ring-2 focus:ring-mono-primary/20 outline-none transition-all text-mono-text"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={loading || !email}
                  className="w-full bg-mono-primary hover:bg-mono-primary-dark text-white font-medium py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      发送中...
                    </>
                  ) : (
                    '发送验证码'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-mono-text mb-2">
                输入验证码
              </h2>
              <p className="text-sm text-mono-text-secondary mb-6">
                已发送至 {email}
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-mono-text mb-2">
                    验证码
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-mono-bg rounded-xl border border-mono-border focus:border-mono-primary focus:ring-2 focus:ring-mono-primary/20 outline-none transition-all text-mono-text text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg text-center">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full bg-mono-primary hover:bg-mono-primary-dark text-white font-medium py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      验证中...
                    </>
                  ) : (
                    '登录 / 注册'
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setStep('email');
                      setError('');
                    }}
                    className="text-mono-primary text-sm hover:underline"
                  >
                    返回修改邮箱
                  </button>
                </div>

                <div className="text-center">
                  {countdown > 0 ? (
                    <span className="text-mono-text-muted text-sm">
                      重新发送 ({countdown}s)
                    </span>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      className="text-mono-primary text-sm hover:underline"
                    >
                      重新发送验证码
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tips */}
        <p className="text-xs text-center text-mono-text-muted mt-6">
          验证码有效期为5分钟，请在收件箱中查找
        </p>
      </div>
    </div>
  );
};

export default Login;
