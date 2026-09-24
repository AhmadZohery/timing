import React, { useState } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { awardSpiritualHabitPoints, upsertDailyLog, getBiologicalDate } from '../../utils/gamification';
import { getHijriDateDetails } from '../../utils/prayerCalculator';

export interface FastingReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFastingToday?: boolean;
  onRewardToast?: (msg: string) => void;
}

export const FastingReminderModal: React.FC<FastingReminderModalProps> = ({
  isOpen,
  onClose,
  isFastingToday = false,
  onRewardToast,
}) => {
  const [fastingLogged, setFastingLogged] = useState(isFastingToday);
  const [intentionForTomorrow, setIntentionForTomorrow] = useState(false);

  // Day & Hijri detection
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const isTodayMon = dayOfWeek === 1;
  const isTodayThu = dayOfWeek === 4;
  const isTomorrowMon = dayOfWeek === 0;
  const isTomorrowThu = dayOfWeek === 3;

  const hijri = getHijriDateDetails(now);
  const isWhiteDayToday = hijri.isWhiteDay;
  const isWhiteDayTomorrow = hijri.isTomorrowWhiteDay;

  // Calculate next Monday and Thursday
  const getNextDayOfWeek = (targetDay: number) => {
    const d = new Date();
    const current = d.getDay();
    let diff = targetDay - current;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('ar-EG', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const nextMonday = getNextDayOfWeek(1);
  const nextThursday = getNextDayOfWeek(4);

  const handleLogFastingToday = async () => {
    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();

    setFastingLogged(true);
    const todayStr = getBiologicalDate(true);

    const fastingType = isTodayMon
      ? 'monday'
      : isTodayThu
      ? 'thursday'
      : isWhiteDayToday
      ? 'white_days'
      : 'voluntary';
    await upsertDailyLog(todayStr, {
      fastingDone: true,
      fastingType,
    });

    const title = isWhiteDayToday
      ? `صيام الأيام البيض (${hijri.day} ${hijri.monthNameAr})`
      : isTodayMon
      ? 'صيام يوم الإثنين'
      : isTodayThu
      ? 'صيام يوم الخميس'
      : 'صيام التطوع المبارك';
    const res = await awardSpiritualHabitPoints('fasting' as any, title);
    if (onRewardToast && res.message) {
      onRewardToast(res.message);
    } else if (onRewardToast) {
      onRewardToast('🤍 تقبل الله طاعتك وصيامك! تم تسجيل صيام اليوم بنجاح (+25 نقطة)');
    }
  };

  const handleIntention = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIntentionForTomorrow(true);
    if (onRewardToast) {
      onRewardToast('🌙 بارك الله فيك! كُتب لك أجر نية الصيام وعزم الطاعة.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[92vh] rounded-3xl bg-slate-900 border border-emerald-900/50 shadow-2xl flex flex-col overflow-hidden text-right cursor-default animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-amber-950/40 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
              🌙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  سُنَنُ الصِّيَامِ وَفَضَائِلُهُ الْمُبَارَكَةُ
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  باب الريان
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                «كُلُّ عَمَلِ ابْنِ آدَمَ لَهُ إِلَّا الصِّيَامَ فَإِنَّهُ لِي وَأَنَا أَجْزِي بِهِ»
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
          {/* Status / Quick Action Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-indigo-950/40 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-emerald-300 block">
                  {isWhiteDayToday
                    ? `اليوم ${hijri.formattedAr} • من الأيام البيض المباركة (صيام الدهر كله) 🌟`
                    : isTodayMon
                    ? `اليوم الإثنين (${hijri.formattedAr}) • يوم عرض الأعمال على الله`
                    : isTodayThu
                    ? `اليوم الخميس (${hijri.formattedAr}) • يوم عرض الأعمال وتجديد العهد`
                    : isWhiteDayTomorrow
                    ? `غداً تبدأ الأيام البيض (${hijri.day + 1} ${hijri.monthNameAr}) • صيام الدهر 🌟`
                    : isTomorrowMon
                    ? 'غداً الإثنين • فرصة الصيام وعرض الأعمال'
                    : isTomorrowThu
                    ? 'غداً الخميس • فرصة الصيام والأجر المضاعف'
                    : `اليوم ${hijri.formattedAr} • صيام التطوع المستحب`}
                </span>
                <span className="text-sm font-black text-white block">
                  {fastingLogged
                    ? 'تقبل الله صيامك وطاعتك اليوم 🤍'
                    : 'سجل صيام اليوم أو اعقد نية الصيام للغد'}
                </span>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
                {fastingLogged ? '✔' : '✨'}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleLogFastingToday}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  fastingLogged
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{fastingLogged ? 'تم تسجيل الصيام بنجاح ✔' : 'أنا صائم اليوم 🤍 (+25 نقطة)'}</span>
              </button>

              {(isTomorrowMon || isTomorrowThu || isWhiteDayTomorrow) && (
                <button
                  type="button"
                  onClick={handleIntention}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    intentionForTomorrow
                      ? 'bg-purple-900/60 border border-purple-500 text-purple-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span>
                    {intentionForTomorrow
                      ? 'عُقدت النية 🌙'
                      : isWhiteDayTomorrow
                      ? 'عقد نية الأيام البيض غداً 🌙'
                      : 'عقد نية صيام الغد 🌙'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Schedule of Sunnah Fasting Days */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>مواعيد الصيام المستحب القادمة:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Monday */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>صيام الإثنين القادم:</span>
                  <span className="font-mono text-[11px] text-slate-400">{nextMonday}</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  «تُعْرَضُ الأَعْمَالُ يَوْمَ الاِثْنَيْنِ وَالْخَمِيسِ، فَأُحِبُّ أَنْ يُعْرَضَ عَمَلِي وَأَنَا صَائِمٌ»
                </p>
              </div>

              {/* Thursday */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>صيام الخميس القادم:</span>
                  <span className="font-mono text-[11px] text-slate-400">{nextThursday}</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  «فَأُحِبُّ أَنْ يُعْرَضَ عَمَلِي وَأَنَا صَائِمٌ» • ختام صحيفة الأسبوع بطاعة خالصة.
                </p>
              </div>

              {/* White Days */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span>الأيام البيض (13 و 14 و 15 من الشهر الهجري):</span>
                  <span className="font-mono text-[11px] text-purple-400">صيام الدهر كله</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  «صِيَامُ ثَلَاثَةِ أَيَّامٍ مِنْ كُلِّ شَهْرٍ صِيَامُ الدَّهْرِ كُلِّهِ» • قال ﷺ لأبي ذر: «إذا صمت من الشهر ثلاثة أيام فصم ثلاث عشرة، وأربع عشرة، وخمس عشرة».
                </p>
              </div>
            </div>
          </div>

          {/* Authentic Hadiths Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>الأحاديث النبوية الصحيحة في فضل الصيام:</span>
            </h4>

            <div className="space-y-2 text-xs">
              {/* Hadith 1 */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300 text-[11px]">1. المباعدة عن النار سبعين خريفاً:</div>
                <p className="text-slate-200 font-serif leading-relaxed text-xs">
                  قال رسول الله ﷺ: «مَنْ صَامَ يَوْمًا فِي سَبِيلِ اللَّهِ، بَاعَدَ اللَّهُ وَجْهَهُ عَنِ النَّارِ سَبْعِينَ خَرِيفًا».
                </p>
                <div className="text-[10px] text-slate-500 font-mono">متفق عليه (صحيح البخاري ومسلم)</div>
              </div>

              {/* Hadith 2 */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300 text-[11px]">2. باب الريان المخصص للصائمين:</div>
                <p className="text-slate-200 font-serif leading-relaxed text-xs">
                  قال رسول الله ﷺ: «إِنَّ فِي الْجَنَّةِ بَابًا يُقَالُ لَهُ الرَّيَّانُ، يَدْخُلُ مِنْهُ الصَّائِمُونَ يَوْمَ الْقِيَامَةِ، لَا يَدْخُلُ مِنْهُ أَحَدٌ غَيْرُهُمْ، يُقَالُ: أَيْنَ الصَّائِمُونَ؟ فَيَقُومُونَ لَا يَدْخُلُ مِنْهُ أَحَدٌ غَيْرُهُمْ، فَإِذَا دَخَلُوا أُغْلِقَ فَلَمْ يَدْخُلْ مِنْهُ أَحَدٌ».
                </p>
                <div className="text-[10px] text-slate-500 font-mono">متفق عليه (صحيح البخاري ومسلم)</div>
              </div>

              {/* Hadith 3 */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300 text-[11px]">3. دعوة الصائم التي لا تُرد ودعاء الإفطار:</div>
                <p className="text-slate-200 font-serif leading-relaxed text-xs">
                  كان رسول الله ﷺ إذا أفطر قال: «ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ». وقال ﷺ: «ثَلَاثَةٌ لَا تُرَدُّ دَعْوَتُهُمْ: الصَّائِمُ حَتَّى يُفْطِرَ...».
                </p>
                <div className="text-[10px] text-slate-500 font-mono">رواه أبو داود والترمذي وحسنه</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>فضل الصيام • مضمار</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
