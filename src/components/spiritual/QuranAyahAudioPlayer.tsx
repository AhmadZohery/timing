import React, { useState, useEffect } from 'react';
import { Play, Pause, Loader2, Volume2, ChevronDown, Check } from 'lucide-react';
import {
  quranAudio,
  QURAN_RECITERS,
  type QuranAudioState,
  parseAyahRange,
} from '../../services/quranAudioService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface QuranAyahAudioPlayerProps {
  surahNumber: number;
  ayahRange: string;
  surahName: string;
  variant?: 'compact' | 'full';
}

export const QuranAyahAudioPlayer: React.FC<QuranAyahAudioPlayerProps> = ({
  surahNumber,
  ayahRange,
  surahName,
  variant = 'compact',
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [audioState, setAudioState] = useState<QuranAudioState>(quranAudio.getState());
  const [isReciterDropdownOpen, setIsReciterDropdownOpen] = useState(false);

  const { start, end } = parseAyahRange(ayahRange);

  useEffect(() => {
    const unsubscribe = quranAudio.subscribe(setAudioState);
    return () => unsubscribe();
  }, []);

  const isCurrentPlaying =
    audioState.isPlaying &&
    audioState.currentSurah === surahNumber &&
    audioState.startAyah === start &&
    audioState.endAyah === end;

  const isCurrentLoading =
    audioState.isLoading &&
    audioState.currentSurah === surahNumber &&
    audioState.startAyah === start &&
    audioState.endAyah === end;

  const handleToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    quranAudio.togglePlay(surahNumber, start, end);
  };

  const activeReciter = quranAudio.getActiveReciter();

  return (
    <div className="relative inline-flex items-center flex-wrap gap-2">
      {/* Main Play / Pause Button with Equalizer */}
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-xs ${
          isCurrentPlaying
            ? 'bg-emerald-600 text-white shadow-emerald-600/30'
            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
        }`}
        title={
          isCurrentPlaying
            ? (isAr ? `إيقاف تلاوة ${surahName}` : `Pause ${surahName}`)
            : (isAr ? `استماع لتلاوة ${surahName}` : `Listen to ${surahName}`)
        }
      >
        {isCurrentLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isCurrentPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current" />
        )}

        {isCurrentPlaying ? (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px]">
              {audioState.currentAyah ? (isAr ? `الآية ${audioState.currentAyah}` : `Ayah ${audioState.currentAyah}`) : (isAr ? 'تلاوة الآيات' : 'Reciting')}
            </span>
            {/* Animated Equalizer Wave Bars */}
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '65%', animationDuration: '0.5s' }} />
              <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.35s' }} />
              <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '45%', animationDuration: '0.6s' }} />
            </div>
          </div>
        ) : (
          <span>
            {isAr
              ? variant === 'full'
                ? `استمع لتلاوة ${surahName}`
                : 'استمع للتلاوة'
              : variant === 'full'
              ? `Listen to ${surahName}`
              : 'Listen'}
          </span>
        )}
      </button>

      {/* Reciter Selector Pill */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            setIsReciterDropdownOpen(!isReciterDropdownOpen);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
          title={isAr ? 'تغيير القارئ' : 'Change Reciter'}
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="max-w-[110px] truncate">
            {isAr ? activeReciter.nameAr.replace('الشيخ ', '') : activeReciter.nameEn}
          </span>
          <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
        </button>

        {/* Dropdown Menu */}
        {isReciterDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsReciterDropdownOpen(false)}
            />
            <div className="absolute top-full mt-1.5 start-0 z-50 w-60 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl p-1.5 space-y-1 text-xs animate-fade-in">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                {isAr ? 'اختر القارئ المفضل' : 'Select Reciter'}
              </div>

              {QURAN_RECITERS.map((r) => {
                const isSelected = r.id === audioState.reciterId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      quranAudio.setReciter(r.id);
                      setIsReciterDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-start cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-black'
                        : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{isAr ? r.nameAr : r.nameEn}</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                        {r.badgeAr}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Optional Error Toast */}
      {audioState.error && isCurrentPlaying && (
        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 font-mono">
          {audioState.error}
        </span>
      )}
    </div>
  );
};
