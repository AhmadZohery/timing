import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Globe,
  Fingerprint,
  Sparkles,
} from 'lucide-react';
import { authService, isLocalEnvironment, DEFAULT_MASTER_ACCOUNT } from '../../services/authService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface AuthGateViewProps {
  onAuthenticated: () => void;
}

export const AuthGateView: React.FC<AuthGateViewProps> = ({ onAuthenticated }) => {
  const { language, isRTL, toggleLanguage } = useTranslation();
  const isAr = language === 'ar';
  const isLocal = isLocalEnvironment();

  const [isLoading, setIsLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isPinMode, setIsPinMode] = useState(false);

  // Setup / Register Form State
  const [setupName, setSetupName] = useState(DEFAULT_MASTER_ACCOUNT.displayName);
  const [setupUsername, setSetupUsername] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPass, setSetupConfirmPass] = useState('');
  const [setupPin, setSetupPin] = useState('');

  // Login Form State
  const [loginUsername, setLoginUsername] = useState(DEFAULT_MASTER_ACCOUNT.username);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    authService.hasRegisteredAccount().then((exists) => {
      setHasAccount(exists);
      if (!exists) {
        setAuthMode('register');
      } else {
        setAuthMode('login');
      }
      if (exists) {
        authService.getOwnerAccount().then((owner) => {
          if (owner) {
            setLoginUsername(owner.username || DEFAULT_MASTER_ACCOUNT.username);
            if (owner.pinHash) {
              setIsPinMode(true);
            }
          }
        });
      }
      setIsLoading(false);
    });
  }, []);

  const handleLocalBypass = () => {
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    authService.bypassLoginLocalOwner();
    onAuthenticated();
  };

  const handleRegisterOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!setupUsername.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال اسم المستخدم' : 'Please enter a username');
      return;
    }
    if (setupPassword.length < 4) {
      setErrorMsg(isAr ? 'كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل' : 'Password must be at least 4 characters');
      return;
    }
    if (setupPassword !== setupConfirmPass) {
      setErrorMsg(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsSubmitting(true);

    try {
      const cleanDisplayName = setupName.trim() || (isAr ? 'مستخدم جديد' : 'New User');
      const cleanUser = setupUsername.trim();
      const pinVal = setupPin.trim() || undefined;

      const res = !hasAccount
        ? await authService.registerOwner(cleanDisplayName, cleanUser, setupPassword, pinVal)
        : await authService.registerNewUser(cleanDisplayName, cleanUser, setupPassword, pinVal);

      if (res.success) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        onAuthenticated();
      } else {
        soundSynth.playWarningSound();
        haptic.vibrateWarning();
        setErrorMsg(res.error || (isAr ? 'حدث خطأ أثناء إنشاء الحساب' : 'Failed to register account'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsSubmitting(true);

    try {
      let res;
      if (isPinMode) {
        res = await authService.loginWithPin(loginPin, rememberMe);
      } else {
        res = await authService.login(loginUsername, loginPassword, rememberMe);
      }

      if (res.success) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        onAuthenticated();
      } else {
        soundSynth.playWarningSound();
        haptic.vibrateWarning();
        setErrorMsg(res.error || (isAr ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid credentials'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-amber-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-spin">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <span>جاري التحقق من أمان المنظومة...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen w-full bg-gradient-to-br from-[#06070a] via-[#0d0f17] to-[#121524] text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-amber-500/[0.04] dark:bg-amber-500/[0.03] blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-500/[0.03] blur-3xl rounded-full pointer-events-none" />

      {/* Top Bar: Brand and Language Toggle */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20">
            مِ
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>مِضمار</span>
              <span className="text-[10px] font-mono text-amber-400 font-normal px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                LifeOS
              </span>
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            toggleLanguage();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-slate-300 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{isAr ? 'English' : 'عربي'}</span>
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-6">
        <div className="rounded-3xl bg-[#11131e]/90 border border-amber-500/20 shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
          {/* Card Header Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {!hasAccount
                ? isAr
                  ? 'تأسيس حساب المالك الرئيسي'
                  : 'Setup Master Owner Account'
                : isAr
                ? 'تسجيل الدخول الآمن'
                : 'Secure Access Gateway'}
            </h2>

            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {!hasAccount
                ? isAr
                  ? 'قم بتعيين اسم المستخدم وكلمة المرور لتأمين منظومتك بالكامل عند رفعها على الويب'
                  : 'Create your master credentials to safeguard your LifeOS when deployed online'
                : isAr
                ? 'المنظومة محمية ومقفرة. أدخل بيانات المرور الخاصة بك لفك القفل والوصول للمحطات'
                : 'System is encrypted and locked. Enter your credentials to unlock your workspace'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Local Dev Environment One-Click Bypass */}
          {isLocal && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2.5 text-center animate-fade-in shadow-inner">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isAr ? 'البيئة المحلية (Localhost) - مفتوح بدون باسوورد' : 'Localhost Dev Mode - Password Free'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isAr
                  ? 'حسابك "أحمد" مهيأ ومحمي. يمكنك الدخول فوراً بلمسة واحدة بدون باسوورد، أو تجربة تسجيل الدخول.'
                  : 'Your account "Ahmad" is configured. You can enter instantly with one tap without password.'}
              </p>
              <button
                type="button"
                onClick={handleLocalBypass}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-transform active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? '⚡ الدخول الفوري كـ أحمد (مفتوح لوكال)' : '⚡ Instant Access as Ahmad'}</span>
              </button>
            </div>
          )}

          {/* Dual Tabs: Login vs Register */}
          <div className="flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? '🔑 تسجيل الدخول' : '🔑 Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setAuthMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? '✨ إنشاء حساب جديد' : '✨ Sign Up'}
            </button>
          </div>

          {authMode === 'register' ? (
            /* 1. REGISTRATION FORM (Create Account) */
            <form onSubmit={handleRegisterOwner} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  {isAr ? 'الاسم الكريم أو اللقب:' : 'Full Name / Display Name:'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    placeholder={isAr ? 'مثال: أحمد' : 'e.g. Ahmad'}
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  {isAr ? 'اسم المستخدم (لتسجيل الدخول):' : 'Username (for login):'}
                </label>
                <div className="relative">
                  <Fingerprint className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={setupUsername}
                    onChange={(e) => setSetupUsername(e.target.value)}
                    placeholder="user123"
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  {isAr ? 'كلمة المرور:' : 'Password:'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-9 pe-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  {isAr ? 'تأكيد كلمة المرور:' : 'Confirm Password:'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={setupConfirmPass}
                    onChange={(e) => setSetupConfirmPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-slate-400 font-bold flex items-center justify-between">
                  <span>{isAr ? 'رمز PIN رقمي سريع (اختياري 4-6 أرقام):' : 'Quick Numeric PIN (optional 4-6 digits):'}</span>
                  <span className="text-[10px] text-amber-400/80">دخول سريع</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    maxLength={6}
                    value={setupPin}
                    onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <span>{isAr ? 'إنشاء الحساب وتأمين المنظومة' : 'Create Account & Secure'}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setAuthMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-amber-400/90 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  {isAr ? 'لديك حساب بالفعل؟ سجل دخولك الآن' : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          ) : (
            /* 2. LOGIN FORM (Returning User) */
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {/* Toggle Mode: Password vs PIN */}
              <div className="flex items-center justify-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setIsPinMode(false);
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isPinMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
                  }`}
                >
                  {isAr ? 'كلمة المرور' : 'Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setIsPinMode(true);
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isPinMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
                  }`}
                >
                  {isAr ? 'رمز الـ PIN السريع' : 'Quick PIN'}
                </button>
              </div>

              {!isPinMode ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-slate-300 font-bold">
                      {isAr ? 'اسم المستخدم أو البريد الإلكتروني:' : 'Username or Email:'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder={isAr ? 'مثال: Ahmad أو البريد' : 'e.g. Ahmad or email'}
                        className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-300 font-bold">
                      {isAr ? 'كلمة المرور:' : 'Password:'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full ps-9 pe-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2 py-2">
                  <label className="block text-slate-300 font-bold text-center">
                    {isAr ? 'أدخل رمز الـ PIN السريع (4-6 أرقام):' : 'Enter Quick Numeric PIN:'}
                  </label>
                  <div className="relative max-w-[200px] mx-auto">
                    <input
                      type="password"
                      maxLength={6}
                      autoFocus
                      required
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full py-3 text-center text-xl font-mono tracking-[0.5em] rounded-2xl bg-white/[0.04] border-2 border-amber-500/40 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* Remember me toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-white/[0.05] text-amber-500 focus:ring-amber-500/50"
                  />
                  <span>{isAr ? 'تذكر تسجيل دخولي على هذا الجهاز' : 'Remember me on this device'}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <span>{isAr ? 'دخول آمن وفك القفل' : 'Unlock Workspace'}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setAuthMode('register');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-amber-400/90 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  {isAr ? 'ليس لديك حساب؟ أنشئ حساباً جديداً الآن بضغطة زر' : "Don't have an account? Sign up now"}
                </button>
              </div>
            </form>
          )}

          {/* Security badge footer */}
          <div className="pt-3 border-t border-white/[0.06] text-center">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {isAr
                  ? 'تشفير محلي صارم SHA-256 لا ينقل أي كلمة سر لأي خادم خارجي'
                  : 'Zero-knowledge SHA-256 local cryptographic hashing'}
              </span>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-2 text-[11px] text-slate-500">
        مِضمار (Midmar LifeOS) • نظام تشغيل وإدارة الحياة المتكامل 2026
      </footer>
    </div>
  );
};
