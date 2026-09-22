import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  CloudRain,
  Brain,
  Waves,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import type { AmbientSoundType } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { gymFaithAudio } from '../../services/gymFaithAudioService';

export const AmbientSoundscapeBar: React.FC = () => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>('rain_light');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isFaithCapsuleActive, setIsFaithCapsuleActive] = useState(false);

  // Subscribe to SoundSynthesizer ambient state
  useEffect(() => {
    return soundSynth.subscribeAmbient((active, type) => {
      setIsPlaying(active);
      if (active && type !== 'none') {
        setCurrentSound(type);
        setIsDismissed(false); // un-dismiss if user starts ambient
      }
    });
  }, []);

  // Track Faith Audio Capsule state to avoid visual overlap
  useEffect(() => {
    return gymFaithAudio.subscribe((state) => {
      const active = Boolean(
        state.isPlaying ||
        state.isLoading ||
        state.currentTime > 0 ||
        state.currentSeriesId ||
        (state.resumePoint && state.resumePoint.currentTime > 0)
      );
      setIsFaithCapsuleActive(active);
    });
  }, []);

  const soundOptions = [
    { id: 'rain_light' as AmbientSoundType, label: isAr ? 'رذاذ مطر خفيف 🌦️' : 'Light Rain 🌦️', icon: CloudRain },
    { id: 'rain_heavy' as AmbientSoundType, label: isAr ? 'مطر غزير وصيب 🌧️' : 'Heavy Rain 🌧️', icon: CloudRain },
    { id: 'alpha' as AmbientSoundType, label: isAr ? 'موجات ألفا 🧠' : 'Alpha Waves 🧠', icon: Brain },
    { id: 'brown' as AmbientSoundType, label: isAr ? 'تركيز بني عميق 🌊' : 'Brown Focus 🌊', icon: Waves },
  ];

  const handleTogglePlay = (soundType?: AmbientSoundType) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const target = soundType || currentSound;
    if (isPlaying && target === currentSound) {
      soundSynth.stopAmbient();
      setIsPlaying(false);
    } else {
      setCurrentSound(target);
      soundSynth.startAmbient(target);
      setIsPlaying(true);
      setIsDismissed(false);
    }
  };

  // If faith audio capsule is active and ambient sound is idle, hide to prevent overlap
  if ((isFaithCapsuleActive && !isPlaying) || isDismissed) {
    return null;
  }

  // Shift upwards if Faith Audio capsule is active
  const positionClass = isFaithCapsuleActive
    ? 'bottom-[148px] lg:bottom-24 start-4 z-40'
    : 'bottom-20 start-4 z-30';

  return (
    <div className={`fixed transition-all duration-300 pointer-events-auto ${positionClass}`}>
      {/* Expanded Soundscape Selector */}
      {isExpanded && (
        <div className="mb-2 p-2.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 shadow-xl backdrop-blur-md space-y-2 animate-fade-in w-60 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            <span>{isAr ? 'أجواء التركيز الذهني (Web Audio)' : 'Ambient Focus Soundscapes'}</span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:text-slate-600 dark:hover:text-zinc-300 rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1">
            {soundOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = currentSound === opt.id && isPlaying;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleTogglePlay(opt.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer font-bold ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected ? (
                    <Square className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current opacity-70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Pill Mini-Controller */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => handleTogglePlay()}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
            isPlaying
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
          }`}
          title={isAr ? 'تشغيل/إيقاف صوت التركيز' : 'Toggle Ambient Focus Sound'}
        >
          {isPlaying ? (
            <>
              {/* Animated Equalizer Wave Bars */}
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '60%', animationDuration: '0.6s' }} />
                <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.4s' }} />
                <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '40%', animationDuration: '0.7s' }} />
              </div>
              <span className="text-[11px]">
                {currentSound === 'rain_light'
                  ? (isAr ? 'رذاذ خفيف' : 'Light Rain')
                  : currentSound === 'rain_heavy' || currentSound === 'rain'
                  ? (isAr ? 'مطر غزير' : 'Heavy Rain')
                  : currentSound === 'alpha'
                  ? (isAr ? 'ألفا' : 'Alpha')
                  : (isAr ? 'تركيز' : 'Brown')}
              </span>
            </>
          ) : (
            <>
              <Waves className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] hidden sm:inline">{isAr ? 'أجواء التركيز' : 'Ambience'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            setIsExpanded(!isExpanded);
          }}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          title={isExpanded ? 'إغلاق القائمة' : 'تغيير الصوت'}
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {!isPlaying && (
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-full text-slate-300 hover:text-slate-500 dark:hover:text-zinc-400 transition-colors cursor-pointer"
            title={isAr ? 'إخفاء' : 'Dismiss'}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
