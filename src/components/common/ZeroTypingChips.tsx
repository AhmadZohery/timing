import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface ZeroTypingChipsProps {
  label?: string;
  chips: string[];
  onSelect: (chipText: string) => void;
  selectedChips?: string[];
  className?: string;
}

export const ZeroTypingChips: React.FC<ZeroTypingChipsProps> = ({
  label,
  chips,
  onSelect,
  selectedChips = [],
  className = '',
}) => {
  const handleClick = (chip: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onSelect(chip);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 text-[11px] font-medium">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          <span>{label} (خيارات سريعة بنقرة واحدة):</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip, idx) => {
          const isSelected = selectedChips.includes(chip);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleClick(chip)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/60 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              {!isSelected && <Plus className="w-3 h-3 text-slate-400 dark:text-zinc-500" />}
              <span>{chip}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Preset rich library for zero-typing throughout the app
export const ZERO_TYPING_PRESETS = {
  wins: [
    'صلاة الفجر في جماعة 🕌',
    'قراءة سورة البقرة كاملة 📖',
    'جلسة عمل عميق بدون تشتت 💻',
    'قراءة سورة الملك قبل النوم 🌙',
    'أذكار الصباح والمساء ✨',
    'جلسة تمارين الجيم 🏋️',
    'صلاة الضحى والسنن الرواتب 🤲',
    'قيام الليل وركعة الوتر 🌌',
    'إنهاء الورد القرآني اليومي 📜',
    'الالتزام بالصيام التطوعي 🌙',
  ],
  reflections: [
    'يوم ممتلئ بالبركة والسكينة الإيمانية',
    'إنجاز ممتاز وتركيز عميق دون تشتت',
    'طاقتي كانت منخفضة لكن قاومت التسويف بنجاح',
    'الحمد لله على نعمة الصلاة في وقتها',
    'تحديات غير متوقعة تم تجاوزها بهدوء ومرونة',
    'شعرت ببعض الإرهاق الذهني وسأعوض غداً بإذن الله',
    'يوم متزن بين العبادة والعمل والرياضة',
  ],
  anchors: [
    'الاستيقاظ قبل أذان الفجر بـ 20 دقيقة للوتر 🌌',
    'قراءة سورة البقرة صباحاً بنية البركة 📖',
    'بدء يوم العمل بأهم مهمة فوراً بدون تسويف 💻',
    'جلسة عمل عميق أولى مدتها 50 دقيقة ⏱️',
    'المحافظة على صلاة الضحى ☀️',
    'أداء جلسة تمرين الحديد في الجيم 🏋️',
    'الابتعاد التام عن شبكات التواصل حتى إتمام الفجر 📵',
  ],
  goldenNuggets: [
    'الصلاة في وقتها هي البوصلة ومفتاح بركة اليوم كله.',
    'البدء بدقيقتين كفيل بإذابة جبل المقاومة النفسية.',
    'الاتساق القليل المستمر خير من الكثير المنقطع.',
    'سورة البقرة أخذها بركة وتركها حسرة.',
    'حماية صلاة الفجر في وقتها تحميك طوال اليوم في ذمة الله.',
    'التركيز العميق عضلة تقوى بالمران اليومي وتجنب المقاطعات.',
  ],
};
