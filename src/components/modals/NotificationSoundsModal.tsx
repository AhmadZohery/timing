import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Check,
  Sparkles,
  BellRing,
  Flame,
  BookOpen,
  Droplets,
  Clock,
  Coffee,
  ShieldAlert,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { db } from '../../db/db';
import type { UserState, NotificationTonesConfig, NotificationSoundCategory } from '../../types';
import { MUADHIN_OPTIONS } from '../../utils/prayerCalculator';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface NotificationSoundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState?: UserState | null;
  onUpdateUserState?: (patch: Partial<UserState>) => void;
}

interface SoundOptionDef {
  id: string;
  nameAr: string;
  descAr: string;
  isDefault?: boolean;
}

interface CategoryCardDef {
  category: NotificationSoundCategory;
  titleAr: string;
  subtitleAr: string;
  icon: React.ReactNode;
  accentColor: string; // Tailwind class
  configKey: keyof NotificationTonesConfig;
  options: SoundOptionDef[];
}

const DEFAULT_CONFIG: NotificationTonesConfig = {
  prayerTone: 'makkah',
  prayerChimeAlternative: 'rast_minaret',
  sprintCompletionTone: 'harmonic_ascent',
  breakRefocusTone: 'tibetan_gong',
  quickAlarmTone: 'marimba_pulse',
  wirdAdhkarTone: 'solfeggio_528',
  hydrationNeatTone: 'water_drop',
  streakCelebrationTone: 'triumphant_fanfare',
  urgentWarningTone: 'minor_third_alert',
};

export const NotificationSoundsModal: React.FC<NotificationSoundsModalProps> = ({
  isOpen,
  onClose,
  userState,
  onUpdateUserState,
}) => {
  const [config, setConfig] = useState<NotificationTonesConfig>(() => {
    return userState?.settings?.notificationTones || soundSynth.getNotificationTonesConfig();
  });

  const [activePreviewKey, setActivePreviewKey] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const previewTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = userState?.settings?.notificationTones || soundSynth.getNotificationTonesConfig();
      setConfig(current);
    } else {
      stopAnyPlayingPreview();
    }
    return () => {
      stopAnyPlayingPreview();
    };
  }, [isOpen, userState]);

  const stopAnyPlayingPreview = () => {
    soundSynth.stopAthanAudio();
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setActivePreviewKey(null);
  };

  const handlePreviewTone = (category: NotificationSoundCategory, toneId: string) => {
    const key = `${category}:${toneId}`;
    if (activePreviewKey === key) {
      stopAnyPlayingPreview();
      return;
    }

    stopAnyPlayingPreview();
    setActivePreviewKey(key);
    haptic.vibrateLight();

    soundSynth.playNotificationSound(category, toneId);

    // Audio preview auto-reset timers:
    // If it's an Athan audio stream, let it preview for up to 8 seconds or until user stops it
    const durationMs = category === 'prayer_athan' && toneId !== 'spiritual_chime' ? 8500 : 2500;
    previewTimerRef.current = window.setTimeout(() => {
      if (category === 'prayer_athan') {
        soundSynth.stopAthanAudio();
      }
      setActivePreviewKey(null);
    }, durationMs);
  };

  const handleSelectTone = async (configKey: keyof NotificationTonesConfig, toneId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const updatedConfig = {
      ...config,
      [configKey]: toneId,
    };

    setConfig(updatedConfig);
    soundSynth.saveNotificationTonesConfig(updatedConfig);

    try {
      // Keep IndexedDB userState updated
      const stateId = userState?.id || 'current';
      const patch: any = {
        'settings.notificationTones': updatedConfig,
      };
      if (configKey === 'prayerTone' && toneId !== 'spiritual_chime') {
        patch['settings.prayerAudioSettings.muadhin'] = toneId;
      }
      if (configKey === 'prayerChimeAlternative') {
        patch['settings.prayerAudioSettings.chimeWhenDisabled'] = toneId;
      }
      await db.user_state.update(stateId, patch);

      if (onUpdateUserState && userState?.settings) {
        onUpdateUserState({
          settings: {
            ...userState.settings,
            notificationTones: updatedConfig,
            prayerAudioSettings: {
              ...(userState.settings.prayerAudioSettings || {
                adhanEnabled: true,
                muadhin: 'makkah',
                prePrayerAlertEnabled: true,
                prePrayerAlertMinutes: 10,
              }),
              ...(configKey === 'prayerTone' && toneId !== 'spiritual_chime'
                ? { muadhin: toneId as any }
                : {}),
              ...(configKey === 'prayerChimeAlternative'
                ? { chimeWhenDisabled: toneId as any }
                : {}),
            },
          },
        });
      }

      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 2000);
    } catch (err) {
      console.warn('Could not persist notification tones to IndexedDB:', err);
    }
  };

  const handleResetDefaults = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    stopAnyPlayingPreview();

    setConfig(DEFAULT_CONFIG);
    soundSynth.saveNotificationTonesConfig(DEFAULT_CONFIG);

    try {
      const stateId = userState?.id || 'current';
      const patch: any = {
        'settings.notificationTones': DEFAULT_CONFIG,
        'settings.prayerAudioSettings.muadhin': 'makkah',
        'settings.prayerAudioSettings.chimeWhenDisabled': 'rast_minaret',
      };
      await db.user_state.update(stateId, patch);

      if (onUpdateUserState && userState?.settings) {
        onUpdateUserState({
          settings: {
            ...userState.settings,
            notificationTones: DEFAULT_CONFIG,
            prayerAudioSettings: {
              ...(userState.settings.prayerAudioSettings || {
                adhanEnabled: true,
                muadhin: 'makkah',
                prePrayerAlertEnabled: true,
                prePrayerAlertMinutes: 10,
              }),
              muadhin: 'makkah',
              chimeWhenDisabled: 'rast_minaret',
            },
          },
        });
      }
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const CATEGORIES: CategoryCardDef[] = [
    {
      category: 'prayer_athan',
      titleAr: 'أذان مواقيت الصلاة المفروضة',
      subtitleAr: 'الصوت المنطلق فور دخول وقت الفريضة (بصوت أئمة الحرمين الشريفين أو كبار المؤذنين)',
      icon: <span className="text-xl">🕋</span>,
      accentColor: 'border-amber-500/50 text-amber-500 bg-amber-500/10',
      configKey: 'prayerTone',
      options: MUADHIN_OPTIONS.map((m) => ({
        id: m.id,
        nameAr: m.nameAr,
        descAr: m.id === 'makkah' ? 'الافتراضي المعتمد - نداء الحرم المكي الشريف المهيب' : 'تسجيل نقي عالي الجودة',
        isDefault: m.id === 'makkah',
      })),
    },
    {
      category: 'prayer_chime',
      titleAr: 'الرنين الروحي البديل للصلاة',
      subtitleAr: 'يعمل عند إيقاف صوت الأذان البشري، أو في وضع الصامت/دون إنترنت لعدم تفويت الفريضة أبداً',
      icon: <BellRing className="w-5 h-5 text-emerald-400" />,
      accentColor: 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10',
      configKey: 'prayerChimeAlternative',
      options: [
        {
          id: 'rast_minaret',
          nameAr: 'مقام الرست النبوي الشريف (مآذن الحرمين)',
          descAr: 'نغمات مئذنة مقدسة توافقية (D4 → G4 → A4 → D5) تميز الصلاة عن أي تنبيه آخر',
          isDefault: true,
        },
        {
          id: 'andalusian_peace',
          nameAr: 'رنين السكينة الأندلسية (432Hz)',
          descAr: 'نغمات هادئة عميقة ودافئة تملأ المكان وقاراً وخشوعاً',
        },
        {
          id: 'serenity_chime',
          nameAr: 'رنين الخشوع والوقار الصافي',
          descAr: 'ثلاثية نقية واضحة مريحة للأذن ولا تقطع حبل الأفكار بعنف',
        },
      ],
    },
    {
      category: 'sprint_completion',
      titleAr: 'إتمام سبرنت التركيز والعمل العميق',
      subtitleAr: 'نغمة إنجاز العمل ومحطات الإنجاز اليومي لتحفيز الدوبامين الإيجابي',
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      accentColor: 'border-indigo-500/50 text-indigo-500 bg-indigo-500/10',
      configKey: 'sprintCompletionTone',
      options: [
        {
          id: 'harmonic_ascent',
          nameAr: 'صعود هارموني ثلاثي مبهج (C5 → E5 → G5 → C6)',
          descAr: 'تتابع موسيقي صاعد يمنحك شعور الانتصار بإتمام المهمة بنجاح',
          isDefault: true,
        },
        {
          id: 'victory_fanfare',
          nameAr: 'بوق الإنجاز والهمة العالية',
          descAr: 'نغمات متدرجة تنبض بالحيوية بعد جهد تركيز مكثف',
        },
        {
          id: 'crystal_clarity',
          nameAr: 'رنين البلور المتألق (A5 → D6 → A6)',
          descAr: 'رنين نقي فائق الوضوح يعلن نهاية السبرنت بأناقة هادئة',
        },
      ],
    },
    {
      category: 'break_refocus',
      titleAr: 'انتهاء الاستراحة وتجديد النشاط الذهني',
      subtitleAr: 'تنبيه لطيف وحازم لكسر التشتت وإعادة توجيه تركيزك إلى مضمار العمل',
      icon: <Coffee className="w-5 h-5 text-teal-400" />,
      accentColor: 'border-teal-500/50 text-teal-500 bg-teal-500/10',
      configKey: 'breakRefocusTone',
      options: [
        {
          id: 'tibetan_gong',
          nameAr: 'وعاء التبت النحاسي التوافقي (880Hz / 1320Hz)',
          descAr: 'رنين عميق مديد يوقظ الانتباه بصفاء دون إفزاع',
          isDefault: true,
        },
        {
          id: 'double_brass',
          nameAr: 'جرس الحلبة المزدوج (Ding! ... Ding!)',
          descAr: 'إشارة واضحة وحماسية للعودة إلى الميدان وبدء الجولة التالية',
        },
        {
          id: 'calm_resumption',
          nameAr: 'رنين الاستئناف الهادئ (440Hz / 660Hz)',
          descAr: 'نغمة هادئة وسلسة مناسبة لأجواء العمل المكتبي الهادئ',
        },
      ],
    },
    {
      category: 'quick_alarm',
      titleAr: 'المنبهات السريعة وتنبيهات التدقيق الزمني',
      subtitleAr: 'تنبيهات المواعيد، التايمر السريع، والتحذيرات اللحظية للمهام المؤقتة',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      accentColor: 'border-amber-500/50 text-amber-500 bg-amber-500/10',
      configKey: 'quickAlarmTone',
      options: [
        {
          id: 'marimba_pulse',
          nameAr: 'نبضات الماريمبا الإيقاعية (950Hz / 1150Hz / 1320Hz)',
          descAr: 'ثلاث نقرات خشبية إيقاعية لافتة للنظر وسهلة التمييز',
          isDefault: true,
        },
        {
          id: 'triple_stride',
          nameAr: 'خطوات إيقاعية حازمة',
          descAr: 'نبضات ثلاثية متوازنة لضبط المواعيد بدقة',
        },
        {
          id: 'resonant_beacon',
          nameAr: 'إشارة الصدى المزدوجة',
          descAr: 'تردد نقي مضاعف ينبهك فور انتهاء الوقت المحدد',
        },
      ],
    },
    {
      category: 'wird_adhkar',
      titleAr: 'الأوراد القرآنية وأذكار الصباح والمساء',
      subtitleAr: 'تذكير ورد سورة البقرة، أذكار الصباح والمساء، وساعة الاستجابة يوم الجمعة',
      icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
      accentColor: 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10',
      configKey: 'wirdAdhkarTone',
      options: [
        {
          id: 'solfeggio_528',
          nameAr: 'تردد السكينة والبركة (528Hz Solfeggio)',
          descAr: 'نغمة مباركة هادئة تفيض بالطمأنينة والانشراح للأوراد الإيمانية',
          isDefault: true,
        },
        {
          id: 'sacred_echo',
          nameAr: 'صدى ترتيل الصفاء (432Hz)',
          descAr: 'تردد طبيعي متناغم يدعوك للتأمل وقراءة القرآن الكريم',
        },
        {
          id: 'tranquil_dawn',
          nameAr: 'سكينة الفجر والنقاء (660Hz)',
          descAr: 'رنين مشرق ومنعش كنسيم الصباح الباكر',
        },
      ],
    },
    {
      category: 'hydration_neat',
      titleAr: 'شرب الماء وتنبيهات الحركة البدنية (NEAT)',
      subtitleAr: 'تذكيرات ترطيب الجسم، الوقوف، وتجديد النشاط العضلي والدورة الدموية',
      icon: <Droplets className="w-5 h-5 text-sky-400" />,
      accentColor: 'border-sky-500/50 text-sky-500 bg-sky-500/10',
      configKey: 'hydrationNeatTone',
      options: [
        {
          id: 'water_drop',
          nameAr: 'قطرة الماء الكريستالية النقية (1400Hz → 2200Hz)',
          descAr: 'صوت قطرة ماء طبيعية حقيقية تعرفه فوراً دون أن تلتفت للشاشة',
          isDefault: true,
        },
        {
          id: 'spring_dew',
          nameAr: 'ندى الينبوع الحيوي المزدوج',
          descAr: 'رنين قطرتين متتابعتين تذكرك بالحفاظ على رطوبة وطاقة جسدك',
        },
        {
          id: 'vitality_bubble',
          nameAr: 'فقاعة النشاط والحيوية الصاعدة',
          descAr: 'ثلاث نقرات صاعدة خفيفة تنشط حواسك للحركة والوقوف',
        },
      ],
    },
    {
      category: 'streak_celebration',
      titleAr: 'حماية الشعلة والأوسمة والإنجازات الكبرى',
      subtitleAr: 'عند ترقية الدروع، الحفاظ على الشعلة، أو كسر الأرقام القياسية الشخصية',
      icon: <Flame className="w-5 h-5 text-rose-400" />,
      accentColor: 'border-rose-500/50 text-rose-500 bg-rose-500/10',
      configKey: 'streakCelebrationTone',
      options: [
        {
          id: 'triumphant_fanfare',
          nameAr: 'فانفار النصر الملحمي مع وتر الإنجاز',
          descAr: 'احتفال صوتي مهيب يخلد تفوقك وثباتك اليومي في المضمار',
          isDefault: true,
        },
        {
          id: 'heroic_chord',
          nameAr: 'وتر الأبطال الرنان التوافقي (A-Maj Chord)',
          descAr: 'وتر عريض دافئ يمنحك شعوراً بالفخر والقوة المستمرة',
        },
        {
          id: 'celestial_ascent',
          nameAr: 'الصعود الخماسي البراق (Pentatonic Shine)',
          descAr: 'تدرج خماسي سريع متلألئ للأوسمة والمستويات الجديدة',
        },
      ],
    },
    {
      category: 'urgent_warning',
      titleAr: 'تنبيهات الاستدراك والتحذير الحازم',
      subtitleAr: 'تذكير تأخر الصلاة، تدارك ما فات قبل انتهاء اليوم، وتنبيهات نفاذ الوقت',
      icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
      accentColor: 'border-amber-500/50 text-amber-500 bg-amber-500/10',
      configKey: 'urgentWarningTone',
      options: [
        {
          id: 'minor_third_alert',
          nameAr: 'تنبيه التردد الحذر (440Hz → 330Hz)',
          descAr: 'تردد هابط وقور يثير انتباهك للاستدراك الفوري دون توتر',
          isDefault: true,
        },
        {
          id: 'urgent_pulse',
          nameAr: 'نبضات الاستدراك المتسارعة',
          descAr: 'نبضتان متتابعتان للإشارة إلى وجود أمر يستوجب تدخلك',
        },
        {
          id: 'resolute_call',
          nameAr: 'نداء العزم والحزم الوقور',
          descAr: 'رنين ثلاثي جاد يساعدك على استدراك أولوياتك المهمة قبل فواتها',
        },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 text-white shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  نظام التمييز الصوتي الإدراكي
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Acoustic Identity
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                نغمة وهوية صوتية مميزة لكل حدث لتعرف ما يجري بدقة دون الحاجة للنظر للشاشة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              title="استعادة النغمات الافتراضية الموصى بها"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">افتراضي</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccessMsg && (
          <div className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تم حفظ خيارات النغمات وتطبيقها فورياً على جميع تنبيهات التطبيق بنجاح ✔</span>
          </div>
        )}

        {/* Scrollable Categories List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar">
          {/* Quick Logic Explainer Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-indigo-950/30 to-slate-900 border border-amber-500/30 flex items-start gap-3">
            <span className="text-2xl mt-0.5">💡</span>
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-200">
                كيف يعزز التمييز الصوتي إنتاجيتك واستقرارك الذهني؟
              </p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                في مضمار، لكل نوع من التنبيهات تردد وبناء هارموني فريد. فالصلاة تمتاز بنغمات المئذنة والأذان، والاستراحة بصوت وعاء التبت العميق، والماء بقطرة الندى، والسبرنت بالصعود الهارموني. انقر على «استماع» لتجربة أي صوت، واختر ما يلائمك.
              </p>
            </div>
          </div>

          {/* Categories Grid / Cards */}
          {CATEGORIES.map((cat) => {
            const selectedTone = (config[cat.configKey] as string) || (DEFAULT_CONFIG[cat.configKey] as string);

            return (
              <div
                key={cat.category}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all space-y-3"
              >
                {/* Category Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${cat.accentColor}`}>
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {cat.titleAr}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {cat.subtitleAr}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {cat.options.map((opt) => {
                    const isSelected = selectedTone === opt.id;
                    const previewKey = `${cat.category}:${opt.id}`;
                    const isPlaying = activePreviewKey === previewKey;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectTone(cat.configKey, opt.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/70 shadow-xs'
                            : 'bg-slate-900/50 border-slate-700/60 hover:border-slate-600 hover:bg-slate-900/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-amber-400 bg-amber-400 text-black'
                                : 'border-slate-600 bg-transparent'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-xs font-bold truncate ${
                                  isSelected ? 'text-amber-200' : 'text-slate-200'
                                }`}
                              >
                                {opt.nameAr}
                              </span>
                              {opt.isDefault && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 font-medium">
                                  موصى به
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                              {opt.descAr}
                            </p>
                          </div>
                        </div>

                        {/* Preview Audio Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewTone(cat.category, opt.id);
                          }}
                          title={isPlaying ? 'إيقاف الاستماع' : 'استماع للنغمة'}
                          className={`p-2 rounded-lg border flex items-center gap-1 text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                            isPlaying
                              ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30 animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>إيقاف</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>استماع</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>يتم الحفظ التلقائي والفوري مع كل اختيار بنقرة واحدة</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            تم وإغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
