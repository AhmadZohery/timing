import React, { useState } from 'react';
import {
  Scale,
  Check,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  Eye,
  MessageSquareOff,
  Home,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

export interface MuhasabahItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: any;
  color: string;
}

const MUHASABAH_CHECKPOINTS: MuhasabahItem[] = [
  {
    id: 'prayers_on_time',
    titleAr: 'إتقان الفرائض الخمس في أوقاتها',
    titleEn: '5 Daily Prayers on Time with Khushu',
    descAr: 'المحافظة على الصلوات في مواقيتها بخشوع دون تأخير أو كسل',
    descEn: 'Maintaining prayers in their proper windows with focus',
    icon: ShieldCheck,
    color: 'emerald',
  },
  {
    id: 'tongue_restraint',
    titleAr: 'حفظ اللسان والنزاهة من اللغو',
    titleEn: 'Restraint of Tongue & Avoidance of Gossip',
    descAr: 'براءة اليوم من الغيبة، النميمة، الكذب، الشتم، والجدال العقيم',
    descEn: 'Purity from backbiting, gossip, lying, foul speech, and futile arguments',
    icon: MessageSquareOff,
    color: 'rose',
  },
  {
    id: 'gaze_limbs',
    titleAr: 'حفظ الجوارح والنقاء الرقمي',
    titleEn: 'Safeguarding Gaze & Digital Purity',
    descAr: 'غض البصر، حفظ السمع، وتطهير العين من المحتوى الخادش والمحرم',
    descEn: 'Lowering the gaze and shielding digital consumption from haram',
    icon: Eye,
    color: 'indigo',
  },
  {
    id: 'quran_wird',
    titleAr: 'وِرد القرآن الكريم والتدبر',
    titleEn: 'Quran Daily Portion & Contemplation',
    descAr: 'حظ من كتاب الله: تلاوة حزب، أو حفظ، أو تدبر آيات بينات',
    descEn: 'A portion of Quran: recitation, memorization, or reflection',
    icon: BookOpen,
    color: 'amber',
  },
  {
    id: 'sadaqah_charity',
    titleAr: 'الصدقة والإحسان ونفع الخلق',
    titleEn: 'Daily Charity & Altruistic Service',
    descAr: 'بذل مال، إطعام طعام، سقيا ماء، تفريج كربة، أو تبسم وكلمة طيبة',
    descEn: 'Financial gift, feeding food, providing water, or a kind word',
    icon: HeartHandshake,
    color: 'teal',
  },
  {
    id: 'family_kin',
    titleAr: 'بر الوالدين وصلة الرحم والأهل',
    titleEn: 'Honoring Parents & Kinship Duties',
    descAr: 'مكالمة والدين، بر، صلة رحم، أو تطييب نفوس أهل البيت والعيال',
    descEn: 'Calling parents, honoring relatives, and bringing joy to the home',
    icon: Home,
    color: 'purple',
  },
  {
    id: 'work_integrity',
    titleAr: 'صدق النية وإتقان السعي وأكل الحلال',
    titleEn: 'Work Integrity & Halal Earnings',
    descAr: 'الإخلاص في العمل، أداء الأمانات والمهام دون غش أو تضييع للأوقات',
    descEn: 'Sincerity in work, fulfilling duties honestly without wasting time',
    icon: Briefcase,
    color: 'sky',
  },
];

const SADAQAH_CHANNELS = [
  { id: 'food', labelAr: 'إطعام طعام', labelEn: 'Feeding Food' },
  { id: 'water', labelAr: 'سقيا ماء', labelEn: 'Water Giving' },
  { id: 'orphan', labelAr: 'كفالة يتيم / إعانة', labelEn: 'Orphan Care' },
  { id: 'distress', labelAr: 'تفريج كربة مسلم', labelEn: 'Relieving Distress' },
  { id: 'knowledge', labelAr: 'نشر علم نافع', labelEn: 'Sharing Knowledge' },
  { id: 'kind_word', labelAr: 'كلمة طيبة وتبسم', labelEn: 'Kind Word' },
];

export const MizanMuhasabahCard: React.FC<{
  todayDate?: string;
  onRewardToast?: (msg: string) => void;
}> = ({ todayDate, onRewardToast }) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const effectiveDate = todayDate || new Date().toISOString().split('T')[0];
  const storageKey = `midmar_muhasabah_${effectiveDate}`;

  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedSadaqah, setSelectedSadaqah] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`midmar_sadaqah_${effectiveDate}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isExpanded, setIsExpanded] = useState(true);

  const toggleCheck = (id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem(storageKey, JSON.stringify(next));

      if (next.length === MUHASABAH_CHECKPOINTS.length && !prev.includes(id)) {
        soundSynth.playStreakMilestoneChime();
        haptic.vibrateSprintCelebration();
        if (onRewardToast) {
          onRewardToast(
            isAr
              ? 'ما شاء الله! اكتمل ميزان المحاسبة اليومي 7/7 (صحيفة بيضاء مشرقة) ✨'
              : 'SubhanAllah! 7/7 Daily Accountability completed (Pure Ledger) ✨'
          );
        }
      }
      return next;
    });
  };

  const toggleSadaqah = (channelId: string, channelNameAr: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    setSelectedSadaqah((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((c) => c !== channelId)
        : [...prev, channelId];
      localStorage.setItem(`midmar_sadaqah_${effectiveDate}`, JSON.stringify(next));

      if (!prev.includes(channelId)) {
        // Auto-check the sadaqah checkpoint in the main grid if not checked
        if (!checkedIds.includes('sadaqah_charity')) {
          const nextChecks = [...checkedIds, 'sadaqah_charity'];
          setCheckedIds(nextChecks);
          localStorage.setItem(storageKey, JSON.stringify(nextChecks));
        }

        if (onRewardToast) {
          onRewardToast(
            isAr
              ? `تقبّل الله صدقتك في مصرف (${channelNameAr}) (+10 XP) 🌿`
              : `Logged charity in ${channelId} (+10 XP)`
          );
        }
      }
      return next;
    });
  };

  const score = Math.round((checkedIds.length / MUHASABAH_CHECKPOINTS.length) * 100);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-[#fbf9f5] via-white to-white dark:from-[#11131a] dark:via-[#0c0d12] dark:to-[#0c0d12] border border-amber-900/15 dark:border-amber-500/20 space-y-4 shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-amber-900/10 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {isAr ? 'ميزان المحاسبة والمساءلة اليومية' : 'Daily Mizan & Self-Audit'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  score === 100
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    : score >= 70
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                {checkedIds.length} / {MUHASABAH_CHECKPOINTS.length} ({score}%)
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
              {isAr ? '«حَاسِبُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُحَاسَبُوا»' : 'Account for yourselves before you are judged'}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            setIsExpanded(!isExpanded);
          }}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Classical Quote Banner */}
          <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="font-serif text-amber-950 dark:text-amber-200 leading-relaxed">
              «حَاسِبُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُحَاسَبُوا، وَزِنُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُوزَنُوا، فَإِنَّهُ أَهْوَنُ عَلَيْكُمْ فِي الْحِسَابِ غَدًا أَنْ تُحَاسَبُوا الْيَوْمَ»
              <span className="block text-[10px] text-amber-800/70 dark:text-amber-400/70 font-sans mt-0.5">
                — أمير المؤمنين عمر بن الخطاب رضي الله عنه
              </span>
            </p>
            <div className="text-right">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                {score === 100
                  ? isAr ? '🌟 صحيفة بيضاء مشرقة' : '🌟 Pure Ledger'
                  : score >= 70
                  ? isAr ? '🌿 مجاهدة ويقظة نفس' : '🌿 Vigilant Soul'
                  : isAr ? '🤲 تدارك واستغفار' : '🤲 Seek Forgiveness'}
              </span>
            </div>
          </div>

          {/* 7 Checkpoints Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MUHASABAH_CHECKPOINTS.map((item) => {
              const isChecked = checkedIds.includes(item.id);
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'bg-white/80 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 text-white font-black shadow-xs'
                        : 'border border-slate-300 dark:border-zinc-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <h4
                        className={`text-xs font-bold truncate ${
                          isChecked
                            ? 'text-emerald-900 dark:text-emerald-200'
                            : 'text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        {isAr ? item.titleAr : item.titleEn}
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-snug line-clamp-2">
                      {isAr ? item.descAr : item.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sadaqah Channels 1-Tap Bar */}
          <div className="p-3.5 rounded-2xl bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'مصارف الصدقة اليومية (سجّل ما تصدقت به بنقرة)' : 'Daily Sadaqah Channels'}</span>
              </span>
              <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">
                {selectedSadaqah.length} {isAr ? 'مصارف موثقة' : 'logged'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {SADAQAH_CHANNELS.map((ch) => {
                const isSelected = selectedSadaqah.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleSadaqah(ch.id, ch.labelAr)}
                    className={`py-1 px-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs font-black'
                        : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-teal-500/20 hover:border-teal-500/40'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{isAr ? ch.labelAr : ch.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
