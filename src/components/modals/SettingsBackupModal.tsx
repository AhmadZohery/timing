import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Settings,
  Download,
  Upload,
  Volume2,
  Vibrate,
  ShieldCheck,
  QrCode,
  Moon,
  Clock,
  BellRing,
  Bot,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Calendar,
  BookOpen,
  AlertCircle,
  Lock,
  KeyRound,
} from 'lucide-react';
import QRCode from 'qrcode';
import type { UserState, AppSettings, WeekendPreset, DayWorkRhythm } from '../../types';
import { db } from '../../db/db';
import { exportDatabaseToJson, downloadBackupFile, importDatabaseFromJson } from '../../utils/backup';
import { authService } from '../../services/authService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { notificationService } from '../../services/notificationService';
import { accountabilityNotificationManager } from '../../services/accountabilityNotificationManager';
import { useTranslation } from '../../i18n/LanguageContext';
import { aiCoach } from '../../services/aiCoachService';
import {
  WEEKEND_PRESETS_INFO,
  WEEKEND_PRESET_MAPS,
  DEFAULT_WORK_RHYTHM_CONFIG,
  DAYS_AR,
} from '../../utils/workRhythm';

interface SettingsBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState | undefined;
}

export const SettingsBackupModal: React.FC<SettingsBackupModalProps> = ({
  isOpen,
  onClose,
  userState,
}) => {
  const { t, isRTL, language } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showQrSync, setShowQrSync] = useState(false);
  const [pasteSyncText, setPasteSyncText] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Security & Authentication state
  const session = authService.getSession();
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [autoLockMin, setAutoLockMin] = useState<number>(() => authService.getAutoLockMinutes());
  const [securityStatus, setSecurityStatus] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const res = await authService.changePassword(currPassword, newPassword);
    if (res.success) {
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      setSecurityStatus(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح ✔' : 'Password changed ✔');
      setCurrPassword('');
      setNewPassword('');
    } else {
      soundSynth.playWarningSound();
      haptic.vibrateWarning();
      setSecurityStatus(res.error || (language === 'ar' ? 'فشل التغيير' : 'Failed'));
    }
    setTimeout(() => setSecurityStatus(null), 3500);
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const res = await authService.setPin(newPin);
    if (res.success) {
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      setSecurityStatus(language === 'ar' ? 'تم تعيين رمز الـ PIN السريع بنجاح ✔' : 'Quick PIN updated ✔');
      setNewPin('');
    } else {
      soundSynth.playWarningSound();
      haptic.vibrateWarning();
      setSecurityStatus(res.error || (language === 'ar' ? 'فشل الحفظ' : 'Failed'));
    }
    setTimeout(() => setSecurityStatus(null), 3500);
  };

  const handleChangeAutoLock = (min: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setAutoLockMin(min);
    authService.setAutoLockMinutes(min);
  };

  // AI Coach API state
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'custom'>('gemini');
  const [aiModel, setAiModel] = useState('gemini-2.0-flash');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load AI config
  useEffect(() => {
    aiCoach.getConfig().then((cfg) => {
      if (cfg) {
        setAiApiKey(cfg.apiKey || '');
        setAiProvider(cfg.provider || 'gemini');
        setAiModel(cfg.model || 'gemini-2.0-flash');
        setAiEnabled(cfg.enabled ?? true);
      }
    });
  }, []);

  const handleSaveAi = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    await aiCoach.saveConfig({
      provider: aiProvider,
      apiKey: aiApiKey.trim(),
      model: aiModel,
      enabled: aiEnabled,
    });
    setAiTestResult({
      success: true,
      message: language === 'ar' ? 'تم حفظ إعدادات الـ API بنجاح ✔' : 'AI configuration saved ✔',
    });
    setTimeout(() => setAiTestResult(null), 3500);
  };

  const handleTestAi = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await aiCoach.testConnection({
        provider: aiProvider,
        apiKey: aiApiKey.trim(),
        model: aiModel,
        enabled: aiEnabled,
      });
      setAiTestResult(res);
      if (res.success) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        await aiCoach.saveConfig({
          provider: aiProvider,
          apiKey: aiApiKey.trim(),
          model: aiModel,
          enabled: aiEnabled,
        });
      }
    } finally {
      setIsTestingAi(false);
    }
  };

  // Generate QR Code when QR sync is opened
  useEffect(() => {
    if (showQrSync && qrCanvasRef.current) {
      exportDatabaseToJson().then((jsonStr) => {
        if (qrCanvasRef.current) {
          QRCode.toCanvas(qrCanvasRef.current, jsonStr, {
            width: 220,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          }).catch((err) => {
            console.warn('QR code generation warning:', err);
          });
        }
      });
    }
  }, [showQrSync]);

  if (!isOpen) return null;

  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    if (!userState) return;
    soundSynth.playTactileClick();

    const updatedSettings = { ...userState.settings, ...partial };
    await db.user_state.update(userState.id, { settings: updatedSettings });
  };

  const handleExportBackup = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const jsonStr = await exportDatabaseToJson();
    downloadBackupFile(jsonStr);
  };

  const handleExportMarkdown = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const logs = await db.daily_logs.toArray();
    const goals = await db.goals.toArray();
    const quran = await db.quran_progress.toArray();
    const book = await db.book_progress.toArray();

    let md = `# Midmar LifeOS - Markdown Archives & Daily Logs\n`;
    md += `Export Date: ${new Date().toISOString()}\n\n`;
    md += `## 🌟 Habit & Operating Statistics\n`;
    md += `- Current Streak: ${userState?.streakDays || 0} days\n`;
    md += `- Total Points: ${userState?.totalPoints || 0} XP\n`;
    md += `- Streak Shields: ${userState?.streakShields || 0}\n`;
    md += `- Resilience Badges (MVD): ${userState?.resilienceBadges || 0}\n\n`;

    md += `## 📖 Reading & Spiritual Focus\n`;
    if (quran[0]) {
      md += `### ${quran[0].surah}\n- Page: ${quran[0].currentPage} / ${quran[0].totalPages}\n`;
    }
    if (book[0]) {
      md += `### ${book[0].title}\n- Page: ${book[0].currentPage} / ${book[0].totalPages}\n`;
    }
    md += `\n## 🎯 Macro Goals Velocity\n`;
    goals.forEach((g) => {
      md += `- **${g.title}** (${g.category}): ${g.currentValue} / ${g.targetValue} ${g.unit}\n`;
    });

    md += `\n## 📝 Daily Retrospectives\n`;
    logs.forEach((log) => {
      md += `### Date: ${log.date}\n`;
      md += `- Completed Stations: ${log.completedStations.join(', ')}\n`;
      if (log.voiceNotes) md += `- **Voice Reflection**: ${log.voiceNotes}\n`;
      if (log.goldenNugget) md += `- **Golden Nugget**: ${log.goldenNugget}\n`;
      if (log.tomorrowAnchor) md += `- **Tomorrow Anchor**: ${log.tomorrowAnchor}\n`;
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `midmar-lifeos-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importDatabaseFromJson(text);
      if (success) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        setImportStatus(language === 'ar' ? 'تم استيراد البيانات بنجاح! جاري التحديث...' : 'Imported successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportStatus(language === 'ar' ? 'فشل في قراءة ملف النسخ الاحتياطي.' : 'Failed to read backup file.');
      }
    } catch (_err) {
      setImportStatus(language === 'ar' ? 'حدث خطأ أثناء تحميل الملف.' : 'Error loading backup file.');
    }
  };

  const handleApplyPasteSync = async () => {
    if (!pasteSyncText.trim()) return;
    soundSynth.playTactileClick();

    const success = await importDatabaseFromJson(pasteSyncText.trim());
    if (success) {
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      setImportStatus(language === 'ar' ? 'تمت المزامنة بنجاح! جاري التحديث...' : 'Sync applied! Reloading...');
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setImportStatus(language === 'ar' ? 'النص البرمجي للمزامنة غير صالح.' : 'Invalid sync payload.');
    }
  };

  const handleTestActionableNotification = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const granted = await notificationService.requestPermission();
    if (granted) {
      setNotificationMsg(t('notification_permission_granted'));
      await notificationService.showStationAlert(
        language === 'ar' ? 'مِضمار | تنبيه جلسة التعلم والتركيز' : 'Midmar | Learning Session Alert',
        language === 'ar' ? 'حان موعد الـ 20 دقيقة المخصصة للدراسة المعمارية!' : 'Your 20-minute deep work session is ready!',
        'WORK_START'
      );
    } else {
      setNotificationMsg(t('notification_permission_denied'));
    }

    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleTestAccountability = async (type: 'prayer' | 'wird' | 'checkin') => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const success = await accountabilityNotificationManager.testNotification(type);
    if (success) {
      setNotificationMsg(
        type === 'prayer'
          ? (language === 'ar' ? 'تم إرسال تجربة إشعار استدراك الصلاة بنجاح 🕌' : 'Late prayer alert sent 🕌')
          : type === 'wird'
          ? (language === 'ar' ? 'تم إرسال تجربة تذكير ورد سورة البقرة بنجاح 📖' : 'Late Quran wird alert sent 📖')
          : (language === 'ar' ? 'تم إرسال تجربة تذكير إغلاق اليوم بنجاح 🌙' : 'Daily review alert sent 🌙')
      );
    } else {
      setNotificationMsg(t('notification_permission_denied'));
    }

    setTimeout(() => setNotificationMsg(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in transition-colors duration-200">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              {t('settings_modal_title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{t('settings_modal_sub')}</p>
          </div>
        </div>

        {/* Behavioral & Hardware Controls */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-2xs">
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-300">{t('settings_haptics_title')}</h4>

          {/* Fajr Grace Period Toggle */}
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('fajr_grace_label')}</span>
            </span>
            <input
              type="checkbox"
              checked={userState?.settings?.fajrGracePeriodActive ?? true}
              onChange={(e) => handleUpdateSettings({ fajrGracePeriodActive: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* OLED Burn-in Protection Toggle */}
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
            <span className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{t('oled_protect_label')}</span>
            </span>
            <input
              type="checkbox"
              checked={userState?.settings?.oledBurnInProtect ?? true}
              onChange={(e) => handleUpdateSettings({ oledBurnInProtect: e.target.checked })}
              className="w-4 h-4 accent-cyan-600 cursor-pointer"
            />
          </div>

          {/* Sound & Haptics */}
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
            <span className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t('sound_fx_label')}</span>
            </span>
            <input
              type="checkbox"
              checked={userState?.settings?.soundEnabled ?? true}
              onChange={(e) => handleUpdateSettings({ soundEnabled: e.target.checked })}
              className="w-4 h-4 accent-amber-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
            <span className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{t('smartwatch_vibrate_label')}</span>
            </span>
            <input
              type="checkbox"
              checked={userState?.settings?.vibrationEnabled ?? true}
              onChange={(e) => handleUpdateSettings({ vibrationEnabled: e.target.checked })}
              className="w-4 h-4 accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Work Rhythm & Weekend Settings ("نظام أيام العمل والعطلات الأسبوعية") */}
        {(() => {
          const currentRhythmConfig = userState?.settings?.workRhythmConfig || DEFAULT_WORK_RHYTHM_CONFIG;
          const currentPreset: WeekendPreset = currentRhythmConfig.preset || 'friday_saturday';
          const currentDayTypes: Record<number, DayWorkRhythm> =
            currentRhythmConfig.dayTypes || WEEKEND_PRESET_MAPS[currentPreset] || WEEKEND_PRESET_MAPS.friday_saturday;

          return (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {language === 'ar' ? 'نظام أيام العمل والعطلات الأسبوعية' : 'Work Schedule & Weekends'}
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {WEEKEND_PRESETS_INFO.find((p) => p.id === currentPreset)?.badge || 'مخصص'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                {language === 'ar'
                  ? 'اختر النظام المناسب لنمط حياتك، أو انقر على أي يوم لتخصيصه بنفسك لحماية شعلتك وراحتك دون ضغط:'
                  : 'Choose your weekly rhythm or click on any day to customize your schedule and protect your streak:'}
              </p>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WEEKEND_PRESETS_INFO.map((p) => {
                  const isSelected = currentPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        const nextDayTypes = p.id !== 'custom' ? { ...WEEKEND_PRESET_MAPS[p.id] } : currentDayTypes;
                        handleUpdateSettings({
                          workRhythmConfig: {
                            ...currentRhythmConfig,
                            preset: p.id,
                            dayTypes: nextDayTypes,
                            saturdayType: nextDayTypes[6] === 'half_day' ? 'half_day' : nextDayTypes[6] === 'rest_day' ? 'off' : 'full_day',
                            sundayType: nextDayTypes[0] === 'rest_day' ? 'rest_day' : nextDayTypes[0] === 'half_day' ? 'half_day' : 'full_day',
                          },
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500 font-bold'
                          : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate">{p.titleAr}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5 line-clamp-1">
                        {p.descAr}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive 7-Day Matrix */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-zinc-800">
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block">
                  {language === 'ar' ? 'تخصيص أيام الأسبوع (انقر لتبديل حالة أي يوم):' : 'Customize Days (tap to cycle):'}
                </span>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                    const dayType = currentDayTypes[dayIdx] || 'full_day';
                    const isRest = dayType === 'rest_day';
                    const isHalf = dayType === 'half_day';
                    const isFri = dayType === 'friday_special';

                    return (
                      <button
                        key={dayIdx}
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          const next: DayWorkRhythm =
                            dayType === 'full_day' ? 'half_day' : dayType === 'half_day' ? 'rest_day' : 'full_day';
                          const updatedDayTypes = {
                            ...currentDayTypes,
                            [dayIdx]: next,
                          };
                          handleUpdateSettings({
                            workRhythmConfig: {
                              ...currentRhythmConfig,
                              preset: 'custom',
                              dayTypes: updatedDayTypes,
                              saturdayType: updatedDayTypes[6] === 'half_day' ? 'half_day' : updatedDayTypes[6] === 'rest_day' ? 'off' : 'full_day',
                              sundayType: updatedDayTypes[0] === 'rest_day' ? 'rest_day' : updatedDayTypes[0] === 'half_day' ? 'half_day' : 'full_day',
                            },
                          });
                        }}
                        className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer text-xs select-none active:scale-95 ${
                          isRest
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                            : isHalf
                            ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold'
                            : isFri
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold'
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}
                        title="انقر للتبديل بين (عمل كامل / نصف يوم / عطلة)"
                      >
                        <span className="text-[10px] font-bold">{DAYS_AR[dayIdx]}</span>
                        <span className="text-[9px] font-mono leading-none">
                          {isRest ? '🌴 عطلة' : isHalf ? '⚡ نصف' : isFri ? '🕌 سنن' : '🎯 عمل'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Smart Late Accountability Reminders Card ("تنبيهات الاستدراك الذكية عند التأخر") */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  {language === 'ar' ? 'تنبيهات الاستدراك الذكية عند التأخر' : 'Smart Late Catch-Up Reminders'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {language === 'ar'
                    ? 'تنبيه لطيف غير مزعج لمساعدتك على استدراك الصلوات، ورد سورة البقرة، ومراجعة اليوم'
                    : 'Gentle proactive alerts if you fall behind on prayers, Surah Al-Baqarah, or day review'}
                </p>
              </div>
            </div>

            {/* Master Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userState?.settings?.accountabilityNotificationsEnabled ?? true}
                onChange={(e) =>
                  handleUpdateSettings({ accountabilityNotificationsEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Sub-toggles (shown if master enabled) */}
          {(userState?.settings?.accountabilityNotificationsEnabled ?? true) && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-zinc-800 animate-fade-in">
              {/* Late Prayer Toggle */}
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {language === 'ar'
                      ? 'تذكير استدراك الصلاة المتأخرة (إذا مضت 45 دقيقة أو دخلت الصلاة التالية)'
                      : 'Remind me if a prayer is overdue / unrecorded'}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={userState?.settings?.latePrayerReminderEnabled ?? true}
                  onChange={(e) =>
                    handleUpdateSettings({ latePrayerReminderEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Late Quran Wird Toggle */}
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    {language === 'ar'
                      ? 'تذكير ورد سورة البقرة المباركة (إذا انتصف النهار أو أقبل المساء دون إتمام)'
                      : 'Remind me of daily Surah Al-Baqarah wird at midday & evening'}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={userState?.settings?.lateWirdReminderEnabled ?? true}
                  onChange={(e) =>
                    handleUpdateSettings({ lateWirdReminderEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Late Check-in Toggle */}
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    {language === 'ar'
                      ? 'تذكير تفقد حصاد اليوم وإغلاق المحطات (مساءً عند 21:30)'
                      : 'Remind me for evening retrospective & day check-in'}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={userState?.settings?.lateCheckinReminderEnabled ?? true}
                  onChange={(e) =>
                    handleUpdateSettings({ lateCheckinReminderEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Interactive Test Triggers */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">
                  {language === 'ar' ? 'اختبار الإشعارات فوراً على جهازك:' : 'Instant test on your device:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTestAccountability('prayer')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? '🕌 تجربة صلاة متأخرة' : '🕌 Test Late Prayer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestAccountability('wird')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? '📖 تجربة ورد البقرة' : '📖 Test Baqarah Wird'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestAccountability('checkin')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 text-[11px] font-bold text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? '🌙 تجربة إغلاق اليوم' : '🌙 Test Day Check-in'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actionable Notifications Testing */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-xs">
              <BellRing className="w-4 h-4" />
              <span>{t('test_notification_btn')}</span>
            </div>
            <button
              onClick={handleTestActionableNotification}
              className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              {language === 'ar' ? 'إرسال إشعار فوري' : 'Send Test Alert'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
            {t('test_notification_desc')}
          </p>
          {notificationMsg && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold animate-fade-in">
              {notificationMsg}
            </p>
          )}
        </div>

        {/* Local QR Code Zero-Cloud Sync */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <QrCode className="w-4 h-4" />
              <span>{t('qr_sync_title')}</span>
            </div>
            <button
              onClick={() => setShowQrSync(!showQrSync)}
              className="text-[11px] text-emerald-700 dark:text-emerald-400 underline cursor-pointer font-bold"
            >
              {showQrSync ? t('hide_qr') : t('generate_qr')}
            </button>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
            {t('qr_sync_desc')}
          </p>

          {showQrSync && (
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl space-y-2 border border-slate-200 shadow-sm">
              <canvas ref={qrCanvasRef} className="max-w-[200px]" />
              <span className="text-[10px] text-slate-700 font-mono font-bold">
                {t('scan_qr_hint')}
              </span>
            </div>
          )}

          {/* Paste Raw Sync Code */}
          <div className="space-y-1 pt-1">
            <textarea
              rows={2}
              placeholder={language === 'ar' ? 'أو الصق كود المزامنة السريعة هنا...' : 'Or paste raw sync payload here...'}
              value={pasteSyncText}
              onChange={(e) => setPasteSyncText(e.target.value)}
              className="w-full p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-800 dark:text-zinc-200 font-mono resize-none focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
            {pasteSyncText && (
              <button
                onClick={handleApplyPasteSync}
                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                {t('paste_sync_btn')}
              </button>
            )}
          </div>
        </div>

        {/* AI Behavioral Coach API Key Configuration Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-300 font-bold text-xs">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isRTL ? 'إعدادات المرشد الذكي (AI Coach API)' : 'AI Behavioral Coach API'}</span>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer">
              <span>{isRTL ? 'تفعيل' : 'Enabled'}</span>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </label>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            {isRTL
              ? 'اربط مفتاح Google Gemini API المجاني تماماً لتمكين المرشد الذكي من فهم سياقك وتفكيك مهامك الصعبة. يُحفظ المفتاح محلياً في جهازك فقط دون أي خوادم خارجية.'
              : 'Connect free Google Gemini API to empower the coach. Stored 100% locally on your device.'}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder={isRTL ? 'أدخل مفتاح Gemini API هنا (AIzaSy...)' : 'Enter Gemini API key...'}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                className="flex-1 py-2 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={handleTestAi}
                disabled={!aiApiKey.trim() || isTestingAi}
                className="py-2 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isTestingAi ? (isRTL ? 'جاري الفحص...' : 'Testing...') : (isRTL ? 'فحص وحفظ ⚡' : 'Test & Save ⚡')}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{isRTL ? 'احصل على مفتاح Gemini مجاناً بدون بطاقة بنكية' : 'Get free Gemini API Key (No credit card)'}</span>
              </a>

              {aiApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setAiApiKey('');
                    handleSaveAi();
                  }}
                  className="text-slate-400 hover:text-rose-500 text-[10px] cursor-pointer"
                >
                  {isRTL ? 'مسح المفتاح' : 'Clear Key'}
                </button>
              )}
            </div>

            {aiTestResult && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  aiTestResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{aiTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Security & Authentication Management */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-300 font-bold text-xs">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>{language === 'ar' ? 'الأمان وحساب تسجيل الدخول' : 'Security & Access Credentials'}</span>
            </div>
            {session && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                @{session.username} ({session.displayName})
              </span>
            )}
          </div>

          {securityStatus && (
            <div className="p-2.5 rounded-lg text-xs bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300">
              {securityStatus}
            </div>
          )}

          {/* 1. Change Password Form */}
          <form onSubmit={handleChangePassword} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5 text-xs">
            <span className="font-bold text-slate-700 dark:text-zinc-200 block">
              {language === 'ar' ? 'تغيير كلمة المرور الرئيسية:' : 'Change Master Password:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="password"
                required
                value={currPassword}
                onChange={(e) => setCurrPassword(e.target.value)}
                placeholder={language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
              />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-[11px] cursor-pointer"
            >
              {language === 'ar' ? 'حفظ كلمة المرور الجديدة' : 'Save New Password'}
            </button>
          </form>

          {/* 2. Quick PIN & Auto-Lock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* PIN Setup */}
            <form onSubmit={handleUpdatePin} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-200">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'ar' ? 'رمز الـ PIN السريع (4-6 أرقام):' : 'Quick Numeric PIN:'}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="submit"
                  disabled={!newPin || newPin.length < 4}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-bold disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>

            {/* Auto Lock Timer */}
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-200">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === 'ar' ? 'القفل التلقائي عند الخمول:' : 'Auto-Lock Inactivity:'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: language === 'ar' ? 'معطل' : 'Off', value: 0 },
                  { label: '15د', value: 15 },
                  { label: '30د', value: 30 },
                  { label: '60د', value: 60 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChangeAutoLock(opt.value)}
                    className={`py-1.5 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                      autoLockMin === opt.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* JSON Backup & Restore Box (100% Free / Zero Cloud) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-300 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('json_backup_title')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleExportBackup}
              className="py-2.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>{t('export_json')}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Upload className="w-4 h-4" />
              <span>{t('import_json')}</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          {importStatus && (
            <p className="text-xs text-amber-700 dark:text-amber-300 text-center font-medium">{importStatus}</p>
          )}
        </div>

        {/* Obsidian / Markdown Export Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-300 font-bold text-xs">
              <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{t('markdown_export_title')}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            {t('markdown_export_desc')}
          </p>
          <button
            onClick={handleExportMarkdown}
            className="w-full py-2.5 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>{t('export_markdown')} (.md)</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs transition-all cursor-pointer shadow-2xs"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};
