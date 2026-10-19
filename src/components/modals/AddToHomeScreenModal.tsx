import React from 'react';
import { Smartphone, PlusSquare, Share, CheckCircle2, X, Sparkles } from 'lucide-react';
import type { PwaInstallState } from '../../hooks/usePwaInstall';

interface AddToHomeScreenModalProps {
  pwaState: PwaInstallState;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToHomeScreenModal: React.FC<AddToHomeScreenModalProps> = ({
  pwaState,
  isOpen,
  onClose,
}) => {
  if (!isOpen || pwaState.isStandalone) return null;

  const handleInstallClick = async () => {
    if (pwaState.isInstallable) {
      const success = await pwaState.promptInstall();
      if (success) {
        onClose();
      }
    }
  };

  const handleAlreadyInstalled = () => {
    pwaState.markAsInstalled();
    onClose();
  };

  const handleDismissLater = () => {
    pwaState.dismissForLater(7);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-4 animate-fade-in"
    >
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div 
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-all max-h-[88dvh] flex flex-col animate-scale-in"
        dir="rtl"
      >
        {/* Celestial Obsidian 3D Header */}
        <div className="celestial-obsidian-stage px-6 pt-5 pb-6 text-white relative">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-[11px] font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              تطبيق الشاشة الكاملة
            </span>
            <button
              onClick={handleDismissLater}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <img
              src="/favicon.svg?v=20261019"
              alt="مِضمار"
              className="w-14 h-14 rounded-2xl shadow-lg shadow-emerald-950/50 border border-amber-400/35 shrink-0"
            />
            <div>
              <h3 className="text-lg font-black text-white leading-tight">
                ثبّت «مِضمار» على جهازك
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                افتح مِضمار بضغطة واحدة وبشاشة كاملة يعمل فوراً حتى بدون إنترنت.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 pb-6 pt-5 overflow-y-auto space-y-4">

          {/* iOS Specific Instructions */}
          {pwaState.isIos ? (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                <Smartphone className="w-4 h-4 text-amber-600" />
                <span>خطوتان سريعتان في متصفح Safari:</span>
              </div>
              <div className="space-y-2.5 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-start gap-2.5 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <div>
                    اضغط على زر المشاركة <Share className="inline w-3.5 h-3.5 mx-1 text-sky-600" /> في شريط سفاري السفلي.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <div>
                    مرر لأسفل القائمة واضغط على <span className="font-bold underline text-amber-900 dark:text-amber-200">«إضافة إلى الصفحة الرئيسية»</span> <PlusSquare className="inline w-3.5 h-3.5 mx-1 text-slate-700 dark:text-slate-300" />.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Chrome Direct 1-Tap Install */
            pwaState.isInstallable && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-98 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>تثبيت الأيقونة الآن بضغطة واحدة</span>
              </button>
            )
          )}

          {/* Action Buttons: Never Ask Again / Dismiss */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleAlreadyInstalled}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>لدي الأيقونة بالفعل على الشاشة (عدم السؤال ثانية)</span>
            </button>

            <button
              onClick={handleDismissLater}
              className="w-full py-2 px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-medium transition-colors"
            >
              تذكيري لاحقاً بعد أسبوع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
