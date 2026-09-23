import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  Type,
  ShieldCheck,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { awardSpiritualHabitPoints } from '../../utils/gamification';

export interface SurahMulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCompleted?: boolean;
  onCompleted?: () => void;
  onRewardToast?: (msg: string) => void;
}

export const SURAH_MULK_VERSES: Array<{ number: number; text: string }> = [
  { number: 1, text: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ" },
  { number: 2, text: "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ" },
  { number: 3, text: "الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ" },
  { number: 4, text: "ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ" },
  { number: 5, text: "وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ" },
  { number: 6, text: "وَلِلَّذِينَ كَفَرُوا بِرَبِّهِمْ عَذَابُ جَهَنَّمَ ۖ وَبِئْسَ الْمَصِيرُ" },
  { number: 7, text: "إِذَا أُلْقُوا فِيهَا سَمِعُوا لَهَا شَهِيقًا وَهِيَ تَفُورُ" },
  { number: 8, text: "تَكَادُ تَمَيَّزُ مِنَ الْغَيْظِ ۖ كُلَّمَا أُلْقِيَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَا أَلَمْ يَأْتِكُمْ نَذِيرٌ" },
  { number: 9, text: "قَالُوا بَلَىٰ قَدْ جَاءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ اللَّهُ مِن شَيْءٍ إِنْ أَنتُمْ إِلَّا فِي ضَلَالٍ كَبِيرٍ" },
  { number: 10, text: "وَقَالُوا لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِي أَصْحَابِ السَّعِيرِ" },
  { number: 11, text: "فَاعْتَرَفُوا بِذَنبِهِمْ فَسُحْقًا لِّأَصْحَابِ السَّعِيرِ" },
  { number: 12, text: "إِنَّ الَّذِينَ يَخْشَوْنَ رَبَّهُم بِالْغَيْبِ لَهُم مَّغْفِرَةٌ وَأَجْرٌ كَبِيرٌ" },
  { number: 13, text: "وَأَسِرُّوا قَوْلَكُمْ أَوِ اجْهَرُوا بِهِ ۖ إِنَّهُ عَلِيمٌ بِذَاتِ الصُّدُورِ" },
  { number: 14, text: "أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ" },
  { number: 15, text: "هُوَ الَّذِي جَعَلَ لَكُمُ الْأَرْضَ ذَلُولًا فَامْشُوا فِي مَنَاكِبِهَا وَكُلُوا مِن رِّزْقِهِ ۖ وَإِلَيْهِ النُّشُورُ" },
  { number: 16, text: "أَأَمِنتُم مَّن فِي السَّمَاءِ أَن يَخْسِفَ بِكُمُ الْأَرْضَ فَإِذَا هِيَ تَمُورُ" },
  { number: 17, text: "أَمْ أَمِنتُم مَّن فِي السَّمَاءِ أَن يُرْسِلَ عَلَيْكُمْ حَاصِبًا ۖ فَسَتَعْلَمُونَ كَيْفَ نَذِيرِ" },
  { number: 18, text: "وَلَقَدْ كَذَّبَ الَّذِينَ مِن قَبْلِهِمْ فَكَيْفَ كَانَ نَكِيرِ" },
  { number: 19, text: "أَوَلَمْ يَرَوْا إِلَى الطَّيْرِ فَوْقَهُمْ صَافَّاتٍ وَيَقْبِضْنَ ۚ مَا يُمْسِكُهُنَّ إِلَّا الرَّحْمَٰنُ ۚ إِنَّهُ بِكُلِّ شَيْءٍ بَصِيرٌ" },
  { number: 20, text: "أَمَّنْ هَٰذَا الَّذِي هُوَ جُندٌ لَّكُمْ يَنصُرُكُم مِّن دُونِ الرَّحْمَٰنِ ۚ إِنِ الْكَافِرُونَ إِلَّا فِي غُرُورٍ" },
  { number: 21, text: "أَمَّنْ هَٰذَا الَّذِي يَرْزُقُكُمْ إِنْ أَمْسَكَ رِزْقَهُ ۚ بَل لَّجُّوا فِي عُتُوٍّ وَنُفُورٍ" },
  { number: 22, text: "أَفَمَن يَمْشِي مُكِبًّا عَلَىٰ وَجْهِهِ أَهْدَىٰ أَمَّن يَمْشِي سَوِيًّا عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ" },
  { number: 23, text: "قُلْ هُوَ الَّذِي أَنشَأَكُمْ وَجَعَلَ لَكُمُ السَّمْعَ وَالْأَبْصَارَ وَالْأَفْئِدَةَ ۖ قَلِيلًا مَّا تَشْكُرُونَ" },
  { number: 24, text: "قُلْ هُوَ الَّذِي ذَرَأَكُمْ فِي الْأَرْضِ وَإِلَيْهِ تُحْشَرُونَ" },
  { number: 25, text: "وَيَقُولُونَ مَتَىٰ هَٰذَا الْوَعْدُ إِن كُنتُمْ صَادِقِينَ" },
  { number: 26, text: "قُلْ إِنَّمَا الْعِلْمُ عِندَ اللَّهِ وَإِنَّمَا أَنَا نَذِيرٌ مُّبِينٌ" },
  { number: 27, text: "فَلَمَّا رَأَوْهُ زُلْفَةً سِيئَتْ وُجُوهُ الَّذِينَ كَفَرُوا وَقِيلَ هَٰذَا الَّذِي كُنتُم بِهِ تَدَّعُونَ" },
  { number: 28, text: "قُلْ أَرَأَيْتُمْ إِنْ أَهْلَكَنِيَ اللَّهُ وَمَن مَّعِيَ أَوْ رَحِمَنَا فَمَن يُجِيرُ الْكَافِرِينَ مِنْ عَذَابٍ أَلِيمٍ" },
  { number: 29, text: "قُلْ هُوَ الرَّحْمَٰنُ آمَنَّا بِهِ وَعَلَيْهِ تَوَكَّلْنَا ۖ فَسَتَعْلَمُونَ مَنْ هُوَ فِي ضَلَالٍ مُّبِينٍ" },
  { number: 30, text: "قُلْ أَرَأَيْتُمْ إِنْ أَصْبَحَ مَاؤُكُمْ غَوْرًا فَمَن يَأْتِيكُم بِمَاءٍ مَّعِينٍ" },
];

export const SurahMulkModal: React.FC<SurahMulkModalProps> = ({
  isOpen,
  onClose,
  isCompleted = false,
  onCompleted,
  onRewardToast,
}) => {
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'huge'>('large');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [readVerses, setReadVerses] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(isCompleted);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setDone(isCompleted);
  }, [isCompleted]);

  // Clean up audio on unmount or close
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  const toggleAudio = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    if (!audioRef.current) {
      const audio = new Audio('https://server8.mp3quran.net/afs/067.mp3');
      audioRef.current = audio;

      audio.addEventListener('waiting', () => setIsAudioLoading(true));
      audio.addEventListener('playing', () => {
        setIsAudioLoading(false);
        setIsPlayingAudio(true);
      });
      audio.addEventListener('pause', () => setIsPlayingAudio(false));
      audio.addEventListener('ended', () => setIsPlayingAudio(false));
      audio.addEventListener('error', () => {
        setIsAudioLoading(false);
        setIsPlayingAudio(false);
      });
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
    } else {
      setIsAudioLoading(true);
      audioRef.current.play().catch(() => {
        setIsAudioLoading(false);
      });
    }
  };

  const handleToggleVerse = (num: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setReadVerses((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  };

  const handleCompleteAll = async () => {
    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();

    setDone(true);
    setReadVerses(new Set(SURAH_MULK_VERSES.map((v) => v.number)));

    const res = await awardSpiritualHabitPoints('mulk', 'سورة الملك المنجية');
    if (onRewardToast && res.message) {
      onRewardToast(res.message);
    } else if (onRewardToast) {
      onRewardToast('✨ هنيئاً لك! شَفَعَت لصاحبها؛ تم تسجيل قراءة سورة الملك (+15 نقطة) 🤍');
    }

    if (onCompleted) {
      onCompleted();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-slate-900 border border-indigo-900/60 shadow-2xl flex flex-col overflow-hidden text-right cursor-default animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-indigo-950/80 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  سُورَةُ الْمُلْكِ (الْمُنْجِيَة)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                  30 آية كاملة
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                «مَانِعَةٌ مِنْ عَذَابِ الْقَبْرِ، تَشْفَعُ لِصَاحِبِهَا حَتَّى يُغْفَرَ لَهُ»
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Font size cycler */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setFontSizeLevel((prev) =>
                  prev === 'normal' ? 'large' : prev === 'large' ? 'huge' : 'normal'
                );
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="تغيير حجم الخط"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Recitation Audio */}
            <button
              type="button"
              onClick={toggleAudio}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                isPlayingAudio
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="تلاوة خاشعة (مشاري العفاسي)"
            >
              {isAudioLoading ? (
                <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin inline-block" />
              ) : isPlayingAudio ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span className="text-[11px] font-bold hidden sm:inline">
                {isAudioLoading ? 'تحميل...' : isPlayingAudio ? 'إيقاف' : 'استماع 🎙️'}
              </span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hadith Benefit Banner */}
        <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/40 flex items-center justify-between text-[11px] text-indigo-300">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>سنة نبوية مؤكدة: كان النبي ﷺ لا ينام حتى يقرأ ﴿تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ﴾.</span>
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            {readVerses.size}/30 آية
          </span>
        </div>

        {/* Verses Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {/* Basmalah */}
          <div className="text-center py-2">
            <span className="font-serif text-xl sm:text-2xl text-amber-200/90 tracking-wide">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </span>
          </div>

          <div
            className={`leading-[2.4] font-serif text-slate-100 space-y-3 ${
              fontSizeLevel === 'normal'
                ? 'text-base sm:text-lg'
                : fontSizeLevel === 'large'
                ? 'text-lg sm:text-2xl'
                : 'text-2xl sm:text-3xl'
            }`}
          >
            {SURAH_MULK_VERSES.map((v) => {
              const isChecked = readVerses.has(v.number) || done;
              return (
                <div
                  key={v.number}
                  onClick={() => handleToggleVerse(v.number)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                      : 'bg-slate-800/40 border-slate-700/40 hover:border-indigo-500/50 hover:bg-slate-800/70'
                  }`}
                >
                  <p className="flex-1 select-text leading-relaxed">
                    {v.text}
                  </p>
                  <div className="shrink-0 flex items-center gap-1.5 mt-1">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition-colors ${
                        isChecked
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-800 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      {v.number}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-indigo-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-start">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>مكافأة الليلة: +15 نقطة همة وإيمان</span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCompleteAll}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                done
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{done ? 'تمت القراءة بنجاح اليوم ✔' : 'أتممت قراءة سورة الملك كاملة 🤍'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
