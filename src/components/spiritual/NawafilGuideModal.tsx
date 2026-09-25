import React, { useState } from 'react';
import {
  X,
  Sun,
  Moon,
  Sparkles,
  Compass,
  HeartHandshake,
  Copy,
  Check,
  BookOpen,
  Clock,
  Award,
  Droplets,
  Building,
  RotateCcw,
  Plane,
  Heart,
  Flame,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { awardSpiritualHabitPoints, upsertDailyLog, getBiologicalDate } from '../../utils/gamification';

export type NafilaTab =
  | 'qiyam'       // قيام الليل ومراتب الآيات (10، 100، 1000) 🌌
  | 'dhuha'       // صلاة الضحى والإشراق ☀️
  | 'witr'        // الشفع والوتر ودعاء القنوت 🌙
  | 'rawatib'     // السنن الرواتب التابعة للصلوات (12 ركعة) 🕌
  | 'tawbah'      // صلاة التوبة والاستغفار 🤲
  | 'wudu'        // سُنّة الوضوء (ركعتا الطهور) 💧
  | 'tahiyyah'    // تحية المسجد 🏛️
  | 'istikhara'   // صلاة ودعاء الاستخارة 🧭
  | 'hajah'       // صلاة الحاجة والتضرع 🤲
  | 'safar'       // سُنّة القدوم من السفر 🧳
  | 'sujud'       // سجدة الشكر والتلاوة 💎
  | 'tasabih';    // صلاة التسابيح 📿

export type NawafilCategory = 'daily' | 'occasions' | 'special';

export interface NawafilGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: NafilaTab;
  todayLog?: any;
  onRewardToast?: (msg: string) => void;
}

export const NawafilGuideModal: React.FC<NawafilGuideModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'qiyam',
  todayLog,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<NafilaTab>(initialTab);
  const [activeCategory, setActiveCategory] = useState<NawafilCategory>('daily');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status logs
  const [dhuhaDone, setDhuhaDone] = useState(Boolean(todayLog?.dhuhaDone));
  const [qiyamDone, setQiyamDone] = useState(Boolean(todayLog?.qiyamNightDone));
  const [witrDone, setWitrDone] = useState(Boolean(todayLog?.witrDone));
  const [tawbahDone, setTawbahDone] = useState(Boolean(todayLog?.tawbahDone));
  const [wuduDone, setWuduDone] = useState(Boolean(todayLog?.wuduSunnahDone));
  const [tahiyyahDone, setTahiyyahDone] = useState(Boolean(todayLog?.tahiyyatMasjidDone));
  const [ishraqDone, setIshraqDone] = useState(Boolean(todayLog?.ishraqDone));

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogNafila = async (type: string, title: string, pts: number) => {
    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();

    const todayStr = getBiologicalDate(true);
    if (type === 'dhuha') {
      setDhuhaDone(true);
      await upsertDailyLog(todayStr, { dhuhaDone: true, dhuhaRakats: 2 });
    } else if (type === 'qiyam') {
      setQiyamDone(true);
      await upsertDailyLog(todayStr, { qiyamNightDone: true, qiyamRakats: 8 });
    } else if (type === 'witr') {
      setWitrDone(true);
      await upsertDailyLog(todayStr, { witrDone: true });
    } else if (type === 'tawbah') {
      setTawbahDone(true);
      await upsertDailyLog(todayStr, { tawbahDone: true });
    } else if (type === 'wudu') {
      setWuduDone(true);
      await upsertDailyLog(todayStr, { wuduSunnahDone: true });
    } else if (type === 'tahiyyah') {
      setTahiyyahDone(true);
      await upsertDailyLog(todayStr, { tahiyyatMasjidDone: true });
    } else if (type === 'ishraq') {
      setIshraqDone(true);
      await upsertDailyLog(todayStr, { ishraqDone: true });
    }

    const res = await awardSpiritualHabitPoints(type as any, title);
    if (onRewardToast) {
      onRewardToast(res.message || (isAr ? `تقبّل الله طاعتك! تم تسجيل ${title} بنجاح (+${pts} نقطة) ✨` : `May Allah accept! ${title} logged (+${pts} pts) ✨`));
    }
  };

  const tabs: Array<{
    id: NafilaTab;
    labelAr: string;
    labelEn: string;
    icon: any;
    badgeAr: string;
    badgeEn: string;
    category: NawafilCategory;
  }> = [
    // Daily Core
    { id: 'qiyam', labelAr: 'قيام الليل (مراتب الآيات)', labelEn: 'Qiyam (Night Vigil)', icon: Moon, badgeAr: 'شرف المؤمن 🌌', badgeEn: 'Believer’s Honor 🌌', category: 'daily' },
    { id: 'dhuha', labelAr: 'الضحى والإشراق', labelEn: 'Dhuha & Ishraq', icon: Sun, badgeAr: 'الأوّابين ☀️', badgeEn: 'The Penitent ☀️', category: 'daily' },
    { id: 'witr', labelAr: 'الشفع والوتر', labelEn: 'Shaf & Witr', icon: Sparkles, badgeAr: 'القنوت 🌙', badgeEn: 'Qunoot 🌙', category: 'daily' },
    { id: 'rawatib', labelAr: 'السنن الرواتب (١٢ ركعة)', labelEn: 'Rawatib (12 Raka’ah)', icon: Building, badgeAr: 'بيت في الجنة 🕌', badgeEn: 'House in Jannah 🕌', category: 'daily' },

    // Occasions & Needs
    { id: 'istikhara', labelAr: 'صلاة الاستخارة', labelEn: 'Salat al-Istikhara', icon: Compass, badgeAr: 'طلب الخيرة 🧭', badgeEn: 'Seeking Guidance 🧭', category: 'occasions' },
    { id: 'hajah', labelAr: 'صلاة الحاجة', labelEn: 'Salat al-Hajah', icon: HeartHandshake, badgeAr: 'كشف الكرب 🤲', badgeEn: 'Relief of Need 🤲', category: 'occasions' },
    { id: 'tawbah', labelAr: 'صلاة التوبة', labelEn: 'Salat al-Tawbah', icon: RotateCcw, badgeAr: 'محو الذنوب 🌿', badgeEn: 'Repentance 🌿', category: 'occasions' },
    { id: 'wudu', labelAr: 'سُنّة الوضوء', labelEn: 'Sunnah of Wudu', icon: Droplets, badgeAr: 'درجة بلال 💧', badgeEn: 'Bilal’s Rank 💧', category: 'occasions' },

    // Special & Sunan
    { id: 'tahiyyah', labelAr: 'تحية المسجد', labelEn: 'Tahiyyat al-Masjid', icon: Building, badgeAr: 'إكرام بيت الله 🏛️', badgeEn: 'Mosque Greeting 🏛️', category: 'special' },
    { id: 'safar', labelAr: 'سُنّة القدوم من السفر', labelEn: 'Travel Return Sunnah', icon: Plane, badgeAr: 'هدي نبوي 🧳', badgeEn: 'Prophetic Sunnah 🧳', category: 'special' },
    { id: 'sujud', labelAr: 'سجدة الشكر والتلاوة', labelEn: 'Sujud Shukr & Tilawah', icon: Heart, badgeAr: 'خضوع وفرح 💎', badgeEn: 'Humility & Joy 💎', category: 'special' },
    { id: 'tasabih', labelAr: 'صلاة التسابيح', labelEn: 'Salat al-Tasabih', icon: Flame, badgeAr: '٣٠٠ تسبيحة 📿', badgeEn: '300 Tasbih 📿', category: 'special' },
  ];

  const visibleTabs = tabs.filter((t) => t.category === activeCategory);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[94vh] rounded-3xl bg-white dark:bg-[#151722] border border-slate-200 dark:border-white/[0.12] shadow-2xl flex flex-col overflow-hidden cursor-default animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-white/[0.08] bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl shrink-0 shadow-inner">
              🕊️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white">
                  {isAr ? 'مَوْسُوعَةُ السُّنَنِ وَالنَّوَافِلِ النَّبَوِيَّةِ' : 'Prophetic Sunan & Nawafil Encyclopedia'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                  {isAr ? 'صحيح الأحاديث' : 'Authentic Sunnah'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {isAr
                  ? '«مَا يَزَالُ عَبْدِي يَتَقَرَّبُ إِلَيَّ بِالنَّوَافِلِ حَتَّى أُحِبَّهُ» (صحيح البخاري: 6502)'
                  : '«My servant continues to draw near to Me with nawafil until I love him» (Sahih al-Bukhari: 6502)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher Tabs */}
        <div className="px-3 sm:px-5 pt-2.5 pb-2 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-black/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveCategory('daily');
              setActiveTab('qiyam');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeCategory === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            <span>🌌</span>
            <span>{isAr ? 'السنن اليومية والرواتب' : 'Daily Core & Rawatib'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveCategory('occasions');
              setActiveTab('istikhara');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeCategory === 'occasions'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            <span>🧭</span>
            <span>{isAr ? 'صلوات الأسباب والحاجة' : 'Occasions & Needs'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveCategory('special');
              setActiveTab('tahiyyah');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeCategory === 'special'
                ? 'bg-indigo-500 text-white shadow-xs'
                : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            <span>💎</span>
            <span>{isAr ? 'المأثورات والسجدات الخاصة' : 'Special Prophetic Sunan'}</span>
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="px-3 sm:px-5 py-2 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setActiveTab(t.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black shadow-sm'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isAr ? t.labelAr : t.labelEn}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-amber-400 text-slate-950 font-black' : 'opacity-70'}`}>
                  {isAr ? t.badgeAr : t.badgeEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 scrollbar-thin">
          {/* TAB: QIYAM AL-LAYL & HADITH OF AYAT RANKS (10, 100, 1000 AYAT) */}
          {activeTab === 'qiyam' && (
            <div className="space-y-4">
              {/* Hero Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 text-white shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌌</span>
                    <h4 className="text-sm sm:text-base font-black text-indigo-200">
                      قِيَامُ اللَّيْلِ وَمَرَاتِبُ الآيَاتِ الثَّلَاثِ (شَرَفُ الْمُؤْمِنِ)
                    </h4>
                  </div>
                  <p className="text-xs text-indigo-300/80 leading-relaxed font-medium">
                    أفضل الصلاة بعد المكتوبة، ووقت النزول الإلهي واستجابة الدعوات في الثلث الأخير.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleLogNafila('qiyam', 'قيام الليل والتهجد', 30)}
                  disabled={qiyamDone}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    qiyamDone
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95'
                  }`}
                >
                  {qiyamDone ? <Check className="w-4 h-4" /> : <span>🤲</span>}
                  <span>{qiyamDone ? 'سُجِّل قيام الليلة 🌟' : 'سجّل قيام الليل (+30ن)'}</span>
                </button>
              </div>

              {/* The Central Hadith of 10, 100, 1000 Ayat */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-500/10 via-slate-50 to-white dark:from-indigo-950/40 dark:via-[#161824] dark:to-[#12131b] border-2 border-indigo-500/40 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-black">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>الحديث النبوي الصريح في مراتب قيام الليل بالآيات:</span>
                </div>

                <blockquote className="p-3.5 rounded-xl bg-white/80 dark:bg-black/30 border border-indigo-200 dark:border-indigo-800/60 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 font-serif leading-loose tracking-wide">
                  عَنْ عَبْدِ اللَّهِ بْنِ عَمْرِو بْنِ الْعَاصِ رَضِيَ اللَّهُ عَنْهُمَا، قَالَ: قَالَ رَسُولُ اللَّهِ ﷺ:
                  <br />
                  «<strong className="text-amber-700 dark:text-amber-300">مَنْ قَامَ بِعَشْرِ آيَاتٍ لَمْ يُكْتَبْ مِنَ الْغَافِلِينَ</strong>،
                  <br />
                  <strong className="text-emerald-700 dark:text-emerald-300">وَمَنْ قَامَ بِمِائَةِ آيَةٍ كُتِبَ مِنَ الْقَانِتِينَ</strong>،
                  <br />
                  <strong className="text-indigo-700 dark:text-indigo-300">وَمَنْ قَامَ بِأَلْفِ آيَةٍ كُتِبَ مِنَ الْمُقَنْطِرِينَ</strong>»
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-sans">
                    (رواه أبو داود: 1398، وصحيح ابن حبان: 2572، وصححه الإمام الألباني)
                  </span>
                </blockquote>
              </div>

              {/* 3 Interactive Rank Cards: 10, 100, 1000 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 10 Ayat: Not written among heedless */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black">
                        ١٠ آيات
                      </span>
                      <span className="text-xs">🛡️ نجاة من الغفلة</span>
                    </div>
                    <h5 className="font-black text-amber-900 dark:text-amber-200 text-xs sm:text-sm mt-1">
                      «لَمْ يُكْتَبْ مِنَ الْغَافِلِينَ»
                    </h5>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 mt-1 leading-relaxed">
                      الحد الأدنى الذي يرفعك من ديوان الغافلين، ولا يستغرق سوى دقيقة أو دقيقتين.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-amber-300/40 text-[11px] space-y-1">
                    <strong className="text-amber-900 dark:text-amber-300 block font-bold">كيف تقرؤها عملياً:</strong>
                    <span>• الفاتحة (٧) + الإخلاص (٤) = ١١ آية ✅</span>
                    <br />
                    <span>• أو الفاتحة + المعوذتين = ١٨ آية ✅</span>
                    <br />
                    <span>• أو آية الكرسي وخواتيم البقرة ✅</span>
                  </div>
                </div>

                {/* 100 Ayat: Written among devout */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                        ١٠٠ آية
                      </span>
                      <span className="text-xs">🌿 رتبة القنوت</span>
                    </div>
                    <h5 className="font-black text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm mt-1">
                      «كُتِبَ مِنَ الْقَانِتِينَ»
                    </h5>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 mt-1 leading-relaxed">
                      القانت هو الخاشع المطيع الدائم على العبادة. تستغرق قرابة ٨ إلى ١٢ دقيقة.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-emerald-300/40 text-[11px] space-y-1">
                    <strong className="text-emerald-900 dark:text-emerald-300 block font-bold">كيف تقرؤها عملياً:</strong>
                    <span>• سورة الواقعة (٩٦) + الفاتحة = ١٠٣ آيات ✅</span>
                    <br />
                    <span>• الملك (٣٠) + القلم (٥٢) + الفاتحة + الإخلاص = ٩٦+ آية ✅</span>
                    <br />
                    <span>• سورتي النبأ (٤٠) والنازعات (٤٦) مع الفواتح ✅</span>
                  </div>
                </div>

                {/* 1000 Ayat: Written among Al-Muqantirin */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black">
                        ١٠٠٠ آية
                      </span>
                      <span className="text-xs">👑 قناطير الأجر</span>
                    </div>
                    <h5 className="font-black text-indigo-900 dark:text-indigo-200 text-xs sm:text-sm mt-1">
                      «كُتِبَ مِنَ الْمُقَنْطِرِينَ»
                    </h5>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 mt-1 leading-relaxed">
                      أصحاب القناطير المقنطرة من الأجر والنعيم (القنطار خير مما طلعت عليه الشمس).
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-indigo-300/40 text-[11px] space-y-1">
                    <strong className="text-indigo-900 dark:text-indigo-300 block font-bold">كيف تقرؤها عملياً:</strong>
                    <span>• قراءة جزأي (تبارك وعمّ): من سورة الملك إلى الناس = ٩٩٥ آية + الفاتحة = ١٠٠٢ آية ✅</span>
                    <br />
                    <span>• يُصلي بها ركعات التهجد في ٤٥ - ٦٠ دقيقة بتأنٍ وترتيل ✅</span>
                  </div>
                </div>
              </div>

              {/* Hadith: The Last Two Verses of Baqarah */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                    <span>🛡️</span>
                    <span>فضل قراءة آخر آيتين من سورة البقرة في الليل:</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-serif">
                    قال رسول الله ﷺ: «مَنْ قَرَأَ بِالآيَتَيْنِ مِنْ آخِرِ سُورَةِ البَقَرَةِ فِي لَيْلَةٍ <strong className="text-emerald-600 dark:text-emerald-400">كَفَتَاهُ</strong>» (متفق عليه: البخاري 5009 ومسلم 808).
                  </p>
                  <span className="text-[10px] text-slate-500">معنى كفتاه: أجزأتاه عن قيام الليل، وكفتاه كل سوء ومكروه من الشياطين والآفات.</span>
                </div>
              </div>

              {/* Prophet's Grand Tahajjud Dua (Bukhari & Muslim) */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950/20 to-slate-900/40 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                    <span>🤲</span>
                    <span>دُعَاءُ التَّهَجُّدِ وَاسْتِفْتَاحِ اللَّيْلِ النَّبَوِيُّ (مُتَّفَقٌ عَلَيْهِ):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'اللَّهُمَّ لَكَ الحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ أَنْتَ قَيِّمُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ أَنْتَ الحَقُّ، وَوَعْدُكَ الحَقُّ، وَقَوْلُكَ الحَقُّ، وَلِقَاؤُكَ حَقٌّ، وَالجَنَّةُ حَقٌّ، وَالنَّارُ حَقٌّ، وَالنَّبِيُّونَ حَقٌّ، وَمُحَمَّدٌ حَقٌّ، وَالسَّاعَةُ حَقٌّ. اللَّهُمَّ لَكَ أَسْلَمْتُ، وَبِكَ آمَنْتُ، وَعَلَيْكَ تَوَكَّلْتُ، وَإِلَيْكَ أَنَبْتُ، وَبِكَ خَاصَمْتُ، وَإِلَيْكَ حَاكَمْتُ، فَاغْفِرْ لِي مَا قَدَّمْتُ وَمَا أَخَّرْتُ، وَمَا أَسْرَرْتُ وَمَا أَعْلَنْتُ، أَنْتَ المُقَدِّمُ وَأَنْتَ المُؤَخِّرُ، لاَ إِلَهَ إِلَّا أَنْتَ.',
                        'tahajjud_dua'
                      )
                    }
                    className="p-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === 'tahajjud_dua' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'tahajjud_dua' ? 'تم النسخ' : 'نسخ الدعاء'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-500/20 text-xs sm:text-sm text-slate-100 font-serif leading-loose tracking-wide">
                  «اللَّهُمَّ لَكَ الحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ أَنْتَ قَيِّمُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ أَنْتَ الحَقُّ، وَوَعْدُكَ الحَقُّ، وَقَوْلُكَ الحَقُّ، وَلِقَاؤُكَ حَقٌّ، وَالجَنَّةُ حَقٌّ، وَالنَّارُ حَقٌّ، وَالنَّبِيُّونَ حَقٌّ، وَمُحَمَّدٌ حَقٌّ، وَالسَّاعَةُ حَقٌّ... اللَّهُمَّ لَكَ أَسْلَمْتُ، وَبِكَ آمَنْتُ، وَعَلَيْكَ تَوَكَّلْتُ، وَإِلَيْكَ أَنَبْتُ، وَبِكَ خَاصَمْتُ، وَإِلَيْكَ حَاكَمْتُ، فَاغْفِرْ لِي مَا قَدَّمْتُ وَمَا أَخَّرْتُ، وَمَا أَسْرَرْتُ وَمَا أَعْلَنْتُ، أَنْتَ المُقَدِّمُ وَأَنْتَ المُؤَخِّرُ، لاَ إِلَهَ إِلَّا أَنْتَ»
                  <span className="block text-[10px] text-indigo-400 font-sans mt-2">
                    (صحيح البخاري: 1120، وصحيح مسلم: 769)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DHUHA AND ISHRAQ */}
          {activeTab === 'dhuha' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-orange-500/15 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">☀️</span>
                    <h4 className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-200">
                      صَلَاةُ الضُّحَى وَالإِشْرَاقِ (صَلَاةُ الْأَوَّابِينَ)
                    </h4>
                  </div>
                  <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed font-medium">
                    تُجزئ صدقةً عن ٣٦٠ مَفْصِلاً في بدنك كل يوم، وشكرٌ مباشر لعافية الجسد والنعمة.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleLogNafila('dhuha', 'صلاة الضحى المباركة', 20)}
                    disabled={dhuhaDone}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      dhuhaDone
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                    }`}
                  >
                    {dhuhaDone ? <Check className="w-4 h-4" /> : <span>🤲</span>}
                    <span>{dhuhaDone ? 'أُديت الضحى 🌟' : 'سجّل صلاة الضحى (+20ن)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLogNafila('ishraq', 'صلاة الإشراق (جلسة الفجر)', 25)}
                    disabled={ishraqDone}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      ishraqDone
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-800 dark:text-amber-200 border border-amber-500/30 shadow-xs active:scale-95'
                    }`}
                    title="جلسة الذكر حتى طلوع الشمس ثم ركعتان"
                  >
                    {ishraqDone ? <Check className="w-4 h-4" /> : <span>🌅</span>}
                    <span>{ishraqDone ? 'أُديت الإشراق 🌟' : 'سجّل الإشراق (+25ن)'}</span>
                  </button>
                </div>
              </div>

              {/* Hadith Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2.5">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>الأحاديث الصحيحة في فضلها:</span>
                </div>
                <blockquote className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-amber-500 pr-3 font-medium">
                  «يُصْبِحُ عَلَى كُلِّ سُلَامَى مِنْ أَحَدِكُمْ صَدَقَةٌ... <strong className="text-amber-600 dark:text-amber-300">وَيُجْزِئُ مِنْ ذَلِكَ رَكْعَتَانِ يَرْكَعُهُمَا مِنَ الضُّحَى</strong>»
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">(صحيح مسلم: 720)</span>
                </blockquote>

                <blockquote className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-amber-500 pr-3 font-medium pt-1">
                  قال رسول الله ﷺ: «مَنْ صَلَّى الْغَدَاةَ فِي جَمَاعَةٍ ثُمَّ قَعَدَ يَذْكُرُ اللَّهَ حَتَّى تَطْلُعَ الشَّمْسُ ثُمَّ صَلَّى رَكْعَتَيْنِ كَانَتْ لَهُ كَأَجْرِ حَجَّةٍ وَعُمْرَةٍ <strong className="text-amber-600 dark:text-amber-300">تَامَّةٍ تَامَّةٍ تَامَّةٍ</strong>»
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">(سنن الترمذي: 586، وحسنه الألباني)</span>
                </blockquote>
              </div>

              {/* Timing & Practical Guidance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-700/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>مِيْقَاتُهَا وَأَفْضَلُ أَوْقَاتِهَا:</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                    <strong>البداية:</strong> بعد شروق الشمس بـ ١٥ دقيقة (ارتفاع قيد رمح).<br />
                    <strong>صلاة الإشراق:</strong> تكون في أول وقتها عقب جلسة ذكر الفجر.<br />
                    <strong>النهاية:</strong> قبل أذان الظهر بـ ١٠ دقائق (وقت استواء الشمس نهي).<br />
                    <strong>أفضل أوقاتها:</strong> «حِينَ تَرْمَضُ الْفِصَالُ»؛ أي عند اشتداد حرارة الضحى.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                    <span>عَدَدُ رَكَعَاتِهَا:</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                    <strong>أقلها:</strong> ركعتان خفيفتان بتسليمة واحدة.<br />
                    <strong>أوسطها:</strong> أربع ركعات (ركعتين ركعتين).<br />
                    <strong>أكثرها:</strong> ثماني ركعات إلى ما شاء الله، تُصلّى مثنى مثنى، يقرأ فيها بما تيسر.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SHAFA AND WITR */}
          {activeTab === 'witr' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌙</span>
                    <h4 className="text-sm sm:text-base font-black text-purple-200">
                      صَلَاةُ الشَّفْعِ وَالْوِتْرِ وَدُعَاءُ الْقُنُوتِ
                    </h4>
                  </div>
                  <p className="text-xs text-purple-300/80 leading-relaxed font-medium">
                    آكد السنن المؤكدة التي لم يتركها رسول الله ﷺ في حضر ولا سفر، ختام عمل الليل.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleLogNafila('witr', 'صلاة الشفع والوتر', 25)}
                  disabled={witrDone}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    witrDone
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95'
                  }`}
                >
                  {witrDone ? <Check className="w-4 h-4" /> : <span>🤲</span>}
                  <span>{witrDone ? 'أُوتِر الليلة 🌟' : 'سجّل صلاة الوتر (+25ن)'}</span>
                </button>
              </div>

              {/* Hadith */}
              <blockquote className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-purple-500 font-medium">
                قال رسول الله ﷺ: «إِنَّ اللَّهَ وِتْرٌ يُحِبُّ الْوِتْرَ، فَأَوْتِرُوا يَا أَهْلَ الْقُرْآنِ» (أبو داود والترمذي). وقال: «اجْعَلُوا آخِرَ صَلَاتِكُمْ بِاللَّيْلِ وِتْرًا» (متفق عليه).
              </blockquote>

              {/* Recitation Sunnah */}
              <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-300/60 dark:border-purple-700/40 space-y-2">
                <h5 className="text-xs font-black text-purple-950 dark:text-purple-200">
                  السُّوَرُ الْمُسْتَحَبَّةُ فِي الشَّفْعِ وَالْوِتْرِ:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800/60">
                    <span className="text-[10px] text-purple-600 font-bold block">الركعة الأولى (الشفع)</span>
                    <strong className="text-slate-900 dark:text-white font-black text-xs">سورة الأعلى 📖</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800/60">
                    <span className="text-[10px] text-purple-600 font-bold block">الركعة الثانية (الشفع)</span>
                    <strong className="text-slate-900 dark:text-white font-black text-xs">سورة الكافرون 📖</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800/60">
                    <span className="text-[10px] text-purple-600 font-bold block">ركعة الوتر المنفصلة</span>
                    <strong className="text-slate-900 dark:text-white font-black text-xs">الإخلاص والمعوذتين 📖</strong>
                  </div>
                </div>
              </div>

              {/* Dua Qunut */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/20 to-slate-900/40 border border-purple-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                    <span>🤲</span>
                    <span>دُعَاءُ الْقُنُوتِ فِي الْوِتْرِ (عَلَّمَهُ النَّبِيُّ لِلْحَسَنِ رَضِيَ اللَّهُ عَنْهُ):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، وَلَا يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ.',
                        'qunut'
                      )
                    }
                    className="p-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === 'qunut' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'qunut' ? 'تم النسخ' : 'نسخ الدعاء'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-xs sm:text-sm text-slate-100 font-serif leading-loose tracking-wide">
                  «اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، وَلَا يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ»
                  <span className="block text-[10px] text-purple-400 font-sans mt-1">
                    (رواه أبو داود والترمذي والنسائي، وصححه الألباني)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONFIRMED SUNAN RAWATIB (12 RAK'AHS) */}
          {activeTab === 'rawatib' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/30 space-y-1 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🕌</span>
                  <h4 className="text-sm sm:text-base font-black text-emerald-200">
                    السُّنَنُ الرَّوَاتِبُ التَّابِعَةُ لِلْفَرَائِضِ (١٢ رَكْعَةً)
                  </h4>
                </div>
                <p className="text-xs text-emerald-300/80 leading-relaxed font-medium">
                  من حافظ عليها بنى الله له بيتاً في الجنة، وتجبر ما نقص من الفرائض يوم القيامة.
                </p>
              </div>

              {/* Hadith */}
              <blockquote className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-emerald-500 font-medium">
                عَنْ أُمِّ حَبِيبَةَ رَضِيَ اللَّهُ عَنْهَا، قَالَتْ: سَمِعْتُ رَسُولَ اللَّهِ ﷺ يَقُولُ:
                <br />
                «<strong className="text-emerald-600 dark:text-emerald-400">مَا مِنْ عَبْدٍ مُسْلِمٍ يُصَلِّي لِلَّهِ كُلَّ يَوْمٍ ثِنْتَيْ عَشْرَةَ رَكْعَةً تَطَوُّعًا غَيْرَ فَرِيضَةٍ، إِلَّا بَنَى اللَّهُ لَهُ بَيْتًا فِي الْجَنَّةِ</strong>»
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">(صحيح مسلم: 728)</span>
              </blockquote>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Fajr Sunnah */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center justify-between font-black text-emerald-950 dark:text-emerald-200">
                    <span>🌅 سُنّة الفجر الاستفتاحية (السنة السابقة للصلاة - ركعتان)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px]">مؤكدة جداً</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                    «رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا» (صحيح مسلم). ركعتان خفيفتان يُقرأ فيهما بالكافرون والإخلاص.
                  </p>
                </div>

                {/* Dhuhr Sunnah */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between font-black text-amber-950 dark:text-amber-200">
                    <span>☀️ سُنّة الظهر (٤ سابقة استفتاحية، و٢ لاحقة معقبة)</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-600 text-slate-950 text-[10px]">٦ ركعات</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                    أربع ركعات بتسليمتين سابقة للصلاة، وركعتان لاحقة بعدها. ومن صلى أربعاً بعدها حرّمه الله على النار (الترمذي).
                  </p>
                </div>

                {/* Maghrib Sunnah */}
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center justify-between font-black text-purple-950 dark:text-purple-200">
                    <span>🌆 سُنّة المغرب (ركعتان لاحقة معقبة للصلاة)</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px]">مؤكدة</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                    ركعتان خفيفتان لاحقتان بعد صلاة المغرب، ويستحب أداؤهما في البيت كما كان هدي النبي ﷺ.
                  </p>
                </div>

                {/* Isha Sunnah */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-1.5">
                  <div className="flex items-center justify-between font-black text-indigo-950 dark:text-indigo-200">
                    <span>🌙 سُنّة العشاء (ركعتان لاحقة معقبة للصلاة)</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px]">مؤكدة</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                    ركعتان لاحقتان بعد صلاة العشاء يتبعهما بعد ذلك الشفع والوتر قبل النوم أو في جوف الليل.
                  </p>
                </div>
              </div>

              {/* Non-confirmed beneficial Sunan */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2 text-xs">
                <span className="font-black text-slate-900 dark:text-white block">
                  🌟 سنن مستحبة غير مؤكدة ورد فيها أجر وفضل خاص:
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-slate-700 dark:text-zinc-300 leading-relaxed">
                  <li>
                    <strong>السنة السابقة المستحبة لصلاة العصر (٤ ركعات):</strong> «رَحِمَ اللَّهُ امْرَأً صَلَّى قَبْلَ الْعَصْرِ أَرْبَعًا» (أبو داود والترمذي، حسن).
                  </li>
                  <li>
                    <strong>السنة السابقة المستحبة لصلاة المغرب (ركعتان):</strong> «صَلُّوا قَبْلَ صَلَاةِ الْمَغْرِبِ... لِمَنْ شَاءَ» (صحيح البخاري).
                  </li>
                  <li>
                    <strong>السنة السابقة المستحبة لصلاة العشاء:</strong> لعموم حديث: «بَيْنَ كُلِّ أَذَانَيْنِ صَلَاةٌ» (متفق عليه).
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB: SALAT AL-TAWBAH (REPENTANCE) */}
          {activeTab === 'tawbah' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-emerald-950/70 border border-teal-500/30 flex flex-wrap items-center justify-between gap-3 text-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌿</span>
                    <h4 className="text-sm sm:text-base font-black text-teal-200">
                      صَلَاةُ التَّوْبَةِ وَالاسْتِغْفَارِ (بَابُ الْمَغْفِرَةِ)
                    </h4>
                  </div>
                  <p className="text-xs text-teal-300/80 leading-relaxed font-medium">
                    سُنّة مؤكدة إذا وقع العبد في ذنب أو خطيئة؛ يتطهر ويصلي ركعتين ويستغفر فيغفر الله له.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleLogNafila('tawbah', 'صلاة التوبة والاستغفار', 25)}
                  disabled={tawbahDone}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    tawbahDone
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md active:scale-95'
                  }`}
                >
                  {tawbahDone ? <Check className="w-4 h-4" /> : <span>🤲</span>}
                  <span>{tawbahDone ? 'أُديت اليوم 🌟' : 'سجّل صلاة التوبة (+25ن)'}</span>
                </button>
              </div>

              {/* Hadith */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>الحديث الصحيح عن الصديق وعلي رضي الله عنهما:</span>
                </div>
                <blockquote className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-teal-500 pr-3 font-medium">
                  عَنْ عَلِيٍّ رَضِيَ اللَّهُ عَنْهُ، عَنْ أَبِي بَكْرٍ الصِّدِّيقِ رَضِيَ اللَّهُ عَنْهُ، قَالَ: سَمِعْتُ رَسُولَ اللَّهِ ﷺ يَقُولُ:
                  <br />
                  «<strong className="text-teal-600 dark:text-teal-300">مَا مِنْ عَبْدٍ يُذْنِبُ ذَنْبًا فَيُحْسِنُ الطُّهُورَ، ثُمَّ يَقُومُ فَيُصَلِّي رَكْعَتَيْنِ، ثُمَّ يَسْتَغْفِرُ اللَّهَ، إِلَّا غَفَرَ اللَّهُ لَهُ</strong>»، ثُمَّ قَرَأَ هَذِهِ الآيَةَ: ﴿وَالَّذِينَ إِذَا فَعَلُوا فَاحِشَةً أَوْ ظَلَمُوا أَنْفُسَهُمْ ذَكَرُوا اللَّهَ فَاسْتَغْفَرُوا لِذُنُوبِهِمْ وَمَنْ يَغْفِرُ الذُّنُوبَ إِلَّا اللَّهُ﴾
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">(رواه أبو داود: 1521، والترمذي: 406، وصححه الألباني)</span>
                </blockquote>
              </div>

              {/* How to pray */}
              <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-300/60 dark:border-teal-700/40 space-y-1.5 text-xs text-slate-700 dark:text-zinc-300">
                <h5 className="font-black text-teal-950 dark:text-teal-200">
                  كَيْفِيَّةُ أَدَائِهَا وَشُرُوطُ التَّوْبَةِ النَّصُوحِ:
                </h5>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                  <li><strong>إسباغ الوضوء:</strong> يتوضأ بقلب حاضر ونية صادقة للتطهر من المعصية.</li>
                  <li><strong>ركعتان خاشعتان:</strong> يصلي ركعتين منفرداً لا يحدّث فيهما نفسه بالدنيا.</li>
                  <li><strong>الاستغفار والندم:</strong> يرفع يديه بعد السلام مستغفراً نادماً عازماً ألا يعود للذنب أبداً.</li>
                  <li><strong>رد المظالم:</strong> إن كان الذنب متعلقاً بحقوق العباد وجب رد الحقوق أو التحلل منهم.</li>
                </ol>
              </div>

              {/* Sayyid Al-Istighfar */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-teal-950/20 to-slate-900/40 border border-teal-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-teal-300 flex items-center gap-1.5">
                    <span>👑</span>
                    <span>سَيِّدُ الاسْتِغْفَارِ النَّبَوِيُّ (مَنْ قَالَهُ مُوقِناً بِهِ دَخَلَ الْجَنَّةَ):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.',
                        'sayyid_istighfar'
                      )
                    }
                    className="p-1.5 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === 'sayyid_istighfar' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'sayyid_istighfar' ? 'تم النسخ' : 'نسخ الاستغفار'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-teal-500/20 text-xs sm:text-sm text-slate-100 font-serif leading-loose tracking-wide">
                  «اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ»
                  <span className="block text-[10px] text-teal-400 font-sans mt-2">
                    (صحيح البخاري: 6306)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: WUDU SUNNAH (BILAL & UTHMAN HADITHS) */}
          {activeTab === 'wudu' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💧</span>
                    <h4 className="text-sm sm:text-base font-black text-cyan-200">
                      سُنَّةُ الْوُضُوءِ (رَكْعَتَا الطَّهُورِ وَدَرَجَةُ بِلَالٍ)
                    </h4>
                  </div>
                  <p className="text-xs text-cyan-300/80 leading-relaxed font-medium">
                    السر الذي سمع به النبي ﷺ قرع نعلي بلال في الجنة، ومغفرة ما تقدم من الذنوب.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleLogNafila('wudu', 'سُنّة ركعتي الوضوء', 15)}
                  disabled={wuduDone}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    wuduDone
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md active:scale-95'
                  }`}
                >
                  {wuduDone ? <Check className="w-4 h-4" /> : <span>🤲</span>}
                  <span>{wuduDone ? 'أُديت اليوم 🌟' : 'سجّل ركعتي الوضوء (+15ن)'}</span>
                </button>
              </div>

              {/* Hadith Bilal */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>حديث بلال بن رباح رضي الله عنه في الصحيحين:</span>
                </div>
                <blockquote className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-cyan-500 pr-3 font-medium">
                  قال النبي ﷺ لبلال عند صلاة الفجر: «يَا بِلَالُ حَدِّثْنِي بِأَرْجَى عَمَلٍ عَمِلْتَهُ فِي الْإِسْلَامِ، <strong className="text-cyan-600 dark:text-cyan-300">فَإِنِّي سَمِعْتُ دَفَّ نَعْلَيْكَ بَيْنَ يَدَيَّ فِي الْجَنَّةِ</strong>»، قَالَ: مَا عَمِلْتُ عَمَلًا أَرْجَى عِنْدِي: <strong className="text-cyan-600 dark:text-cyan-300">أَنِّي لَمْ أَتَطَهَّرْ طَهُورًا فِي سَاعَةِ لَيْلٍ أَوْ نَهَارٍ إِلَّا صَلَّيْتُ بِذَلِكَ الطُّهُورِ مَا كُتِبَ لِي أَنْ أُصَلِّيَ</strong>.
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">(متفق عليه: صحيح البخاري 1149، وصحيح مسلم 2458)</span>
                </blockquote>
              </div>

              {/* Hadith Uthman */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>حديث عثمان بن عفان رضي الله عنه:</span>
                </div>
                <blockquote className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-cyan-500 pr-3 font-medium">
                  قال رسول الله ﷺ: «<strong className="text-cyan-600 dark:text-cyan-300">مَنْ تَوَضَّأَ نَحْوَ وُضُوئِي هَذَا ثُمَّ قَامَ فَرَكَعَ رَكْعَتَيْنِ لَا يُحَدِّثُ فِيهِمَا نَفْسَهُ، غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ</strong>»
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">(متفق عليه: صحيح البخاري 159، وصحيح مسلم 226)</span>
                </blockquote>
              </div>

              {/* Practical Guidance */}
              <div className="p-3.5 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-300/60 dark:border-cyan-700/40 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                <strong>حكمها وميقاتها:</strong> سنة مستحبة عقب كل وضوء في أي ساعة من ليل أو نهار، وهي من ذوات الأسباب فتجوز حتى في أوقات النهي عند جمهور أهل العلم. ركعتان خفيفتان يجمع فيهما المسلم قلبه على الله دون استرسال مع وساوس النفس.
              </div>
            </div>
          )}

          {/* TAB: TAHIYYAT AL-MASJID */}
          {activeTab === 'tahiyyah' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-sky-950/70 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏛️</span>
                    <h4 className="text-sm sm:text-base font-black text-emerald-200">
                      تَحِيَّةُ الْمَسْجِدِ (إِكْرَامُ بُيُوتِ اللَّهِ)
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-300/80 leading-relaxed font-medium">
                    حق المسجد على من دخله ألا يجلس حتى يركع ركعتين تعظيماً لبيت الله تعالى.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleLogNafila('tahiyyah', 'تحية المسجد', 15)}
                  disabled={tahiyyahDone}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    tahiyyahDone
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
                  }`}
                >
                  {tahiyyahDone ? <Check className="w-4 h-4" /> : <span>🤲</span>}
                  <span>{tahiyyahDone ? 'أُديت اليوم 🌟' : 'سجّل تحية المسجد (+15ن)'}</span>
                </button>
              </div>

              {/* Hadith */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>الحديث الصحيح في الصحيحين:</span>
                </div>
                <blockquote className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-emerald-500 pr-3 font-medium">
                  عَنْ أَبِي قَتَادَةَ السَّلَمِيِّ رَضِيَ اللَّهُ عَنْهُ، أَنَّ رَسُولَ اللَّهِ ﷺ قَالَ:
                  <br />
                  «<strong className="text-emerald-600 dark:text-emerald-300">إِذَا دَخَلَ أَحَدُكُمُ الْمَسْجِدَ فَلَا يَجْلِسْ حَتَّى يُصَلِّيَ رَكْعَتَيْنِ</strong>»
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">(متفق عليه: صحيح البخاري 444، وصحيح مسلم 714)</span>
                </blockquote>
              </div>

              {/* Fiqh Points */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300/60 dark:border-emerald-700/40 space-y-1.5 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                <h5 className="font-black text-emerald-950 dark:text-emerald-200">
                  فَوَائِدُ وَأَحْكَامٌ فِقْهِيَّةٌ مُهِمَّةٌ:
                </h5>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>تجزئ عنها الفريضة أو الراتبة:</strong> إذا دخلت المسجد وأقيمت الصلاة، أو صليت سُنّة الفجر أو سُنّة الظهر، أجزأت عن تحية المسجد لأن المقصود ألا تجلس إلا بعد صلاة.</li>
                  <li><strong>حتى والإمام يخطب الجمعة:</strong> أمر النبي ﷺ سُليكاً الغطفاني حين دخل يوم الجمعة وهو يخطب أن يقوم فيركع ركعتين خفيفتين ثم يجلس (متفق عليه).</li>
                  <li><strong>المسجد الحرام:</strong> تحية المسجد الحرام لمن نوى الطواف هي الطواف بالكعبة المشرفة، فإن لم يطف صلى ركعتين كغيره من المساجد.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB: ISTIKHARA PRAYER */}
          {activeTab === 'istikhara' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 space-y-1 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧭</span>
                  <h4 className="text-sm sm:text-base font-black text-emerald-200">
                    صَلَاةُ وَدُعَاءُ الاسْتِخَارَةِ النَّبَوِيِّ
                  </h4>
                </div>
                <p className="text-xs text-emerald-300/80 leading-relaxed font-medium">
                  طلب الخيرة وتفويض الأمر إلى علام الغيوب عند التردد في أمر مباح (زواج، عمل، سفر، شراء...).
                </p>
              </div>

              {/* Hadith */}
              <blockquote className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-emerald-500 font-medium">
                عن جابر بن عبد الله رضي الله عنهما قال: «كَانَ رَسُولُ اللَّهِ ﷺ يُعَلِّمُنَا الِاسْتِخَارَةَ فِي الْأُمُورِ كُلِّهَا كَمَا يُعَلِّمُنَا السُّورَةَ مِنَ الْقُرْآنِ» (صحيح البخاري: 1166).
              </blockquote>

              {/* Step-by-step how to pray */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300/60 dark:border-emerald-700/40 space-y-1.5 text-xs text-slate-700 dark:text-zinc-300">
                <h5 className="font-black text-emerald-950 dark:text-emerald-200">
                  كَيْفِيَّةُ صَلَاةِ الاسْتِخَارَةِ بِالتَّفْصِيلِ:
                </h5>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                  <li>توضأ وضوءك للصلاة، وانوِ بقلبك صلاة الاستخارة.</li>
                  <li>صلِّ ركعتين من غير الفريضة (يستحب قراءة الكافرون في الأولى، والإخلاص في الثانية).</li>
                  <li>بعد التسليم، ارفع يديك، واحمد الله وأثنِ عليه وصلِّ على النبي ﷺ.</li>
                  <li>ادعُ بنص دعاء الاستخارة النبوي، وعند قولك (أَنَّ هَذَا الْأَمْرَ) سَمِّ حاجتك بعينها.</li>
                  <li>امضِ في أمرك مستعيناً بالله، فما قدّره الله فهو الخير والبركة.</li>
                </ol>
              </div>

              {/* Dua Istikhara Full Text */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/20 to-slate-900/40 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                    <span>📖</span>
                    <span>نَصُّ دُعَاءِ الاسْتِخَارَةِ كَامِلاً مِنْ صَحِيحِ الْبُخَارِيِّ:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ. اللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ (وتسمي حاجتك) خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي -أَوْ قَالَ: عَاجِلِ أَمْرِي وَآجِلِهِ- فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ. وَإِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي -أَوْ قَالَ: فِي عَاجِلِ أَمْرِي وَآجِلِهِ- فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ، وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ ثُمَّ أَرْضِنِي بِهِ.',
                        'istikhara'
                      )
                    }
                    className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === 'istikhara' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'istikhara' ? 'تم النسخ' : 'نسخ الدعاء'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-xs sm:text-sm text-slate-100 font-serif leading-loose tracking-wide">
                  «اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ.<br /><br />
                  اللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ <span className="text-amber-400 font-sans font-bold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">[وتُسمّي حاجتك هنا]</span> خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي -أَوْ قَالَ: عَاجِلِ أَمْرِي وَآجِلِهِ- فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ.<br /><br />
                  وَإِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي -أَوْ قَالَ: فِي عَاجِلِ أَمْرِي وَآجِلِهِ- فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ، وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ ثُمَّ أَرْضِنِي بِهِ»
                  <span className="block text-[10px] text-emerald-400 font-sans mt-2">
                    (صحيح البخاري: حديث 1166)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HAJAH PRAYER */}
          {activeTab === 'hajah' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/60 border border-rose-500/30 space-y-1 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤲</span>
                  <h4 className="text-sm sm:text-base font-black text-rose-200">
                    صَلَاةُ الْحَاجَةِ وَالتَّضَرُّعِ لِرَبِّ الْعِبَادِ
                  </h4>
                </div>
                <p className="text-xs text-rose-300/80 leading-relaxed font-medium">
                  التوجه إلى الله بطلب العون والتيسير وكشف الكربات وقضاء الحوائج الدنيوية والأخروية.
                </p>
              </div>

              {/* Hadith */}
              <blockquote className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-rose-500 font-medium">
                قال رسول الله ﷺ: «مَنْ كَانَتْ لَهُ إِلَى اللَّهِ حَاجَةٌ أَوْ إِلَى أَحَدٍ مِنْ بَنِي آدَمَ، فَلْيَتَوَضَّأْ فَلْيُحْسِنِ الْوُضُوءَ، ثُمَّ لِيُصَلِّ رَكْعَتَيْنِ، ثُمَّ لِيُثْنِ عَلَى اللَّهِ، وَلْيُصَلِّ عَلَى النَّبِيِّ ﷺ، ثُمَّ لِيَقُلْ:...» (سنن الترمذي وابن ماجه).
              </blockquote>

              {/* Dua Hajah Full Text */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-rose-950/20 to-slate-900/40 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                    <span>📖</span>
                    <span>دُعَاءُ الْحَاجَةِ الْمَأْثُورُ كَامِلاً بِالتَّشْكِيلِ:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'لَا إِلَهَ إِلَّا اللَّهُ الْحَلِيمُ الْكَرِيمُ، سُبْحَانَ اللَّهِ رَبِّ الْعَرْشِ الْعَظِيمِ، الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ. أَسْأَلُكَ مُوجِبَاتِ رَحْمَتِكَ، وَعَزَائِمَ مَغْفِرَتِكَ، وَالْغَنِيمَةَ مِنْ كُلِّ بِرٍّ، وَالسَّلَامَةَ مِنْ كُلِّ إِثْمٍ. لَا تَدَعْ لِي ذَنْبًا إِلَّا غَفَرْتَهُ، وَلَا هَمًّا إِلَّا فَرَّجْتَهُ، وَلَا حَاجَةً هِيَ لَكَ رِضًا إِلَّا قَضَيْتَهَا يَا أَرْحَمَ الرَّاحِمِينَ.',
                        'hajah'
                      )
                    }
                    className="p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === 'hajah' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'hajah' ? 'تم النسخ' : 'نسخ الدعاء'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/20 text-xs sm:text-sm text-slate-100 font-serif leading-loose tracking-wide">
                  «لَا إِلَهَ إِلَّا اللَّهُ الْحَلِيمُ الْكَرِيمُ، سُبْحَانَ اللَّهِ رَبِّ الْعَرْشِ الْعَظِيمِ، الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ.<br /><br />
                  أَسْأَلُكَ مُوجِبَاتِ رَحْمَتِكَ، وَعَزَائِمَ مَغْفِرَتِكَ، وَالْغَنِيمَةَ مِنْ كُلِّ بِرٍّ، وَالسَّلَامَةَ مِنْ كُلِّ إِثْمٍ.<br /><br />
                  لَا تَدَعْ لِي ذَنْبًا إِلَّا غَفَرْتَهُ، وَلَا هَمًّا إِلَّا فَرَّجْتَهُ، وَلَا حَاجَةً هِيَ لَكَ رِضًا إِلَّا قَضَيْتَهَا يَا أَرْحَمَ الرَّاحِمِينَ»
                  <span className="block text-[10px] text-rose-400 font-sans mt-2">
                    [ثم يسأل العبد ربه مسألته وما شاء من خيري الدنيا والآخرة]
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SAFAR RETURN SUNNAH */}
          {activeTab === 'safar' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-yellow-950/70 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧳</span>
                    <h4 className="text-sm sm:text-base font-black text-amber-200">
                      سُنَّةُ الْقُدُومِ مِنَ السَّفَرِ (رَكْعَتَا الْمَسْجِدِ)
                    </h4>
                  </div>
                  <p className="text-xs text-amber-300/80 leading-relaxed font-medium">
                    هدي نبوي مهجور؛ كان النبي ﷺ إذا قدم من سفره لم يدخل بيته حتى يدخل المسجد فيصلي ركعتين.
                  </p>
                </div>
              </div>

              {/* Hadith */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>حديث كعب بن مالك رضي الله عنه في الصحيحين:</span>
                </div>
                <blockquote className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-amber-500 pr-3 font-medium">
                  «أَنَّ رَسُولَ اللَّهِ ﷺ <strong className="text-amber-600 dark:text-amber-300">كَانَ إِذَا قَدِمَ مِنْ سَفَرٍ بَدَأَ بِالْمَسْجِدِ فَرَكَعَ فِيهِ رَكْعَتَيْنِ ثُمَّ جَلَسَ لِلنَّاسِ</strong>»
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">(متفق عليه: صحيح البخاري 443، وصحيح مسلم 715)</span>
                </blockquote>
              </div>

              {/* Wisdom & Guidance */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-700/40 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed space-y-1.5">
                <h5 className="font-black text-amber-950 dark:text-amber-200">
                  حِكْمَتُهَا وَكَيْفِيَّةُ إِحْيَائِهَا:
                </h5>
                <p>
                  شكرٌ لله على نعمة السلامة وتيسير العودة، وافتتاح لقاء الأهل والبلد بعبادة الله في بيته. يصلي المسافر ركعتين في أقرب مسجد لبلدته أو حيه قبل أن يدخل منزله.
                </p>
              </div>
            </div>
          )}

          {/* TAB: SUJUD SHUKR & TILAWAT */}
          {activeTab === 'sujud' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/30 space-y-1 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💎</span>
                  <h4 className="text-sm sm:text-base font-black text-emerald-200">
                    سَجْدَةُ الشُّكْرِ وَسَجْدَةُ التِّلَاوَةِ
                  </h4>
                </div>
                <p className="text-xs text-emerald-300/80 leading-relaxed font-medium">
                  خضوع فوري لله عند تجدد النعم العظيمة أو سماع آيات السجود في كتاب الله.
                </p>
              </div>

              {/* Sujud Shukr */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between font-black text-emerald-950 dark:text-emerald-200">
                  <span className="text-sm">🌿 ١. سَجْدَةُ الشُّكْرِ:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px]">فورية عند البشرى</span>
                </div>
                <blockquote className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-emerald-500 pr-3 font-medium">
                  عَنْ أَبِي بَكْرَةَ رَضِيَ اللَّهُ عَنْهُ: «أَنَّ النَّبِيَّ ﷺ <strong className="text-emerald-600 dark:text-emerald-400">كَانَ إِذَا أَتَاهُ أَمْرُ سُرُورٍ أَوْ بُشِّرَ بِهِ خَرَّ سَاجِدًا شَاكِرًا لِلَّهِ تَعَالَى</strong>» (أبو داود والترمذي وابن ماجه).
                </blockquote>
                <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                  <strong>أحكامها:</strong> سجدة واحدة يخر فيها المسلم لله حامداً ومسبحاً وشاكراً، ولا يُشترط لها وضوء ولا استقبال قبلة عند المحققين من العلماء، فتُفعل فور سماع الخبر السار أو النجاة من بلاء.
                </p>
              </div>

              {/* Sujud Tilawat */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between font-black text-indigo-950 dark:text-indigo-200">
                  <span className="text-sm">📖 ٢. سَجْدَةُ التِّلَاوَةِ:</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px]">١٥ موضعاً في القرآن</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                  سنة مؤكدة للقارئ والمستمع عند المرور بآيات السجود، يكبر ويسجد سجدة واحدة.
                </p>

                {/* Dua Sujud Tilawat with copy */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/20 text-xs text-slate-100 font-serif space-y-1.5">
                  <div className="flex items-center justify-between font-sans text-indigo-300 font-bold text-[11px]">
                    <span>دعاء سجود التلاوة المأثور:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          'سَجَدَ وَجْهِي لِلَّذِي خَلَقَهُ، وَشَقَّ سَمْعَهُ وَبَصَرَهُ، بِحَوْلِهِ وَقُوَّتِهِ، فَتَبَارَكَ اللَّهُ أَحْسَنُ الْخَالِقِينَ.',
                          'tilawat_dua'
                        )
                      }
                      className="p-1 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'tilawat_dua' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>نسخ</span>
                    </button>
                  </div>
                  <p className="leading-loose">
                    «سَجَدَ وَجْهِي لِلَّذِي خَلَقَهُ، وَشَقَّ سَمْعَهُ وَبَصَرَهُ، بِحَوْلِهِ وَقُوَّتِهِ، فَتَبَارَكَ اللَّهُ أَحْسَنُ الْخَالِقِينَ» (أبو داود والترمذي وصححه).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SALAT AL-TASABIH */}
          {activeTab === 'tasabih' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 space-y-1 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📿</span>
                  <h4 className="text-sm sm:text-base font-black text-purple-200">
                    صَلَاةُ التَّسَابِيحِ (مَغْفِرَةُ الذُّنُوبِ كُلِّهَا)
                  </h4>
                </div>
                <p className="text-xs text-purple-300/80 leading-relaxed font-medium">
                  علمها النبي ﷺ لعمه العباس رضي الله عنه؛ أربع ركعات فيها ثلاثمائة تسبيحة تغفر الذنوب أولها وآخرها.
                </p>
              </div>

              {/* Hadith */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2">
                <blockquote className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed border-r-2 border-purple-500 pr-3 font-medium">
                  قال النبي ﷺ للعباس بن عبد المطلب رضي الله عنه: «يَا عَبَّاسُ، يَا عَمَّاهُ، أَلَا أُعْطِيكَ، أَلَا أَمْنَحُكَ، أَلَا أَحْبُوكَ، أَلَا أَفْعَلُ بِكَ عَشْرَ خِصَالٍ، إِذَا أَنْتَ فَعَلْتَ ذَلِكَ غَفَرَ اللَّهُ لَكَ ذَنْبَكَ: أَوَّلَهُ وَآخِرَهُ، قَدِيمَهُ وَحَدِيثَهُ، خَطَأَهُ وَعَمْدَهُ، صَغِيرَهُ وَكَبِيرَهُ، سِرَّهُ وَعَلَانِيَتَهُ... إِنِ اسْتَطَعْتَ أَنْ تُصَلِّيَهَا فِي كُلِّ يَوْمٍ مَرَّةً فَافْعَلْ، فَإِنْ لَمْ تَفْعَلْ فَفِي كُلِّ جُمُعَةٍ مَرَّةً، فَإِنْ لَمْ تَفْعَلْ فَفِي كُلِّ شَهْرٍ مَرَّةً، فَإِنْ لَمْ تَفْعَلْ فَفِي كُلِّ سَنَةٍ مَرَّةً، فَإِنْ لَمْ تَفْعَلْ فَفِي عُمُرِكَ مَرَّةً» (رواه أبو داود: 1297، وابن ماجه: 1387).
                </blockquote>
              </div>

              {/* How to pray */}
              <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-300/60 dark:border-purple-700/40 space-y-2 text-xs text-slate-700 dark:text-zinc-300">
                <h5 className="font-black text-purple-950 dark:text-purple-200">
                  كَيْفِيَّتُهَا الدَّقِيقَةُ (٧٥ تَسْبِيحَةً فِي كُلِّ رَكْعَةٍ):
                </h5>
                <p className="leading-relaxed">
                  تُصلّى ٤ ركعات، والتسبيح هو: <strong className="text-purple-600 dark:text-purple-300">«سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ»</strong> موزعة كالآتي في كل ركعة:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800">
                    <span className="font-bold block text-purple-600">بعد القراءة قائماً</span>
                    <strong className="text-slate-900 dark:text-white">١٥ مرة</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800">
                    <span className="font-bold block text-purple-600">في الركوع</span>
                    <strong className="text-slate-900 dark:text-white">١٠ مرات</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800">
                    <span className="font-bold block text-purple-600">عند الرفع من الركوع</span>
                    <strong className="text-slate-900 dark:text-white">١٠ مرات</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800">
                    <span className="font-bold block text-purple-600">في السجدة الأولى</span>
                    <strong className="text-slate-900 dark:text-white">١٠ مرات</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800">
                    <span className="font-bold block text-purple-600">بين السجدتين</span>
                    <strong className="text-slate-900 dark:text-white">١٠ مرات</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800">
                    <span className="font-bold block text-purple-600">في السجدة الثانية</span>
                    <strong className="text-slate-900 dark:text-white">١٠ مرات</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800">
                    <span className="font-bold block text-purple-600">جلسة الاستراحة قبل القيام</span>
                    <strong className="text-slate-900 dark:text-white">١٠ مرات</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <span className="font-bold block text-amber-700 dark:text-amber-300">مجموع الركعة</span>
                    <strong className="text-amber-800 dark:text-amber-200">٧٥ تسبيحة</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
