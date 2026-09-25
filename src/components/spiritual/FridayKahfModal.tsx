import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Heart,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { awardSpiritualHabitPoints } from '../../utils/gamification';
import { SURAH_KAHF_VERSES, KAHF_THEMATIC_STORIES } from '../../data/surahKahfData';

export interface FridayKahfModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCompleted?: boolean;
  onCompleted?: () => void;
  onRewardToast?: (msg: string) => void;
}

type KahfModalTab = 'reader' | 'lessons' | 'salawat';

export const FridayKahfModal: React.FC<FridayKahfModalProps> = ({
  isOpen,
  onClose,
  isCompleted = false,
  onCompleted,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<KahfModalTab>('reader');
  const [fontSize, setFontSize] = useState<number>(20);
  const [completed, setCompleted] = useState<boolean>(isCompleted);

  // Salawat counter state
  const [salawatCount, setSalawatCount] = useState<number>(() => {
    return Number(localStorage.getItem('midmar_friday_salawat') || '0');
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCompleted(isCompleted);
  }, [isCompleted]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleIncrementSalawat = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const next = salawatCount + 1;
    setSalawatCount(next);
    localStorage.setItem('midmar_friday_salawat', String(next));

    if (next % 100 === 0) {
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `👑 هنيئاً لك! أتممت ${next} صلاة على الحبيب المصطفى ﷺ!`
            : `👑 Blessed! You completed ${next} Salawat on the Prophet ﷺ!`
        );
      }
    }
  };

  const handleResetSalawat = () => {
    soundSynth.playTactileClick();
    setSalawatCount(0);
    localStorage.setItem('midmar_friday_salawat', '0');
  };

  const handleMarkCompleted = async () => {
    if (completed) return;
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();

    try {
      await awardSpiritualHabitPoints('kahf', 'سورة الكهف');
      setCompleted(true);
      if (onCompleted) onCompleted();
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? '✨ تقبل الله! أتممت قراءة سورة الكهف (+30 XP) • نور ما بين الجمعتين'
            : '✨ Accepted! You completed Surah Al-Kahf (+30 XP) • Light between Fridays'
        );
      }
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#12131F] border border-slate-200 dark:border-white/[0.09] shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  {isAr ? 'بركة الجمعة' : 'Friday Barakah'}
                </span>
                <span className="text-xs text-slate-400 font-mono">110 {isAr ? 'آية' : 'verses'}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {isAr ? 'سورة الكهف والصلاة على النبي ﷺ' : 'Surah Al-Kahf & Friday Salawat'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {completed && (
              <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تمت القراءة' : 'Read'}</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-slate-100/80 dark:bg-black/30 border-b border-slate-200/80 dark:border-white/[0.06] shrink-0">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('reader');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'reader'
                ? 'bg-white dark:bg-[#1A1C2E] text-amber-700 dark:text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isAr ? 'المصحف الشريف (110 آيات)' : 'Complete Surah Reader'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('lessons');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'lessons'
                ? 'bg-white dark:bg-[#1A1C2E] text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isAr ? 'تدبر القصص الأربع والقيادة' : 'The 4 Life Lessons'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('salawat');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'salawat'
                ? 'bg-white dark:bg-[#1A1C2E] text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{isAr ? `الصلاة على النبي (${salawatCount})` : `Salawat (${salawatCount})`}</span>
          </button>
        </div>

        {/* Tab 1: Complete Surah Reader */}
        {activeTab === 'reader' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Font Zoom Controls & Virtues Bar */}
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                {isAr
                  ? '«مَنْ قَرَأَ سُورَةَ الْكَهْفِ فِي يَوْمِ الْجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ»'
                  : '"Whoever reads Surah Al-Kahf on Friday will have a light shining between the two Fridays."'}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setFontSize((prev) => Math.max(16, prev - 2))}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize((prev) => Math.min(32, prev + 2))}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Verses Scroll Area */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4 scrollbar-thin bg-amber-50/20 dark:bg-black/20"
              style={{ fontSize: `${fontSize}px` }}
            >
              {/* Basmalah */}
              <div className="text-center py-4 text-emerald-700 dark:text-emerald-400 font-serif font-black tracking-wide">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>

              {/* Quranic Text Flow */}
              <div className="leading-[2.4] font-serif text-slate-900 dark:text-zinc-100 text-justify tracking-wide selection:bg-amber-200 dark:selection:bg-amber-900/50">
                {SURAH_KAHF_VERSES.map((v) => (
                  <span key={v.number} className="inline">
                    {v.text}{' '}
                    <span className="inline-flex items-center justify-center w-7 h-7 mx-1 text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 rounded-full border border-amber-300 dark:border-amber-800 align-middle">
                      {v.number}
                    </span>{' '}
                  </span>
                ))}
              </div>
            </div>

            {/* Reader Footer: Mark Complete Action */}
            <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3 shrink-0 bg-slate-50/80 dark:bg-white/[0.02]">
              <span className="text-xs text-slate-500 font-mono">
                {isAr ? 'أجر القراءة: +30 XP في مضمار' : 'Completion reward: +30 XP'}
              </span>

              <button
                type="button"
                onClick={handleMarkCompleted}
                disabled={completed}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer ${
                  completed
                    ? 'bg-emerald-600 text-white cursor-default opacity-90'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {completed
                    ? (isAr ? 'تمت القراءة بنجاح ✓' : 'Completed ✓')
                    : (isAr ? 'تأكيد إتمام السورة (+30 XP)' : 'Mark Surah as Read (+30 XP)')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: The 4 Life Lessons & Executive Leadership */}
        {activeTab === 'lessons' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200">
              💡 {isAr
                ? 'سورة الكهف هي درع المسلم ضد فتن الزمان الأربع: فتنة الدين، فتنة المال، فتنة العلم، وفتنة السلطة.'
                : 'Surah Al-Kahf provides immunity against the 4 core trials: Faith, Wealth, Knowledge, and Power.'}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {KAHF_THEMATIC_STORIES.map((story) => (
                <div
                  key={story.id}
                  className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-zinc-800">{story.icon}</span>
                      <div>
                        <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {story.versesRange}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {isAr ? story.titleAr : story.titleEn}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {story.summaryAr}
                  </p>

                  <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                      {isAr ? 'الدرس القيادي والتنفيذي للمسلم المعاصر:' : 'Leadership & Executive Takeaway:'}
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {isAr ? story.pmTakeawayAr : story.pmTakeawayEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Salawat Counter */}
        {activeTab === 'salawat' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="space-y-2 max-w-md">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                {isAr ? 'سيد الأيام والبركة' : 'Friday Master of Days'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                «أَكْثِرُوا عَلَيَّ مِنَ الصَّلَاةِ يَوْمَ الْجُمُعَةِ وَلَيْلَةَ الْجُمُعَةِ»
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAr
                  ? 'صلاة واحدة ترفعك بها عشر درجات، وتُحط عنك بها عشر خطيئات، وتكفى بها همك ويُغفر ذنبك.'
                  : 'Sending one blessing upon the Prophet raises you ten ranks, removes ten sins, and relieves your worries.'}
              </p>
            </div>

            {/* Giant Circular Counter Button */}
            <button
              type="button"
              onClick={handleIncrementSalawat}
              className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl shadow-emerald-600/30 flex flex-col items-center justify-center gap-1 transition-transform active:scale-90 cursor-pointer border-4 border-white/20 select-none group"
            >
              <Heart className="w-8 h-8 fill-white/80 group-hover:scale-125 transition-transform" />
              <span className="text-3xl sm:text-4xl font-mono font-black">{salawatCount}</span>
              <span className="text-[11px] font-sans font-bold opacity-90">
                {isAr ? 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ' : 'Tap to Count'}
              </span>
            </button>

            {/* Alternative Formulation & Reset */}
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400 font-mono">
                {isAr ? 'الصيغة الإبراهيمية أو الموجزة' : 'Ibrahimiyyah or Concise'}
              </span>
              {salawatCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetSalawat}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تصفير العداد' : 'Reset'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
