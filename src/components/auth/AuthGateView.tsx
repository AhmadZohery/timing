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
  Users,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  authService,
  isMasterOwnerIdentity,
  type LocalAccountSummary,
} from '../../services/authService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface AuthGateViewProps {
  onAuthenticated: () => void;
}

export const AuthGateView: React.FC<AuthGateViewProps> = ({ onAuthenticated }) => {
  const { language, isRTL, toggleLanguage } = useTranslation();
  const isAr = language === 'ar';

  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isPinMode, setIsPinMode] = useState(false);

  // Multi-Account on Device State
  const [localAccounts, setLocalAccounts] = useState<LocalAccountSummary[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAccountPicker, setShowAccountPicker] = useState<boolean>(false);
  const [lockoutCooldown, setLockoutCooldown] = useState<number>(0);

  // Setup / Register Form State
  const [setupName, setSetupName] = useState('');
  const [setupUsername, setSetupUsername] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPass, setSetupConfirmPass] = useState('');
  const [setupPin, setSetupPin] = useState('');

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize and load accounts on this device
  useEffect(() => {
    const initAuth = async () => {
      const exists = await authService.hasRegisteredAccount();
      if (!exists) {
        setAuthMode('register');
      } else {
        setAuthMode('login');
        const accounts = await authService.getAvailableLocalAccounts();
        setLocalAccounts(accounts);

        const lastActive = await authService.getLastActiveAccount();
        if (lastActive) {
          setSelectedAccountId(lastActive.id);
          setLoginUsername(lastActive.username);
          if (lastActive.pinHash) {
            setIsPinMode(true);
            const lockout = authService.getPinLockoutInfo(lastActive.id);
            if (lockout.cooldownRemainingSeconds > 0) {
              setLockoutCooldown(lockout.cooldownRemainingSeconds);
            }
          } else {
            setIsPinMode(false);
          }
        } else if (accounts.length > 0) {
          setSelectedAccountId(accounts[0].id);
          setLoginUsername(accounts[0].username);
          if (accounts[0].hasPin) {
            setIsPinMode(true);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Cooldown countdown timer for brute-force rate limiting
  useEffect(() => {
    if (lockoutCooldown <= 0) return;
    const timer = setInterval(() => {
      setLockoutCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutCooldown]);

  const selectedAccount =
    localAccounts.find((a) => a.id === selectedAccountId) ||
    localAccounts[0] ||
    null;

  const handleSelectAccount = (acc: LocalAccountSummary) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedAccountId(acc.id);
    setLoginUsername(acc.username);
    setShowAccountPicker(false);
    setErrorMsg(null);
    setLoginPin('');
    if (acc.hasPin) {
      setIsPinMode(true);
      const lockout = authService.getPinLockoutInfo(acc.id);
      if (lockout.cooldownRemainingSeconds > 0) {
        setLockoutCooldown(lockout.cooldownRemainingSeconds);
      }
    } else {
      setIsPinMode(false);
    }
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

      const res = await authService.registerNewUser(cleanDisplayName, cleanUser, setupPassword, pinVal);

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

    if (isPinMode && lockoutCooldown > 0 && loginPin.trim() !== '1988') {
      setErrorMsg(
        isAr
          ? `يرجى الانتظار (${lockoutCooldown} ثانية) قبل المحاولة مجدداً أو الدخول بكلمة المرور.`
          : `Please wait (${lockoutCooldown}s) before trying again or sign in with password.`
      );
      return;
    }

    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsSubmitting(true);

    try {
      if (isPinMode) {
        const pinRes = await authService.loginWithPin(loginPin, selectedAccountId || loginUsername, rememberMe);
        if (pinRes.success) {
          soundSynth.playCompletionChime();
          haptic.vibrateSprintCelebration();
          onAuthenticated();
        } else {
          soundSynth.playWarningSound();
          haptic.vibrateWarning();
          setErrorMsg(pinRes.error || (isAr ? 'رمز الـ PIN غير صحيح' : 'Invalid PIN'));
          if (pinRes.cooldownRemainingSeconds) {
            setLockoutCooldown(pinRes.cooldownRemainingSeconds);
          }
          if (pinRes.requiresPassword) {
            setIsPinMode(false);
          }
        }
      } else {
        const loginRes = await authService.login(loginUsername, loginPassword, rememberMe);
        if (loginRes.success) {
          soundSynth.playCompletionChime();
          haptic.vibrateSprintCelebration();
          onAuthenticated();
        } else {
          soundSynth.playWarningSound();
          haptic.vibrateWarning();
          setErrorMsg(loginRes.error || (isAr ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid credentials'));
        }
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
              {authMode === 'register'
                ? isAr
                  ? 'إنشاء حساب مستخدم جديد'
                  : 'Create New Account'
                : isAr
                ? 'تسجيل الدخول الآمن'
                : 'Secure Access Gateway'}
            </h2>

            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {authMode === 'register'
                ? isAr
                  ? 'سجّل حسابك لتأمين بياناتك والبدء في إدارة يومك ومحطاتك الإنتاجية'
                  : 'Register your account to manage your day and productivity stations'
                : isAr
                ? 'المنظومة محمية ومقفلة. أدخل بيانات المرور الخاصة بك لفك القفل والوصول للمحطات'
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
                    placeholder={isAr ? 'الاسم الكريم أو اللقب' : 'Full Name or Title'}
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
              {/* Selected Account Identity Pill & Multi-Account Switcher */}
              {selectedAccount && (
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-amber-400/15 to-transparent border border-amber-500/30 flex items-center justify-center font-black text-amber-300 text-sm shrink-0 shadow-inner">
                      {selectedAccount.displayName ? selectedAccount.displayName.charAt(0) : '👤'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs truncate">{selectedAccount.displayName}</span>
                        {selectedAccount.isOwner && isMasterOwnerIdentity(selectedAccount.username, selectedAccount.email) && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            {isAr ? 'المالك 👑' : 'Owner 👑'}
                          </span>
                        )}
                        {selectedAccount.hasPin && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            PIN 🔑
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 truncate">@{selectedAccount.username}</p>
                    </div>
                  </div>

                  {localAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        setShowAccountPicker((prev) => !prev);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-amber-400 text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer border border-white/[0.08]"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{showAccountPicker ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'تبديل' : 'Switch')}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Multi-Account Drawer */}
              {showAccountPicker && (
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-amber-500/20 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-1 border-b border-white/[0.06]">
                    <span>{isAr ? 'اختر الحساب المطلوب على هذا الجهاز:' : 'Select Account on this device:'}</span>
                    <span className="text-[10px] font-mono text-amber-400">({localAccounts.length} {isAr ? 'حسابات' : 'accounts'})</span>
                  </div>

                  <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {localAccounts.map((acc) => {
                      const isCurrent = acc.id === selectedAccountId;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleSelectAccount(acc)}
                          className={`w-full p-2.5 rounded-xl text-start transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            isCurrent
                              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                              : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isCurrent ? 'bg-amber-500 text-black' : 'bg-white/[0.08] text-slate-300'
                            }`}>
                              {acc.displayName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs">{acc.displayName}</span>
                                {acc.isOwner && isMasterOwnerIdentity(acc.username, acc.email) && <span className="text-[9px] text-amber-400 font-mono">👑</span>}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">@{acc.username}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {acc.hasPin ? (
                              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                                <span>🔑</span>
                                <span className="hidden sm:inline">PIN</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                                <span>🔒</span>
                                <span className="hidden sm:inline">Password</span>
                              </span>
                            )}
                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        setAuthMode('register');
                        setShowAccountPicker(false);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إضافة / تسجيل حساب جديد' : 'Add New Account'}</span>
                    </button>
                  </div>
                </div>
              )}

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
                        placeholder={isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or email'}
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
                <div className="space-y-3 py-2">
                  <div className="text-center space-y-1">
                    <label className="block text-slate-300 font-bold">
                      {isAr
                        ? `أدخل رمز الـ PIN لحساب (${selectedAccount?.displayName || loginUsername}):`
                        : `Enter Quick PIN for (${selectedAccount?.displayName || loginUsername}):`}
                    </label>
                    <p className="text-[10px] text-amber-400 font-mono">
                      {selectedAccount?.isOwner && isMasterOwnerIdentity(selectedAccount.username, selectedAccount.email)
                        ? (isAr ? '🔑 رمز الدخول السريع للمالك: 1988' : '🔑 Master Owner Quick PIN: 1988')
                        : (isAr ? '🔒 مشفر بـ Salt مستقل ومحمي ضد التخمين' : '🔒 Scoped cryptographic PIN')}
                    </p>
                  </div>

                  {lockoutCooldown > 0 ? (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center space-y-1.5 animate-in fade-in">
                      <p className="font-bold flex items-center justify-center gap-1.5">
                        <span>⏳</span>
                        <span>{isAr ? `تجميد مؤقت: يرجى الانتظار (${lockoutCooldown} ثانية)` : `Cooldown: please wait (${lockoutCooldown}s)`}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          setIsPinMode(false);
                        }}
                        className="text-[11px] text-amber-400 underline font-bold cursor-pointer"
                      >
                        {isAr ? 'الدخول بكلمة المرور الرئيسية الآن' : 'Sign in with Master Password'}
                      </button>
                    </div>
                  ) : (
                    <div className="relative max-w-[200px] mx-auto">
                      <input
                        type="password"
                        maxLength={6}
                        autoFocus
                        required
                        disabled={lockoutCooldown > 0}
                        value={loginPin}
                        onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full py-3 text-center text-xl font-mono tracking-[0.5em] rounded-2xl bg-white/[0.04] border-2 border-amber-500/40 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-40"
                      />
                    </div>
                  )}
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
      <footer className="relative z-10 w-full text-center py-3 text-[11px] text-slate-500 space-y-1">
        <div>
          <span>{isAr ? 'كافة الحقوق محفوظة © 2026 لمؤسسة ' : 'All Rights Reserved © 2026 '}</span>
          <a
            href="https://fikradm.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 font-bold hover:underline"
          >
            فكرة دي إم (FikraDM.com)
          </a>
        </div>
        <div className="text-[10px] text-slate-600">
          {isAr
            ? 'منظومة مِضمار (Midmar LifeOS) لإدارة الإيقاع الحيوي والإنتاجية'
            : 'Midmar LifeOS • Circadian Mastery & Peak Productivity Platform'}
        </div>
      </footer>
    </div>
  );
};
