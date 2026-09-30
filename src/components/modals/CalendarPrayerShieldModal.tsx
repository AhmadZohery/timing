import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Trash2,
  FileText,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { db } from '../../db/db';
import { parseICS } from '../../utils/icsParser';
import {
  computePrayerShieldBuffers,
  findConflictFreeFocusSlots,
} from '../../utils/prayerShield';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { calculatePrayerTimes } from '../../utils/prayerCalculator';
import type { ExternalCalendarEvent, PrayerShieldBuffer, FocusSlot } from '../../types';

interface CalendarPrayerShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventsImported?: (count: number) => void;
}

export const CalendarPrayerShieldModal: React.FC<CalendarPrayerShieldModalProps> = ({
  isOpen,
  onClose,
  onEventsImported,
}) => {
  const { isRTL, language } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'schedule'>('upload');
  const [rawIcsText, setRawIcsText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedEvents, setParsedEvents] = useState<ExternalCalendarEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [bufferBefore, setBufferBefore] = useState(15);
  const [bufferAfter, setBufferAfter] = useState(25);

  // Load existing external events from Dexie on mount
  useEffect(() => {
    if (!isOpen) return;
    db.external_calendar_events
      .toArray()
      .then((events) => {
        if (events && events.length > 0) {
          setParsedEvents(events);
        }
      })
      .catch((err) => console.warn('Failed to load existing calendar events:', err));
  }, [isOpen]);

  // Compute today's prayer times map
  const prayerTimesMap: Record<string, Date | string> = useMemo(() => {
    const pt = calculatePrayerTimes(new Date(), 24.7136, 46.6753, 'umm_al_qura');
    return {
      fajr: pt.fajr,
      dhuhr: pt.dhuhr,
      asr: pt.asr,
      maghrib: pt.maghrib,
      isha: pt.isha,
    };
  }, []);

  // Compute prayer shield buffers and conflicts
  const buffers: PrayerShieldBuffer[] = useMemo(() => {
    return computePrayerShieldBuffers(
      prayerTimesMap,
      parsedEvents,
      bufferBefore,
      bufferAfter,
      new Date()
    );
  }, [prayerTimesMap, parsedEvents, bufferBefore, bufferAfter]);

  // Compute optimal focus slots
  const focusSlots: FocusSlot[] = useMemo(() => {
    return findConflictFreeFocusSlots(buffers, parsedEvents, 7, 22, 45, new Date());
  }, [buffers, parsedEvents]);

  // Summary statistics
  const totalConflicts = useMemo(() => {
    return buffers.filter((b) => b.isConflict).length;
  }, [buffers]);

  const totalProtectedMinutes = useMemo(() => {
    return buffers.length * (bufferBefore + bufferAfter);
  }, [buffers, bufferBefore, bufferAfter]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const events = parseICS(text);
          setParsedEvents(events);
          setRawIcsText(text);
          setActiveTab('schedule');
        } catch (err) {
          console.error('ICS parsing error:', err);
        }
      }
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleParsePastedText = () => {
    if (!rawIcsText.trim()) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsProcessing(true);

    try {
      const events = parseICS(rawIcsText);
      setParsedEvents(events);
      setActiveTab('schedule');
    } catch (err) {
      console.error('ICS parsing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToIndexedDb = async () => {
    if (parsedEvents.length === 0) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsProcessing(true);

    try {
      const timestamp = Date.now();
      const recordsToSave = parsedEvents.map((evt) => ({
        ...evt,
        updatedAt: timestamp,
      }));

      await db.external_calendar_events.bulkPut(recordsToSave);
      setSavedCount(recordsToSave.length);
      if (onEventsImported) {
        onEventsImported(recordsToSave.length);
      }
      setTimeout(() => {
        setSavedCount(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to save external calendar events:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearCalendar = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    try {
      await db.external_calendar_events.clear();
      setParsedEvents([]);
      setFileName('');
      setRawIcsText('');
    } catch (err) {
      console.warn('Failed to clear calendar events:', err);
    }
  };

  const formatTime = (date: Date | number) => {
    const d = typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in transition-colors">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 sm:p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{isAr ? 'درع الصلوات ومزامنة التقويم' : 'Calendar Prayer Shield'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium">
                OPP-0104
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isAr
                ? 'حماية أوقات الصلوات والسنن من تعارضات اجتماعات العمل عبر استيراد ملفات التقويم .ics محلياً 100%'
                : 'Zero-cloud RFC 5545 iCalendar parser guarding sacred prayer buffers against meeting clashes'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isAr ? 'رفع ملف .ics' : 'Upload .ics'}</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? 'لصق نص التقويم' : 'Paste Raw iCal'}</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isAr ? `الجدول والتعارضات (${parsedEvents.length})` : `Schedule (${parsedEvents.length})`}</span>
          </button>
        </div>

        {/* Tab 1: Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-zinc-950/50">
              <Upload className="w-10 h-10 text-amber-500 mb-2" />
              <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                {fileName ? fileName : (isAr ? 'اضغط لاختيار ملف .ics أو اسحبه هنا' : 'Click to select .ics file or drag & drop')}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {isAr ? 'متوافق مع تقويم جوجل، Outlook، و Apple Calendar' : 'Compatible with Google Calendar, Outlook, Apple Calendar'}
              </span>
              <input
                type="file"
                accept=".ics,text/calendar"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Tab 2: Paste */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <textarea
              value={rawIcsText}
              onChange={(e) => setRawIcsText(e.target.value)}
              placeholder={
                isAr
                  ? 'الصق نص تقويم iCalendar هنا (يبدأ بـ BEGIN:VCALENDAR...)'
                  : 'Paste RFC 5545 iCalendar string here (starts with BEGIN:VCALENDAR...)'
              }
              rows={6}
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleParsePastedText}
              disabled={!rawIcsText.trim() || isProcessing}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? (isAr ? 'جارٍ التحليل...' : 'Parsing...') : (isAr ? 'تحليل النص واستخراج المواعيد' : 'Parse iCal Text')}</span>
            </button>
          </div>
        )}

        {/* Buffer Zone Settings */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'حرم الصلاة الوقائي:' : 'Prayer Buffer Protection:'}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
              <span>{isAr ? 'قبل الأذان (وضوء/استعداد):' : 'Before (Wudu):'}</span>
              <select
                value={bufferBefore}
                onChange={(e) => setBufferBefore(Number(e.target.value))}
                className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md px-1.5 py-0.5 font-bold"
              >
                <option value={10}>10 د</option>
                <option value={15}>15 د</option>
                <option value={20}>20 د</option>
                <option value={30}>30 د</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
              <span>{isAr ? 'بعد الأذان (صلاة/سنن/أذكار):' : 'After (Prayer/Sunnah):'}</span>
              <select
                value={bufferAfter}
                onChange={(e) => setBufferAfter(Number(e.target.value))}
                className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md px-1.5 py-0.5 font-bold"
              >
                <option value={15}>15 د</option>
                <option value={25}>25 د</option>
                <option value={35}>35 د</option>
                <option value={45}>45 د</option>
              </select>
            </label>
          </div>
        </div>

        {/* Tab 3 / Main Display: Schedule & Conflict Analysis */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {/* Status Summary Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              totalConflicts > 0
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-200'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200'
            }`}>
              <div className="flex items-center gap-3">
                {totalConflicts > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <div className="text-xs">
                  <div className="font-bold">
                    {totalConflicts > 0
                      ? (isAr ? `تنبيه: تم رصد ${totalConflicts} تعارض مع أوقات الصلاة!` : `Warning: ${totalConflicts} meeting conflicts detected with prayer buffers!`)
                      : (isAr ? 'ما شاء الله! جميع مواعيدك اليوم خارج حرم الصلوات الخمس.' : 'All meetings today are clear of sacred prayer buffers.')}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {isAr
                      ? `تم فحص ${buffers.length} صلوات، وإجمالي وقت الحرم المحمي: ${totalProtectedMinutes} دقيقة`
                      : `Protected ${buffers.length} prayers with ${totalProtectedMinutes} total buffer minutes.`}
                  </div>
                </div>
              </div>

              {parsedEvents.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSaveToIndexedDb}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{savedCount ? (isAr ? 'تم الحفظ ✅' : 'Saved ✅') : (isAr ? 'حفظ محلياً' : 'Save')}</span>
                  </button>
                  <button
                    onClick={handleClearCalendar}
                    className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                    title={isAr ? 'مسح مواعيد التقويم' : 'Clear events'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Prayer Shield Buffer Cards */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                {isAr ? 'أوقات الصلوات والحرم الوقائي اليوم:' : "Today's Sacred Prayer Buffers:"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {buffers.map((buf) => (
                  <div
                    key={buf.prayerName}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      buf.isConflict
                        ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                        : 'bg-slate-50/70 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 dark:text-zinc-100">
                        {buf.prayerNameAr}
                      </span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        {formatTime(buf.prayerTime)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>{isAr ? 'حرم الصلاة الوقائي:' : 'Buffer zone:'}</span>
                      <span className="font-mono">
                        {formatTime(buf.bufferStart)} - {formatTime(buf.bufferEnd)}
                      </span>
                    </div>

                    {buf.isConflict && (
                      <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800/60 space-y-1">
                        <div className="font-bold text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{isAr ? 'تعارض مع:' : 'Clash with:'}</span>
                        </div>
                        {buf.conflictingEvents.map((evt) => (
                          <div key={evt.id} className="text-[11px] text-rose-700 dark:text-rose-300 truncate">
                            • {evt.summary} ({formatTime(evt.startTime)} - {formatTime(evt.endTime)})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Optimal Focus Slots */}
            {focusSlots.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'فترات التركيز الذهبي المقترحة (خالية من الاجتماعات والصلوات):' : 'Golden Deep-Work Focus Slots:'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {focusSlots.slice(0, 4).map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-[10px]">
                        {slot.durationMinutes} {isAr ? 'دقيقة تركيز' : 'min focus'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
