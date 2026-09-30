import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  User,
  CheckCircle2,
  Trash2,
  Lock,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import type { AuthAccount } from '../../types';

interface QuickPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export const QuickPinModal: React.FC<QuickPinModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'pin' | 'profile'>('pin');
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // PIN Form State
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Status & Feedback
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStatusMsg(null);
    setPin('');
    setConfirmPin('');

    const loadData = async () => {
      setLoading(true);
      const acc = await authService.getCurrentAccount();
      setAccount(acc);
      if (acc) {
        setDisplayName(acc.displayName || '');
        setUsername(acc.username || '');
        setEmail(acc.email || '');
      }
      setLoading(false);
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const cleanPin = pin.trim();
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      soundSynth.playWarningSound();
      haptic.vibrateWarning();
      setStatusMsg({
        text: isAr ? 'يجب أن يتكون رمز الـ PIN من 4 إلى 6 أرقام' : 'PIN must be 4 to 6 digits',
        isError: true,
      });
      return;
    }

    if (cleanPin !== confirmPin.trim()) {
      soundSynth.playWarningSound();
      haptic.vibrateWarning();
      setStatusMsg({
        text: isAr ? 'رمز الـ PIN وتأكيده غير متطابقين' : 'PIN and confirmation do not match',
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    try {
      const res = await authService.setPin(cleanPin);
      if (res.success) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        setStatusMsg({
          text: isAr ? 'تم تحديث وحفظ رمز الـ PIN بنجاح! 🔑' : 'Quick PIN updated successfully! 🔑',
          isError: false,
        });
        setPin('');
        setConfirmPin('');
        const updated = await authService.getCurrentAccount();
        setAccount(updated);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        soundSynth.playWarningSound();
        haptic.vibrateWarning();
        setStatusMsg({
          text: res.error || (isAr ? 'فشل حفظ رمز PIN' : 'Failed to update PIN'),
          isError: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePin = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsSubmitting(true);

    try {
      const res = await authService.removePin();
      if (res.success) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        setStatusMsg({
          text: isAr ? 'تم حذف رمز الـ PIN بنجاح. الدخول الآن بكلمة المرور فقط.' : 'PIN removed successfully.',
          isError: false,
        });
        const updated = await authService.getCurrentAccount();
        setAccount(updated);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        soundSynth.playWarningSound();
        haptic.vibrateWarning();
        setStatusMsg({
          text: res.error || (isAr ? 'فشل حذف رمز PIN' : 'Failed to remove PIN'),
          isError: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const cleanName = displayName.trim();
    const cleanUser = username.trim();

    if (!cleanName) {
      soundSynth.playWarningSound();
      haptic.vibrateWarning();
      setStatusMsg({
        text: isAr ? 'يرجى إدخال اسمك الكريم أو لقبك' : 'Please enter your display name',
        isError: true,
      });
      return;
    }

    if (!cleanUser) {
      soundSynth.playWarningSound();
      haptic.vibrateWarning();
      setStatusMsg({
        text: isAr ? 'يرجى إدخال اسم المستخدم لتسجيل الدخول' : 'Please enter a username',
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    try {
      const res = await authService.updateAccountProfile(cleanName, cleanUser, email.trim() || undefined);
      if (res.success) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        setStatusMsg({
          text: isAr ? 'تم تحديث بيانات الحساب والاسم بنجاح! ✨' : 'Profile updated successfully! ✨',
          isError: false,
        });
        const updated = await authService.getCurrentAccount();
        setAccount(updated);
        onProfileUpdated?.();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        soundSynth.playWarningSound();
        haptic.vibrateWarning();
        setStatusMsg({
          text: res.error || (isAr ? 'فشل تحديث البيانات' : 'Failed to update profile'),
          isError: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[#0e1017] border border-amber-500/30 p-6 sm:p-7 shadow-2xl text-slate-100 flex flex-col space-y-5 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                <span>{isAr ? 'إدارة الـ PIN والبيانات الشخصية' : 'Quick PIN & Identity'}</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'تعديل رمز الدخول السريع أو تغيير اسمك واسم المستخدم' : 'Manage your fast numeric PIN and account identity'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Alert Message */}
        {statusMsg && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
              statusMsg.isError
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {statusMsg.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span className="font-bold">{statusMsg.text}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setActiveTab('pin');
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pin'
                ? 'bg-amber-500 text-black font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isAr ? 'رمز PIN السريع' : 'Quick PIN'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setActiveTab('profile');
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-black font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isAr ? 'الاسم والحساب' : 'Profile & Name'}</span>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            <span>{isAr ? 'جاري قراءة البيانات...' : 'Loading account...'}</span>
          </div>
        ) : activeTab === 'pin' ? (
          /* TAB 1: PIN MANAGEMENT */
          <div className="space-y-4">
            {/* Current PIN status pill */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className={`w-4 h-4 ${account?.pinHash ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="text-slate-300">
                  {account?.pinHash
                    ? isAr
                      ? 'رمز PIN سريع مفعل حالياً'
                      : 'Quick PIN is currently active'
                    : isAr
                    ? 'لم يتم تعيين رمز PIN بعد'
                    : 'No PIN set currently'}
                </span>
              </div>
              {account?.pinHash && (
                <button
                  type="button"
                  onClick={handleRemovePin}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isAr ? 'إلغاء الـ PIN' : 'Remove'}</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSavePin} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  {isAr ? 'رمز PIN الجديد (4 إلى 6 أرقام):' : 'New PIN (4-6 digits):'}
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-amber-300 font-mono text-center tracking-[0.5em] text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((p) => !p)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  {isAr ? 'تأكيد رمز PIN الجديد:' : 'Confirm New PIN:'}
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    required
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-amber-300 font-mono text-center tracking-[0.5em] text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || pin.length < 4}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? 'حفظ رمز الـ PIN الجديد' : 'Save New PIN'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* TAB 2: PROFILE & NAME MANAGEMENT */
          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">
                {isAr ? 'الاسم الكريم أو اللقب المعروض:' : 'Display Name:'}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isAr ? 'أدخل اسمك الكريم' : 'Your display name'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">
                {isAr ? 'اسم المستخدم لتسجيل الدخول:' : 'Username:'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">
                {isAr ? 'البريد الإلكتروني (اختياري):' : 'Email (optional):'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتحديث بيانات الحساب' : 'Save Changes'}</span>
            </button>
          </form>
        )}

        {/* Security Note Footer */}
        <div className="pt-2 border-t border-white/[0.06] text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1 font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>{isAr ? 'البيانات تشفر محلياً مع المزامنة التلقائية مع خادمك' : 'Locally encrypted & automatically synced'}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
