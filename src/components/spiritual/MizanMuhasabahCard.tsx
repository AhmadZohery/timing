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

  const handleSliderChange = (targetCount: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const clamped = Math.max(0, Math.min(MUHASABAH_CHECKPOINTS.length, targetCount));
    const nextIds = MUHASABAH_CHECKPOINTS.slice(0, clamped).map((c) => c.id);
    setCheckedIds(nextIds);
    localStorage.setItem(storageKey, JSON.stringify(nextIds));
    if (clamped === MUHASABAH_CHECKPOINTS.length && checkedIds.length < MUHASABAH_CHECKPOINTS.length) {
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
  };

  const getPastelUncheckedSurface = (color: string) => {
    switch (color) {
      case 'rose':
        return 'bg-[#fce2e6]/45 dark:bg-white/[0.04] border-[#fce2e6] dark:border-white/10 hover:bg-[#fce2e6]/80';
      case 'indigo':
      case 'purple':
        return 'bg-[#e2defc]/45 dark:bg-white/[0.04] border-[#e2defc] dark:border-white/10 hover:bg-[#e2defc]/80';
      case 'amber':
        return 'bg-[#fde6d8]/45 dark:bg-white/[0.04] border-[#fde6d8] dark:border-white/10 hover:bg-[#fde6d8]/80';
      default:
        return 'bg-[#d4f5dc]/40 dark:bg-white/[0.04] border-[#bce8c2] dark:border-white/10 hover:bg-[#d4f5dc]/75';
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-[26px] surface-card-3d border border-slate-200/90 dark:border-white/10 space-y-4 transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#141517] dark:bg-[#fde6d8] text-[#fde6d8] dark:text-[#141517] shadow-2xs shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 dark:text-[#fde6d8]">
                {isAr ? 'ميزان المحاسبة والمساءلة اليومية' : 'Daily Mizan & Self-Audit'}
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-black border ${
                  score === 100
                    ? 'bg-[#bce8c2] text-[#141517] border-[#1eb814]/40'
                    : score >= 70
                    ? 'bg-[#fde6d8] text-[#141517] border-[#ff5500]/25'
                    : 'bg-[#e2defc] text-[#141517] border-[#5448e8]/20'
                }`}
              >
                {checkedIds.length} / {MUHASABAH_CHECKPOINTS.length} ({score}%)
              </span>
            </div>
            <h3
              dir="rtl"
              lang="ar"
              className="tashkeel-text leading-[2.2] text-sm sm:text-base font-bold text-[#141517] dark:text-white"
            >
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
          className="p-2 rounded-full bg-[#e2defc] hover:brightness-95 text-[#141517] transition-all active:scale-95 cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Classical Quote Banner */}
          <div className="p-4 rounded-[26px] bg-[#fde6d8]/65 dark:bg-white/5 border border-[#fde6d8] dark:border-[#fde6d8]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <p
              dir="rtl"
              lang="ar"
              className="tashkeel-text leading-[2.2] font-quran text-sm sm:text-base text-[#141517] dark:text-[#fde6d8] font-normal flex-1 min-w-[220px]"
            >
              «حَاسِبُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُحَاسَبُوا، وَزِنُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُوزَنُوا، فَإِنَّهُ أَهْوَنُ عَلَيْكُمْ فِي الْحِسَابِ غَدًا أَنْ تُحَاسَبُوا الْيَوْمَ»
              <span className="block text-[10px] text-[#141517]/75 dark:text-[#fde6d8]/80 font-sans font-bold mt-1">
                — أمير المؤمنين عمر بن الخطاب رضي الله عنه
              </span>
            </p>
            <div className="px-3 py-1.5 rounded-full bg-[#141517] text-[#bce8c2] font-black text-[11px] shrink-0">
              {score === 100
                ? isAr ? '🌟 صحيفة بيضاء مشرقة' : '🌟 Pure Ledger'
                : score >= 70
                ? isAr ? '🌿 مجاهدة ويقظة نفس' : '🌿 Vigilant Soul'
                : isAr ? '🤲 تدارك واستغفار' : '🤲 Seek Forgiveness'}
            </div>
          </div>

          {/* Interactive Mizan Balance Slider */}
          <div className="p-3.5 rounded-[22px] bg-[#141517] text-white border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#bce8c2] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#1eb814]" />
                <span>{isAr ? 'مؤشر كفة الميزان اليومي التفاعلي' : 'Interactive Daily Mizan Scale'}</span>
              </span>
              <span className="font-mono font-black px-2 py-0.5 rounded-full bg-[#bce8c2] text-[#141517]">
                {checkedIds.length} / {MUHASABAH_CHECKPOINTS.length}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={MUHASABAH_CHECKPOINTS.length}
              step={1}
              value={checkedIds.length}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full accent-[#bce8c2] h-2 bg-white/15 rounded-full cursor-pointer"
            />
          </div>

          {/* 7 Checkpoints Grid (Habitline Pastel & Obsidian Bento Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MUHASABAH_CHECKPOINTS.map((item) => {
              const isChecked = checkedIds.includes(item.id);
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-3.5 rounded-[26px] border transition-all cursor-pointer flex items-start gap-3 select-none active:scale-[0.98] ${
                    isChecked
                      ? 'bg-[#bce8c2] text-[#141517] border-[#1eb814]/40 shadow-xs'
                      : getPastelUncheckedSurface(item.color)
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs transition-colors ${
                      isChecked
                        ? 'bg-[#141517] text-[#bce8c2] font-black shadow-2xs'
                        : 'border border-[#141517]/25 dark:border-white/25 bg-white/80 dark:bg-zinc-900 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.75]" />
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isChecked ? 'text-[#1eb814]' : 'text-[#141517] dark:text-[#bce8c2]'
                        }`}
                      />
                      <h4
                        className={`text-xs font-black truncate ${
                          isChecked
                            ? 'text-[#141517]'
                            : 'text-[#141517] dark:text-white'
                        }`}
                      >
                        {isAr ? item.titleAr : item.titleEn}
                      </h4>
                    </div>
                    <p
                      className={`text-[10px] leading-snug line-clamp-2 font-bold ${
                        isChecked
                          ? 'text-[#141517]/80'
                          : 'text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {isAr ? item.descAr : item.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sadaqah Channels 1-Tap Bar */}
          <div className="p-4 rounded-[26px] bg-[#e2defc]/55 dark:bg-white/[0.04] border border-[#e2defc] dark:border-[#e2defc]/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#141517] dark:text-[#e2defc] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#5448e8] dark:text-[#bce8c2]" />
                <span>{isAr ? 'مصارف الصدقة اليومية (سجّل ما تصدقت به بنقرة)' : 'Daily Sadaqah Channels'}</span>
              </span>
              <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-[#141517] text-[#bce8c2]">
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
                    className={`py-1.5 px-3 rounded-full text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-[#141517] text-[#bce8c2] dark:bg-[#bce8c2] dark:text-[#141517] shadow-xs'
                        : 'bg-white dark:bg-[#141517] text-[#141517] dark:text-zinc-200 border border-[#5448e8]/20 dark:border-white/15 hover:bg-[#d4f5dc]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#1eb814] dark:text-[#141517]" />}
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

