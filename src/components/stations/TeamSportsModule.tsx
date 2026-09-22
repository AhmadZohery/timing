import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Trophy,
} from 'lucide-react';
import { db } from '../../db/db';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

const STORAGE_KEY = 'midmar_team_matches_log';

interface MatchRecord {
  id: string;
  date: string;
  sportType: 'football' | 'padel';
  durationMinutes: number;
  result: 'win' | 'draw' | 'loss';
  // Football specific
  goals?: number;
  assists?: number;
  position?: 'striker' | 'midfielder' | 'defender' | 'goalkeeper';
  pitchType?: 'natural_grass' | 'turf' | 'indoor';
  pitchFormat?: '5v5' | '7v7' | '11v11';
  estimatedDistanceKm?: number;
  // Padel specific
  courtSide?: 'left' | 'right';
  set1User?: number;
  set1Opp?: number;
  set2User?: number;
  set2Opp?: number;
  hasSet3?: boolean;
  set3User?: number;
  set3Opp?: number;
  isSuperTiebreak?: boolean;
  puntoDeOroWon?: number;
  winnerSmashes?: number;
  unforcedErrors?: number;
  // Common
  caloriesBurned: number;
  intensityRating: number; // 1 to 5
  notes?: string;
}

interface TeamSportsModuleProps {
  onRewardToast?: (msg: string) => void;
}

export const TeamSportsModule: React.FC<TeamSportsModuleProps> = ({
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [matches, setMatches] = useState<MatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'all' | 'football' | 'padel'>('all');

  // New Match Form State
  const [sportType, setSportType] = useState<'football' | 'padel'>('padel');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [result, setResult] = useState<'win' | 'draw' | 'loss'>('win');
  const [notes, setNotes] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Football fields
  const [goals, setGoals] = useState(1);
  const [assists, setAssists] = useState(1);
  const [position, setPosition] = useState<'striker' | 'midfielder' | 'defender' | 'goalkeeper'>('midfielder');
  const [pitchType, setPitchType] = useState<'turf' | 'natural_grass' | 'indoor'>('turf');
  const [pitchFormat, setPitchFormat] = useState<'5v5' | '7v7' | '11v11'>('7v7');

  // Padel fields
  const [courtSide, setCourtSide] = useState<'left' | 'right'>('left');
  const [set1User, setSet1User] = useState(6);
  const [set1Opp, setSet1Opp] = useState(4);
  const [set2User, setSet2User] = useState(6);
  const [set2Opp, setSet2Opp] = useState(3);
  const [hasSet3, setHasSet3] = useState(false);
  const [set3User, setSet3User] = useState(7);
  const [set3Opp, setSet3Opp] = useState(6);
  const [isSuperTiebreak, setIsSuperTiebreak] = useState(false);
  const [puntoDeOroWon, setPuntoDeOroWon] = useState(2);
  const [winnerSmashes, setWinnerSmashes] = useState(5);
  const [unforcedErrors, setUnforcedErrors] = useState(3);

  // Load from Dexie on mount
  useEffect(() => {
    const loadFromDexie = async () => {
      try {
        if (db.match_logs) {
          const dexieMatches = await db.match_logs.toArray();
          if (dexieMatches.length > 0) {
            setMatches(dexieMatches);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dexieMatches));
          }
        }
      } catch (e) {
        console.warn('Dexie match logs load error:', e);
      }
    };
    loadFromDexie();
  }, []);

  const saveMatches = async (updated: MatchRecord[]) => {
    setMatches(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    try {
      if (db.match_logs) {
        await db.match_logs.clear();
        await db.match_logs.bulkPut(updated);
      }
    } catch (e) {
      console.warn('Dexie match logs save error:', e);
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();

    // Calculate calories & distance
    let caloriesBurned = Math.round(durationMinutes * 8.5); // Padel default METs ~ 6.5
    let estimatedDistanceKm: number | undefined;

    if (sportType === 'football') {
      caloriesBurned = Math.round(durationMinutes * 11.5); // Football METs ~ 8.5
      const kmRate = pitchFormat === '5v5' ? 4.5 : pitchFormat === '11v11' ? 9.5 : 6.5;
      estimatedDistanceKm = Number(((durationMinutes / 60) * kmRate).toFixed(1));
    }

    const newMatch: MatchRecord = {
      id: `match-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      sportType,
      durationMinutes,
      result,
      caloriesBurned,
      intensityRating: 4,
      notes: notes.trim() || undefined,
      ...(sportType === 'football'
        ? { goals, assists, position, pitchType, pitchFormat, estimatedDistanceKm }
        : {
            courtSide,
            set1User,
            set1Opp,
            set2User,
            set2Opp,
            hasSet3,
            ...(hasSet3 ? { set3User, set3Opp } : {}),
            isSuperTiebreak,
            puntoDeOroWon,
            winnerSmashes,
            unforcedErrors,
          }),
    };

    await saveMatches([newMatch, ...matches]);
    setIsFormOpen(false);
    setNotes('');

    if (onRewardToast) {
      onRewardToast(
        isAr
          ? `🏆 تم توثيق مباراة ${sportType === 'padel' ? 'البادل' : 'كرة القدم'} بنجاح! (${caloriesBurned} سعرة حرارية محروقة) (+25 XP)`
          : `🏆 Match logged successfully! (${caloriesBurned} kcal burned) (+25 XP)`
      );
    }
  };

  const handleDeleteMatch = async (id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    await saveMatches(matches.filter((m) => m.id !== id));
  };

  const filteredMatches = activeTab === 'all' ? matches : matches.filter((m) => m.sportType === activeTab);

  // Aggregate Stats
  const totalMinutes = filteredMatches.reduce((sum, m) => sum + m.durationMinutes, 0);
  const totalCalories = filteredMatches.reduce((sum, m) => sum + (m.caloriesBurned || 0), 0);
  const winsCount = filteredMatches.filter((m) => m.result === 'win').length;
  const totalGoals = filteredMatches.filter((m) => m.sportType === 'football').reduce((sum, m) => sum + (m.goals || 0), 0);
  const totalSmashes = filteredMatches.filter((m) => m.sportType === 'padel').reduce((sum, m) => sum + (m.winnerSmashes || 0), 0);

  return (
    <div className="space-y-4">
      {/* Sport Category Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            {isAr ? 'الكل' : 'All'} ({matches.length})
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('padel');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'padel'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>🎾</span>
            <span>{isAr ? 'البادل' : 'Padel'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('football');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'football'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>⚽</span>
            <span>{isAr ? 'كرة القدم' : 'Football'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            setIsFormOpen(!isFormOpen);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAr ? 'توثيق مباراة جديدة' : 'Log New Match'}</span>
        </button>
      </div>

      {/* Top Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center">
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40">
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">الوقت الإجمالي</span>
          <span className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
            {totalMinutes} {isAr ? 'دقيقة' : 'mins'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40">
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">السعرات المحروقة 🔥</span>
          <span className="text-base sm:text-lg font-black font-mono text-amber-700 dark:text-amber-300">
            {totalCalories} {isAr ? 'سعرة' : 'kcal'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/40">
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">الانتصارات 🏆</span>
          <span className="text-base sm:text-lg font-black font-mono text-indigo-700 dark:text-indigo-300">
            {winsCount} / {filteredMatches.length}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/40">
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">
            {activeTab === 'football' ? 'الأهداف ⚽' : activeTab === 'padel' ? 'الضربات الساحقة 🎾' : 'أهداف و Smash ⚡'}
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-purple-700 dark:text-purple-300">
            {activeTab === 'football' ? totalGoals : activeTab === 'padel' ? totalSmashes : totalGoals + totalSmashes}
          </span>
        </div>
      </div>

      {/* New Match Form */}
      {isFormOpen && (
        <form
          onSubmit={handleAddMatch}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-400/40 dark:border-emerald-500/30 shadow-md space-y-4 animate-scale-up"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'تسجيل تفاصيل المباراة' : 'Match Details'}</span>
            </h4>

            {/* Sport Type Toggle inside Form */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSportType('padel')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  sportType === 'padel'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                🎾 {isAr ? 'بادل' : 'Padel'}
              </button>
              <button
                type="button"
                onClick={() => setSportType('football')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  sportType === 'football'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                ⚽ {isAr ? 'كرة قدم' : 'Football'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {isAr ? 'مدة المباراة (بالدقائق):' : 'Duration (Minutes):'}
              </label>
              <input
                type="number"
                min="15"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {isAr ? 'نتيجة المباراة:' : 'Match Outcome:'}
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-bold text-slate-900 dark:text-white"
              >
                <option value="win">🏆 {isAr ? 'فوز مستحق' : 'Win'}</option>
                {sportType === 'football' && <option value="draw">🤝 {isAr ? 'تعادل' : 'Draw'}</option>}
                <option value="loss">💔 {isAr ? 'خسارة وتعلم' : 'Loss'}</option>
              </select>
            </div>
          </div>

          {/* PADEL SPECIFIC INPUTS */}
          {sportType === 'padel' && (
            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <span>🎾</span>
                  <span>{isAr ? 'نتائج المجموعات والأشواط (Sets & Games)' : 'Sets & Games'}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">{isAr ? 'موقعك:' : 'Side:'}</span>
                  <button
                    type="button"
                    onClick={() => setCourtSide('left')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      courtSide === 'left' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-zinc-700'
                    }`}
                  >
                    {isAr ? 'يسار (Reves)' : 'Left'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourtSide('right')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      courtSide === 'right' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-zinc-700'
                    }`}
                  >
                    {isAr ? 'يمين (Drive)' : 'Right'}
                  </button>
                </div>
              </div>

              {/* Set 1 & Set 2 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="block font-bold text-slate-500 mb-1">{isAr ? 'المجموعة 1' : 'Set 1'}</span>
                  <div className="flex items-center justify-center gap-1 font-mono font-black text-base">
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set1User}
                      onChange={(e) => setSet1User(Number(e.target.value))}
                      className="w-8 text-center bg-slate-100 dark:bg-zinc-800 rounded"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set1Opp}
                      onChange={(e) => setSet1Opp(Number(e.target.value))}
                      className="w-8 text-center bg-slate-100 dark:bg-zinc-800 rounded"
                    />
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="block font-bold text-slate-500 mb-1">{isAr ? 'المجموعة 2' : 'Set 2'}</span>
                  <div className="flex items-center justify-center gap-1 font-mono font-black text-base">
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set2User}
                      onChange={(e) => setSet2User(Number(e.target.value))}
                      className="w-8 text-center bg-slate-100 dark:bg-zinc-800 rounded"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set2Opp}
                      onChange={(e) => setSet2Opp(Number(e.target.value))}
                      className="w-8 text-center bg-slate-100 dark:bg-zinc-800 rounded"
                    />
                  </div>
                </div>

                {hasSet3 ? (
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    <span className="block font-bold text-slate-500 mb-1">{isAr ? 'المجموعة 3 الفاصلة' : 'Set 3'}</span>
                    <div className="flex items-center justify-center gap-1 font-mono font-black text-base">
                      <input
                        type="number"
                        min="0"
                        max="7"
                        value={set3User}
                        onChange={(e) => setSet3User(Number(e.target.value))}
                        className="w-8 text-center bg-slate-100 dark:bg-zinc-800 rounded"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min="0"
                        max="7"
                        value={set3Opp}
                        onChange={(e) => setSet3Opp(Number(e.target.value))}
                        className="w-8 text-center bg-slate-100 dark:bg-zinc-800 rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setHasSet3(true)}
                    className="p-2 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-bold flex flex-col items-center justify-center hover:bg-indigo-100/40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? '+ مجموعة فاصلة' : '+ 3rd Set'}</span>
                  </button>
                )}
              </div>

              {/* Super Tie-Break & Punto de Oro Controls */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                      {isAr ? 'شوط كسر التعادل الفائق (Super Tie-Break)' : 'Super Tie-Break (to 10)'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isAr ? 'بديل المجموعة الثالثة (أول من يحرز 10 نقاط بفارق نقطتين)' : 'First to 10 points with 2 points margin'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSuperTiebreak(!isSuperTiebreak)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      isSuperTiebreak
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {isSuperTiebreak ? (isAr ? 'مفعّل ⚡' : 'ON ⚡') : (isAr ? 'معطل' : 'OFF')}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isAr ? 'النقاط الذهبية الحاسمة (Punto de Oro 🥇):' : 'Golden Points Won (Punto de Oro):'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={puntoDeOroWon}
                    onChange={(e) => setPuntoDeOroWon(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-center font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Smashes & Unforced Errors */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                    {isAr ? 'ضربات ساحقة فائزة (Smashes):' : 'Winning Smashes:'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={winnerSmashes}
                    onChange={(e) => setWinnerSmashes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                    {isAr ? 'أخطاء غير مجبرة (Unforced):' : 'Unforced Errors:'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unforcedErrors}
                    onChange={(e) => setUnforcedErrors(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* FOOTBALL SPECIFIC INPUTS */}
          {sportType === 'football' && (
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-3">
              {/* Pitch Format Selector */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {isAr ? 'نوع وحجم الملعب (Pitch Format):' : 'Pitch Format & Benchmark:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['5v5', '7v7', '11v11'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setPitchFormat(fmt)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold text-center transition-all cursor-pointer ${
                        pitchFormat === fmt
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                      }`}
                    >
                      <span className="block">{fmt}</span>
                      <span className="block text-[9px] opacity-80">
                        {fmt === '5v5' ? '~4.5 km/h' : fmt === '7v7' ? '~6.5 km/h' : '~9.5 km/h'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    {isAr ? 'الأهداف المسجلة ⚽:' : 'Goals:'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={goals}
                    onChange={(e) => setGoals(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    {isAr ? 'صناعة أهداف 👟:' : 'Assists:'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={assists}
                    onChange={(e) => setAssists(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    {isAr ? 'المركز في الملعب:' : 'Position:'}
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium"
                  >
                    <option value="striker">{isAr ? 'مهاجم' : 'Striker'}</option>
                    <option value="midfielder">{isAr ? 'وسط' : 'Midfielder'}</option>
                    <option value="defender">{isAr ? 'مدافع' : 'Defender'}</option>
                    <option value="goalkeeper">{isAr ? 'حارس مرمى' : 'Goalkeeper'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    {isAr ? 'نوع الأرضية:' : 'Pitch:'}
                  </label>
                  <select
                    value={pitchType}
                    onChange={(e) => setPitchType(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium"
                  >
                    <option value="turf">{isAr ? 'نجيل صناعي' : 'Turf'}</option>
                    <option value="natural_grass">{isAr ? 'نجيل طبيعي' : 'Grass'}</option>
                    <option value="indoor">{isAr ? 'صالة مغطاة' : 'Indoor'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              {isAr ? 'حفظ المباراة في السجل' : 'Save Match'}
            </button>
          </div>
        </form>
      )}

      {/* Match History List */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {isAr ? 'سجل المباريات السابق' : 'Recent Match History'} ({filteredMatches.length})
        </h4>

        {filteredMatches.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400">
            {isAr ? 'لم تسجل أي مباريات حتى الآن. ابدأ بتوثيق أول مباراة لك!' : 'No matches logged yet. Log your first match above!'}
          </div>
        ) : (
          filteredMatches.map((m) => {
            const isPadel = m.sportType === 'padel';
            const isWin = m.result === 'win';

            return (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-emerald-400 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                      isPadel
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isPadel ? '🎾' : '⚽'}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {isPadel ? (isAr ? 'مباراة بادل' : 'Padel Match') : (isAr ? 'مباراة كرة قدم' : 'Football Match')}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold font-mono ${
                          isWin
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : m.result === 'draw'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {isWin ? (isAr ? 'فوز 🏆' : 'WIN') : m.result === 'draw' ? (isAr ? 'تعادل 🤝' : 'DRAW') : (isAr ? 'خسارة' : 'LOSS')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.date}</span>
                    </div>

                    {/* Stats summary */}
                    <div className="text-xs text-slate-600 dark:text-zinc-400 flex items-center gap-3 flex-wrap">
                      <span>⏱️ {m.durationMinutes}د</span>
                      <span>🔥 {m.caloriesBurned} سعرة</span>
                      {isPadel && (
                        <>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            المجموعات: {m.set1User}-{m.set1Opp}, {m.set2User}-{m.set2Opp}
                            {m.set3User !== undefined ? `, ${m.set3User}-${m.set3Opp}` : ''}
                          </span>
                          {m.winnerSmashes ? <span>⚡ {m.winnerSmashes} Smash</span> : null}
                        </>
                      )}
                      {!isPadel && (
                        <>
                          <span className="font-bold text-emerald-600">⚽ {m.goals || 0} أهداف</span>
                          <span>👟 {m.assists || 0} أسيست</span>
                          {m.estimatedDistanceKm ? <span>🏃 {m.estimatedDistanceKm} كم</span> : null}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteMatch(m.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors self-end sm:self-auto cursor-pointer"
                  title={isAr ? 'حذف من السجل' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
