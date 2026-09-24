import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Laptop,
  Palette,
  GraduationCap,
  Briefcase,
  Stethoscope,
  Star,
  Calendar,
  Key,
  Bot,
  Moon,
  Sun,
  Zap,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { db } from '../../db/db';
import type {
  DayWorkRhythm,
  ProfessionDomain,
  UserProfile,
  WeekendPreset,
  UserOnboardingAnswers,
  AiOnboardingBlueprint,
} from '../../types';
import {
  WEEKEND_PRESETS_INFO,
  WEEKEND_PRESET_MAPS,
  DAYS_AR,
} from '../../utils/workRhythm';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { aiCoach } from '../../services/aiCoachService';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile?: UserProfile;
}

const EMOJI_OPTIONS = ['⚡', '🚀', '💻', '🎨', '📚', '🎯', '🌿', '🌙', '💡', '🛡️', '🩺', '✨'];

const AVAILABLE_INTERESTS = [
  'الذكاء الاصطناعي',
  'برمجة وتطوير',
  'تصميم واجهات UI/UX',
  'تلاوة وتدبر القرآن',
  'المحافظة على صلاة الفجر',
  'اللياقة والصحة البدنية',
  'القراءة والمطالعة',
  'ريادة الأعمال والبيزنس',
  'العمل العميق (Deep Work)',
  'تنظيم الوقت والعادات',
];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Identity & Domain
  const [name, setName] = useState(activeProfile?.name || 'أحمد');
  const [avatarEmoji, setAvatarEmoji] = useState(activeProfile?.avatarEmoji || '⚡');
  const [domain, setDomain] = useState<ProfessionDomain>(
    activeProfile?.professionDomain || 'software_dev'
  );
  const [customRoleTitle, setCustomRoleTitle] = useState(activeProfile?.customRoleTitle || '');
  const [interests, setInterests] = useState<string[]>(
    activeProfile?.coreInterests && activeProfile.coreInterests.length > 0
      ? activeProfile.coreInterests
      : ['برمجة وتطوير', 'تلاوة وتدبر القرآن', 'المحافظة على صلاة الفجر', 'العمل العميق (Deep Work)']
  );

  // Step 2: Lifestyle & Core Struggle
  const [wakePattern, setWakePattern] = useState<'early_bird' | 'night_owl' | 'flexible'>('early_bird');
  const [primaryStruggle, setPrimaryStruggle] = useState<
    'fajr_prayer' | 'procrastination' | 'distraction' | 'afternoon_crash' | 'consistency'
  >('procrastination');
  const [spiritualPriority, setSpiritualPriority] = useState<
    'fajr_and_sunan' | 'quran_wird' | 'qiyam_and_witr' | 'all_around'
  >('fajr_and_sunan');
  const [focusPreference, setFocusPreference] = useState<'short_bursts' | 'deep_flow'>('short_bursts');
  const [freeTextBio, setFreeTextBio] = useState('');

  // Step 3: AI Personalization & API Key
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiProvider, setApiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [apiKeyTestedSuccess, setApiKeyTestedSuccess] = useState<boolean | null>(null);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [generatedBlueprint, setGeneratedBlueprint] = useState<AiOnboardingBlueprint | null>(null);
  const [blueprintApplied, setBlueprintApplied] = useState(false);

  // Step 4: Work Rhythm & Weekend Customization
  const [weekendPreset, setWeekendPreset] = useState<WeekendPreset>('friday_saturday');
  const [customDayTypes, setCustomDayTypes] = useState<Record<number, DayWorkRhythm>>(() => ({
    ...WEEKEND_PRESET_MAPS.friday_saturday,
  }));

  // Load existing API config on mount
  useEffect(() => {
    aiCoach.getConfig().then((cfg) => {
      if (cfg?.apiKey) {
        setApiKeyInput(cfg.apiKey);
        setApiKeyTestedSuccess(true);
        if (cfg.provider === 'openai' || cfg.provider === 'gemini') {
          setApiProvider(cfg.provider);
        }
      }
    });
  }, []);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    soundSynth.playTactileClick();
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsTestingApiKey(true);
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    try {
      const res = await aiCoach.testConnection({
        provider: apiProvider,
        apiKey: apiKeyInput.trim(),
        model: apiProvider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini',
        enabled: true,
      });
      setApiKeyTestedSuccess(res.success);
      if (res.success) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        await aiCoach.saveConfig({
          provider: apiProvider,
          apiKey: apiKeyInput.trim(),
          model: apiProvider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini',
          enabled: true,
        });
      }
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const handleGenerateBlueprint = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsGeneratingBlueprint(true);
    try {
      // If user typed an API key but didn't click test, save it
      if (apiKeyInput.trim() && !apiKeyTestedSuccess) {
        await aiCoach.saveConfig({
          provider: apiProvider,
          apiKey: apiKeyInput.trim(),
          model: apiProvider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini',
          enabled: true,
        });
      }

      const answers: UserOnboardingAnswers = {
        name: name.trim() || 'صاحب الهمة',
        professionDomain: domain,
        customRoleTitle: customRoleTitle.trim() || undefined,
        wakePattern,
        primaryStruggle,
        spiritualPriority,
        focusPreference,
        freeTextBio: freeTextBio.trim() || undefined,
      };

      const bp = await aiCoach.generateOnboardingBlueprint(answers);
      setGeneratedBlueprint(bp);
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };

  const handleApplyBlueprint = async () => {
    if (!generatedBlueprint) return;
    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();
    await aiCoach.applyAiBlueprint(generatedBlueprint);
    setBlueprintApplied(true);
  };

  const handleSelectPreset = (preset: WeekendPreset) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setWeekendPreset(preset);
    if (preset !== 'custom') {
      setCustomDayTypes({ ...WEEKEND_PRESET_MAPS[preset] });
    }
  };

  const handleCycleDayType = (dayIdx: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setWeekendPreset('custom');
    const current = customDayTypes[dayIdx] || 'full_day';
    const next: DayWorkRhythm =
      current === 'full_day' ? 'half_day' : current === 'half_day' ? 'rest_day' : 'full_day';
    setCustomDayTypes((prev) => ({
      ...prev,
      [dayIdx]: next,
    }));
  };

  const handleFinish = async () => {
    try {
      const profileId = activeProfile?.id || 'profile_default';
      await db.profiles.update(profileId, {
        name: name.trim() || 'صاحب الهمة',
        avatarEmoji,
        professionDomain: domain,
        customRoleTitle: customRoleTitle.trim() || undefined,
        coreInterests: interests,
        onboardingCompleted: true,
      });

      // Apply blueprint settings if generated
      if (generatedBlueprint) {
        await aiCoach.applyAiBlueprint(generatedBlueprint);
      }

      // Save work rhythm config to user state
      const user = await db.user_state.get('current_user');
      if (user) {
        await db.user_state.update('current_user', {
          settings: {
            ...user.settings,
            workRhythmConfig: {
              preset: weekendPreset,
              dayTypes: customDayTypes,
              saturdayType:
                customDayTypes[6] === 'half_day'
                  ? 'half_day'
                  : customDayTypes[6] === 'rest_day'
                  ? 'off'
                  : 'full_day',
              sundayType:
                customDayTypes[0] === 'rest_day'
                  ? 'rest_day'
                  : customDayTypes[0] === 'half_day'
                  ? 'half_day'
                  : 'full_day',
              workdaySessionsTarget: 5,
              halfDaySessionsTarget: 2,
            },
          },
        });
      }

      localStorage.setItem('midmar_onboarding_wizard_seen', 'true');
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      onClose();
    } catch (err) {
      console.error('Failed to save onboarding profile:', err);
      onClose();
    }
  };

  const domainCards: Array<{ id: ProfessionDomain; title: string; desc: string; icon: any }> = [
    {
      id: 'software_dev',
      title: 'هندسة وبرمجة البرمجيات',
      desc: 'Frontend, Backend, Mobile, Full-Stack, AI',
      icon: Laptop,
    },
    {
      id: 'ui_ux_design',
      title: 'تصميم واجهات وتجربة المستخدم',
      desc: 'UI, UX, Figma, Product Design',
      icon: Palette,
    },
    {
      id: 'student_academia',
      title: 'دراسة وأبحاث أكاديمية',
      desc: 'جامعة، ماجستير، دكتوراه، تعلم ذاتي',
      icon: GraduationCap,
    },
    {
      id: 'business_freelance',
      title: 'عمل حر وريادة أعمال',
      desc: 'Freelancer, مشاريع ناشئة, تسويق ومبيعات',
      icon: Briefcase,
    },
    {
      id: 'healthcare',
      title: 'مجال طبي ورعاية صحية',
      desc: 'طب، صيدلة، تمريض، بحوث طبية',
      icon: Stethoscope,
    },
    {
      id: 'custom',
      title: 'مجال مخصص / عام',
      desc: 'صناعة محتوى، إدارة، أهداف عامة',
      icon: Star,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] text-slate-900 dark:text-white"
        dir="rtl"
      >
        {/* Mobile Pull Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header & Steps Progress Bar */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                تهيئة نظام «مِضمار» الذكي المخصص لك
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              خطوة {step} من 4
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Contents */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {/* STEP 1: Name, Avatar & Domain */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  أهلاً بك في مِضمار! كيف تحب أن نناديك؟
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  حدد هويتك ومجالك المهني لتخصيص لوحة الإنجاز والتوجيه اليومي
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  اختر رمزك الشخصي:
                </label>
                <div className="flex flex-wrap gap-2 justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarEmoji(emoji)}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                        avatarEmoji === emoji
                          ? 'bg-emerald-600 text-white shadow-md scale-110'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  اسمك أو كنيتك:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد، م. عمر، أبو عبد الله..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>

              {/* Domain Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  مجالك وتخصصك الأساسي:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {domainCards.map((card) => {
                    const Icon = card.icon;
                    const isSelected = domain === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setDomain(card.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-2xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs leading-tight mb-0.5">{card.title}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {card.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  المسمى الدقيق (اختياري):
                </label>
                <input
                  type="text"
                  value={customRoleTitle}
                  onChange={(e) => setCustomRoleTitle(e.target.value)}
                  placeholder="مثال: Full-Stack Developer، باحث أكاديمي، مصمم منتجات..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              {/* Core Interests */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  اهتماماتك وأولوياتك الرئيسية:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isSelected = interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {interest} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Lifestyle, Energy & Core Struggle */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  فهم نمط حياتك وطبيعة طاقتك
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  الذكاء الاصطناعي لا يفرض عليك قالباً واحداً؛ بل يتكيف مع ساعتك البيولوجية وتحدياتك
                </p>
              </div>

              {/* Wake Pattern */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ١. نمط استيقاظك ونومك المعتاد:
                </label>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setWakePattern('early_bird')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      wakePattern === 'early_bird'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <Sun className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                    <span className="font-black block">طائر مبكر 🌅</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">أفضل طاقتي فجراً وصباحاً</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWakePattern('night_owl')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      wakePattern === 'night_owl'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <Moon className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
                    <span className="font-black block">مسائي / ليلي 🌙</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">يزداد تركيزي في هدوء الليل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWakePattern('flexible')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      wakePattern === 'flexible'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <Zap className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                    <span className="font-black block">مرن / متقلب ⚡</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">حسب ظروف العمل والدراسة</span>
                  </button>
                </div>
              </div>

              {/* Primary Struggle */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ٢. ما هو أكبر تحدٍ أو معاناة تود التغلب عليها في مِضمار؟
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'fajr_prayer', label: 'المحافظة على صلاة الفجر في وقتها 🕌', desc: 'صعوبة الاستيقاظ وتذبذب النوم' },
                    { id: 'procrastination', label: 'التسويف وصعوبة بدء المهام ⏳', desc: 'المقاومة النفسية وتأجيل العمل المهم' },
                    { id: 'distraction', label: 'التشتت الرقمي وتصفح الهاتف 📱', desc: 'ضياع ساعات في وسائل التواصل والتنقل' },
                    { id: 'afternoon_crash', label: 'هبوط الطاقة الشديد بعد الظهر 🔋', desc: 'الخمول وضياع النصف الثاني من اليوم' },
                    { id: 'consistency', label: 'تذبذب الالتزام (الحماس ثم الانقطاع) 📉', desc: 'أبدأ بقوة ثم أتوقف بعد أيام قليلة' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPrimaryStruggle(s.id as any)}
                      className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer ${
                        primaryStruggle === s.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 font-bold ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black">{s.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spiritual Priority & Focus Preference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    ٣. أولويتك الروحية الكبرى:
                  </label>
                  <select
                    value={spiritualPriority}
                    onChange={(e) => setSpiritualPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="fajr_and_sunan">المحافظة على الفجر والسنن الرواتب (١٢ ركعة)</option>
                    <option value="quran_wird">تثبيت ورد القرآن اليومي وتدبره</option>
                    <option value="qiyam_and_witr">قيام الليل والشفع والوتر (مراتب الآيات)</option>
                    <option value="all_around">بناء توازن روحي شامل وهادئ</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    ٤. أسلوب التركيز المفضل لديك:
                  </label>
                  <select
                    value={focusPreference}
                    onChange={(e) => setFocusPreference(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="short_bursts">جلسات مجهرية قصيرة وسريعة (١٥ - ٢٠ دقيقة)</option>
                    <option value="deep_flow">جلسات عمل عميق متصلة (٣٠ - ٤٥ دقيقة)</option>
                  </select>
                </div>
              </div>

              {/* Free-form Bio / Behavioral Reflection for AI Analysis */}
              <div className="space-y-1.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>٥. صف روتينك أو التحدي الأكبر لديك بحرية (اختياري للذكاء الاصطناعي):</span>
                  </label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/40">
                    تحليل إدراكي عميق
                  </span>
                </div>
                <textarea
                  value={freeTextBio}
                  onChange={(e) => setFreeTextBio(e.target.value)}
                  rows={2}
                  placeholder="مثال: أنا مهندس برمجيات أعمل عن بُعد، أسهر كثيراً بعد منتصف الليل وأجد صعوبة في الاستيقاظ لصلاة الفجر، وأسوّف المهام التقنية المعقدة حتى يتراكم الضغط..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all leading-relaxed"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  سيستخدم الذكاء الاصطناعي هذا الوصف لكشف الأسباب النفسية للتسويف وبناء جدول مواقيت وتركيز مخصص تماماً لواقعك.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: AI Intelligence, API Key & Tailored Blueprint */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-black mb-1">
                  <Bot className="w-3.5 h-3.5" />
                  <span>المحرك الإدراكي الفائق (AI Blueprint)</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  فهمك وتحليل سلوكك واختيار المنظومة المنطقية المناسبة لك
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  أدخل مفتاح الـ API الخاص بك لتفعيل الذكاء الكامل، أو استخدم محرك التحليل السلوكي المحلي فوراً
                </p>
              </div>

              {/* API Key Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/60 dark:from-indigo-950/30 dark:via-[#161724] dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      ربط مفتاح الذكاء الاصطناعي (Gemini API Key):
                    </span>
                  </div>

                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-bold"
                  >
                    <span>احصل على مفتاح مجاني من Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setApiKeyTestedSuccess(null);
                      }}
                      placeholder="AIzaSy... الصق مفتاح الـ API هنا"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={!apiKeyInput.trim() || isTestingApiKey}
                    className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                  >
                    {isTestingApiKey ? (
                      <span className="animate-spin text-sm">⏳</span>
                    ) : apiKeyTestedSuccess ? (
                      <Check className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <span>فحص وحفظ</span>
                    )}
                    <span>{apiKeyTestedSuccess ? 'متصل بنجاح ✔' : 'تحقق'}</span>
                  </button>
                </div>

                {apiKeyTestedSuccess && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                    <span>✨</span>
                    <span>تم التحقق من مفتاح الـ API بنجاح! المرشد السلوكي جاهز بقدرات Gemini 2.0 الكاملة.</span>
                  </p>
                )}
                {!apiKeyInput.trim() && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    💡 يمكنك المتابعة الآن دون إدخال المفتاح؛ وسيتولى المحرك السلوكي المحلي (Offline Engine) تحليل شخصيتك فوراً.
                  </p>
                )}
              </div>

              {/* Generate Blueprint CTA Button */}
              {!generatedBlueprint ? (
                <div className="text-center py-2">
                  <button
                    type="button"
                    onClick={handleGenerateBlueprint}
                    disabled={isGeneratingBlueprint}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-sm font-black shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    {isGeneratingBlueprint ? (
                      <>
                        <span className="animate-spin text-lg">🪄</span>
                        <span>الذكاء الاصطناعي يحلل نمطك ويصمم خطتك الآن...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>تحليل نمطي وتوليد خطتي الذكية المناسبة فوراً</span>
                        <span>⚡</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Generated Blueprint Card */
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 via-slate-50 to-white dark:from-emerald-950/30 dark:via-zinc-900/60 dark:to-zinc-950 border-2 border-emerald-500/40 space-y-4 animate-scale-in shadow-md">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm shadow-xs font-bold">
                        🧬
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          النمط المقترح: {generatedBlueprint.circadianArchetype}
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                          تم تحليله بناءً على معاناتك مع ({primaryStruggle === 'fajr_prayer' ? 'الفجر' : 'التسويف'})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateBlueprint}
                      className="text-[11px] text-slate-500 hover:text-emerald-600 font-bold cursor-pointer"
                    >
                      إعادة توليد 🔄
                    </button>
                  </div>

                  {/* Diagnosis */}
                  <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-slate-800 dark:text-zinc-200 leading-relaxed font-medium">
                    {generatedBlueprint.psychologicalDiagnosis}
                  </div>

                  {/* Recommended Logical Defaults Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                      <span className="text-[10px] text-slate-500 block">مدة جلسة التركيز</span>
                      <strong className="text-slate-900 dark:text-white font-black text-xs sm:text-sm">
                        {generatedBlueprint.recommendedSprintMinutes} دقيقة ⏱️
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                      <span className="text-[10px] text-slate-500 block">مرتبة قيام الليل</span>
                      <strong className="text-slate-900 dark:text-white font-black text-xs sm:text-sm">
                        {generatedBlueprint.recommendedQiyamAyatTarget} آيات 🌙
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                      <span className="text-[10px] text-slate-500 block">الورد القرآني</span>
                      <strong className="text-slate-900 dark:text-white font-black text-xs sm:text-sm">
                        {generatedBlueprint.recommendedSpiritualPreset === 'baqarah_only'
                          ? 'سورة البقرة 📖'
                          : 'المنجيات والفضائل 🌿'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                      <span className="text-[10px] text-slate-500 block">النشاط البدني</span>
                      <strong className="text-slate-900 dark:text-white font-black text-xs sm:text-sm">
                        {generatedBlueprint.dailyStepGoal} خطوة 👟
                      </strong>
                    </div>
                  </div>

                  {/* 3 Atomic Friction Hacks */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-black text-slate-900 dark:text-white block flex items-center gap-1">
                      <span>🛡️</span>
                      <span>الحيل الذرية الموصى بها للتغلب على معاناتك:</span>
                    </span>
                    <ul className="space-y-1 text-slate-700 dark:text-zinc-300 leading-relaxed pr-2">
                      {generatedBlueprint.atomicFrictionHacks.map((hack, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold shrink-0">•</span>
                          <span>{hack}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Apply Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleApplyBlueprint}
                      disabled={blueprintApplied}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        blueprintApplied
                          ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs active:scale-98'
                      }`}
                    >
                      {blueprintApplied ? <CheckCircle2 className="w-4 h-4" /> : <span>✅</span>}
                      <span>{blueprintApplied ? 'تم تطبيق هذه الخطة على حسابك بنجاح' : 'اعتماد وتطبيق هذه الخطة على حسابي الآن'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Work Rhythm & Weekend Customization */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  ما هو نظام أيام عملك وعطلتك الأسبوعية؟
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  اختر النظام المطابق لجدولك أو خصص كل يوم بنفسك
                </p>
              </div>

              {/* Preset Cards List */}
              <div className="space-y-2">
                {WEEKEND_PRESETS_INFO.map((p) => {
                  const isSelected = weekendPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.id)}
                      className={`w-full p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm ring-2 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {p.titleAr}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {p.descAr}
                        </p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive 7-Day Matrix for Visual Schedule & Custom Toggling */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>خريطة أيام أسبوعك الحالية:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {weekendPreset === 'custom' ? '🛠️ تخصيص حر' : 'مربوط بالخيار أعلاه'}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                    const rType = customDayTypes[dayIdx] || 'full_day';
                    const isRest = rType === 'rest_day';
                    const isHalf = rType === 'half_day';
                    const isFri = rType === 'friday_special';

                    return (
                      <button
                        key={dayIdx}
                        type="button"
                        onClick={() => handleCycleDayType(dayIdx)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer select-none active:scale-95 ${
                          isRest
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : isHalf
                            ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                            : isFri
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                        title="انقر للتبديل بين (عمل كامل / نصف يوم / عطلة)"
                      >
                        <span className="text-[11px] font-bold">{DAYS_AR[dayIdx]}</span>
                        <span className="text-[10px] font-mono leading-none">
                          {isRest ? '🌴 عطلة' : isHalf ? '⚡ نصف' : isFri ? '🕌 سنن' : '🎯 عمل'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                  💡 يمكنك النقر على أي يوم لتبديل حالته مباشرة بين: (عمل كامل 🎯 / نصف يوم ⚡ / عطلة 🌴)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setStep((s) => (s - 1) as any);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setStep((s) => (s + 1) as any);
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
            >
              <span>التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>اعتماد وتفعيل النظام الذكي الآن 🚀</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
