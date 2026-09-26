import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Zap,
  Target,
  Plus,
  Trash2,
  Wind,
  Compass,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import type { AmbientSoundType } from '../../types';

export interface ExecutiveFocusHUDProps {
  isOpen: boolean;
  onClose: () => void;
  focusTask: string;
  checkpoints: Array<{ id: number; text: string; done: boolean }>;
  onToggleCheckpoint: (id: number) => void;
  onCompleteSprint: () => void;
  onRewardToast?: (msg: string) => void;
  initialDurationSec?: number;
}

export const ExecutiveFocusHUD: React.FC<ExecutiveFocusHUDProps> = ({
  isOpen,
  onClose,
  focusTask,
  checkpoints,
  onToggleCheckpoint,
  onCompleteSprint,
  onRewardToast,
  initialDurationSec = 20 * 60, // 20 minutes default sprint
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [remainingSec, setRemainingSec] = useState(initialDurationSec);
  const [isRunning, setIsRunning] = useState(false);
  const [activeAmbient, setActiveAmbient] = useState<AmbientSoundType>('none');
  const [parkingLotText, setParkingLotText] = useState('');
  const [parkedNotes, setParkedNotes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('midmar_hud_parking_lot');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Breathing pacer cycle (11 seconds total: 5.5s inhale, 5.5s exhale = ~5.5 bpm HRV coherence)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setBreathPhase((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, 5500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Active Timer Tick
  useEffect(() => {
    if (!isOpen || !isRunning) return;
    const timer = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          soundSynth.playCompletionChime();
          haptic.vibrateSprintCelebration();
          onCompleteSprint();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isRunning, onCompleteSprint]);

  // Clean up ambient sound on close
  useEffect(() => {
    if (!isOpen) {
      soundSynth.stopAmbient();
      setActiveAmbient('none');
    }
  }, [isOpen]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleTimer = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    soundSynth.playTactileClick();
    setIsRunning(false);
    setRemainingSec(initialDurationSec);
  };

  const handleSelectAmbient = (type: AmbientSoundType) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (activeAmbient === type) {
      soundSynth.stopAmbient();
      setActiveAmbient('none');
    } else {
      soundSynth.startAmbient(type, 0.45);
      setActiveAmbient(type);
    }
  };

  const handleAddParkedNote = () => {
    if (!parkingLotText.trim()) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const updated = [parkingLotText.trim(), ...parkedNotes];
    setParkedNotes(updated);
    localStorage.setItem('midmar_hud_parking_lot', JSON.stringify(updated));
    setParkingLotText('');
    if (onRewardToast) {
      onRewardToast(
        isAr ? '🧠 تم حفظ الفكرة في ساحة الانتظار دون مقاطعة تركيزك!' : '🧠 Note parked in parking lot!'
      );
    }
  };

  const handleRemoveParkedNote = (index: number) => {
    soundSynth.playTactileClick();
    const updated = parkedNotes.filter((_, i) => i !== index);
    setParkedNotes(updated);
    localStorage.setItem('midmar_hud_parking_lot', JSON.stringify(updated));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = useMemo(() => {
    return Math.round(((initialDurationSec - remainingSec) / initialDurationSec) * 100);
  }, [remainingSec, initialDurationSec]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#0A0B10] text-white select-none overflow-hidden animate-fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background Ambient Breathing Aurora Glow */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-1000 blur-3xl opacity-20 ${
          breathPhase === 'inhale' ? 'scale-110 bg-indigo-600/40' : 'scale-95 bg-teal-600/30'
        }`}
      />

      {/* Top Cockpit Header Bar */}
      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between border-b border-white/[0.08] bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5 fill-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Cognitive Focus HUD
              </span>
              <span className="text-xs font-mono text-slate-400">{progressPercent}% {isAr ? 'مكتمل' : 'done'}</span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-white leading-tight">
              {isAr ? 'مقصورة التركيز التنفيذي والتدفق الذهني' : 'Executive Flow Cockpit'}
            </h2>
          </div>
        </div>

        {/* Top Controls: Soundscapes & Exit */}
        <div className="flex items-center gap-2">
          {/* Ambient Sound Toggles */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.05] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleSelectAmbient('alpha')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeAmbient === 'alpha'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="10Hz Alpha Waves (Calm Focus)"
            >
              🧠 Alpha
            </button>

            <button
              type="button"
              onClick={() => handleSelectAmbient('theta')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeAmbient === 'theta'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="6Hz Theta Waves (Deep Learning)"
            >
              🌊 Theta
            </button>

            <button
              type="button"
              onClick={() => handleSelectAmbient('rain')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeAmbient === 'rain'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Rain Acoustic Masking"
            >
              🌧️ Rain
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/[0.08]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Focus Stage: 2-Column Responsive Cockpit */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left / Center Column: The Giant Minimalist Timer & North Star */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center text-center space-y-6">
          {/* North Star Task Card */}
          <div className="max-w-xl w-full p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 block">
              {isAr ? 'الهدف المحوري لهذا الشوط (North Star Task)' : 'North Star Focus Task'}
            </span>
            <h1 className="text-base sm:text-xl md:text-2xl font-black text-white leading-snug">
              {focusTask.trim() || (isAr ? 'جلسة عمل عميق وإنجاز مركز' : 'Deep Work & Strategic Execution')}
            </h1>
          </div>

          {/* Giant Time Display with Pulsing HRV Coherent Ring */}
          <div className="relative flex items-center justify-center py-4">
            {/* Outer HRV Coherent Breathing Halo */}
            <div
              className={`w-64 h-64 sm:w-80 sm:h-80 rounded-full border-2 border-indigo-500/30 flex items-center justify-center transition-all duration-1000 ${
                breathPhase === 'inhale' ? 'scale-105 border-indigo-400/60 shadow-[0_0_50px_rgba(99,102,241,0.25)]' : 'scale-95 border-teal-400/40'
              }`}
            >
              {/* Inner Glowing Ring */}
              <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-black/60 border border-white/[0.08] flex flex-col items-center justify-center gap-1 shadow-2xl backdrop-blur-md">
                <span className="text-5xl sm:text-6xl md:text-7xl font-mono font-black tracking-tighter text-white">
                  {formatTime(remainingSec)}
                </span>
                <span className="text-[11px] font-mono text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Wind className="w-3 h-3 animate-pulse" />
                  <span>{isAr ? (breathPhase === 'inhale' ? 'شهيق هادئ...' : 'زفير بطيء...') : (breathPhase === 'inhale' ? 'Inhale...' : 'Exhale...')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTimer}
              className={`px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isRunning ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-white" />}
              <span>{isRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause Flow') : (isAr ? 'انطلق في التركيز ⚡' : 'Ignite Flow ⚡')}</span>
            </button>

            <button
              type="button"
              onClick={resetTimer}
              className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/[0.08]"
              title={isAr ? 'إعادة ضبط المؤقت' : 'Reset Timer'}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Column: Checkpoints & Instant Parking Lot */}
        <div className="lg:col-span-5 space-y-5">
          {/* A. Sprint Checkpoints Strip */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                <span>{isAr ? 'محطات الإنجاز المرحلية (Checkpoints):' : 'Sprint Checkpoints:'}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {checkpoints.filter((c) => c.done).length} / {checkpoints.length}
              </span>
            </div>

            <div className="space-y-2">
              {checkpoints.map((cp) => (
                <div
                  key={cp.id}
                  onClick={() => onToggleCheckpoint(cp.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    cp.done
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className={`text-xs font-medium leading-snug ${cp.done ? 'line-through opacity-70' : ''}`}>
                    {cp.text.trim() || `${isAr ? 'المرحلة' : 'Step'} ${cp.id}`}
                  </span>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${cp.done ? 'text-emerald-400' : 'text-slate-600'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* B. Instant Parking Lot (Brain Dump to Defeat Distractions) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>{isAr ? 'ساحة الانتظار (Parking Lot):' : 'Instant Thought Parking Lot:'}</span>
              </span>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'طرت على بالك فكرة عشوائية؟ اكتبها هنا فوراً لتفرغ ذهنك وتواصل التركيز.'
                  : 'Random idea popped up? Dump it here to clear brain bandwidth and stay focused.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={parkingLotText}
                onChange={(e) => setParkingLotText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddParkedNote();
                }}
                placeholder={isAr ? 'دوّن الفكرة واضغط Enter...' : 'Capture thought and hit Enter...'}
                className="flex-1 p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddParkedNote}
                className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Parked Notes List */}
            {parkedNotes.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                {parkedNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-black/30 border border-white/[0.04] flex items-center justify-between gap-2 text-xs text-slate-300"
                  >
                    <span className="truncate">• {note}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParkedNote(idx)}
                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
