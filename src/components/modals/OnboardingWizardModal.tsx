import React, { useState } from 'react';
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
} from 'lucide-react';
import { db } from '../../db/db';
import type { DayWorkRhythm, ProfessionDomain, UserProfile, WeekendPreset } from '../../types';
import {
  WEEKEND_PRESETS_INFO,
  WEEKEND_PRESET_MAPS,
  DAYS_AR,
} from '../../utils/workRhythm';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  // Step 3: Work Rhythm & Weekend Customization
  const [weekendPreset, setWeekendPreset] = useState<WeekendPreset>('friday_saturday');
  const [customDayTypes, setCustomDayTypes] = useState<Record<number, DayWorkRhythm>>(() => ({
    ...WEEKEND_PRESET_MAPS.friday_saturday,
  }));

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    soundSynth.playTactileClick();
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
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
      title: 'تصميم تجربة وواجهات المستخدم',
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
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div
        className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white"
        dir="rtl"
      >
        {/* Mobile Pull Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Progress Bar & Header */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                تهيئة نظام «مِضمار» المخصص لك
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              خطوة {step} من 3
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Contents */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Name & Avatar */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  أهلاً بك في مِضمار! كيف تحب أن نناديك؟
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  حدد اسمك ورمزك الشخصي لتخصيص لوحة الإنجاز والتوجيه اليومي
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  اختر رمزك / الأفاتار:
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
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  اسمك أو كنيتك:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد، م. عمر، أبو عبد الله..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Field, Profession & Interests */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  ما هو مجالك المهني واهتماماتك الأساسية؟
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  لنقترح عليك مهام عمل ذكية ومناسبة لطبيعة مجالك بدون أن تبدأ من الصفر
                </p>
              </div>

              {/* Domain Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {domainCards.map((card) => {
                  const Icon = card.icon;
                  const isSelected = domain === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setDomain(card.id)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm ring-2 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
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
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {card.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Role Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  المسمى أو التخصص الدقيق (اختياري):
                </label>
                <input
                  type="text"
                  value={customRoleTitle}
                  onChange={(e) => setCustomRoleTitle(e.target.value)}
                  placeholder="مثال: Full-Stack Developer أو طالب ماجستير..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              {/* Interests Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  جوانب ترغب في التركيز عليها:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isChecked = interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Work Rhythm & Weekend Customization */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  ما هو نظام أيام عملك وعطلتك الأسبوعية؟
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  راعينا كافة الفروق: اختر النظام المطابق لجدولك أو خصص كل يوم بنفسك
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
                    <span>خريطة أيام أسبوعك الحالية (انقر على أي يوم لتعديله):</span>
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

        {/* Footer Navigation Buttons with Clear High-Contrast Colors */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
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

          {step < 3 ? (
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>اعتماد وتفعيل النظام الآن 🚀</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
