import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Check,
  Dumbbell,
  ArrowLeft,
  ArrowRight,
  Sun,
  Car,
  Utensils,
} from 'lucide-react';
import type { UserState, DailyRoutineAnswers } from '../../types';
import { db } from '../../db/db';
import { calculateSmartDailySchedule } from '../../utils/lifestyleEngine';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface SmartRoutineWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState?: UserState;
  onRewardToast?: (msg: string) => void;
}

export const SmartRoutineWizardModal: React.FC<SmartRoutineWizardModalProps> = ({
  isOpen,
  onClose,
  userState,
  onRewardToast,
}) => {
  const [step, setStep] = useState<number>(1);

  // Initial answers from saved state or smart defaults
  const savedAnswers = userState?.settings?.dailyRoutineAnswers;
  const [answers, setAnswers] = useState<DailyRoutineAnswers>(() => {
    return (
      savedAnswers || {
        activityType: 'office_job',
        commuteMinutes: 0,
        cooksFood: false,
        cookingWindow: 'pre_dhuhr',
        cookingMinutes: 60,
        workoutPreference: 'gym_iron',
        workStartHour: 9,
        workEndHour: 17,
        targetSleepHours: 7,
        autoSuggestWakeup: true,
        customWakeupTime: '05:00',
      }
    );
  });

  if (!isOpen) return null;

  // Real-time calculation based on current answers
  const scheduleRec = calculateSmartDailySchedule(answers);

  const handleApplySchedule = async () => {
    soundSynth.playCompletionChime();
    haptic.vibrateWorkDone();

    if (userState) {
      await db.user_state.update('current_user', {
        'settings.dailyRoutineAnswers': {
          ...answers,
          calculatedAt: new Date().toISOString(),
          suggestedWakeupTime: scheduleRec.suggestedWakeupTime,
        },
        'settings.lifestylePersona': scheduleRec.matchedPersona,
        'settings.stationCustomOverrides': {
          ...(userState.settings.stationCustomOverrides || {}),
          ...scheduleRec.stationOverrides,
        },
      });
    }

    onRewardToast?.('🌟 تم اعتماد روتينك الذكي بنجاح وتحديث جميع محطات يومك!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                المُعالج الذكي لبناء روتينك اليومي 🧭
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                أجب على أسئلة سريعة لنقترح لك جدولاً متناغماً تماماً مع واقعك ومواقيت الصلاة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="px-5 py-2.5 bg-slate-100/60 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
          <span>الخطوة {step} من 5</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step
                    ? 'w-6 bg-amber-500'
                    : s < step
                    ? 'w-3 bg-emerald-500'
                    : 'w-2 bg-slate-300 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Activity & Life Nature */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>1️⃣</span>
                  <span>ما هي طبيعة نشاطك ويومك الأساسي؟</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اختر النمط الأقرب ليومك الحالي لنكيف المحطات والمفردات معك
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'office_job',
                    title: 'موظف بدوام مكتبي كامل / جزئي',
                    desc: 'عمل وظيفي رسمي يتطلب التزاماً بمواعيد محددة ومواصلات',
                    icon: '💼',
                  },
                  {
                    id: 'freelance_remote',
                    title: 'مستقل / صانع محتوى (Freelancer)',
                    desc: 'مواعيد عمل مرنة ومنزلية مع تسليم مشاريع للعملاء',
                    icon: '💻',
                  },
                  {
                    id: 'remote_teacher',
                    title: 'معلم ومدرّس عن بعد بمواعيد مرنة',
                    desc: 'حصص افتراضية، تدريس خصوصي، وشرح وتطوير مناهج',
                    icon: '🎓',
                  },
                  {
                    id: 'dedicated_learning',
                    title: 'متفرغ للتعلم الذاتي وبناء المهارات',
                    desc: 'دراسة كورس مكثف، تعلم برمجة/لغات بدل الشغل التقليدي',
                    icon: '💡',
                  },
                  {
                    id: 'homemaker_cooking',
                    title: 'ربة منزل وإدارة الأسرة والطهي',
                    desc: 'إدارة شؤون المنزل، إعداد الوجبات، رعاية الأسرة والسكينة',
                    icon: '🌸',
                  },
                  {
                    id: 'seeking_flexible',
                    title: 'متفرغ حالياً / باحث عن شغف (بدون وظيفة)',
                    desc: 'تنظيم اليوم والصلوات والمهارات الشخصية دون ضغط وظيفي',
                    icon: '🕊️',
                  },
                  {
                    id: 'student',
                    title: 'طالب دراسي أو باحث أكاديمي',
                    desc: 'محاضرات، مذاكرة، ومشاريع تخرج أو دراسات عليا',
                    icon: '📚',
                  },
                ].map((item) => {
                  const isSelected = answers.activityType === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setAnswers({ ...answers, activityType: item.id as any });
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 shadow-sm ring-1 ring-amber-500'
                          : 'bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Commute Questionnaire */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>2️⃣</span>
                  <span>المواصلات والتحرك اليومي 🚗</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  كم دقيقة تستغرق المواصلات يومياً ذهاباً وعودة لمقر العمل أو الدراسة؟
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setAnswers({ ...answers, commuteMinutes: 0 });
                  }}
                  className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                    answers.commuteMinutes === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🏡</span>
                    {answers.commuteMinutes === 0 && <Check className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white mt-2">
                    أعمل / أدرس من المنزل (0 دقيقة مواصلات)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    لا يوجد هدر في الطريق، واستثمار كامل لوقت الصباح في الورد والسكينة
                  </p>
                </button>

                <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                    لدي مواصلات، وأستغرق تقريباً:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[15, 30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          setAnswers({ ...answers, commuteMinutes: mins });
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          answers.commuteMinutes === mins
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        {mins} دقيقة
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Cooking & Meal Prep */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>3️⃣</span>
                  <span>الطبخ وإعداد الطعام والوجبات 🍳</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  هل تطبخين/تطبخ بنفسك وما هو الوقت المناسب لإدراجه ضمن محطاتك؟
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setAnswers({ ...answers, cooksFood: false });
                  }}
                  className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                    !answers.cooksFood
                      ? 'bg-slate-100 dark:bg-zinc-800 border-slate-400 ring-1 ring-slate-400'
                      : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <span className="text-lg">🚫</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white mt-2">
                    لست مسؤولاً عن الطبخ / وجبات جاهزة
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    لن يتم حجز محطة زمنية مخصصة للطهي في جدولك
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setAnswers({ ...answers, cooksFood: true });
                  }}
                  className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                    answers.cooksFood
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500'
                      : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <span className="text-lg">🍲</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white mt-2">
                    نعم، أطبخ الوجبات وأريد إدراجها بجدولي
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تخصيص وقت محدد مع تشغيل أذكار الطهي والسكينة الأسرية
                  </p>
                </button>
              </div>

              {answers.cooksFood && (
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      فترة الطهي المفضلة:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'pre_dhuhr', label: 'قبل الظهر (11:30)' },
                        { id: 'after_dhuhr', label: 'بعد الظهر (13:30)' },
                        { id: 'pre_maghrib', label: 'قبل المغرب (16:30)' },
                        { id: 'evening', label: 'فترة المساء (19:00)' },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setAnswers({ ...answers, cookingWindow: w.id as any })}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            answers.cookingWindow === w.id
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      المدة التقريبية لإعداد الطعام:
                    </label>
                    <div className="flex items-center gap-2">
                      {[30, 45, 60, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setAnswers({ ...answers, cookingMinutes: d })}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            answers.cookingMinutes === d
                              ? 'bg-rose-600 text-white'
                              : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          {d} دقيقة
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Workout & Fitness Preference */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>4️⃣</span>
                  <span>النشاط البدني والرياضة 🏋️</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اختر ما يناسب صحتك ورغبتك (بدون أي إجبار على الجيم!)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'gym_iron',
                    title: 'نادي رياضي وأوزان وحديد (Gym)',
                    desc: 'تمارين القوة، البار، ورفع الأثقال وتتبع الأوزان',
                    icon: '🏋️‍♂️',
                  },
                  {
                    id: 'home_calisthenics',
                    title: 'تمارين لياقة وتمدد منزلية',
                    desc: 'ضغط، قرفصاء، وبلانك في البيت دون الحاجة لمعدات',
                    icon: '🤸‍♂️',
                  },
                  {
                    id: 'outdoor_walk',
                    title: 'مشي في الهواء الطلق',
                    desc: 'مشي خفيف لتصفية الذهن واستنشاق الأكسجين وتجديد الدورة الدموية',
                    icon: '🚶‍♂️',
                  },
                  {
                    id: 'none_rest',
                    title: 'لا أمارس الرياضة حالياً (راحة واستجمام)',
                    desc: 'تحويل المحطة لجلسة استرخاء ذاتية، شاي هادئ، وعناية شخصية',
                    icon: '☕',
                  },
                ].map((item) => {
                  const isSelected = answers.workoutPreference === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setAnswers({ ...answers, workoutPreference: item.id as any });
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-1 ring-purple-500'
                          : 'bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          {isSelected && <Check className="w-4 h-4 text-purple-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Wakeup & Smart Schedule Recommendation */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>5️⃣</span>
                  <span>المقترح الذكي لوقت الاستيقاظ والروتين 🌅</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  محسوب بالذكاء الاصطناعي بناءً على صلاة الفجر ومواعيدك ومواصلاتك
                </p>
              </div>

              {/* Wakeup Mode Toggle */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAnswers({ ...answers, autoSuggestWakeup: true })}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    answers.autoSuggestWakeup
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  ✨ اقتراح وقت الاستيقاظ آلياً (موصى به)
                </button>
                <button
                  type="button"
                  onClick={() => setAnswers({ ...answers, autoSuggestWakeup: false })}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    !answers.autoSuggestWakeup
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  ⏰ تحديد وقت يدوي
                </button>
              </div>

              {!answers.autoSuggestWakeup && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    وقت الاستيقاظ المفضل:
                  </span>
                  <input
                    type="time"
                    value={answers.customWakeupTime || '05:00'}
                    onChange={(e) => setAnswers({ ...answers, customWakeupTime: e.target.value })}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-400 font-mono font-bold text-xs"
                  />
                </div>
              )}

              {/* Recommendation Card */}
              <div className="p-5 rounded-3xl bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/5 dark:to-zinc-900/40 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                        الخطة الزمنية المقترحة
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        استيقاظ مثالي: {scheduleRec.suggestedWakeupTime} ص • نوم مستهدف:{' '}
                        {scheduleRec.suggestedBedtime} م
                      </h4>
                    </div>
                  </div>

                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    {scheduleRec.matchedPersona === 'homemaker_family'
                      ? '🌸 ربة منزل'
                      : scheduleRec.matchedPersona === 'remote_teacher_flexible'
                      ? '🎓 معلم عن بعد'
                      : scheduleRec.matchedPersona === 'dedicated_learner'
                      ? '💡 متعلم ذاتي'
                      : scheduleRec.matchedPersona === 'freelancer_creator'
                      ? '💻 مستقل'
                      : scheduleRec.matchedPersona === 'seeker_nonworking'
                      ? '🕊️ متفرغ'
                      : '💼 عمل مكتبي'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-zinc-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{scheduleRec.fajrSyncNote}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{scheduleRec.commuteSummary}</span>
                  </div>
                  {scheduleRec.cookingSummary && (
                    <div className="flex items-center gap-2">
                      <Utensils className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{scheduleRec.cookingSummary}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>النشاط: {scheduleRec.workoutSummary}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setStep(step - 1);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setStep(step + 1);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <span>التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplySchedule}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>اعتماد وتطبيق هذا الروتين فوراً ✅</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
