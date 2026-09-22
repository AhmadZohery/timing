import React from 'react';
import { X, BookOpen, CheckCircle, Plus } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface QuranPageGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: number;
  totalPages: number;
  onSelectPage: (page: number) => void;
  title?: string;
}

export const QuranPageGridModal: React.FC<QuranPageGridModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  totalPages,
  onSelectPage,
  title,
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const handlePageClick = (pageNum: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onSelectPage(pageNum);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in transition-colors">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              {title || (isAr ? `خريطة صفحات الورد (${totalPages} صفحة)` : `Wird ${totalPages}-Page Visualizer`)}
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {isAr ? `أنت حالياً عند الصفحة ${currentPage} من أصل ${totalPages} صفحة` : `Currently on page ${currentPage} of ${totalPages}`}
            </p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-zinc-400">
            {isAr ? 'انقر على أي صفحة لتحديث موضع قراءتك فورياً:' : 'Click any page to jump your reading position:'}
          </span>
          <button
            onClick={() => handlePageClick(Math.min(totalPages, currentPage + 1))}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? '+1 صفحة تالية' : '+1 Next Page'}</span>
          </button>
        </div>

        {/* 48-Page Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 text-center">
          {pages.map((p) => {
            const isRead = p <= currentPage;
            const isCurrent = p === currentPage;
            // Known Quranic Sajdah pages (مواضع سجدات التلاوة في المصحف الشريف)
            const isSajdahPage = [175, 250, 271, 318, 333, 341, 377, 415, 479, 528, 574, 589, 597].includes(p);

            return (
              <button
                key={p}
                onClick={() => handlePageClick(p)}
                title={isSajdahPage ? (isAr ? '۩ موضع سجدة تلاوة مسنونة' : '۩ Quranic Sajdah Page') : undefined}
                className={`h-11 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                  isCurrent
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400 scale-105'
                    : isRead
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-100/80 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 hover:border-emerald-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                {isSajdahPage && (
                  <span className="absolute top-0.5 end-1 text-[9px] text-amber-500 font-serif leading-none" title="سجدة تلاوة">
                    ۩
                  </span>
                )}
                <span>{p}</span>
                {isRead && !isCurrent && (
                  <CheckCircle className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-zinc-500">
          {isAr ? 'سورة البقرة: الجزء الأول (ص 1-21) والجزء الثاني (ص 22-48)' : 'Surah Al-Baqarah: Juz 1 (pp 1-21) & Juz 2 (pp 22-48)'}
        </div>
      </div>
    </div>
  );
};
