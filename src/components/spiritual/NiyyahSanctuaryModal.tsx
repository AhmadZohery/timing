import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Briefcase,
  GraduationCap,
  Heart,
  Shield,
  Check,
  Sparkles,
  Copy,
  Flame,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

export type NiyyahPillar = 'livelihood' | 'knowledge' | 'family' | 'body';

export interface NiyyahSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
  initialPillar?: NiyyahPillar;
}

interface IntentionOption {
  id: string;
  pillar: NiyyahPillar;
  textAr: string;
  textEn: string;
  evidenceAr: string;
  evidenceEn: string;
  scholarAr: string;
}

const INTENTIONS_VAULT: IntentionOption[] = [
  // 1. الرزق الحلال والكفاية
  {
    id: 'l1',
    pillar: 'livelihood',
    textAr: 'إعفاف النفس والأهل عن الحرام وسؤال الناس',
    textEn: 'Chastity & self-sufficiency for self and family from haram and begging',
    evidenceAr: '«طَلَبُ الْحَلالِ فَرِيضَةٌ بَعْدَ الْفَرِيضَةِ» — رواه البيهقي',
    evidenceEn: 'Seeking halal is an obligation after the religious obligations',
    scholarAr: 'قال عمر بن الخطاب: «ما من موضع يأتيني الموت فيه أحب إلي من موطن أتسوق فيه لأهلي أشتري وأبيع»',
  },
  {
    id: 'l2',
    pillar: 'livelihood',
    textAr: 'التصدق بفضل الكسب وإغاثة الملهوف وإعانة الضعفاء',
    textEn: 'Charity from surplus earnings and relieving the distressed',
    evidenceAr: '«اليَدُ العُلْيَا خَيْرٌ مِنَ اليَدِ السُّفْلَى» — متفق عليه',
    evidenceEn: 'The upper hand is better than the lower hand',
    scholarAr: 'قال عبد الله بن المبارك: «لا أعلم بعد النبوة درجة أفضل من بث العلم وبذل المال للمسلمين»',
  },
  {
    id: 'l3',
    pillar: 'livelihood',
    textAr: 'عمارة الأرض وبناء عزة اقتصادية واستقلالية للأمة',
    textEn: 'Cultivating the earth and building economic independence for the Ummah',
    evidenceAr: '﴿هُوَ أَنشَأَكُم مِّنَ الْأَرْضِ وَاسْتَعْمَرَكُمْ فِيهَا﴾ [هود: 61]',
    evidenceEn: 'He brought you forth from the earth and settled you upon it',
    scholarAr: 'قال الإمام أحمد: «هذا كسب حلال يتقرب به إلى الله وينفق منه على قرابته»',
  },

  // 2. العلم النافع والإتقان
  {
    id: 'k1',
    pillar: 'knowledge',
    textAr: 'رفع الجهل عن النفس وعبادة الله على بصيرة وبينة',
    textEn: 'Lifting ignorance from oneself and worshiping Allah with insight',
    evidenceAr: '﴿قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ﴾ [الزمر: 9]',
    evidenceEn: 'Are those who know equal to those who do not know?',
    scholarAr: 'قال الإمام أحمد: «العلم لا يعدله شيء لمن صحت نيته: ينوي رفع الجهل عن نفسه وعن غيره»',
  },
  {
    id: 'k2',
    pillar: 'knowledge',
    textAr: 'إتقان الصنعة والمهنة لتقديم أعظم نفع للمسلمين',
    textEn: 'Mastery of professional craft to provide maximum benefit to humanity',
    evidenceAr: '«إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ» — رواه البيهقي',
    evidenceEn: 'Allah loves that when one of you does a work, he perfects it',
    scholarAr: 'قال الحسن البصري: «المؤمن جمع إحساناً في عمل ومخافةً من الله»',
  },
  {
    id: 'k3',
    pillar: 'knowledge',
    textAr: 'التفوق المهني والتكنولوجي لإعلاء شأن المسلم وتمكينه',
    textEn: 'Professional & technological excellence to elevate and empower the believer',
    evidenceAr: '«مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ» — رواه مسلم',
    evidenceEn: 'Whoever treads a path in search of knowledge, Allah will make easy for him the path to Paradise',
    scholarAr: 'قال مطرف بن عبد الله: «فضل العلم أحب إلي من فضل العبادة، وخير دينكم الورع»',
  },

  // 3. الأهل والرحم والواجبات
  {
    id: 'f1',
    pillar: 'family',
    textAr: 'بر الوالدين وطلب رضاهما والإحسان بالقول والعمل',
    textEn: 'Honoring parents, seeking their pleasure through speech and deeds',
    evidenceAr: '﴿وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا﴾ [الإسراء: 23]',
    evidenceEn: 'And your Lord has decreed that you not worship except Him, and to parents, good treatment',
    scholarAr: 'قال ابن المنكدر: «بات أخي عمر يصلي وبِتُّ أغمز قدم أمي، وما أحب أن ليلتي بليلته»',
  },
  {
    id: 'f2',
    pillar: 'family',
    textAr: 'إدخال السرور على أهل البيت والإنفاق عليهم احتساباً للأجر',
    textEn: 'Bringing joy to household and spending on them seeking reward',
    evidenceAr: '«إِنَّكَ لَنْ تُنْفِقَ نَفَقَةً تَبْتَغِي بِهَا وَجْهَ اللَّهِ إِلاَّ أُجِرْتَ عَلَيْهَا» — متفق عليه',
    evidenceEn: 'Whatever you spend seeking Allah\'s Face, you will be rewarded for it',
    scholarAr: 'قال النبي ﷺ: «خَيْرُكُمْ خَيْرُكُمْ لأَهْلِهِ وَأَنَا خَيْرُكُمْ لأَهْلِي»',
  },
  {
    id: 'f3',
    pillar: 'family',
    textAr: 'صلة الأرحام وتفقد المحتاجين منهم وتأليف القلوب',
    textEn: 'Upholding ties of kinship, checking on relatives, and harmonizing hearts',
    evidenceAr: '«مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ وَيُنْسَأَ لَهُ فِي أَثَرِهِ فَلْيَصِلْ رَحِمَهُ» — رواه البخاري',
    evidenceEn: 'Whoever loves that his sustenance be expanded and his life prolonged, let him uphold ties of kinship',
    scholarAr: 'قال علي بن أبي طالب: «صلة الرحم توجب المحبة، وتكبت العدو، وتدفع ميتة السوء»',
  },

  // 4. البدن والنفس والترويح
  {
    id: 'b1',
    pillar: 'body',
    textAr: 'التقوي بصحة البدن على عبادة الله والجهاد ومكابدة شؤون الحياة',
    textEn: 'Strengthening the physical body for worship, service, and enduring life challenges',
    evidenceAr: '«الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ» — رواه مسلم',
    evidenceEn: 'The strong believer is better and more beloved to Allah than the weak believer',
    scholarAr: 'قال معاذ بن جبل رضي الله عنه: «إِنِّي لأَحْتَسِبُ نَوْمَتِي كَمَا أَحْتَسِبُ قَوْمَتِي»',
  },
  {
    id: 'b2',
    pillar: 'body',
    textAr: 'حفظ أمانة الجسد والوقاية من الأسقام والكسل والفتور',
    textEn: 'Safeguarding body trust, preventing illness, lethargy, and burnout',
    evidenceAr: '«وَإِنَّ لِجَسَدِكَ عَلَيْكَ حَقًّا» — صحيح البخاري',
    evidenceEn: 'Indeed, your body has a right over you',
    scholarAr: 'كان من دعائه ﷺ: «اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْهَرَمِ»',
  },
  {
    id: 'b3',
    pillar: 'body',
    textAr: 'الترويح المباح عن النفس لتجديد النشاط وشحذ العزيمة لخدمة الحق',
    textEn: 'Permissible recreation to renew stamina and sharpen focus for righteousness',
    evidenceAr: '«رَوِّحُوا الْقُلُوبَ سَاعَةً بَعْدَ سَاعَةٍ، فَإِنَّ الْقُلُوبَ إِذَا كَلَّتْ عَمِيَتْ» — أثر مأثور',
    evidenceEn: 'Give rest to hearts hour after hour, for hearts go blind when exhausted',
    scholarAr: 'قال علي بن أبي طالب: «إن هذه القلوب تمل كما تمل الأبدان، فابتغوا لها طرائف الحكمة»',
  },
];

export const NiyyahSanctuaryModal: React.FC<NiyyahSanctuaryModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
  initialPillar = 'livelihood',
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [activePillar, setActivePillar] = useState<NiyyahPillar>(initialPillar);
  const [selectedIntentions, setSelectedIntentions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('midmar_selected_niyyah_ids');
      return saved ? JSON.parse(saved) : ['l1', 'k2', 'b1'];
    } catch {
      return ['l1', 'k2', 'b1'];
    }
  });

  const [isCopied, setIsCopied] = useState(false);
  const [isLockedToday, setIsLockedToday] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return localStorage.getItem('midmar_niyyah_locked_date') === today;
  });

  useEffect(() => {
    if (initialPillar) {
      setActivePillar(initialPillar);
    }
  }, [initialPillar]);

  if (!isOpen) return null;

  const toggleIntention = (id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedIntentions((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('midmar_selected_niyyah_ids', JSON.stringify(next));
      return next;
    });
  };

  const handleLockNiyyah = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('midmar_niyyah_locked_date', today);
    setIsLockedToday(true);
    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();

    if (onRewardToast) {
      onRewardToast(
        isAr
          ? 'تقبّل الله نيتك! جُعل سعيك اليوم كله في ميزان حسناتك (+15 XP) 🌟'
          : 'Intention consecrated! May your daily strive count as pure worship (+15 XP) 🌟'
      );
    }
  };

  const handleCopyPledge = () => {
    const chosenItems = INTENTIONS_VAULT.filter((item) => selectedIntentions.includes(item.id));
    const text = isAr
      ? `بسم الله الرحمن الرحيم\n«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ»\nميثاق النية اليومي في مضمار:\n` +
        chosenItems.map((i) => `• ${i.textAr}`).join('\n') +
        `\n\nاللهم اجعل عملي كله صالحاً، واجعله لوجهك خالصاً، ولا تجعل لأحد فيه شيئاً.`
      : `In the Name of Allah\n"Actions are by intentions"\nMy Daily Midmar Intention Covenant:\n` +
        chosenItems.map((i) => `• ${i.textEn}`).join('\n') +
        `\n\nO Allah, make all my work righteous and purely for Your Face.`;

    navigator.clipboard.writeText(text);
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const pillarsConfig = [
    {
      id: 'livelihood' as NiyyahPillar,
      labelAr: 'ركن الرزق والكفاية',
      labelEn: 'Livelihood & Sustenance',
      icon: Briefcase,
      color: 'amber',
      tagAr: 'إعفاف وعمارة',
      tagEn: 'Chastity & Growth',
    },
    {
      id: 'knowledge' as NiyyahPillar,
      labelAr: 'ركن العلم والإتقان',
      labelEn: 'Knowledge & Mastery',
      icon: GraduationCap,
      color: 'sky',
      tagAr: 'بصيرة وإحسان',
      tagEn: 'Insight & Excellence',
    },
    {
      id: 'family' as NiyyahPillar,
      labelAr: 'ركن الأهل والرحم',
      labelEn: 'Family & Kinship',
      icon: Heart,
      color: 'rose',
      tagAr: 'بر ومودة',
      tagEn: 'Love & Duty',
    },
    {
      id: 'body' as NiyyahPillar,
      labelAr: 'ركن البدن والنفس',
      labelEn: 'Body & Vitality',
      icon: Shield,
      color: 'emerald',
      tagAr: 'المؤمن القوي',
      tagEn: 'Strong Believer',
    },
  ];

  const currentPillarIntentions = INTENTIONS_VAULT.filter((i) => i.pillar === activePillar);
  const activeConfig = pillarsConfig.find((p) => p.id === activePillar)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-[#faf8f5] dark:bg-[#0c0d12] border border-amber-900/20 dark:border-amber-500/20 shadow-2xl text-slate-900 dark:text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-amber-900/10 dark:border-white/10 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {isAr ? 'محرك استحضار النوايا الأربع' : 'The 4 Pillars of Intention'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                  {isAr ? 'تحويل العادات إلى عبادات' : 'Habit to Worship'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                {isAr ? 'محراب تجديد النية والاحتساب' : 'Niyyah & Consecration Sanctuary'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Prophetic Hadith Banner */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-center space-y-1">
            <p className="text-xs sm:text-sm font-serif font-black text-amber-950 dark:text-amber-200">
              «إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى»
            </p>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
              {isAr
                ? 'بالنية الصالحة تنقلب نومك، وأكلك، وسعيك في الرزق، وعرق تمرينك إلى حسنات في صحيفتك.'
                : 'With sincere intention, your sleep, food, work, and workout sweat become worship on your scale.'}
            </p>
          </div>
        </div>

        {/* 4 Pillars Navigation Bar */}
        <div className="px-4 sm:px-6 pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {pillarsConfig.map((p) => {
              const Icon = p.icon;
              const isActive = activePillar === p.id;
              const count = INTENTIONS_VAULT.filter(
                (i) => i.pillar === p.id && selectedIntentions.includes(i.id)
              ).length;

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setActivePillar(p.id);
                  }}
                  className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-slate-200/80 dark:border-zinc-800 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`p-1.5 rounded-xl ${
                        isActive
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                        {count} عقد
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-black block truncate text-slate-900 dark:text-zinc-100">
                      {isAr ? p.labelAr : p.labelEn}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium block truncate">
                      {isAr ? p.tagAr : p.tagEn}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Intentions List for Active Pillar */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 scrollbar-thin">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {isAr
                  ? `نوايا ${activeConfig.labelAr} (حدد ما تستحضره في قلبك اليوم)`
                  : `Intentions for ${activeConfig.labelEn}`}
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
              {currentPillarIntentions.filter((i) => selectedIntentions.includes(i.id)).length} /{' '}
              {currentPillarIntentions.length}
            </span>
          </div>

          <div className="space-y-3">
            {currentPillarIntentions.map((item) => {
              const isSelected = selectedIntentions.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleIntention(item.id)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'bg-white dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-xs transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-black'
                              : 'border border-slate-300 dark:border-zinc-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                          {isAr ? item.textAr : item.textEn}
                        </h4>
                      </div>

                      <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 font-serif pr-7">
                        {isAr ? item.evidenceAr : item.evidenceEn}
                      </p>

                      <div className="text-[10px] text-slate-500 dark:text-zinc-400 pr-7 italic">
                        {item.scholarAr}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-amber-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopyPledge}
            className="tap-spring py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? (isAr ? 'تم نسخ الميثاق' : 'Copied!') : isAr ? 'نسخ ميثاق النية' : 'Copy Pledge'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLockNiyyah}
              disabled={selectedIntentions.length === 0}
              className={`tap-spring py-2.5 px-5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                isLockedToday
                  ? 'bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-700 hover:from-amber-500 hover:to-emerald-600 text-white shadow-amber-600/20'
              }`}
            >
              {isLockedToday ? <Check className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
              <span>
                {isLockedToday
                  ? isAr
                    ? 'عُقدت نية اليوم بنجاح ✓'
                    : 'Intention Consecrated Today ✓'
                  : isAr
                  ? `عقد النية اليومية (${selectedIntentions.length} نوايا)`
                  : `Consecrate Intention (${selectedIntentions.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
