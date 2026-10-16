import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Bell,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Droplets,
  Pill,
  Phone,
  BookOpen,
  Footprints,
  Eye,
  Coffee,
  HeartPulse,
  Mic,
  MicOff,
  Zap,
  Volume2,
  Play,
  Pause,
  ShieldCheck,
  Radio,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { CustomReminderItem, ReminderRecurrence, ReminderCategory } from '../../types';
import { autonomousNotificationScheduler } from '../../services/autonomousNotificationScheduler';
import {
  calculatePrayerTimes,
  detectDefaultCityFromTimezone,
  MUADHIN_OPTIONS,
  formatPrayerTime,
} from '../../utils/prayerCalculator';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { speechService } from '../../services/speechService';
import { localIntelligence, type LocalReminderNLPResult } from '../../services/localIntelligenceEngine';
import { formatLocalDate } from '../../utils/gamification';

interface QuickReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
}

type NotificationHubTab = 'alarms' | 'schedule' | 'sounds';

const PRESET_SUGGESTIONS = [
  {
    title: 'شرب كوب ماء وترطيب الجسم',
    icon: Droplets,
    category: 'health' as ReminderCategory,
    defaultMins: 30,
    bgClass: 'bg-[#e0f2fe] dark:bg-sky-950/50 border-sky-300/70 dark:border-sky-700/40 text-sky-950 dark:text-sky-200',
  },
  {
    title: 'أخذ الفيتامينات / الدواء',
    icon: Pill,
    category: 'health' as ReminderCategory,
    defaultMins: 60,
    bgClass: 'bg-[#fce2e6] dark:bg-rose-950/50 border-rose-300/70 dark:border-rose-700/40 text-rose-950 dark:text-rose-200',
  },
  {
    title: 'مكالمة هامة / متابعة سريعة',
    icon: Phone,
    category: 'work' as ReminderCategory,
    defaultMins: 15,
    bgClass: 'bg-[#fde6d8] dark:bg-amber-950/50 border-amber-300/70 dark:border-amber-700/40 text-amber-950 dark:text-amber-200',
  },
  {
    title: 'استراحة مشي وحركة 10 دقائق',
    icon: Footprints,
    category: 'fitness' as ReminderCategory,
    defaultMins: 45,
    bgClass: 'bg-[#d4f5dc] dark:bg-emerald-950/50 border-emerald-300/70 dark:border-emerald-700/40 text-emerald-950 dark:text-emerald-200',
  },
  {
    title: 'إراحة العينين وإطالة العضلات',
    icon: Eye,
    category: 'health' as ReminderCategory,
    defaultMins: 20,
    bgClass: 'bg-[#e2defc] dark:bg-indigo-950/50 border-indigo-300/70 dark:border-indigo-700/40 text-indigo-950 dark:text-indigo-200',
  },
  {
    title: 'جلسة قراءة وورد تطويري',
    icon: BookOpen,
    category: 'learning' as ReminderCategory,
    defaultMins: 60,
    bgClass: 'bg-[#d4f5dc] dark:bg-emerald-950/50 border-emerald-300/70 dark:border-emerald-700/40 text-emerald-950 dark:text-emerald-200',
  },
  {
    title: 'استراحة قهوة وصفاء ذهني',
    icon: Coffee,
    category: 'custom' as ReminderCategory,
    defaultMins: 30,
    bgClass: 'bg-[#fde6d8] dark:bg-amber-950/50 border-amber-300/70 dark:border-amber-700/40 text-amber-950 dark:text-amber-200',
  },
  {
    title: 'استراحة تنفس وسكينة',
    icon: HeartPulse,
    category: 'spiritual' as ReminderCategory,
    defaultMins: 15,
    bgClass: 'bg-[#e2defc] dark:bg-indigo-950/50 border-indigo-300/70 dark:border-indigo-700/40 text-indigo-950 dark:text-indigo-200',
  },
];

export const QuickReminderModal: React.FC<QuickReminderModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const reminders = useLiveQuery(() => db.custom_reminders.toArray(), []) || [];
  const userState = useLiveQuery(() => db.user_state.get('current_user'), []);

  const [activeTab, setActiveTab] = useState<NotificationHubTab>('alarms');
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const [title, setTitle] = useState('');
  const [time, setTime] = useState(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>('once');
  const [category, setCategory] = useState<ReminderCategory>('custom');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Natural Language & Voice NLP state (0 Tokens)
  const [naturalText, setNaturalText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [nlpPreview, setNlpPreview] = useState<LocalReminderNLPResult | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [testPushStatus, setTestPushStatus] = useState<string | null>(null);
  const [isTestingLockscreen, setIsTestingLockscreen] = useState(false);

  // Audio Preview state for Tab 3 (Sounds)
  const [playingMuadhinId, setPlayingMuadhinId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPerm(Notification.permission);
    }
    return () => {
      speechService.stopListening();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, [isOpen]);

  const handleRequestBrowserPermission = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const perm = await autonomousNotificationScheduler.requestPermission();
    setNotifPerm(perm);
    if (perm === 'granted') {
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      onRewardToast?.(
        isAr
          ? '🔔 تم تفعيل إشعارات النظام بنجاح! ستصلك تنبيهات الصلاة والمنبهات في موعدها.'
          : '🔔 System notifications enabled!'
      );
    }
  };

  const handleSendInstantNotification = async (e: React.MouseEvent) => {
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    try {
      confetti({
        particleCount: 28,
        spread: 65,
        origin: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        },
        colors: ['#1eb814', '#ff5500', '#7c3aed', '#f59e0b'],
        disableForReducedMotion: true,
      });
    } catch {}

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        const perm = await autonomousNotificationScheduler.requestPermission();
        setNotifPerm(perm);
        if (perm !== 'granted') {
          setTestPushStatus(
            isAr
              ? '⚠️ يرجى السماح بالإشعارات من المتصفح أولاً لتصلك التنبيهات.'
              : '⚠️ Please allow browser notifications first.'
          );
          return;
        }
      }

      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.showNotification(
              isAr ? 'مِضمار LifeOS — التنبيهات تعمل بنجاح 🔔' : 'Midmar LifeOS — Notifications Active 🔔',
              {
                body: isAr
                  ? 'هذا إشعار فوري يؤكد جاهزية منبهات الصلاة والأذكار والمهام على جهازك.'
                  : 'Instant verification alert: Prayer & task alarms are active.',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                tag: 'midmar-instant-test',
              }
            );
          } else {
            new Notification(
              isAr ? 'مِضمار LifeOS — التنبيهات تعمل بنجاح 🔔' : 'Midmar LifeOS — Notifications Active 🔔',
              {
                body: isAr
                  ? 'هذا إشعار فوري يؤكد جاهزية منبهات الصلاة والأذكار والمهام على جهازك.'
                  : 'Instant verification alert: Prayer & task alarms are active.',
              }
            );
          }
        }
      } catch {}
    }

    setTestPushStatus(
      isAr
        ? '✅ تم إرسال الإشعار الفوري بنجاح وتشغيل نغمة التنبيه!'
        : '✅ Instant notification sent successfully!'
    );
    setTimeout(() => setTestPushStatus(null), 5000);
  };

  const handleTestLockscreen = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsTestingLockscreen(true);
    setTestPushStatus(
      isAr
        ? '⏳ تم إطلاق أمر التنبيه.. اقفل شاشة هاتفك الآن لتتأكد من وصوله والتطبيق مغلق (خلال 5 ثوانٍ)'
        : 'Test alert sent! Lock your phone now (fires in 5s)...'
    );
    try {
      const res = await autonomousNotificationScheduler.testLockscreenAlarm(5);
      if (!res.success) {
        setTestPushStatus(res.message);
      } else {
        setNotifPerm('granted');
      }
    } finally {
      setIsTestingLockscreen(false);
      setTimeout(() => setTestPushStatus(null), 8000);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      return;
    }

    if (!speechService.isSupported()) {
      setVoiceError(isAr ? 'المتصفح لا يدعم التسجيل الصوتي المباشر' : 'Voice recognition not supported');
      setTimeout(() => setVoiceError(null), 3500);
      return;
    }

    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsListening(true);
    setVoiceError(null);

    speechService.startListening(
      (transcript, isFinal) => {
        setNaturalText(transcript);
        if (transcript.trim().length > 3) {
          const res = localIntelligence.parseReminderIntent(transcript);
          setNlpPreview(res);
          if (isFinal) {
            setTitle(res.title);
            setTime(res.time);
            setCategory(res.category);
            setRecurrence(res.recurrence);
            soundSynth.playCompletionChime();
            haptic.vibrateSprintCelebration();
          }
        }
      },
      (err) => {
        setVoiceError(err);
        setIsListening(false);
        setTimeout(() => setVoiceError(null), 3500);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  // Compute live upcoming scheduled alerts for Tab 2
  const upcomingScheduleFeed = useMemo(() => {
    const defaultCity = detectDefaultCityFromTimezone();
    const loc = userState?.settings?.prayerLocation;
    const lat = loc?.latitude ?? defaultCity.lat;
    const lng = loc?.longitude ?? defaultCity.lng;
    const method = loc?.calculationMethod ?? defaultCity.defaultMethod;
    const now = new Date();
    const times = calculatePrayerTimes(now, lat, lng, method as any);
    const preMins = userState?.settings?.prayerAudioSettings?.prePrayerAlertMinutes ?? 10;
    const preEnabled = userState?.settings?.prayerAudioSettings?.prePrayerAlertEnabled ?? true;

    const feed: Array<{
      id: string;
      title: string;
      subtitle: string;
      timeFormatted: string;
      badge: string;
      pastelClass: string;
      sortMs: number;
    }> = [];

    const prayersList = [
      { id: 'fajr', nameAr: 'صلاة الفجر', nameEn: 'Fajr Prayer', time: times.fajr, emoji: '🌅' },
      { id: 'dhuhr', nameAr: times.isFriday ? 'صلاة الجمعة' : 'صلاة الظهر', nameEn: 'Dhuhr Prayer', time: times.dhuhr, emoji: '☀️' },
      { id: 'asr', nameAr: 'صلاة العصر', nameEn: 'Asr Prayer', time: times.asr, emoji: '🌤️' },
      { id: 'maghrib', nameAr: 'صلاة المغرب', nameEn: 'Maghrib Prayer', time: times.maghrib, emoji: '🌇' },
      { id: 'isha', nameAr: 'صلاة العشاء', nameEn: 'Isha Prayer', time: times.isha, emoji: '🌙' },
    ];

    for (const p of prayersList) {
      let targetTime = p.time;
      let isTomorrow = false;
      if (targetTime.getTime() <= now.getTime()) {
        targetTime = new Date(targetTime.getTime() + 24 * 60 * 60 * 1000);
        isTomorrow = true;
      }
      const diffMins = Math.max(1, Math.round((targetTime.getTime() - now.getTime()) / 60000));
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;

      feed.push({
        id: `sched_${p.id}`,
        title: `${p.emoji} ${isAr ? p.nameAr : p.nameEn}`,
        subtitle: preEnabled
          ? isAr
            ? `أذان كامل + تنبيه استباقي قبلها بـ ${preMins} دقائق`
            : `Full Adhan + ${preMins}m pre-alert`
          : isAr
          ? 'تنبيه الأذان المباشر عند دخول الوقت'
          : 'Exact Adhan time alert',
        timeFormatted: formatPrayerTime(targetTime, isAr),
        badge: isAr
          ? `${isTomorrow ? 'غداً • ' : ''}بعد ${h > 0 ? `${h}س و` : ''}${m}د`
          : `in ${h > 0 ? `${h}h ` : ''}${m}m`,
        pastelClass:
          p.id === 'fajr'
            ? 'bg-[#e0f2fe] dark:bg-sky-950/45 border-sky-300/60'
            : p.id === 'maghrib'
            ? 'bg-[#fce2e6] dark:bg-rose-950/45 border-rose-300/60'
            : p.id === 'isha'
            ? 'bg-[#e2defc] dark:bg-indigo-950/45 border-indigo-300/60'
            : 'bg-[#fde6d8] dark:bg-amber-950/45 border-amber-300/60',
        sortMs: targetTime.getTime(),
      });
    }

    // Add enabled custom reminders
    for (const rem of reminders.filter((r) => r.enabled)) {
      const [hh, mm] = rem.time.split(':').map(Number);
      const remDate = new Date();
      remDate.setHours(hh || 0, mm || 0, 0, 0);
      if (remDate.getTime() <= now.getTime()) {
        remDate.setDate(remDate.getDate() + 1);
      }
      feed.push({
        id: `custom_${rem.id}`,
        title: `⏰ ${rem.title}`,
        subtitle:
          rem.recurrence === 'daily'
            ? isAr
              ? 'منبه مخصص يتكرر يومياً'
              : 'Daily custom alarm'
            : isAr
            ? 'منبه مخصص نشط'
            : 'Active custom alarm',
        timeFormatted: rem.time,
        badge: isAr ? 'منبهك 🔔' : 'Custom 🔔',
        pastelClass: 'bg-[#d4f5dc] dark:bg-emerald-950/45 border-emerald-300/60',
        sortMs: remDate.getTime(),
      });
    }

    return feed.sort((a, b) => a.sortMs - b.sortMs);
  }, [userState, reminders, isAr]);

  if (!isOpen) return null;

  const handleAddMinutes = (mins: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const d = new Date(Date.now() + mins * 60 * 1000);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    setTime(`${h}:${m}`);
  };

  const handleSelectPreset = (preset: (typeof PRESET_SUGGESTIONS)[0]) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setTitle(preset.title);
    setCategory(preset.category);
    handleAddMinutes(preset.defaultMins);
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time) return;

    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();
    setIsSubmitting(true);

    try {
      confetti({
        particleCount: 26,
        spread: 60,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#1eb814', '#22c55e', '#ff5500', '#7c3aed'],
        disableForReducedMotion: true,
      });
    } catch {}

    try {
      const todayIso = formatLocalDate();
      const newReminder: CustomReminderItem = {
        id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: title.trim(),
        time,
        date: todayIso,
        recurrence,
        category,
        enabled: true,
        notes: notes.trim() || undefined,
        createdAt: Date.now(),
      };

      await db.custom_reminders.add(newReminder);
      await autonomousNotificationScheduler.scheduleAllUpcomingAlarms();

      setTitle('');
      setNotes('');
      setNaturalText('');
      setNlpPreview(null);
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `🔔 تم ضبط المنبه بنجاح في الساعة ${time}`
            : `🔔 Reminder scheduled for ${time}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEnabled = async (rem: CustomReminderItem) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    await db.custom_reminders.update(rem.id, { enabled: !rem.enabled });
    await autonomousNotificationScheduler.scheduleAllUpcomingAlarms();
  };

  const handleDeleteReminder = async (id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateWarning();
    await db.custom_reminders.delete(id);
    await autonomousNotificationScheduler.scheduleAllUpcomingAlarms();
  };

  const currentMuadhin = userState?.settings?.prayerAudioSettings?.muadhin || 'makkah';
  const currentChime = userState?.settings?.prayerAudioSettings?.chimeWhenDisabled || 'rast_minaret';
  const prePrayerAlertEnabled = userState?.settings?.prayerAudioSettings?.prePrayerAlertEnabled ?? true;
  const adhanEnabled = userState?.settings?.prayerAudioSettings?.adhanEnabled ?? true;

  const handleUpdatePrayerAudioSetting = async (patch: Record<string, any>) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const currentAudio = userState?.settings?.prayerAudioSettings || {
      adhanEnabled: true,
      muadhin: 'makkah',
      prePrayerAlertEnabled: true,
      prePrayerAlertMinutes: 10,
      chimeWhenDisabled: 'rast_minaret',
    };
    await db.user_state.update('current_user', {
      'settings.prayerAudioSettings': {
        ...currentAudio,
        ...patch,
      },
    });
    await autonomousNotificationScheduler.scheduleAllUpcomingAlarms();
    onRewardToast?.(isAr ? '🎵 تم حفظ إعدادات صوت الأذان والتنبيهات!' : '🎵 Audio settings saved!');
  };

  const handlePreviewMuadhin = (muadhinId: string, audioUrl: string) => {
    soundSynth.playTactileClick();
    if (playingMuadhinId === muadhinId) {
      previewAudioRef.current?.pause();
      setPlayingMuadhinId(null);
      return;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    const aud = new Audio(audioUrl);
    aud.volume = 0.85;
    previewAudioRef.current = aud;
    setPlayingMuadhinId(muadhinId);
    aud.play().catch(() => {
      soundSynth.playPrayerSpiritualChime('rast_minaret');
      setPlayingMuadhinId(null);
    });
    aud.onended = () => setPlayingMuadhinId(null);
  };

  const enabledRemindersCount = reminders.filter((r) => r.enabled).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'مركز الإشعارات والمنبهات الذكي' : 'Smart Notifications & Alarms Hub'}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-xl max-h-[92vh] flex flex-col rounded-t-[32px] sm:rounded-[32px] bg-[#f7f7f7] dark:bg-zinc-950 border border-zinc-200/80 dark:border-white/10 shadow-2xl overflow-hidden"
      >
        {/* ============================================================ */}
        {/* 1. HABITLINE OBSIDIAN COMMAND HEADER                         */}
        {/* ============================================================ */}
        <div className="bg-[#141517] text-white p-4 sm:p-5 border-b border-white/10 space-y-3.5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff5500] to-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {isAr ? 'مركز الإشعارات والمنبهات الذكي' : 'Smart Notifications & Alarms Hub'}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      notifPerm === 'granted'
                        ? 'bg-[#bce8c2] text-zinc-950'
                        : 'bg-habit-flame-ink text-white'
                    }`}
                  >
                    {notifPerm === 'granted'
                      ? isAr
                        ? 'مفعّل بالخلفية ✓'
                        : 'Active ✓'
                      : isAr
                      ? 'بانتظار التفعيل 🔔'
                      : 'Needs Permission'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {isAr
                    ? 'منبهات الصلاة، الأذان، التذكيرات الصوتية، ورنين قفل الشاشة'
                    : 'Prayer Adhan, voice alarms, and lockscreen notifications'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onClose();
              }}
              aria-label={isAr ? 'إغلاق' : 'Close'}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3-Tab Pill Switcher inside Obsidian Header */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/10 border border-white/10">
            {[
              {
                id: 'alarms' as NotificationHubTab,
                labelAr: `🔔 المنبهات (${enabledRemindersCount})`,
                labelEn: `🔔 Alarms (${enabledRemindersCount})`,
              },
              {
                id: 'schedule' as NotificationHubTab,
                labelAr: '📡 جدول الإشعارات',
                labelEn: '📡 Live Schedule',
              },
              {
                id: 'sounds' as NotificationHubTab,
                labelAr: '🎵 الأذان والنغمات',
                labelEn: '🎵 Adhan & Tones',
              },
            ].map((tItem) => {
              const isActive = activeTab === tItem.id;
              return (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setActiveTab(tItem.id);
                  }}
                  className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer truncate ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isAr ? tItem.labelAr : tItem.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SCROLLABLE CONTENT BODY                                   */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Status Toast Banner inside Modal */}
          <AnimatePresence>
            {testPushStatus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 rounded-[20px] bg-[#141517] text-white border border-[#1eb814]/50 text-xs font-bold text-center leading-relaxed shadow-md"
              >
                {testPushStatus}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================== */}
          {/* TAB 1: ALARMS & SMART VOICE REMINDERS                      */}
          {/* ========================================================== */}
          {activeTab === 'alarms' && (
            <div className="space-y-4 animate-fade-in">
              {/* Smart Voice & Natural Input (Soft Lavender #e2defc Bento) */}
              <div className="p-4 rounded-[26px] bg-[#e2defc] dark:bg-indigo-950/50 border border-indigo-300/70 dark:border-indigo-500/30 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#5448e8] dark:text-indigo-400" />
                    <span>{isAr ? 'إدخال صوتي أو نصي ذكي وفوري ⚡' : 'Smart Voice or NLP Input ⚡'}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-indigo-950 dark:text-indigo-200">
                    {isAr ? 'يفهم الوقت تلقائياً' : 'Auto Time Parse'}
                  </span>
                </div>

                <div className="relative flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={
                      isAr
                        ? 'اكتب أو تحدث: "فكرني بمكالمة بعد ربع ساعة" أو "دواء كل يوم الساعة 9"...'
                        : 'Speak or type: "Call manager in 15 mins" or "Pill every day at 9am"...'
                    }
                    value={naturalText}
                    onChange={(e) => {
                      setNaturalText(e.target.value);
                      if (e.target.value.trim().length > 3) {
                        const res = localIntelligence.parseReminderIntent(e.target.value);
                        setNlpPreview(res);
                      } else {
                        setNlpPreview(null);
                      }
                    }}
                    className="flex-1 py-2.5 px-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-indigo-200/80 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:border-[#5448e8] shadow-2xs"
                  />

                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                        : 'bg-[#141517] text-white hover:bg-zinc-800'
                    }`}
                    title={isAr ? (isListening ? 'إيقاف التسجيل' : 'تسجيل صوتي') : 'Voice input'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                {isListening && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>{isAr ? '🎙️ جاري الاستماع.. تحدث بالمنبه المطلوب الآن' : '🎙️ Listening...'}</span>
                  </div>
                )}

                {voiceError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">{voiceError}</p>
                )}

                {nlpPreview && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-indigo-300/60 dark:border-indigo-500/30 text-xs flex items-center justify-between gap-2 animate-fade-in shadow-2xs">
                    <div className="min-w-0">
                      <span className="font-bold text-zinc-900 dark:text-white block truncate">
                        {nlpPreview.title}
                      </span>
                      <span className="text-[11px] text-indigo-700 dark:text-indigo-300 block truncate">
                        {nlpPreview.explanation}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        setTitle(nlpPreview.title);
                        setTime(nlpPreview.time);
                        setCategory(nlpPreview.category);
                        setRecurrence(nlpPreview.recurrence);
                      }}
                      className="px-3 py-1.5 rounded-full bg-habit-green-ink text-white font-bold text-[11px] shrink-0 cursor-pointer active:scale-95 transition-transform"
                    >
                      {isAr ? 'اعتماد ⚡' : 'Apply ⚡'}
                    </button>
                  </div>
                )}
              </div>

              {/* 1-Tap Pastel Presets Strip */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block px-1">
                  {isAr ? 'قوالب جاهزة بلمسة واحدة:' : '1-Tap Pastel Presets:'}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {PRESET_SUGGESTIONS.map((preset, idx) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold shrink-0 transition-all cursor-pointer active:scale-95 ${preset.bgClass}`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{preset.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Create Reminder Bento Form */}
              <form
                onSubmit={handleCreateReminder}
                className="p-4 sm:p-5 rounded-[26px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {isAr ? 'عنوان التذكير أو المنبه:' : 'Reminder Title:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: شرب الماء، مكالمة العمل، ورد القراءة...' : 'e.g., Drink water, Standup...'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:border-[#1eb814]"
                  />
                </div>

                {/* Time Selector & Quick Increments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#ff5500]" />
                      <span>{isAr ? 'موعد الرنين:' : 'Alarm Time:'}</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-900 dark:text-white focus:outline-hidden focus:border-[#1eb814]"
                    />
                  </div>

                  {/* Quick +Mins Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-zinc-500 font-bold shrink-0">
                      {isAr ? 'ضبط سريع:' : 'Quick set:'}
                    </span>
                    {[
                      { labelAr: '+15 دقيقة', labelEn: '+15m', mins: 15 },
                      { labelAr: '+30 دقيقة', labelEn: '+30m', mins: 30 },
                      { labelAr: '+ساعة', labelEn: '+1h', mins: 60 },
                      { labelAr: '+ساعتين', labelEn: '+2h', mins: 120 },
                    ].map((chip) => (
                      <button
                        key={chip.mins}
                        type="button"
                        onClick={() => handleAddMinutes(chip.mins)}
                        className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-[#141517] hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer active:scale-95"
                      >
                        {isAr ? chip.labelAr : chip.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recurrence Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#5448e8]" />
                    <span>{isAr ? 'التكرار:' : 'Recurrence:'}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'once' as ReminderRecurrence, label: isAr ? 'اليوم فقط' : 'Once today' },
                      { id: 'daily' as ReminderRecurrence, label: isAr ? 'يومياً' : 'Daily' },
                      { id: 'weekdays' as ReminderRecurrence, label: isAr ? 'أيام العمل' : 'Weekdays' },
                    ].map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          setRecurrence(rec.id);
                        }}
                        className={`py-2 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          recurrence === rec.id
                            ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {rec.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="w-full py-3 px-4 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#1eb814]/25 active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? 'حفظ وتفعيل المنبه الذكي 🔔' : 'Save & Schedule Smart Alarm 🔔'}</span>
                </button>
              </form>

              {/* Active Reminders List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#ff5500]" />
                    <span>{isAr ? 'منبهاتك وتذكيراتك المجدولة' : 'Your Scheduled Alarms'}</span>
                  </h4>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    {reminders.length}
                  </span>
                </div>

                {reminders.length === 0 ? (
                  <div className="p-6 text-center rounded-[24px] bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs">
                    {isAr
                      ? 'لا توجد منبهات مخصصة حالياً.. اختر قالباً جاهزاً من الأعلى أو أضف منبهاً جديداً.'
                      : 'No custom reminders yet. Pick a preset above or add one!'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reminders.map((rem) => (
                      <div
                        key={rem.id}
                        className={`p-3.5 rounded-[22px] border flex items-center justify-between gap-3 transition-all ${
                          rem.enabled
                            ? 'bg-[#bce8c2] dark:bg-emerald-950/60 border-[#1eb814]/40 text-zinc-900 dark:text-white shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200/70 dark:border-zinc-800 text-zinc-400 opacity-65'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleEnabled(rem)}
                            className={`px-2.5 py-1.5 rounded-xl font-mono font-bold text-xs shrink-0 cursor-pointer transition-all ${
                              rem.enabled
                                ? 'bg-[#141517] text-white shadow-2xs'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            <bdi dir="ltr">{rem.time}</bdi>
                          </button>

                          <div className="min-w-0">
                            <span
                              className={`text-xs sm:text-sm font-bold block truncate ${
                                rem.enabled ? 'text-zinc-950 dark:text-white' : 'line-through'
                              }`}
                            >
                              {rem.title}
                            </span>
                            <span className="text-[11px] text-zinc-700 dark:text-emerald-200/80 block">
                              {rem.recurrence === 'daily'
                                ? isAr
                                  ? 'يتكرر يومياً'
                                  : 'Daily'
                                : rem.recurrence === 'weekdays'
                                ? isAr
                                  ? 'أيام العمل'
                                  : 'Weekdays'
                                : isAr
                                ? 'اليوم فقط'
                                : 'Today only'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleEnabled(rem)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                              rem.enabled
                                ? 'bg-habit-green-ink text-white shadow-2xs'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                            }`}
                            title={rem.enabled ? 'تفعيل/تعطيل' : 'تفعيل'}
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteReminder(rem.id)}
                            className="w-9 h-9 rounded-full bg-white/80 dark:bg-zinc-800 text-rose-600 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: LIVE SCHEDULED NOTIFICATIONS & DIAGNOSTIC TESTERS   */}
          {/* ========================================================== */}
          {activeTab === 'schedule' && (
            <div className="space-y-4 animate-fade-in">
              {/* System Permission & Instant Testers Bento */}
              <div className="p-4 rounded-[26px] bg-[#141517] text-white border border-white/10 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#1eb814]/20 text-[#1eb814] flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {isAr ? 'فحص وتجربة الإشعارات الحية' : 'Live Notification Diagnostics'}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {isAr
                          ? 'تأكد من وصول الإشعارات الفورية ورنين قفل الشاشة على جهازك'
                          : 'Test instant notification & closed-app lockscreen alarm'}
                      </p>
                    </div>
                  </div>

                  {notifPerm !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestBrowserPermission}
                      className="px-3 py-1.5 rounded-full bg-habit-flame-ink text-white text-xs font-bold cursor-pointer active:scale-95 transition-transform shrink-0"
                    >
                      {isAr ? 'تفعيل الإذن 🔔' : 'Allow 🔔'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleSendInstantNotification}
                    className="py-2.5 px-3.5 rounded-2xl bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    <Bell className="w-4 h-4" />
                    <span>{isAr ? 'إرسال إشعار فوري الآن 🔔' : 'Send Instant Alert Now 🔔'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestLockscreen}
                    disabled={isTestingLockscreen}
                    className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Radio className="w-4 h-4" />
                    <span>
                      {isTestingLockscreen
                        ? isAr
                          ? 'اقفل الشاشة الآن (5ث)...'
                          : 'Lock screen now (5s)...'
                        : isAr
                        ? 'تجربة رنين قفل الشاشة (5ث) 🚀'
                        : 'Test Lockscreen Alarm (5s) 🚀'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Chronological Upcoming Notifications Feed */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {isAr
                      ? 'جدول الإشعارات القادمة تلقائياً (٢٤ ساعة):'
                      : 'Upcoming Automated Notifications (24h):'}
                  </h4>
                  <span className="text-[11px] font-bold text-[#1eb814]">
                    {isAr ? `${upcomingScheduleFeed.length} تنبيهات نشطة` : `${upcomingScheduleFeed.length} active`}
                  </span>
                </div>

                <div className="space-y-2">
                  {upcomingScheduleFeed.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-[22px] border flex items-center justify-between gap-3 ${item.pastelClass}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/30 text-zinc-800 dark:text-zinc-200 shrink-0">
                            {item.badge}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-300 block truncate mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>

                      <span className="px-2.5 py-1 rounded-xl bg-[#141517] text-white font-mono text-xs font-bold tabular-nums shrink-0">
                        <bdi dir="ltr">{item.timeFormatted}</bdi>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: ADHAN & NOTIFICATION SOUNDS STUDIO                  */}
          {/* ========================================================== */}
          {activeTab === 'sounds' && (
            <div className="space-y-4 animate-fade-in">
              {/* Toggles for Adhan & Pre-Prayer Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleUpdatePrayerAudioSetting({ adhanEnabled: !adhanEnabled })}
                  className={`p-3.5 rounded-[22px] border text-start flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    adhanEnabled
                      ? 'bg-[#bce8c2] dark:bg-emerald-950/60 border-[#1eb814]/50 text-zinc-950 dark:text-white'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">
                      {isAr ? '🕋 صوت الأذان الكامل' : '🕋 Full Adhan Audio'}
                    </span>
                    <span className="text-[10px] opacity-80 block mt-0.5">
                      {adhanEnabled
                        ? isAr
                          ? 'يرفع الأذان تلقائياً عند دخول الوقت'
                          : 'Plays automatically at prayer time'
                        : isAr
                        ? 'مكتوم (يكتفي بالرنين الروحي)'
                        : 'Muted (Chime only)'}
                    </span>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      adhanEnabled ? 'bg-habit-green-ink text-white' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleUpdatePrayerAudioSetting({ prePrayerAlertEnabled: !prePrayerAlertEnabled })
                  }
                  className={`p-3.5 rounded-[22px] border text-start flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    prePrayerAlertEnabled
                      ? 'bg-[#e2defc] dark:bg-indigo-950/60 border-indigo-400/50 text-zinc-950 dark:text-white'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">
                      {isAr ? '⏳ تنبيه قبل الأذان (10د)' : '⏳ Pre-Prayer Alert (10m)'}
                    </span>
                    <span className="text-[10px] opacity-80 block mt-0.5">
                      {prePrayerAlertEnabled
                        ? isAr
                          ? 'تذكير لطيف للاستعداد والوضوء'
                          : 'Gentle reminder to prepare'
                        : isAr
                        ? 'معطل حالياً'
                        : 'Disabled'}
                    </span>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      prePrayerAlertEnabled ? 'bg-[#5448e8] text-white' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>
              </div>

              {/* Muadhin Selector Cards */}
              <div className="p-4 rounded-[26px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    {isAr ? '🎙️ اختر صوت المؤذن المفضل ومعاينته:' : '🎙️ Choose & Preview Muadhin Voice:'}
                  </span>
                </div>

                <div className="space-y-2">
                  {MUADHIN_OPTIONS.map((m) => {
                    const isSelected = currentMuadhin === m.id;
                    const isPlaying = playingMuadhinId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleUpdatePrayerAudioSetting({ muadhin: m.id })}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#fde6d8] dark:bg-amber-950/50 border-[#ff5500]/50 text-zinc-950 dark:text-white font-bold'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200/70 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                              isSelected
                                ? 'bg-habit-flame-ink text-white'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-transparent'
                            }`}
                          >
                            ✓
                          </div>
                          <span className="text-xs truncate">{m.nameAr}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewMuadhin(m.id, m.audioUrl);
                          }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 ${
                            isPlaying
                              ? 'bg-rose-500 text-white'
                              : 'bg-[#141517] text-white hover:bg-zinc-800'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{isPlaying ? (isAr ? 'إيقاف' : 'Stop') : isAr ? 'استماع' : 'Preview'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spiritual Chime Selector */}
              <div className="p-4 rounded-[26px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-2.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                  {isAr ? '🔔 نغمة الرنين الروحي والتنبيهات السريعة:' : '🔔 Spiritual Chime & Quick Alert Tone:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'rast_minaret', nameAr: 'مقام الرست النبوي', nameEn: 'Rast Minaret' },
                    { id: 'andalusian_peace', nameAr: 'السكينة الأندلسية', nameEn: 'Andalusian Peace' },
                    { id: 'serenity_chime', nameAr: 'رنين الوقار الصافي', nameEn: 'Serenity Chime' },
                  ].map((ch) => {
                    const isSel = currentChime === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          soundSynth.playPrayerSpiritualChime(ch.id as any);
                          handleUpdatePrayerAudioSetting({ chimeWhenDisabled: ch.id });
                        }}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isSel
                            ? 'bg-[#d4f5dc] dark:bg-emerald-950/60 border-[#1eb814] text-zinc-950 dark:text-white'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{isAr ? ch.nameAr : ch.nameEn}</span>
                        <Volume2 className="w-3.5 h-3.5 shrink-0 text-[#1eb814]" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
